import { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import { editorReducer, initialState } from '../reducer';
import {
  getProject,
  addCharacter,
  updateCharacter,
  deleteCharacter,
  addLine,
  updateLine,
  deleteLine,
  reorderLines,
  updateProjectTitle,
  getPdfUrl,
} from '../api';
import type { ComposeMode } from '../types';
import { Sidebar } from './Sidebar';
import { Script } from './Script';
import { Composer } from './Composer';
import { StatsPanel } from './StatsPanel';
import { Toasts } from './Toasts';
import { useToasts } from '../hooks/useToasts';

interface Props {
  projectId: string;
  onBack: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved';

export function Editor({ projectId, onBack }: Props) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [inputText, setInputText] = useState('');
  const [statsOpen, setStatsOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toasts, notify, dismiss } = useToasts();

  const { project, activeSpeakerId, composeMode } = state;

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    getProject(projectId)
      .then((p) => dispatch({ type: 'LOAD_PROJECT', payload: p }))
      .catch(() => dispatch({ type: 'SET_ERROR', payload: 'Nie udało się załadować projektu.' }));
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project?.lines.length]);

  /** Run a persisting action while reflecting save status; report failures as toasts. */
  const persist = useCallback(
    async <T,>(fn: () => Promise<T>, errorMsg: string): Promise<T | undefined> => {
      try {
        setSaveState('saving');
        const result = await fn();
        setSaveState('saved');
        return result;
      } catch {
        setSaveState('idle');
        notify(errorMsg, 'error');
        return undefined;
      }
    },
    [notify],
  );

  // ----- line actions -----

  async function submitLine() {
    const text = inputText.trim();
    if (!text || !project) return;
    if (composeMode === 'dialogue' && !activeSpeakerId) {
      notify('Najpierw dodaj i wybierz postać.', 'info');
      return;
    }
    const line = await persist(
      () => addLine(projectId, text, composeMode, composeMode === 'dialogue' ? activeSpeakerId : null),
      'Nie udało się dodać kwestii.',
    );
    if (line) {
      dispatch({ type: 'ADD_LINE', payload: line });
      setInputText('');
    }
  }

  async function handleEditLine(lineId: string, text: string) {
    const line = await persist(() => updateLine(projectId, lineId, text), 'Nie udało się zapisać zmiany.');
    if (line) dispatch({ type: 'UPDATE_LINE', payload: line });
  }

  async function handleDeleteLine(lineId: string) {
    const ok = await persist(() => deleteLine(projectId, lineId), 'Nie udało się usunąć kwestii.');
    if (ok) dispatch({ type: 'REMOVE_LINE', payload: lineId });
  }

  async function handleMoveLine(lineId: string, dir: -1 | 1) {
    if (!project) return;
    const lines = project.lines;
    const idx = lines.findIndex((l) => l.id === lineId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= lines.length) return;
    const ids = lines.map((l) => l.id);
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    const updated = await persist(() => reorderLines(projectId, ids), 'Nie udało się zmienić kolejności.');
    if (updated) dispatch({ type: 'REORDER_LINES', payload: updated.lines });
  }

  // ----- character actions -----

  async function handleAddCharacter(name: string) {
    const char = await persist(() => addCharacter(projectId, name), 'Nie udało się dodać postaci.');
    if (char) {
      dispatch({ type: 'ADD_CHARACTER', payload: char });
      notify(`Dodano postać „${char.name}".`, 'success');
    }
  }

  async function handleUpdateCharacter(charId: string, patch: { name?: string; color?: string }) {
    const char = await persist(
      () => updateCharacter(projectId, charId, patch),
      'Nie udało się zaktualizować postaci.',
    );
    if (char) dispatch({ type: 'UPDATE_CHARACTER', payload: char });
  }

  async function handleDeleteCharacter(charId: string) {
    const char = project?.characters.find((c) => c.id === charId);
    const linesUsing = project?.lines.filter((l) => l.characterId === charId).length ?? 0;
    if (
      linesUsing > 0 &&
      !confirm(
        `Postać „${char?.name}" ma ${linesUsing} kwestii. Po usunięciu pozostaną one jako „nieznana postać". Kontynuować?`,
      )
    ) {
      return;
    }
    const ok = await persist(() => deleteCharacter(projectId, charId), 'Nie udało się usunąć postaci.');
    if (ok) dispatch({ type: 'REMOVE_CHARACTER', payload: charId });
  }

  // ----- title -----

  function startEditTitle() {
    if (!project) return;
    setTitleDraft(project.title);
    setEditingTitle(true);
  }

  async function commitTitle() {
    setEditingTitle(false);
    const title = titleDraft.trim();
    if (!project || !title || title === project.title) return;
    dispatch({ type: 'UPDATE_PROJECT_TITLE', payload: title });
    await persist(() => updateProjectTitle(projectId, title), 'Nie udało się zmienić tytułu.');
  }

  // ----- keyboard shortcuts (Alt+1..9 speaker, Alt+0 narrator, Alt+S scene) -----

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || !project) return;
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        const char = project.characters[idx];
        if (char) {
          e.preventDefault();
          dispatch({ type: 'SET_ACTIVE_SPEAKER', payload: char.id });
        }
      } else if (e.key === '0') {
        e.preventDefault();
        dispatch({ type: 'SET_COMPOSE_MODE', payload: 'narrator' });
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        dispatch({ type: 'SET_COMPOSE_MODE', payload: 'scene' });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project]);

  // ----- render -----

  if (state.loading) {
    return <div className="editor-loading">Ładowanie projektu…</div>;
  }
  if (!project) {
    return (
      <div className="editor-loading">
        <p className="error-banner">{state.error ?? 'Nie znaleziono projektu.'}</p>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Wróć
        </button>
      </div>
    );
  }

  const activeSpeaker = project.characters.find((c) => c.id === activeSpeakerId) ?? null;

  return (
    <div className="editor-layout">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <Sidebar
        project={project}
        activeSpeakerId={activeSpeakerId}
        composeMode={composeMode}
        onSetSpeaker={(id) => dispatch({ type: 'SET_ACTIVE_SPEAKER', payload: id })}
        onSetMode={(m: ComposeMode) => dispatch({ type: 'SET_COMPOSE_MODE', payload: m })}
        onAddCharacter={handleAddCharacter}
        onUpdateCharacter={handleUpdateCharacter}
        onDeleteCharacter={handleDeleteCharacter}
        onBack={onBack}
        pdfUrl={getPdfUrl(projectId)}
      />

      <div className="editor-main">
        <div className="editor-topbar">
          {editingTitle ? (
            <input
              className="title-input"
              value={titleDraft}
              autoFocus
              maxLength={200}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
            />
          ) : (
            <button className="title-display" onClick={startEditTitle} title="Kliknij, aby zmienić tytuł">
              {project.title}
              <span className="title-edit-hint">✎</span>
            </button>
          )}

          <div className="topbar-right">
            <span className={`save-indicator save-indicator--${saveState}`}>
              {saveState === 'saving' ? 'Zapisywanie…' : saveState === 'saved' ? 'Zapisano ✓' : 'Autozapis'}
            </span>
            <button
              className={`icon-btn${statsOpen ? ' active' : ''}`}
              title="Statystyki"
              onClick={() => setStatsOpen((v) => !v)}
            >
              📊
            </button>
          </div>
        </div>

        <Script
          lines={project.lines}
          onEditLine={handleEditLine}
          onDeleteLine={handleDeleteLine}
          onMoveLine={handleMoveLine}
        />
        <div ref={bottomRef} />

        <Composer
          composeMode={composeMode}
          speaker={activeSpeaker}
          hasCharacters={project.characters.length > 0}
          value={inputText}
          onChange={setInputText}
          onSubmit={submitLine}
        />
      </div>

      {statsOpen && <StatsPanel project={project} onClose={() => setStatsOpen(false)} />}
    </div>
  );
}
