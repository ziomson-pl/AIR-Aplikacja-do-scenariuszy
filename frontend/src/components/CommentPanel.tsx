import { useState } from 'react';
import type { Comment, DialogueLine } from '../types';

interface Props {
  projectId: string;
  line: DialogueLine;
  onAddComment: (lineId: string, text: string) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onClose: () => void;
}

export function CommentPanel({ line, onAddComment, onResolveComment, onDeleteComment, onClose }: Props) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const comments = line.comments ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await onAddComment(line.id, text);
      setDraft('');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="comment-panel">
      <div className="comment-panel-header">
        <span className="comment-panel-title">Komentarze</span>
        <button className="comment-panel-close icon-btn" onClick={onClose} title="Zamknij">
          ✕
        </button>
      </div>

      <div className="comment-panel-line-preview">
        {line.type === 'dialogue' && line.character && (
          <span className="comment-panel-speaker" style={{ color: line.character.color }}>
            {line.character.name.toUpperCase()}:{' '}
          </span>
        )}
        <span className="comment-panel-text">{line.text}</span>
      </div>

      <div className="comment-list">
        {comments.length === 0 && (
          <p className="comment-empty">Brak komentarzy. Dodaj pierwszy poniżej.</p>
        )}
        {comments.map((c: Comment) => (
          <div key={c.id} className={`comment-item${c.resolved ? ' comment-item--resolved' : ''}`}>
            <p className="comment-text">{c.text}</p>
            <div className="comment-meta">
              <span className="comment-date">{formatDate(c.createdAt)}</span>
              {c.resolved && <span className="comment-resolved-badge">Rozwiązany</span>}
              <div className="comment-actions">
                {!c.resolved && (
                  <button
                    className="comment-action-btn"
                    onClick={() => onResolveComment(c.id)}
                    title="Oznacz jako rozwiązany"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="comment-action-btn comment-action-btn--danger"
                  onClick={() => onDeleteComment(c.id)}
                  title="Usuń komentarz"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          className="comment-input"
          value={draft}
          rows={2}
          placeholder="Dodaj komentarz…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        <button
          className="btn btn-primary btn-sm"
          type="submit"
          disabled={!draft.trim() || submitting}
        >
          Dodaj
        </button>
      </form>
    </div>
  );
}
