export type LineType = 'dialogue' | 'narrator' | 'scene';

/** What the composer is currently set to produce. */
export type ComposeMode = LineType;

export interface Character {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface DialogueLine {
  id: string;
  projectId: string;
  characterId: string | null;
  text: string;
  order: number;
  type: LineType;
  character?: Character | null;
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  characters: Character[];
  lines: DialogueLine[];
}

export interface ProjectSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  characters: Character[];
  _count: { lines: number };
}

// ---- Reducer state & actions ----

export interface EditorState {
  project: Project | null;
  activeSpeakerId: string | null;
  composeMode: ComposeMode;
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
  | { type: 'ADD_LINE'; payload: DialogueLine }
  | { type: 'UPDATE_LINE'; payload: DialogueLine }
  | { type: 'REMOVE_LINE'; payload: string }
  | { type: 'REORDER_LINES'; payload: DialogueLine[] }
  | { type: 'UPDATE_PROJECT_TITLE'; payload: string };
