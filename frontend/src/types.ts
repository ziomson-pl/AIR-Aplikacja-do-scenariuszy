export type LineType = 'dialogue' | 'narrator';
export type ExportFormat = 'pdf' | 'fountain' | 'docx';

export interface Character {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface Comment {
  id: string;
  lineId: string;
  text: string;
  resolved: boolean;
  createdAt: string;
}

export interface LineVersion {
  id: string;
  lineId: string;
  text: string;
  parenthetical: string | null;
  createdAt: string;
}

export interface DialogueLine {
  id: string;
  sceneId: string;
  characterId: string | null;
  text: string;
  parenthetical: string | null;
  order: number;
  type: LineType;
  character?: Character | null;
  comments?: Comment[];
}

export interface Scene {
  id: string;
  projectId: string;
  heading: string;
  order: number;
  lines: DialogueLine[];
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  characters: Character[];
  scenes: Scene[];
}

export interface ProjectSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  characters: Character[];
  _count: { scenes: number };
}

export type ComposeMode = LineType;

export interface EditorState {
  project: Project | null;
  activeSpeakerId: string | null;
  composeMode: ComposeMode;
  activeSceneId: string | null;
  collapsedScenes: Set<string>;
  loading: boolean;
  error: string | null;
}

export type EditorAction =
  | { type: 'LOAD_PROJECT'; payload: Project }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'UPDATE_CHARACTER'; payload: Character }
  | { type: 'REMOVE_CHARACTER'; payload: string }
  | { type: 'SET_ACTIVE_SPEAKER'; payload: string }
  | { type: 'SET_COMPOSE_MODE'; payload: ComposeMode }
  | { type: 'SET_ACTIVE_SCENE'; payload: string }
  | { type: 'TOGGLE_SCENE_COLLAPSE'; payload: string }
  | { type: 'ADD_SCENE'; payload: Scene }
  | { type: 'UPDATE_SCENE'; payload: Scene }
  | { type: 'REMOVE_SCENE'; payload: string }
  | { type: 'REORDER_SCENES'; payload: Scene[] }
  | { type: 'ADD_LINE'; payload: { sceneId: string; line: DialogueLine } }
  | { type: 'UPDATE_LINE'; payload: { sceneId: string; line: DialogueLine } }
  | { type: 'REMOVE_LINE'; payload: { sceneId: string; lineId: string } }
  | { type: 'REORDER_LINES'; payload: { sceneId: string; lines: DialogueLine[] } }
  | { type: 'ADD_COMMENT'; payload: { lineId: string; sceneId: string; comment: Comment } }
  | { type: 'RESOLVE_COMMENT'; payload: { lineId: string; sceneId: string; commentId: string } }
  | { type: 'REMOVE_COMMENT'; payload: { lineId: string; sceneId: string; commentId: string } }
  | { type: 'UPDATE_PROJECT_TITLE'; payload: string };
