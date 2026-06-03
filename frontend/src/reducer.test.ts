import { describe, it, expect } from 'vitest';
import { editorReducer, initialState } from './reducer';
import type { Character, DialogueLine, Scene, Project, EditorState } from './types';

const char = (id: string, name = id, color = '#111'): Character => ({
  id,
  name,
  color,
  projectId: 'p1',
});

const line = (
  id: string,
  sceneId = 's1',
  type: DialogueLine['type'] = 'dialogue',
  characterId: string | null = null,
  text = 'tekst',
  order = 0,
): DialogueLine => ({
  id,
  sceneId,
  characterId,
  text,
  parenthetical: null,
  order,
  type,
});

const scene = (id: string, lines: DialogueLine[] = [], order = 0): Scene => ({
  id,
  projectId: 'p1',
  heading: 'INT. POKÓJ — DZIEŃ',
  order,
  lines,
});

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1',
  title: 'Tytuł',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  characters: [],
  scenes: [],
  ...over,
});

const withProject = (p: Project, over: Partial<EditorState> = {}): EditorState => ({
  ...initialState,
  project: p,
  ...over,
});

describe('editorReducer', () => {
  describe('LOAD_PROJECT', () => {
    it('selects the first character and dialogue mode', () => {
      const p = project({ characters: [char('a'), char('b')] });
      const next = editorReducer(initialState, { type: 'LOAD_PROJECT', payload: p });
      expect(next.activeSpeakerId).toBe('a');
      expect(next.composeMode).toBe('dialogue');
      expect(next.loading).toBe(false);
    });

    it('sets the first scene as active', () => {
      const p = project({ scenes: [scene('s1'), scene('s2', [], 1)] });
      const next = editorReducer(initialState, { type: 'LOAD_PROJECT', payload: p });
      expect(next.activeSceneId).toBe('s1');
    });

    it('falls back to narrator mode when there are no characters', () => {
      const next = editorReducer(initialState, { type: 'LOAD_PROJECT', payload: project() });
      expect(next.activeSpeakerId).toBeNull();
      expect(next.composeMode).toBe('narrator');
    });
  });

  describe('ADD_CHARACTER', () => {
    it('makes the very first character the active speaker', () => {
      const state = withProject(project(), { activeSpeakerId: null, composeMode: 'narrator' });
      const next = editorReducer(state, { type: 'ADD_CHARACTER', payload: char('a') });
      expect(next.project!.characters).toHaveLength(1);
      expect(next.activeSpeakerId).toBe('a');
      expect(next.composeMode).toBe('dialogue');
    });

    it('does not change the active speaker for later characters', () => {
      const state = withProject(project({ characters: [char('a')] }), { activeSpeakerId: 'a' });
      const next = editorReducer(state, { type: 'ADD_CHARACTER', payload: char('b') });
      expect(next.activeSpeakerId).toBe('a');
      expect(next.project!.characters.map((c) => c.id)).toEqual(['a', 'b']);
    });
  });

  describe('UPDATE_CHARACTER', () => {
    it('updates the character and syncs denormalized lines in scenes', () => {
      const l = { ...line('l1', 's1', 'dialogue', 'a'), character: char('a', 'Anna') };
      const state = withProject(
        project({
          characters: [char('a', 'Anna')],
          scenes: [scene('s1', [l])],
        }),
      );
      const updated = char('a', 'Ania', '#abc');
      const next = editorReducer(state, { type: 'UPDATE_CHARACTER', payload: updated });
      expect(next.project!.characters[0].name).toBe('Ania');
      expect(next.project!.scenes[0].lines[0].character!.name).toBe('Ania');
      expect(next.project!.scenes[0].lines[0].character!.color).toBe('#abc');
    });
  });

  describe('REMOVE_CHARACTER', () => {
    it('reassigns the active speaker when the active one is removed', () => {
      const state = withProject(project({ characters: [char('a'), char('b')] }), {
        activeSpeakerId: 'a',
      });
      const next = editorReducer(state, { type: 'REMOVE_CHARACTER', payload: 'a' });
      expect(next.project!.characters.map((c) => c.id)).toEqual(['b']);
      expect(next.activeSpeakerId).toBe('b');
    });

    it('keeps the active speaker when a different character is removed', () => {
      const state = withProject(project({ characters: [char('a'), char('b')] }), {
        activeSpeakerId: 'b',
      });
      const next = editorReducer(state, { type: 'REMOVE_CHARACTER', payload: 'a' });
      expect(next.activeSpeakerId).toBe('b');
    });
  });

  describe('speaker & mode', () => {
    it('SET_ACTIVE_SPEAKER switches to dialogue mode', () => {
      const state = withProject(project({ characters: [char('a')] }), { composeMode: 'narrator' });
      const next = editorReducer(state, { type: 'SET_ACTIVE_SPEAKER', payload: 'a' });
      expect(next.activeSpeakerId).toBe('a');
      expect(next.composeMode).toBe('dialogue');
    });

    it('SET_COMPOSE_MODE switches the mode', () => {
      const state = withProject(project());
      expect(
        editorReducer(state, { type: 'SET_COMPOSE_MODE', payload: 'narrator' }).composeMode,
      ).toBe('narrator');
    });
  });

  describe('scenes', () => {
    it('ADD_SCENE appends', () => {
      const state = withProject(project());
      const s = scene('s1');
      const next = editorReducer(state, { type: 'ADD_SCENE', payload: s });
      expect(next.project!.scenes.map((s) => s.id)).toEqual(['s1']);
    });

    it('REMOVE_SCENE removes and updates activeSceneId', () => {
      const state = withProject(project({ scenes: [scene('s1'), scene('s2', [], 1)] }), {
        activeSceneId: 's1',
      });
      const next = editorReducer(state, { type: 'REMOVE_SCENE', payload: 's1' });
      expect(next.project!.scenes.map((s) => s.id)).toEqual(['s2']);
      expect(next.activeSceneId).toBe('s2');
    });

    it('TOGGLE_SCENE_COLLAPSE adds then removes', () => {
      const state = withProject(project());
      const after = editorReducer(state, { type: 'TOGGLE_SCENE_COLLAPSE', payload: 's1' });
      expect(after.collapsedScenes.has('s1')).toBe(true);
      const after2 = editorReducer(after, { type: 'TOGGLE_SCENE_COLLAPSE', payload: 's1' });
      expect(after2.collapsedScenes.has('s1')).toBe(false);
    });
  });

  describe('lines', () => {
    it('ADD_LINE appends to the correct scene', () => {
      const state = withProject(project({ scenes: [scene('s1', [line('l1')])] }));
      const newLine = line('l2', 's1');
      const next = editorReducer(state, { type: 'ADD_LINE', payload: { sceneId: 's1', line: newLine } });
      expect(next.project!.scenes[0].lines.map((l) => l.id)).toEqual(['l1', 'l2']);
    });

    it('UPDATE_LINE replaces the matching line', () => {
      const state = withProject(
        project({ scenes: [scene('s1', [line('l1', 's1', 'dialogue', null, 'stary')])] }),
      );
      const updated = line('l1', 's1', 'dialogue', null, 'nowy');
      const next = editorReducer(state, {
        type: 'UPDATE_LINE',
        payload: { sceneId: 's1', line: updated },
      });
      expect(next.project!.scenes[0].lines[0].text).toBe('nowy');
    });

    it('REMOVE_LINE filters the line out of the correct scene', () => {
      const state = withProject(
        project({ scenes: [scene('s1', [line('l1'), line('l2')])] }),
      );
      const next = editorReducer(state, {
        type: 'REMOVE_LINE',
        payload: { sceneId: 's1', lineId: 'l1' },
      });
      expect(next.project!.scenes[0].lines.map((l) => l.id)).toEqual(['l2']);
    });

    it('REORDER_LINES replaces the scene lines', () => {
      const state = withProject(
        project({ scenes: [scene('s1', [line('l1'), line('l2')])] }),
      );
      const reordered = [line('l2'), line('l1')];
      const next = editorReducer(state, {
        type: 'REORDER_LINES',
        payload: { sceneId: 's1', lines: reordered },
      });
      expect(next.project!.scenes[0].lines.map((l) => l.id)).toEqual(['l2', 'l1']);
    });
  });

  describe('guards', () => {
    it('returns state unchanged for project-scoped actions when no project is loaded', () => {
      const next = editorReducer(initialState, {
        type: 'ADD_LINE',
        payload: { sceneId: 's1', line: line('l1') },
      });
      expect(next).toBe(initialState);
    });

    it('UPDATE_PROJECT_TITLE changes the title', () => {
      const state = withProject(project({ title: 'Stary' }));
      const next = editorReducer(state, { type: 'UPDATE_PROJECT_TITLE', payload: 'Nowy' });
      expect(next.project!.title).toBe('Nowy');
    });
  });
});
