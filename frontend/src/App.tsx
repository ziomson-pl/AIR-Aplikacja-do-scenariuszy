import { useState, useEffect } from 'react';
import { listProjects, createProject, deleteProject } from './api';
import type { ProjectSummary } from './types';
import { Editor } from './components/Editor';

export default function App() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setProjects(await listProjects());
    } catch {
      setError('Nie można załadować projektów. Czy backend działa?');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    try {
      const p = await createProject(title);
      setNewTitle('');
      setActiveProjectId(p.id);
    } catch {
      setError('Błąd podczas tworzenia projektu.');
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Usunąć projekt?')) return;
    try {
      await deleteProject(id);
      if (activeProjectId === id) setActiveProjectId(null);
      await load();
    } catch {
      setError('Błąd podczas usuwania projektu.');
    }
  }

  if (activeProjectId) {
    return (
      <Editor
        projectId={activeProjectId}
        onBack={() => { setActiveProjectId(null); load(); }}
      />
    );
  }

  return (
    <div className="home">
      <h1 className="home-title">AIR — Aplikacja do Scenariuszy</h1>

      <form className="create-form" onSubmit={handleCreate}>
        <input
          className="create-input"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Tytuł nowego projektu..."
        />
        <button className="btn btn-primary" type="submit" disabled={!newTitle.trim()}>
          Utwórz projekt
        </button>
      </form>

      {error && <p className="error-msg">{error}</p>}

      {loading ? (
        <p className="muted">Ładowanie...</p>
      ) : projects.length === 0 ? (
        <p className="muted">Brak projektów. Utwórz pierwszy!</p>
      ) : (
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.id} className="project-item" onClick={() => setActiveProjectId(p.id)}>
              <div className="project-info">
                <span className="project-name">{p.title}</span>
                <span className="project-meta">
                  {p.characters.length} postaci · {p._count.lines} kwestii
                </span>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => handleDelete(p.id, e)}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
