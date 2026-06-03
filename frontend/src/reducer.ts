import type { EditorState, EditorAction } from './types';

export const initialState: EditorState = {
  project: null,
  activeSpeakerId: null,
  composeMode: 'dialogue',
  activeSceneId: null,
  collapsedScenes: new Set<string>(),
  loading: false,
  error: null,
};

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_PROJECT': {
      const firstSpeaker = action.payload.characters[0]?.id ?? null;
      const firstScene = action.payload.scenes[0]?.id ?? null;
      return {
        ...state,
        project: action.payload,
        activeSpeakerId: firstSpeaker,
        activeSceneId: firstScene,
        composeMode: firstSpeaker ? 'dialogue' : 'narrator',
        collapsedScenes: new Set<string>(),
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
          scenes: state.project.scenes.map((scene) => ({
            ...scene,
            lines: scene.lines.map((l) =>
              l.characterId === action.payload.id ? { ...l, character: action.payload } : l,
            ),
          })),
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

    case 'SET_ACTIVE_SCENE':
      return { ...state, activeSceneId: action.payload };

    case 'TOGGLE_SCENE_COLLAPSE': {
      const next = new Set<string>(state.collapsedScenes);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, collapsedScenes: next };
    }

    case 'ADD_SCENE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: [...state.project.scenes, action.payload],
        },
        activeSceneId: state.activeSceneId ?? action.payload.id,
      };
    }

    case 'UPDATE_SCENE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((s) =>
            s.id === action.payload.id ? action.payload : s,
          ),
        },
      };
    }

    case 'REMOVE_SCENE': {
      if (!state.project) return state;
      const remainingScenes = state.project.scenes.filter((s) => s.id !== action.payload);
      const newActiveSceneId =
        state.activeSceneId === action.payload
          ? (remainingScenes[0]?.id ?? null)
          : state.activeSceneId;
      const newCollapsed = new Set<string>(state.collapsedScenes);
      newCollapsed.delete(action.payload);
      return {
        ...state,
        project: { ...state.project, scenes: remainingScenes },
        activeSceneId: newActiveSceneId,
        collapsedScenes: newCollapsed,
      };
    }

    case 'REORDER_SCENES': {
      if (!state.project) return state;
      return { ...state, project: { ...state.project, scenes: action.payload } };
    }

    case 'ADD_LINE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? { ...scene, lines: [...scene.lines, action.payload.line] }
              : scene,
          ),
        },
      };
    }

    case 'UPDATE_LINE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? {
                  ...scene,
                  lines: scene.lines.map((l) =>
                    l.id === action.payload.line.id ? action.payload.line : l,
                  ),
                }
              : scene,
          ),
        },
      };
    }

    case 'REMOVE_LINE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? { ...scene, lines: scene.lines.filter((l) => l.id !== action.payload.lineId) }
              : scene,
          ),
        },
      };
    }

    case 'REORDER_LINES': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? { ...scene, lines: action.payload.lines }
              : scene,
          ),
        },
      };
    }

    case 'ADD_COMMENT': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? {
                  ...scene,
                  lines: scene.lines.map((l) =>
                    l.id === action.payload.lineId
                      ? { ...l, comments: [...(l.comments ?? []), action.payload.comment] }
                      : l,
                  ),
                }
              : scene,
          ),
        },
      };
    }

    case 'RESOLVE_COMMENT': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? {
                  ...scene,
                  lines: scene.lines.map((l) =>
                    l.id === action.payload.lineId
                      ? {
                          ...l,
                          comments: (l.comments ?? []).map((c) =>
                            c.id === action.payload.commentId ? { ...c, resolved: true } : c,
                          ),
                        }
                      : l,
                  ),
                }
              : scene,
          ),
        },
      };
    }

    case 'REMOVE_COMMENT': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? {
                  ...scene,
                  lines: scene.lines.map((l) =>
                    l.id === action.payload.lineId
                      ? {
                          ...l,
                          comments: (l.comments ?? []).filter(
                            (c) => c.id !== action.payload.commentId,
                          ),
                        }
                      : l,
                  ),
                }
              : scene,
          ),
        },
      };
    }

    case 'UPDATE_PROJECT_TITLE': {
      if (!state.project) return state;
      return { ...state, project: { ...state.project, title: action.payload } };
    }

    default:
      return state;
  }
}
