import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { CHARACTER_PALETTE } from './screenplay.constants';

function createPrismaMock() {
  return {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    character: {
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scene: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dialogueLine: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    lineVersion: {
      create: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ProjectsService);
  });

  describe('createProject', () => {
    it('trims the title before persisting', async () => {
      prisma.project.create.mockResolvedValue({ id: 'p1', title: 'Mój film' });
      await service.createProject({ title: '  Mój film  ' });
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { title: 'Mój film' } }),
      );
    });
  });

  describe('getProject', () => {
    it('returns the project when it exists', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1', title: 'X' });
      await expect(service.getProject('p1')).resolves.toEqual({ id: 'p1', title: 'X' });
    });

    it('throws NotFound when missing', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.getProject('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('addCharacter', () => {
    it('assigns the next palette colour based on existing count', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.character.count.mockResolvedValue(2);
      prisma.character.create.mockResolvedValue({ id: 'c3' });

      await service.addCharacter('p1', { name: '  Anna  ' });

      expect(prisma.character.create).toHaveBeenCalledWith({
        data: { name: 'Anna', color: CHARACTER_PALETTE[2], projectId: 'p1' },
      });
    });

    it('respects an explicitly provided colour', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.character.count.mockResolvedValue(0);
      prisma.character.create.mockResolvedValue({ id: 'c1' });

      await service.addCharacter('p1', { name: 'Bob', color: '#abcdef' });

      expect(prisma.character.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ color: '#abcdef' }) }),
      );
    });

    it('throws NotFound for an unknown project', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.addCharacter('nope', { name: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateCharacter', () => {
    it('rejects an empty update', async () => {
      prisma.character.findFirst.mockResolvedValue({ id: 'c1' });
      await expect(service.updateCharacter('p1', 'c1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('updates only the provided fields', async () => {
      prisma.character.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.character.update.mockResolvedValue({ id: 'c1', name: 'New' });
      await service.updateCharacter('p1', 'c1', { name: '  New  ' });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { name: 'New' },
      });
    });
  });

  describe('addLine', () => {
    beforeEach(() => {
      prisma.scene.findFirst.mockResolvedValue({ id: 's1', projectId: 'p1' });
      prisma.project.update.mockResolvedValue({ id: 'p1' });
    });

    it('computes order as last + 1 and trims text', async () => {
      prisma.character.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.dialogueLine.findFirst.mockResolvedValue({ order: 4 });
      prisma.dialogueLine.create.mockResolvedValue({ id: 'l1' });

      await service.addLine('p1', 's1', { text: '  Cześć  ', type: 'dialogue', characterId: 'c1' });

      expect(prisma.dialogueLine.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 5, text: 'Cześć', characterId: 'c1' }),
        }),
      );
    });

    it('starts ordering at 0 for the first line', async () => {
      prisma.dialogueLine.findFirst.mockResolvedValue(null);
      prisma.dialogueLine.create.mockResolvedValue({ id: 'l1' });

      await service.addLine('p1', 's1', { text: 'Pada deszcz', type: 'narrator' });

      expect(prisma.dialogueLine.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ order: 0, characterId: null }) }),
      );
    });

    it('rejects a dialogue line without a character', async () => {
      await expect(
        service.addLine('p1', 's1', { text: 'Hej', type: 'dialogue' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('stores narrator lines with a null character', async () => {
      prisma.dialogueLine.findFirst.mockResolvedValue(null);
      prisma.dialogueLine.create.mockResolvedValue({ id: 'l1' });

      await service.addLine('p1', 's1', { text: 'Pada deszcz', type: 'narrator' });

      expect(prisma.dialogueLine.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ characterId: null }) }),
      );
    });
  });

  describe('reorderLines', () => {
    it('rejects an id set that does not match the scene', async () => {
      prisma.scene.findFirst.mockResolvedValue({ id: 's1', projectId: 'p1' });
      prisma.dialogueLine.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);

      await expect(
        service.reorderLines('p1', 's1', { orderedIds: ['a', 'x'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('writes new order indexes inside a transaction', async () => {
      prisma.scene.findFirst.mockResolvedValue({ id: 's1', projectId: 'p1' });
      prisma.scene.findUnique.mockResolvedValue({ id: 's1', lines: [] });
      prisma.dialogueLine.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
      prisma.project.update.mockResolvedValue({ id: 'p1' });
      prisma.dialogueLine.update.mockImplementation((args: unknown) => args);

      await service.reorderLines('p1', 's1', { orderedIds: ['b', 'a'] });

      expect(prisma.dialogueLine.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'b' },
        data: { order: 0 },
      });
      expect(prisma.dialogueLine.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'a' },
        data: { order: 1 },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('deleteLine', () => {
    it('throws NotFound when the line is absent', async () => {
      prisma.dialogueLine.findFirst.mockResolvedValue(null);
      await expect(service.deleteLine('p1', 's1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('addScene', () => {
    it('computes order as last scene order + 1', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.scene.findFirst.mockResolvedValue({ order: 2 });
      prisma.scene.create.mockResolvedValue({ id: 's3', heading: 'EXT. PARK — NACHT', order: 3, lines: [] });
      prisma.project.update.mockResolvedValue({ id: 'p1' });

      await service.addScene('p1', { heading: 'EXT. PARK — NACHT' });

      expect(prisma.scene.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ order: 3 }) }),
      );
    });
  });
});
