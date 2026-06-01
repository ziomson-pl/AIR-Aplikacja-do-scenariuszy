import type { EditorState, EditorAction } from './types';

export const initialState: EditorState = {
  project: null,
  activeSpeakerId: null,
  narratorMode: false,
  loading: false,
  error: null,
};

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_PROJECT':
      return {
        ...state,
        project: action.payload,
        activeSpeakerId: action.payload.characters[0]?.id ?? null,
        narratorMode: false,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_CHARACTER':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          characters: [...state.project.characters, action.payload],
        },
      };
    case 'REMOVE_CHARACTER': {
      if (!state.project) return state;
      const remaining = state.project.characters.filter((c) => c.id !== action.payload);
      return {
        ...state,
        project: { ...state.project, characters: remaining },
        activeSpeakerId:
          state.activeSpeakerId === action.payload
            ? (remaining[0]?.id ?? null)
            : state.activeSpeakerId,
      };
    }
    case 'SET_ACTIVE_SPEAKER':
      return { ...state, activeSpeakerId: action.payload, narratorMode: false };
    case 'TOGGLE_NARRATOR_MODE':
      return { ...state, narratorMode: !state.narratorMode, activeSpeakerId: state.narratorMode ? (state.project?.characters[0]?.id ?? null) : null };
    case 'ADD_LINE':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          lines: [...state.project.lines, action.payload],
        },
      };
    case 'REMOVE_LINE':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          lines: state.project.lines.filter((l) => l.id !== action.payload),
        },
      };
    case 'UPDATE_PROJECT_TITLE':
      if (!state.project) return state;
      return { ...state, project: { ...state.project, title: action.payload } };
    default:
      return state;
  }
}
