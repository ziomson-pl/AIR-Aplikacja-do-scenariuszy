import { useMemo } from 'react';
import type { Project } from '../types';
import { pluralPl, wordCount } from '../utils/format';

interface Props {
  project: Project;
  onClose: () => void;
}

export function StatsPanel({ project, onClose }: Props) {
  const stats = useMemo(() => {
    const dialogue = project.lines.filter((l) => l.type === 'dialogue');
    const narrator = project.lines.filter((l) => l.type === 'narrator');
    const scenes = project.lines.filter((l) => l.type === 'scene');
    const totalWords = project.lines.reduce((sum, l) => sum + wordCount(l.text), 0);

    const perCharacter = project.characters
      .map((c) => {
        const lines = dialogue.filter((l) => l.characterId === c.id);
        const words = lines.reduce((sum, l) => sum + wordCount(l.text), 0);
        return { ...c, lineCount: lines.length, words };
      })
      .sort((a, b) => b.lineCount - a.lineCount);

    const maxLines = Math.max(1, ...perCharacter.map((c) => c.lineCount));

    return {
      totalLines: project.lines.length,
      totalWords,
      dialogueCount: dialogue.length,
      narratorCount: narrator.length,
      sceneCount: scenes.length,
      perCharacter,
      maxLines,
    };
  }, [project]);

  return (
    <aside className="stats-panel">
      <div className="stats-head">
        <h2 className="stats-title">Statystyki</h2>
        <button className="icon-btn" title="Zamknij" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-num">{stats.totalLines}</span>
          <span className="stat-label">{pluralPl(stats.totalLines, ['wiersz', 'wiersze', 'wierszy'])}</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{stats.totalWords}</span>
          <span className="stat-label">{pluralPl(stats.totalWords, ['słowo', 'słowa', 'słów'])}</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{stats.sceneCount}</span>
          <span className="stat-label">{pluralPl(stats.sceneCount, ['scena', 'sceny', 'scen'])}</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{stats.narratorCount}</span>
          <span className="stat-label">narrator</span>
        </div>
      </div>

      <p className="stats-subhead">Udział postaci</p>
      {stats.perCharacter.length === 0 ? (
        <p className="stats-empty">Brak postaci.</p>
      ) : (
        <ul className="stats-bars">
          {stats.perCharacter.map((c) => (
            <li key={c.id} className="stats-bar-row">
              <div className="stats-bar-head">
                <span className="stats-bar-name">
                  <span className="char-dot char-dot--sm" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="stats-bar-val">
                  {c.lineCount} · {c.words} {pluralPl(c.words, ['sł.', 'sł.', 'sł.'])}
                </span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{
                    width: `${(c.lineCount / stats.maxLines) * 100}%`,
                    background: c.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
