import { useState } from 'react';
import type { Project, Scene, ComposeMode } from '../types';

interface Props {
  project: Project;
  activeSpeakerId: string | null;
  activeSceneId: string | null;
  composeMode: ComposeMode;
  onSetSpeaker: (id: string) => void;
  onSetMode: (mode: ComposeMode) => void;
  onAddCharacter: (name: string) => void;
  onUpdateCharacter: (id: string, patch: { name?: string; color?: string }) => void;
  onDeleteCharacter: (id: string) => void;
  onAddScene: (heading: string) => void;
  onSetActiveScene: (sceneId: string) => void;
  onBack: () => void;
  pdfUrl: string;
  fountainUrl: string;
  docxUrl: string;
  onImport: () => void;
}

export function Sidebar({
  project,
  activeSpeakerId,
  activeSceneId,
  composeMode,
  onSetSpeaker,
  onSetMode,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onAddScene,
  onSetActiveScene,
  onBack,
  pdfUrl,
  fountainUrl,
  docxUrl,
  onImport,
}: Props) {
  const [newCharName, setNewCharName] = useState('');
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [draftCharName, setDraftCharName] = useState('');
  const [newSceneHeading, setNewSceneHeading] = useState('');
  const [addingScene, setAddingScene] = useState(false);

  function submitNewChar(e: React.FormEvent) {
    e.preventDefault();
    const name = newCharName.trim();
    if (!name) return;
    onAddCharacter(name);
    setNewCharName('');
  }

  function startRenameChar(id: string, current: string) {
    setEditingCharId(id);
    setDraftCharName(current);
  }

  function commitRenameChar(id: string) {
    const name = draftCharName.trim();
    setEditingCharId(null);
    const original = project.characters.find((c) => c.id === id)?.name;
    if (name && name !== original) onUpdateCharacter(id, { name });
  }

  function submitNewScene(e: React.FormEvent) {
    e.preventDefault();
    const heading = newSceneHeading.trim();
    if (!heading) return;
    onAddScene(heading);
    setNewSceneHeading('');
    setAddingScene(false);
  }

  function scrollToScene(sceneId: string) {
    onSetActiveScene(sceneId);
    const el = document.getElementById(`scene-${sceneId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <aside className="sidebar">
      <button className="sidebar-back" onClick={onBack}>
        ← Wszystkie scenariusze
      </button>

      <p className="sidebar-label">
        Sceny <span className="sidebar-hint">{project.scenes.length}</span>
      </p>

      <div className="scene-outline">
        {project.scenes.length === 0 && (
          <p className="sidebar-empty">Dodaj pierwszą scenę, aby zacząć pisać.</p>
        )}
        {project.scenes.map((scene: Scene) => (
          <button
            key={scene.id}
            className={`scene-outline-item${activeSceneId === scene.id ? ' scene-outline-item--active' : ''}`}
            onClick={() => scrollToScene(scene.id)}
            title={scene.heading}
          >
            <span className="scene-outline-heading">{scene.heading}</span>
            <span className="scene-outline-count">{scene.lines.length}</span>
          </button>
        ))}

        {addingScene ? (
          <form className="scene-add-form" onSubmit={submitNewScene}>
            <input
              className="scene-add-input"
              value={newSceneHeading}
              autoFocus
              maxLength={300}
              placeholder="np. INT. KUCHNIA — DZIEŃ"
              onChange={(e) => setNewSceneHeading(e.target.value)}
              onBlur={() => {
                if (!newSceneHeading.trim()) setAddingScene(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setAddingScene(false);
                  setNewSceneHeading('');
                }
              }}
            />
            <div className="scene-add-actions">
              <button className="btn btn-sm btn-on-dark" type="submit" disabled={!newSceneHeading.trim()}>
                Dodaj
              </button>
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => { setAddingScene(false); setNewSceneHeading(''); }}
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            className="scene-add-btn"
            onClick={() => setAddingScene(true)}
          >
            + Dodaj scenę
          </button>
        )}
      </div>

      <p className="sidebar-label">
        Postacie <span className="sidebar-hint">Alt+1…9</span>
      </p>

      <div className="char-list">
        {project.characters.length === 0 && (
          <p className="sidebar-empty">Dodaj pierwszą postać, aby zacząć pisać dialogi.</p>
        )}

        {project.characters.map((c, i) => {
          const active = composeMode === 'dialogue' && activeSpeakerId === c.id;
          return (
            <div key={c.id} className={`char-row${active ? ' char-row--active' : ''}`}>
              <label className="char-dot-wrap" title="Zmień kolor">
                <span className="char-dot" style={{ background: c.color }} />
                <input
                  type="color"
                  className="char-color-input"
                  value={c.color}
                  onChange={(e) => onUpdateCharacter(c.id, { color: e.target.value })}
                />
              </label>

              {editingCharId === c.id ? (
                <input
                  className="char-rename-input"
                  value={draftCharName}
                  autoFocus
                  maxLength={60}
                  onChange={(e) => setDraftCharName(e.target.value)}
                  onBlur={() => commitRenameChar(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRenameChar(c.id);
                    if (e.key === 'Escape') setEditingCharId(null);
                  }}
                />
              ) : (
                <button
                  className="char-name-btn"
                  onClick={() => onSetSpeaker(c.id)}
                  onDoubleClick={() => startRenameChar(c.id, c.name)}
                  title="Kliknij, aby wybrać · podwójne kliknięcie, aby zmienić nazwę"
                >
                  <span className="char-index">{i < 9 ? i + 1 : ''}</span>
                  {c.name}
                </button>
              )}

              <button
                className="char-delete"
                title="Usuń postać"
                onClick={() => onDeleteCharacter(c.id)}
              >
                ✕
              </button>
            </div>
          );
        })}

        <form className="add-char-form" onSubmit={submitNewChar}>
          <input
            className="add-char-input"
            value={newCharName}
            maxLength={60}
            onChange={(e) => setNewCharName(e.target.value)}
            placeholder="Nowa postać…"
          />
          <button className="btn btn-sm btn-on-dark" type="submit" disabled={!newCharName.trim()}>
            +
          </button>
        </form>
      </div>

      <p className="sidebar-label">Tryb pisania</p>
      <div className="mode-buttons">
        <button
          className={`mode-btn${composeMode === 'narrator' ? ' mode-btn--active' : ''}`}
          onClick={() => onSetMode('narrator')}
        >
          <span className="mode-icon">✎</span>
          <span className="mode-text">
            Narrator <span className="mode-key">Alt+0</span>
          </span>
        </button>
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-on-dark btn-block btn-sm" onClick={onImport} style={{ marginBottom: 8 }}>
          ↑ Importuj tekst
        </button>
        <div className="export-buttons">
          <a className="btn btn-primary btn-sm export-btn" href={pdfUrl} target="_blank" rel="noreferrer">
            PDF
          </a>
          <a className="btn btn-secondary btn-sm export-btn" href={fountainUrl} target="_blank" rel="noreferrer">
            Fountain
          </a>
          <a className="btn btn-secondary btn-sm export-btn" href={docxUrl} target="_blank" rel="noreferrer">
            DOCX
          </a>
        </div>
      </div>
    </aside>
  );
}
