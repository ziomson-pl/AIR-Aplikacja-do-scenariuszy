import { useState, useEffect } from 'react';
import { listProjects, createProject, deleteProject } from './api';
import type { ProjectSummary } from './types';
import { Editor } from './components/Editor';
import { Toasts } from './components/Toasts';
import { useToasts } from './hooks/useToasts';
import { formatRelative } from './utils/format';

export default function App() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toasts, notify, dismiss } = useToasts();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setProjects(await listProjects());
    } catch {
      notify('Nie można połączyć się z serwerem. Czy backend działa?', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || creating) return;
    try {
      setCreating(true);
      const p = await createProject(title);
      setNewTitle('');
      setActiveProjectId(p.id);
    } catch {
      notify('Błąd podczas tworzenia projektu.', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, title: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Usunąć projekt „${title}”? Tej operacji nie można cofnąć.`)) return;
    try {
      await deleteProject(id);
      if (activeProjectId === id) setActiveProjectId(null);
      notify('Projekt usunięty.', 'success');
      await load();
    } catch {
      notify('Błąd podczas usuwania projektu.', 'error');
    }
  }

  if (activeProjectId) {
    return (
      <Editor
        projectId={activeProjectId}
        onBack={() => {
          setActiveProjectId(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="home">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <header className="home-header">
        <div className="home-logo">🎬</div>
        <h1 className="home-title">AIR — Aplikacja do Scenariuszy</h1>
        <p className="home-tagline">
          Pisz dialogi filmowe bez rozpraszania się — wybierasz postać, wpisujesz kwestię,
          a my zajmujemy się resztą.
        </p>
      </header>

      <form className="create-form" onSubmit={handleCreate}>
        <input
          className="create-input"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Tytuł nowego scenariusza…"
          maxLength={200}
        />
        <button className="btn btn-primary" type="submit" disabled={!newTitle.trim() || creating}>
          {creating ? 'Tworzę…' : '+ Nowy scenariusz'}
        </button>
      </form>

      <div className="home-section-head">
        <h2 className="home-section-title">Twoje scenariusze</h2>
        {projects.length > 0 && <span className="home-count">{projects.length}</span>}
      </div>

      {loading ? (
        <div className="home-skeleton">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✍️</div>
          <p className="empty-state-title">Jeszcze nic tu nie ma</p>
          <p className="empty-state-text">Utwórz swój pierwszy scenariusz powyżej i zacznij pisać.</p>
        </div>
      ) : (
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.id} className="project-card" onClick={() => setActiveProjectId(p.id)}>
              <div className="project-card-main">
                <span className="project-name">{p.title}</span>
                <span className="project-meta">
                  {p.characters.length} {pluralChars(p.characters.length)} ·{' '}
                  {p._count.scenes} {pluralScenes(p._count.scenes)} · {formatRelative(p.updatedAt)}
                </span>
              </div>
              <div className="project-card-side">
                <div className="char-chips">
                  {p.characters.slice(0, 5).map((c) => (
                    <span
                      key={c.id}
                      className="char-chip"
                      style={{ background: c.color }}
                      title={c.name}
                    />
                  ))}
                  {p.characters.length > 5 && (
                    <span className="char-chip-more">+{p.characters.length - 5}</span>
                  )}
                </div>
                <button
                  className="icon-btn icon-btn--danger"
                  title="Usuń projekt"
                  onClick={(e) => handleDelete(p.id, p.title, e)}
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function pluralChars(n: number): string {
  if (n === 1) return 'postać';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'postacie';
  return 'postaci';
}

function pluralScenes(n: number): string {
  if (n === 1) return 'scena';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'sceny';
  return 'scen';
}
