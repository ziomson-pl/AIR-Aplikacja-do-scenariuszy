import { useEffect, useState } from 'react';
import type { DialogueLine, LineVersion } from '../types';
import { getLineHistory } from '../api';

interface Props {
  projectId: string;
  line: DialogueLine;
  onRestore: (lineId: string, sceneId: string, text: string, parenthetical: string | null) => Promise<void>;
  onClose: () => void;
}

export function HistoryModal({ projectId, line, onRestore, onClose }: Props) {
  const [versions, setVersions] = useState<LineVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    getLineHistory(projectId, line.id)
      .then(setVersions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId, line.id]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function handleRestore(version: LineVersion) {
    setRestoringId(version.id);
    try {
      await onRestore(line.id, line.sceneId, version.text, version.parenthetical);
      onClose();
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="history-modal">
        <div className="history-modal-header">
          <h2 className="history-modal-title">Historia zmian</h2>
          <button className="icon-btn" onClick={onClose} title="Zamknij">✕</button>
        </div>

        <div className="history-modal-line">
          <strong>Aktualna wersja:</strong> {line.text}
          {line.parenthetical && <em className="history-paren"> ({line.parenthetical})</em>}
        </div>

        {loading && <p className="history-loading">Ladowanie historii…</p>}

        {!loading && versions.length === 0 && (
          <p className="history-empty">Brak wcześniejszych wersji tej kwestii.</p>
        )}

        {!loading && versions.length > 0 && (
          <div className="history-list">
            {versions.map((v) => (
              <div key={v.id} className="history-item">
                <div className="history-item-content">
                  <p className="history-item-text">{v.text}</p>
                  {v.parenthetical && (
                    <p className="history-item-paren">({v.parenthetical})</p>
                  )}
                  <p className="history-item-date">{formatDate(v.createdAt)}</p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRestore(v)}
                  disabled={restoringId === v.id}
                >
                  {restoringId === v.id ? 'Przywracanie…' : 'Przywróć'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
