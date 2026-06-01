import axios from 'axios';
import type { Project, ProjectSummary, Character, DialogueLine } from './types';

const api = axios.create({ baseURL: 'http://localhost:3000' });

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

export async function addCharacter(projectId: string, name: string): Promise<Character> {
  const { data } = await api.post(`/projects/${projectId}/characters`, { name });
  return data;
}

export async function deleteCharacter(projectId: string, charId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/characters/${charId}`);
}

export async function addLine(
  projectId: string,
  text: string,
  type: 'dialogue' | 'narrator',
  characterId?: string | null,
): Promise<DialogueLine> {
  const { data } = await api.post(`/projects/${projectId}/lines`, {
    text,
    type,
    characterId: characterId ?? null,
  });
  return data;
}

export async function deleteLine(projectId: string, lineId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/lines/${lineId}`);
}

export function getPdfUrl(projectId: string): string {
  return `http://localhost:3000/projects/${projectId}/export/pdf`;
}
