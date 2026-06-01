import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { CreateLineDto } from './dto/create-line.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { title: dto.title },
      include: { characters: true, lines: { orderBy: { order: 'asc' } } },
    });
  }

  async listProjects() {
    return this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        characters: true,
        _count: { select: { lines: true } },
      },
    });
  }

  async getProject(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        characters: true,
        lines: {
          orderBy: { order: 'asc' },
          include: { character: true },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    await this.assertProjectExists(id);
    return this.prisma.project.update({
      where: { id },
      data: { title: dto.title },
      include: { characters: true, lines: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteProject(id: string) {
    await this.assertProjectExists(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async addCharacter(projectId: string, dto: CreateCharacterDto) {
    await this.assertProjectExists(projectId);
    return this.prisma.character.create({
      data: { name: dto.name, projectId },
    });
  }

  async deleteCharacter(projectId: string, charId: string) {
    await this.assertProjectExists(projectId);
    const character = await this.prisma.character.findFirst({
      where: { id: charId, projectId },
    });
    if (!character) throw new NotFoundException(`Character ${charId} not found`);
    return this.prisma.character.delete({ where: { id: charId } });
  }

  async addLine(projectId: string, dto: CreateLineDto) {
    await this.assertProjectExists(projectId);

    const lastLine = await this.prisma.dialogueLine.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    });
    const order = (lastLine?.order ?? -1) + 1;

    return this.prisma.dialogueLine.create({
      data: {
        projectId,
        characterId: dto.characterId ?? null,
        text: dto.text,
        order,
        type: dto.type,
      },
      include: { character: true },
    });
  }

  async deleteLine(projectId: string, lineId: string) {
    await this.assertProjectExists(projectId);
    const line = await this.prisma.dialogueLine.findFirst({
      where: { id: lineId, projectId },
    });
    if (!line) throw new NotFoundException(`Line ${lineId} not found`);
    return this.prisma.dialogueLine.delete({ where: { id: lineId } });
  }

  async getProjectForPdf(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        characters: true,
        lines: {
          orderBy: { order: 'asc' },
          include: { character: true },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  private async assertProjectExists(id: string) {
    const exists = await this.prisma.project.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Project ${id} not found`);
  }
}
