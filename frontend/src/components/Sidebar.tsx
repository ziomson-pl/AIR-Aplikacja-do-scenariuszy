import type { Project } from '../types';

interface Props {
  project: Project;
  activeSpeakerId: string | null;
  narratorMode: boolean;
  newCharName: string;
  onSetSpeaker: (id: string) => void;
  onToggleNarrator: () => void;
  onNewCharNameChange: (v: string) => void;
  onAddCharacter: (e: React.FormEvent) => void;
  onDeleteCharacter: (id: string) => void;
  onBack: () => void;
  pdfUrl: string;
}

export function Sidebar({
  project,
  activeSpeakerId,
  narratorMode,
  newCharName,
  onSetSpeaker,
  onToggleNarrator,
  onNewCharNameChange,
  onAddCharacter,
  onDeleteCharacter,
  onBack,
  pdfUrl,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <p className="sidebar-project-title">{project.title}</p>
        <button className="sidebar-back-btn" onClick={onBack}>
          ← Wszystkie projekty
        </button>
      </div>

      <p className="sidebar-section-label">Postacie</p>

      <div className="sidebar-characters">
        {project.characters.map((c) => (
          <button
            key={c.id}
            className={`sidebar-char-btn${!narratorMode && activeSpeakerId === c.id ? ' active' : ''}`}
            onClick={() => onSetSpeaker(c.id)}
          >
            <span className="sidebar-char-name">{c.name}</span>
            <span
              className="sidebar-char-delete"
              role="button"
              tabIndex={0}
              title="Usuń postać"
              onClick={(e) => { e.stopPropagation(); onDeleteCharacter(c.id); }}
              onKeyDown={(e) => e.key === 'Enter' && onDeleteCharacter(c.id)}
            >
              ✕
            </span>
          </button>
        ))}

        <form onSubmit={onAddCharacter} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <input
            style={{
              flex: 1,
              padding: '6px 8px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px dashed rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#e8e8e8',
              fontSize: '13px',
              outline: 'none',
            }}
            value={newCharName}
            onChange={(e) => onNewCharNameChange(e.target.value)}
            placeholder="Nowa postać..."
          />
          <button
            className="btn btn-sm btn-secondary"
            type="submit"
            disabled={!newCharName.trim()}
            style={{ flexShrink: 0 }}
          >
            +
          </button>
        </form>
      </div>

      <div className="sidebar-footer">
        <button
          className={`sidebar-narrator-btn${narratorMode ? ' active' : ''}`}
          onClick={onToggleNarrator}
        >
          ✎ Narrator {narratorMode ? '(aktywny)' : ''}
        </button>

        <a className="btn btn-primary btn-sm" href={pdfUrl} target="_blank" rel="noreferrer">
          Eksportuj PDF
        </a>
      </div>
    </aside>
  );
}
