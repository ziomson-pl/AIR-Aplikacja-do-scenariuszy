import { useState } from 'react';
import type { Character, ComposeMode, Scene } from '../types';

interface Props {
  composeMode: ComposeMode;
  speaker: Character | null;
  hasCharacters: boolean;
  activeScene: Scene | null;
  value: string;
  parenthetical: string;
  onChange: (v: string) => void;
  onParentheticalChange: (v: string) => void;
  onSubmit: () => void;
}

const MODE_PLACEHOLDER: Record<ComposeMode, string> = {
  dialogue: 'Wpisz kwestię…',
  narrator: 'Wpisz didaskalia / opis sceny…',
};

export function Composer({
  composeMode,
  speaker,
  hasCharacters,
  activeScene,
  value,
  parenthetical,
  onChange,
  onParentheticalChange,
  onSubmit,
}: Props) {
  const [showParenthetical, setShowParenthetical] = useState(false);
  const needsCharacter = composeMode === 'dialogue' && !hasCharacters;
  const needsScene = !activeScene;

  const label =
    composeMode === 'dialogue'
      ? (speaker?.name.toUpperCase() ?? 'KWESTIA')
      : 'NARRATOR';

  const accent =
    composeMode === 'dialogue'
      ? (speaker?.color ?? 'var(--accent)')
      : 'var(--narrator)';

  if (needsCharacter) {
    return (
      <div className="composer composer--blocked">
        <span className="composer-hint">
          ➜ Dodaj postać w panelu po lewej, aby zacząć pisać dialog.
        </span>
      </div>
    );
  }

  if (needsScene) {
    return (
      <div className="composer composer--blocked">
        <span className="composer-hint">
          ➜ Dodaj scenę, aby zacząć pisać.
        </span>
      </div>
    );
  }

  return (
    <div className={`composer composer--${composeMode}`}>
      {activeScene && (
        <div className="composer-scene-label">
          Dodajesz do: <strong>{activeScene.heading}</strong>
        </div>
      )}
      <form
        className="composer-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <span className="composer-badge" style={{ background: accent }}>
          {label}
        </span>
        <div className="composer-inputs">
          {composeMode === 'dialogue' && showParenthetical && (
            <input
              className="composer-parenthetical"
              value={parenthetical}
              placeholder="Didaskalia (opcjonalne)…"
              onChange={(e) => onParentheticalChange(e.target.value)}
            />
          )}
          <textarea
            className="composer-input"
            value={value}
            rows={1}
            placeholder={MODE_PLACEHOLDER[composeMode]}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            autoFocus
          />
        </div>
        <div className="composer-controls">
          {composeMode === 'dialogue' && (
            <button
              type="button"
              className={`icon-btn composer-paren-toggle${showParenthetical ? ' active' : ''}`}
              title="Didaskalia (parenthetical)"
              onClick={() => setShowParenthetical((v) => !v)}
            >
              ( )
            </button>
          )}
          <button className="btn btn-primary composer-send" type="submit" disabled={!value.trim()}>
            Dodaj ⏎
          </button>
        </div>
      </form>
    </div>
  );
}
