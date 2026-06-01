import { describe, it, expect } from 'vitest';
import { editorReducer, initialState } from './reducer';
import type { Character, DialogueLine, Project, EditorState } from './types';

const char = (id: string, name = id, color = '#111'): Character => ({
  id,
  name,
  color,
  projectId: 'p1',
});

const line = (
  id: string,
  type: DialogueLine['type'] = 'dialogue',
  characterId: string | null = null,
  text = 'tekst',
  order = 0,
): DialogueLine => ({ id, projectId: 'p1', characterId, text, order, type });

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1',
  title: 'Tytuł',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  characters: [],
  lines: [],
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
    it('updates the character and syncs denormalised lines', () => {
      const state = withProject(
        project({
          characters: [char('a', 'Anna')],
          lines: [{ ...line('l1', 'dialogue', 'a'), character: char('a', 'Anna') }],
        }),
      );
      const updated = char('a', 'Ania', '#abc');
      const next = editorReducer(state, { type: 'UPDATE_CHARACTER', payload: updated });
      expect(next.project!.characters[0].name).toBe('Ania');
      expect(next.project!.lines[0].character!.name).toBe('Ania');
      expect(next.project!.lines[0].character!.color).toBe('#abc');
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
      expect(editorReducer(state, { type: 'SET_COMPOSE_MODE', payload: 'scene' }).composeMode).toBe(
        'scene',
      );
    });
  });

  describe('lines', () => {
    it('ADD_LINE appends', () => {
      const state = withProject(project({ lines: [line('l1')] }));
      const next = editorReducer(state, { type: 'ADD_LINE', payload: line('l2') });
      expect(next.project!.lines.map((l) => l.id)).toEqual(['l1', 'l2']);
    });

    it('UPDATE_LINE replaces the matching line', () => {
      const state = withProject(project({ lines: [line('l1', 'dialogue', null, 'stary')] }));
      const next = editorReducer(state, {
        type: 'UPDATE_LINE',
        payload: line('l1', 'dialogue', null, 'nowy'),
      });
      expect(next.project!.lines[0].text).toBe('nowy');
    });

    it('REMOVE_LINE filters the line out', () => {
      const state = withProject(project({ lines: [line('l1'), line('l2')] }));
      const next = editorReducer(state, { type: 'REMOVE_LINE', payload: 'l1' });
      expect(next.project!.lines.map((l) => l.id)).toEqual(['l2']);
    });

    it('REORDER_LINES replaces the whole list', () => {
      const state = withProject(project({ lines: [line('l1'), line('l2')] }));
      const reordered = [line('l2'), line('l1')];
      const next = editorReducer(state, { type: 'REORDER_LINES', payload: reordered });
      expect(next.project!.lines.map((l) => l.id)).toEqual(['l2', 'l1']);
    });
  });

  describe('guards', () => {
    it('returns state unchanged for project-scoped actions when no project is loaded', () => {
      const next = editorReducer(initialState, { type: 'ADD_LINE', payload: line('l1') });
      expect(next).toBe(initialState);
    });

    it('UPDATE_PROJECT_TITLE changes the title', () => {
      const state = withProject(project({ title: 'Stary' }));
      const next = editorReducer(state, { type: 'UPDATE_PROJECT_TITLE', payload: 'Nowy' });
      expect(next.project!.title).toBe('Nowy');
    });
  });
});
