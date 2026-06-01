import { useState } from 'react';
import type { Project, ComposeMode } from '../types';

interface Props {
  project: Project;
  activeSpeakerId: string | null;
  composeMode: ComposeMode;
  onSetSpeaker: (id: string) => void;
  onSetMode: (mode: ComposeMode) => void;
  onAddCharacter: (name: string) => void;
  onUpdateCharacter: (id: string, patch: { name?: string; color?: string }) => void;
  onDeleteCharacter: (id: string) => void;
  onBack: () => void;
  pdfUrl: string;
}

export function Sidebar({
  project,
  activeSpeakerId,
  composeMode,
  onSetSpeaker,
  onSetMode,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onBack,
  pdfUrl,
}: Props) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onAddCharacter(name);
    setNewName('');
  }

  function startRename(id: string, current: string) {
    setEditingId(id);
    setDraftName(current);
  }

  function commitRename(id: string) {
    const name = draftName.trim();
    setEditingId(null);
    const original = project.characters.find((c) => c.id === id)?.name;
    if (name && name !== original) onUpdateCharacter(id, { name });
  }

  return (
    <aside className="sidebar">
      <button className="sidebar-back" onClick={onBack}>
        ← Wszystkie scenariusze
      </button>

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

              {editingId === c.id ? (
                <input
                  className="char-rename-input"
                  value={draftName}
                  autoFocus
                  maxLength={60}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => commitRename(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(c.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
              ) : (
                <button
                  className="char-name-btn"
                  onClick={() => onSetSpeaker(c.id)}
                  onDoubleClick={() => startRename(c.id, c.name)}
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

        <form className="add-char-form" onSubmit={submitNew}>
          <input
            className="add-char-input"
            value={newName}
            maxLength={60}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nowa postać…"
          />
          <button className="btn btn-sm btn-on-dark" type="submit" disabled={!newName.trim()}>
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
        <button
          className={`mode-btn${composeMode === 'scene' ? ' mode-btn--active' : ''}`}
          onClick={() => onSetMode('scene')}
        >
          <span className="mode-icon">⌖</span>
          <span className="mode-text">
            Scena <span className="mode-key">Alt+S</span>
          </span>
        </button>
      </div>

      <div className="sidebar-footer">
        <a className="btn btn-primary btn-block" href={pdfUrl} target="_blank" rel="noreferrer">
          ⬇ Eksportuj PDF
        </a>
      </div>
    </aside>
  );
}
