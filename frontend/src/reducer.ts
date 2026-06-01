import type { EditorState, EditorAction } from './types';

export const initialState: EditorState = {
  project: null,
  activeSpeakerId: null,
  composeMode: 'dialogue',
  loading: false,
  error: null,
};

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_PROJECT': {
      const firstSpeaker = action.payload.characters[0]?.id ?? null;
      return {
        ...state,
        project: action.payload,
        activeSpeakerId: firstSpeaker,
        composeMode: firstSpeaker ? 'dialogue' : 'narrator',
        loading: false,
        error: null,
      };
    }

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'ADD_CHARACTER': {
      if (!state.project) return state;
      const isFirst = state.project.characters.length === 0;
      return {
        ...state,
        project: {
          ...state.project,
          characters: [...state.project.characters, action.payload],
        },
        // First character ever added becomes the active speaker in dialogue mode.
        activeSpeakerId: isFirst ? action.payload.id : state.activeSpeakerId,
        composeMode: isFirst ? 'dialogue' : state.composeMode,
      };
    }

    case 'UPDATE_CHARACTER': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          characters: state.project.characters.map((c) =>
            c.id === action.payload.id ? action.payload : c,
          ),
          // Keep denormalised character on existing lines in sync.
          lines: state.project.lines.map((l) =>
            l.characterId === action.payload.id ? { ...l, character: action.payload } : l,
          ),
        },
      };
    }

    case 'REMOVE_CHARACTER': {
      if (!state.project) return state;
      const remaining = state.project.characters.filter((c) => c.id !== action.payload);
      const wasActive = state.activeSpeakerId === action.payload;
      return {
        ...state,
        project: { ...state.project, characters: remaining },
        activeSpeakerId: wasActive ? (remaining[0]?.id ?? null) : state.activeSpeakerId,
      };
    }

    case 'SET_ACTIVE_SPEAKER':
      return { ...state, activeSpeakerId: action.payload, composeMode: 'dialogue' };

    case 'SET_COMPOSE_MODE':
      return { ...state, composeMode: action.payload };

    case 'ADD_LINE': {
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, lines: [...state.project.lines, action.payload] },
      };
    }

    case 'UPDATE_LINE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          lines: state.project.lines.map((l) => (l.id === action.payload.id ? action.payload : l)),
        },
      };
    }

    case 'REMOVE_LINE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          lines: state.project.lines.filter((l) => l.id !== action.payload),
        },
      };
    }

    case 'REORDER_LINES': {
      if (!state.project) return state;
      return { ...state, project: { ...state.project, lines: action.payload } };
    }

    case 'UPDATE_PROJECT_TITLE': {
      if (!state.project) return state;
      return { ...state, project: { ...state.project, title: action.payload } };
    }

    default:
      return state;
  }
}
