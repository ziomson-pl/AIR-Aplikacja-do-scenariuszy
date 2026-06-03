import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { ReorderLinesDto } from './dto/reorder-lines.dto';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { ReorderScenesDto } from './dto/reorder-scenes.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ImportTextDto } from './dto/import-text.dto';
import { colorForIndex } from './screenplay.constants';
import { parseImportText } from './text-import';

const fullProjectInclude = {
  characters: { orderBy: { name: 'asc' as const } },
  scenes: {
    orderBy: { order: 'asc' as const },
    include: {
      lines: {
        orderBy: { order: 'asc' as const },
        include: {
          character: true,
          comments: { orderBy: { createdAt: 'asc' as const } },
        },
      },
    },
  },
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
        _count: { select: { scenes: true } },
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

  // ----- Characters -----

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

  // ----- Scenes -----

  async addScene(projectId: string, dto: CreateSceneDto) {
    await this.assertProjectExists(projectId);
    const lastScene = await this.prisma.scene.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (lastScene?.order ?? -1) + 1;
    const scene = await this.prisma.scene.create({
      data: { projectId, heading: dto.heading.trim(), order },
      include: {
        lines: {
          orderBy: { order: 'asc' },
          include: { character: true, comments: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });
    await this.touchProject(projectId);
    return scene;
  }

  async updateScene(projectId: string, sceneId: string, dto: UpdateSceneDto) {
    await this.assertSceneExists(projectId, sceneId);
    const scene = await this.prisma.scene.update({
      where: { id: sceneId },
      data: { heading: dto.heading.trim() },
      include: {
        lines: {
          orderBy: { order: 'asc' },
          include: { character: true, comments: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });
    await this.touchProject(projectId);
    return scene;
  }

  async deleteScene(projectId: string, sceneId: string) {
    await this.assertSceneExists(projectId, sceneId);
    const deleted = await this.prisma.scene.delete({ where: { id: sceneId } });
    await this.touchProject(projectId);
    return deleted;
  }

  async reorderScenes(projectId: string, dto: ReorderScenesDto) {
    await this.assertProjectExists(projectId);
    const existing = await this.prisma.scene.findMany({
      where: { projectId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((s) => s.id));
    const incoming = new Set(dto.orderedIds);

    if (existingIds.size !== incoming.size || ![...existingIds].every((id) => incoming.has(id))) {
      throw new BadRequestException('orderedIds must match the project scenes exactly');
    }

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.scene.update({ where: { id }, data: { order: index } }),
      ),
    );
    await this.touchProject(projectId);
    return this.getProject(projectId);
  }

  // ----- Lines -----

  async addLine(projectId: string, sceneId: string, dto: CreateLineDto) {
    await this.assertSceneExists(projectId, sceneId);

    if (dto.type === 'dialogue') {
      if (!dto.characterId) {
        throw new BadRequestException('Dialogue lines require a characterId');
      }
      await this.assertCharacterExists(projectId, dto.characterId);
    }

    const lastLine = await this.prisma.dialogueLine.findFirst({
      where: { sceneId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (lastLine?.order ?? -1) + 1;

    const line = await this.prisma.dialogueLine.create({
      data: {
        sceneId,
        characterId: dto.type === 'dialogue' ? (dto.characterId ?? null) : null,
        text: dto.text.trim(),
        parenthetical: dto.parenthetical ?? null,
        order,
        type: dto.type,
      },
      include: {
        character: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
    await this.touchProject(projectId);
    return line;
  }

  async updateLine(projectId: string, sceneId: string, lineId: string, dto: UpdateLineDto) {
    await this.assertLineExists(projectId, sceneId, lineId);

    // Save current version before updating
    const current = await this.prisma.dialogueLine.findUnique({
      where: { id: lineId },
      select: { text: true, parenthetical: true },
    });
    if (current) {
      await this.prisma.lineVersion.create({
        data: {
          lineId,
          text: current.text,
          parenthetical: current.parenthetical ?? null,
        },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (dto.text !== undefined) updateData.text = dto.text.trim();
    if (dto.parenthetical !== undefined) updateData.parenthetical = dto.parenthetical;

    const line = await this.prisma.dialogueLine.update({
      where: { id: lineId },
      data: updateData,
      include: {
        character: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
    await this.touchProject(projectId);
    return line;
  }

  async deleteLine(projectId: string, sceneId: string, lineId: string) {
    await this.assertLineExists(projectId, sceneId, lineId);
    const deleted = await this.prisma.dialogueLine.delete({ where: { id: lineId } });
    await this.touchProject(projectId);
    return deleted;
  }

  async reorderLines(projectId: string, sceneId: string, dto: ReorderLinesDto) {
    await this.assertSceneExists(projectId, sceneId);
    const existing = await this.prisma.dialogueLine.findMany({
      where: { sceneId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((l) => l.id));
    const incoming = new Set(dto.orderedIds);

    if (existingIds.size !== incoming.size || ![...existingIds].every((id) => incoming.has(id))) {
      throw new BadRequestException('orderedIds must match the scene lines exactly');
    }

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.dialogueLine.update({ where: { id }, data: { order: index } }),
      ),
    );
    await this.touchProject(projectId);

    const scene = await this.prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        lines: {
          orderBy: { order: 'asc' },
          include: { character: true, comments: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });
    return scene;
  }

  // ----- History -----

  async getLineHistory(projectId: string, lineId: string) {
    const line = await this.prisma.dialogueLine.findFirst({
      where: {
        id: lineId,
        scene: { projectId },
      },
      select: { id: true },
    });
    if (!line) throw new NotFoundException(`Line ${lineId} not found`);

    return this.prisma.lineVersion.findMany({
      where: { lineId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ----- Comments -----

  async addComment(projectId: string, lineId: string, dto: CreateCommentDto) {
    const line = await this.prisma.dialogueLine.findFirst({
      where: { id: lineId, scene: { projectId } },
      select: { id: true },
    });
    if (!line) throw new NotFoundException(`Line ${lineId} not found`);

    return this.prisma.comment.create({
      data: { lineId, text: dto.text.trim() },
    });
  }

  async resolveComment(projectId: string, commentId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, line: { scene: { projectId } } },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { resolved: true },
    });
  }

  async deleteComment(projectId: string, commentId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, line: { scene: { projectId } } },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);

    return this.prisma.comment.delete({ where: { id: commentId } });
  }

  // ----- Import -----

  async importText(projectId: string, dto: ImportTextDto) {
    await this.assertProjectExists(projectId);
    const parsed = parseImportText(dto.text);

    await this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.character.count({ where: { projectId } });
      const existingChars = await tx.character.findMany({
        where: { projectId },
        select: { id: true, name: true },
      });

      const charMap = new Map<string, string>();
      for (const c of existingChars) {
        charMap.set(c.name.toLowerCase(), c.id);
      }

      let colorIdx = existingCount;
      for (const name of parsed.characterNames) {
        if (!charMap.has(name.toLowerCase())) {
          const created = await tx.character.create({
            data: {
              name,
              color: colorForIndex(colorIdx),
              projectId,
            },
          });
          charMap.set(name.toLowerCase(), created.id);
          colorIdx++;
        }
      }

      const lastScene = await tx.scene.findFirst({
        where: { projectId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      let sceneOrder = (lastScene?.order ?? -1) + 1;

      for (const parsedScene of parsed.scenes) {
        const scene = await tx.scene.create({
          data: { projectId, heading: parsedScene.heading, order: sceneOrder++ },
        });

        let lineOrder = 0;
        for (const parsedLine of parsedScene.lines) {
          const characterId =
            parsedLine.type === 'dialogue' && parsedLine.characterName
              ? (charMap.get(parsedLine.characterName.toLowerCase()) ?? null)
              : null;

          await tx.dialogueLine.create({
            data: {
              sceneId: scene.id,
              characterId,
              text: parsedLine.text,
              parenthetical: parsedLine.parenthetical ?? null,
              order: lineOrder++,
              type: parsedLine.type,
            },
          });
        }
      }

      await tx.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      });
    });

    return this.getProject(projectId);
  }

  // ----- Export helpers -----

  async getProjectForExport(id: string) {
    return this.getProject(id);
  }

  // ----- Private guards -----

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

  private async assertSceneExists(projectId: string, sceneId: string) {
    const scene = await this.prisma.scene.findFirst({
      where: { id: sceneId, projectId },
      select: { id: true },
    });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found`);
  }

  private async assertLineExists(projectId: string, sceneId: string, lineId: string) {
    const line = await this.prisma.dialogueLine.findFirst({
      where: { id: lineId, sceneId, scene: { projectId } },
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
