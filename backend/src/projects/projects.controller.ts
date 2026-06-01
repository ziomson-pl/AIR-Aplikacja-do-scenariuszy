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
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { ReorderLinesDto } from './dto/reorder-lines.dto';
import { LineTypeValue } from './screenplay.constants';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly pdfService: PdfService,
  ) {}

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

  @Post(':id/lines')
  addLine(@Param('id') projectId: string, @Body() dto: CreateLineDto) {
    return this.projectsService.addLine(projectId, dto);
  }

  @Patch(':id/lines/reorder')
  reorderLines(@Param('id') projectId: string, @Body() dto: ReorderLinesDto) {
    return this.projectsService.reorderLines(projectId, dto);
  }

  @Patch(':id/lines/:lineId')
  updateLine(
    @Param('id') projectId: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateLineDto,
  ) {
    return this.projectsService.updateLine(projectId, lineId, dto);
  }

  @Delete(':id/lines/:lineId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLine(@Param('id') projectId: string, @Param('lineId') lineId: string) {
    await this.projectsService.deleteLine(projectId, lineId);
  }

  @Get(':id/export/pdf')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const project = await this.projectsService.getProjectForPdf(id);

    const pdfBuffer = await this.pdfService.generatePdf({
      title: project.title,
      lines: project.lines.map((line) => ({
        type: line.type as LineTypeValue,
        characterName: line.character?.name ?? null,
        text: line.text,
      })),
    });

    const safeTitle = project.title.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'scenariusz';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.end(pdfBuffer);
  }
}
