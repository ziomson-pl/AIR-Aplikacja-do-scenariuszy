import { useState } from 'react';

interface Props {
  onImport: (text: string) => Promise<void>;
  onClose: () => void;
}

export function ImportModal({ onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      await onImport(trimmed);
      onClose();
    } catch {
      setError('Nie udało się zaimportować tekstu. Sprawdź format i spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="import-modal">
        <div className="import-modal-header">
          <h2 className="import-modal-title">Importuj tekst</h2>
          <button className="icon-btn" onClick={onClose} title="Zamknij">✕</button>
        </div>

        <div className="import-modal-instructions">
          <p>Wklej tekst scenariusza w formacie:</p>
          <ul>
            <li><code>IMIĘ: kwestia</code> — kwestia dialogowa</li>
            <li><code>NARRATOR: tekst</code> — linia narratora</li>
            <li><code>INT. MIEJSCE — PORA DNIA</code> — nagłówek sceny</li>
            <li><code>EXT. MIEJSCE — PORA DNIA</code> — nagłówek sceny zewnętrznej</li>
            <li>Zwykły tekst bez prefiksu — narrator</li>
          </ul>
        </div>

        {error && <p className="import-error">{error}</p>}

        <form onSubmit={handleSubmit} className="import-form">
          <textarea
            className="import-textarea"
            value={text}
            rows={14}
            placeholder={'INT. KUCHNIA — DZIEŃ\n\nANNA: Czy chcesz herbaty?\nKAROL: Chętnie, dziękuję.\n\nNARRATOR: Karol siada przy stole.'}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="import-modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Anuluj
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!text.trim() || loading}
            >
              {loading ? 'Importowanie…' : 'Importuj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
