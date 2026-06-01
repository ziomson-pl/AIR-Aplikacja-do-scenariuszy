import { useState } from 'react';
import type { DialogueLine } from '../types';

interface Props {
  lines: DialogueLine[];
  onEditLine: (id: string, text: string) => void;
  onDeleteLine: (id: string) => void;
  onMoveLine: (id: string, dir: -1 | 1) => void;
}

export function Script({ lines, onEditLine, onDeleteLine, onMoveLine }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  function startEdit(line: DialogueLine) {
    setEditingId(line.id);
    setDraft(line.text);
  }

  function commit(id: string, original: string) {
    setEditingId(null);
    const text = draft.trim();
    if (text && text !== original) onEditLine(id, text);
  }

  if (lines.length === 0) {
    return (
      <div className="script-scroll">
        <div className="script-empty">
          <div className="script-empty-icon">🎭</div>
          <p className="script-empty-title">Pusty scenariusz</p>
          <p className="script-empty-text">
            Wybierz postać z panelu po lewej i wpisz pierwszą kwestię na dole ekranu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="script-scroll">
      <div className="script-page">
        {lines.map((line, i) => {
          const editing = editingId === line.id;
          return (
            <div key={line.id} className={`line line--${line.type}`}>
              <div className="line-controls">
                <button
                  className="line-ctrl"
                  title="W górę"
                  disabled={i === 0}
                  onClick={() => onMoveLine(line.id, -1)}
                >
                  ↑
                </button>
                <button
                  className="line-ctrl"
                  title="W dół"
                  disabled={i === lines.length - 1}
                  onClick={() => onMoveLine(line.id, 1)}
                >
                  ↓
                </button>
                <button
                  className="line-ctrl line-ctrl--danger"
                  title="Usuń"
                  onClick={() => onDeleteLine(line.id)}
                >
                  ✕
                </button>
              </div>

              <div className="line-body">
                {line.type === 'dialogue' && (
                  <p
                    className="line-speaker"
                    style={{ color: line.character?.color ?? undefined }}
                  >
                    {line.character?.name?.toUpperCase() ?? 'NIEZNANA POSTAĆ'}
                  </p>
                )}

                {editing ? (
                  <textarea
                    className="line-edit"
                    value={draft}
                    autoFocus
                    rows={Math.max(1, draft.split('\n').length)}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commit(line.id, line.text)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        commit(line.id, line.text);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                ) : (
                  <p
                    className="line-text"
                    onDoubleClick={() => startEdit(line)}
                    title="Podwójne kliknięcie, aby edytować"
                  >
                    {line.type === 'narrator' ? `(${line.text})` : line.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
