import axios from 'axios';
import type { Project, ProjectSummary, Character, Scene, DialogueLine, Comment, LineVersion } from './types';

const api = axios.create({ baseURL: 'http://localhost:3000' });

// ----- Projects -----

export async function listProjects(): Promise<ProjectSummary[]> {
  const { data } = await api.get('/projects');
  return data;
}

export async function createProject(title: string): Promise<Project> {
  const { data } = await api.post('/projects', { title });
  return data;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function updateProjectTitle(id: string, title: string): Promise<Project> {
  const { data } = await api.put(`/projects/${id}`, { title });
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

// ----- Characters -----

export async function addCharacter(projectId: string, name: string, color?: string): Promise<Character> {
  const { data } = await api.post(`/projects/${projectId}/characters`, { name, color });
  return data;
}

export async function updateCharacter(
  projectId: string,
  charId: string,
  patch: { name?: string; color?: string },
): Promise<Character> {
  const { data } = await api.patch(`/projects/${projectId}/characters/${charId}`, patch);
  return data;
}

export async function deleteCharacter(projectId: string, charId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/characters/${charId}`);
}

// ----- Scenes -----

export async function addScene(projectId: string, heading: string): Promise<Scene> {
  const { data } = await api.post(`/projects/${projectId}/scenes`, { heading });
  return data;
}

export async function updateScene(projectId: string, sceneId: string, heading: string): Promise<Scene> {
  const { data } = await api.put(`/projects/${projectId}/scenes/${sceneId}`, { heading });
  return data;
}

export async function deleteScene(projectId: string, sceneId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/scenes/${sceneId}`);
}

export async function reorderScenes(projectId: string, orderedIds: string[]): Promise<Project> {
  const { data } = await api.patch(`/projects/${projectId}/scenes/reorder`, { orderedIds });
  return data;
}

// ----- Lines -----

export async function addLine(
  projectId: string,
  sceneId: string,
  dto: { text: string; type: string; characterId?: string | null; parenthetical?: string | null },
): Promise<DialogueLine> {
  const { data } = await api.post(`/projects/${projectId}/scenes/${sceneId}/lines`, dto);
  return data;
}

export async function updateLine(
  projectId: string,
  sceneId: string,
  lineId: string,
  dto: { text?: string; parenthetical?: string | null },
): Promise<DialogueLine> {
  const { data } = await api.patch(`/projects/${projectId}/scenes/${sceneId}/lines/${lineId}`, dto);
  return data;
}

export async function deleteLine(projectId: string, sceneId: string, lineId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/scenes/${sceneId}/lines/${lineId}`);
}

export async function reorderLines(projectId: string, sceneId: string, orderedIds: string[]): Promise<Scene> {
  const { data } = await api.patch(`/projects/${projectId}/scenes/${sceneId}/lines/reorder`, { orderedIds });
  return data;
}

// ----- History -----

export async function getLineHistory(projectId: string, lineId: string): Promise<LineVersion[]> {
  const { data } = await api.get(`/projects/${projectId}/lines/${lineId}/history`);
  return data;
}

// ----- Comments -----

export async function addComment(projectId: string, lineId: string, text: string): Promise<Comment> {
  const { data } = await api.post(`/projects/${projectId}/lines/${lineId}/comments`, { text });
  return data;
}

export async function resolveComment(projectId: string, commentId: string): Promise<Comment> {
  const { data } = await api.patch(`/projects/${projectId}/comments/${commentId}/resolve`);
  return data;
}

export async function deleteComment(projectId: string, commentId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/comments/${commentId}`);
}

// ----- Import -----

export async function importText(projectId: string, text: string): Promise<Project> {
  const { data } = await api.post(`/projects/${projectId}/import`, { text });
  return data;
}

// ----- Export URLs -----

export function getPdfUrl(projectId: string): string {
  return `http://localhost:3000/projects/${projectId}/export/pdf`;
}

export function getFountainUrl(projectId: string): string {
  return `http://localhost:3000/projects/${projectId}/export/fountain`;
}

export function getDocxUrl(projectId: string): string {
  return `http://localhost:3000/projects/${projectId}/export/docx`;
}
