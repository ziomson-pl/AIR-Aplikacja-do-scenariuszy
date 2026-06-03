import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ProjectsService } from './projects.service';
import { PdfService } from './pdf.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { ReorderScenesDto } from './dto/reorder-scenes.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { ReorderLinesDto } from './dto/reorder-lines.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ImportTextDto } from './dto/import-text.dto';
import { buildFountainText } from './fountain-export';
import { buildDocxBuffer } from './docx-export';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly pdfService: PdfService,
  ) {}

  // ----- Projects -----

  @Post()
  createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  @Get()
  listProjects() {
    return this.projectsService.listProjects();
  }

  @Get(':id')
  getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @Put(':id')
  updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.updateProject(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(@Param('id') id: string) {
    await this.projectsService.deleteProject(id);
  }

  // ----- Characters -----

  @Post(':id/characters')
  addCharacter(@Param('id') projectId: string, @Body() dto: CreateCharacterDto) {
    return this.projectsService.addCharacter(projectId, dto);
  }

  @Patch(':id/characters/:charId')
  updateCharacter(
    @Param('id') projectId: string,
    @Param('charId') charId: string,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.projectsService.updateCharacter(projectId, charId, dto);
  }

  @Delete(':id/characters/:charId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCharacter(@Param('id') projectId: string, @Param('charId') charId: string) {
    await this.projectsService.deleteCharacter(projectId, charId);
  }

  // ----- Scenes -----

  @Post(':id/scenes')
  addScene(@Param('id') projectId: string, @Body() dto: CreateSceneDto) {
    return this.projectsService.addScene(projectId, dto);
  }

  @Put(':id/scenes/:sceneId')
  updateScene(
    @Param('id') projectId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: UpdateSceneDto,
  ) {
    return this.projectsService.updateScene(projectId, sceneId, dto);
  }

  @Delete(':id/scenes/:sceneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteScene(@Param('id') projectId: string, @Param('sceneId') sceneId: string) {
    await this.projectsService.deleteScene(projectId, sceneId);
  }

  @Patch(':id/scenes/reorder')
  reorderScenes(@Param('id') projectId: string, @Body() dto: ReorderScenesDto) {
    return this.projectsService.reorderScenes(projectId, dto);
  }

  // ----- Lines -----

  @Post(':id/scenes/:sceneId/lines')
  addLine(
    @Param('id') projectId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: CreateLineDto,
  ) {
    return this.projectsService.addLine(projectId, sceneId, dto);
  }

  @Patch(':id/scenes/:sceneId/lines/reorder')
  reorderLines(
    @Param('id') projectId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: ReorderLinesDto,
  ) {
    return this.projectsService.reorderLines(projectId, sceneId, dto);
  }

  @Patch(':id/scenes/:sceneId/lines/:lineId')
  updateLine(
    @Param('id') projectId: string,
    @Param('sceneId') sceneId: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateLineDto,
  ) {
    return this.projectsService.updateLine(projectId, sceneId, lineId, dto);
  }

  @Delete(':id/scenes/:sceneId/lines/:lineId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLine(
    @Param('id') projectId: string,
    @Param('sceneId') sceneId: string,
    @Param('lineId') lineId: string,
  ) {
    await this.projectsService.deleteLine(projectId, sceneId, lineId);
  }

  // ----- History -----

  @Get(':id/lines/:lineId/history')
  getLineHistory(@Param('id') projectId: string, @Param('lineId') lineId: string) {
    return this.projectsService.getLineHistory(projectId, lineId);
  }

  // ----- Comments -----

  @Post(':id/lines/:lineId/comments')
  addComment(
    @Param('id') projectId: string,
    @Param('lineId') lineId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.projectsService.addComment(projectId, lineId, dto);
  }

  @Patch(':id/comments/:commentId/resolve')
  resolveComment(@Param('id') projectId: string, @Param('commentId') commentId: string) {
    return this.projectsService.resolveComment(projectId, commentId);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(@Param('id') projectId: string, @Param('commentId') commentId: string) {
    await this.projectsService.deleteComment(projectId, commentId);
  }

  // ----- Import -----

  @Post(':id/import')
  importText(@Param('id') projectId: string, @Body() dto: ImportTextDto) {
    return this.projectsService.importText(projectId, dto);
  }

  // ----- Export -----

  @Get(':id/export/pdf')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const project = await this.projectsService.getProjectForExport(id);

    const pdfProject = {
      title: project.title,
      scenes: project.scenes.map((scene) => ({
        heading: scene.heading,
        lines: scene.lines.map((line) => ({
          type: line.type as 'dialogue' | 'narrator',
          characterName: line.character?.name ?? null,
          text: line.text,
          parenthetical: line.parenthetical ?? null,
        })),
      })),
    };

    const pdfBuffer = await this.pdfService.generatePdf(pdfProject);
    const safeTitle = project.title.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'scenariusz';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.end(pdfBuffer);
  }

  @Get(':id/export/fountain')
  async exportFountain(@Param('id') id: string, @Res() res: Response) {
    const project = await this.projectsService.getProjectForExport(id);
    const text = buildFountainText(project);
    const safeTitle = project.title.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'scenariusz';

    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeTitle}.fountain"`,
    });
    res.end(text);
  }

  @Get(':id/export/docx')
  async exportDocx(@Param('id') id: string, @Res() res: Response) {
    const project = await this.projectsService.getProjectForExport(id);
    const buffer = await buildDocxBuffer(project);
    const safeTitle = project.title.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'scenariusz';

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${safeTitle}.docx"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }
}
