import type { DialogueLine } from '../types';

interface Props {
  lines: DialogueLine[];
  onDeleteLine: (id: string) => void;
}

export function DialogueView({ lines, onDeleteLine }: Props) {
  if (lines.length === 0) {
    return <p className="dialogue-empty">Brak kwestii. Wybierz postać i zacznij pisać!</p>;
  }

  return (
    <div className="dialogue-view">
      {lines.map((line) => {
        if (line.type === 'narrator') {
          return (
            <div key={line.id} className="dialogue-line dl-narrator">
              <p className="dl-narrator-text">({line.text})</p>
              <button
                className="line-delete-btn"
                title="Usuń"
                onClick={() => onDeleteLine(line.id)}
              >
                ✕
              </button>
            </div>
          );
        }
        return (
          <div key={line.id} className="dialogue-line">
            <p className="dl-character-name">
              {line.character?.name.toUpperCase() ?? 'NIEZNANA POSTAĆ'}
            </p>
            <p className="dl-text">{line.text}</p>
            <button
              className="line-delete-btn"
              title="Usuń"
              onClick={() => onDeleteLine(line.id)}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
