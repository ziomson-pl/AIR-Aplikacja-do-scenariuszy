import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { ReorderLinesDto } from './dto/reorder-lines.dto';
import { colorForIndex } from './screenplay.constants';

const fullProjectInclude = {
  characters: { orderBy: { name: 'asc' } },
  lines: { orderBy: { order: 'asc' }, include: { character: true } },
} as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { title: dto.title.trim() },
      include: fullProjectInclude,
    });
  }

  async listProjects() {
    return this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        characters: { orderBy: { name: 'asc' } },
        _count: { select: { lines: true } },
      },
    });
  }

  async getProject(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: fullProjectInclude,
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    await this.assertProjectExists(id);
    return this.prisma.project.update({
      where: { id },
      data: { title: dto.title.trim() },
      include: fullProjectInclude,
    });
  }

  async deleteProject(id: string) {
    await this.assertProjectExists(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async addCharacter(projectId: string, dto: CreateCharacterDto) {
    await this.assertProjectExists(projectId);
    const count = await this.prisma.character.count({ where: { projectId } });
    return this.prisma.character.create({
      data: {
        name: dto.name.trim(),
        color: dto.color ?? colorForIndex(count),
        projectId,
      },
    });
  }

  async updateCharacter(projectId: string, charId: string, dto: UpdateCharacterDto) {
    await this.assertCharacterExists(projectId, charId);
    if (dto.name === undefined && dto.color === undefined) {
      throw new BadRequestException('Nothing to update');
    }
    return this.prisma.character.update({
      where: { id: charId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
      },
    });
  }

  async deleteCharacter(projectId: string, charId: string) {
    await this.assertCharacterExists(projectId, charId);
    return this.prisma.character.delete({ where: { id: charId } });
  }

  async addLine(projectId: string, dto: CreateLineDto) {
    await this.assertProjectExists(projectId);

    if (dto.type === 'dialogue') {
      if (!dto.characterId) {
        throw new BadRequestException('Dialogue lines require a characterId');
      }
      await this.assertCharacterExists(projectId, dto.characterId);
    }

    const lastLine = await this.prisma.dialogueLine.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    });
    const order = (lastLine?.order ?? -1) + 1;

    const line = await this.prisma.dialogueLine.create({
      data: {
        projectId,
        characterId: dto.type === 'dialogue' ? dto.characterId : null,
        text: dto.text.trim(),
        order,
        type: dto.type,
      },
      include: { character: true },
    });
    await this.touchProject(projectId);
    return line;
  }

  async updateLine(projectId: string, lineId: string, dto: UpdateLineDto) {
    await this.assertLineExists(projectId, lineId);
    const line = await this.prisma.dialogueLine.update({
      where: { id: lineId },
      data: { text: dto.text.trim() },
      include: { character: true },
    });
    await this.touchProject(projectId);
    return line;
  }

  async deleteLine(projectId: string, lineId: string) {
    await this.assertLineExists(projectId, lineId);
    const deleted = await this.prisma.dialogueLine.delete({ where: { id: lineId } });
    await this.touchProject(projectId);
    return deleted;
  }

  /** Persist a new ordering. `orderedIds` must contain exactly the project's line ids. */
  async reorderLines(projectId: string, dto: ReorderLinesDto) {
    await this.assertProjectExists(projectId);
    const existing = await this.prisma.dialogueLine.findMany({
      where: { projectId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((l) => l.id));
    const incoming = new Set(dto.orderedIds);

    if (existingIds.size !== incoming.size || ![...existingIds].every((id) => incoming.has(id))) {
      throw new BadRequestException('orderedIds must match the project lines exactly');
    }

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.dialogueLine.update({ where: { id }, data: { order: index } }),
      ),
    );
    await this.touchProject(projectId);
    return this.getProject(projectId);
  }

  async getProjectForPdf(id: string) {
    return this.getProject(id);
  }

  // ----- guards -----

  private async assertProjectExists(id: string) {
    const exists = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Project ${id} not found`);
  }

  private async assertCharacterExists(projectId: string, charId: string) {
    const character = await this.prisma.character.findFirst({
      where: { id: charId, projectId },
      select: { id: true },
    });
    if (!character) throw new NotFoundException(`Character ${charId} not found`);
  }

  private async assertLineExists(projectId: string, lineId: string) {
    const line = await this.prisma.dialogueLine.findFirst({
      where: { id: lineId, projectId },
      select: { id: true },
    });
    if (!line) throw new NotFoundException(`Line ${lineId} not found`);
  }

  private async touchProject(projectId: string) {
    await this.prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });
  }
}
