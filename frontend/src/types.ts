export interface Character {
  id: string;
  name: string;
  projectId: string;
}

export interface DialogueLine {
  id: string;
  projectId: string;
  characterId: string | null;
  text: string;
  order: number;
  type: 'dialogue' | 'narrator';
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
  activeSpeakerId: string | null; // null = narrator mode
  narratorMode: boolean;
  loading: boolean;
  error: string | null;
}

export type EditorAction =
  | { type: 'LOAD_PROJECT'; payload: Project }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'REMOVE_CHARACTER'; payload: string }
  | { type: 'SET_ACTIVE_SPEAKER'; payload: string }
  | { type: 'TOGGLE_NARRATOR_MODE' }
  | { type: 'ADD_LINE'; payload: DialogueLine }
  | { type: 'REMOVE_LINE'; payload: string }
  | { type: 'UPDATE_PROJECT_TITLE'; payload: string };
