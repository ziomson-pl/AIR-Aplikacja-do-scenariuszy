import type { Character, ComposeMode } from '../types';

interface Props {
  composeMode: ComposeMode;
  speaker: Character | null;
  hasCharacters: boolean;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

const MODE_META: Record<ComposeMode, { label: string; placeholder: string }> = {
  dialogue: { label: 'KWESTIA', placeholder: 'Wpisz kwestię…' },
  narrator: { label: 'NARRATOR', placeholder: 'Wpisz didaskalia / opis sceny…' },
  scene: { label: 'SCENA', placeholder: 'np. WNĘTRZE — KUCHNIA — DZIEŃ' },
};

function truncateLabel(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

export function Composer({ composeMode, speaker, hasCharacters, value, onChange, onSubmit }: Props) {
  const needsCharacter = composeMode === 'dialogue' && !hasCharacters;

  const label = composeMode === 'dialogue'
    ? truncateLabel(speaker?.name.toUpperCase() ?? MODE_META.dialogue.label, 18)
    : MODE_META[composeMode].label;
  const accent =
    composeMode === 'dialogue'
      ? speaker?.color ?? 'var(--accent)'
      : composeMode === 'narrator'
        ? 'var(--narrator)'
        : 'var(--scene)';

  if (needsCharacter) {
    return (
      <div className="composer composer--blocked">
        <span className="composer-hint">
          ➜ Dodaj postać w panelu po lewej, aby zacząć pisać dialog.
        </span>
      </div>
    );
  }

  return (
    <form
      className={`composer composer--${composeMode}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <span className="composer-badge" style={{ background: accent }}>
        {label}
      </span>
      <textarea
        className="composer-input"
        value={value}
        rows={1}
        placeholder={MODE_META[composeMode].placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        autoFocus
      />
      <button className="btn btn-primary composer-send" type="submit" disabled={!value.trim()}>
        Dodaj ⏎
      </button>
    </form>
  );
}
