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
  reorderScenes,
  addScene,
  updateScene,
  deleteScene,
  updateProjectTitle,
  addComment,
  resolveComment,
  deleteComment,
  importText,
  getPdfUrl,
  getFountainUrl,
  getDocxUrl,
} from '../api';
import type { ComposeMode } from '../types';
import { Sidebar } from './Sidebar';
import { Script } from './Script';
import { Composer } from './Composer';
import { StatsPanel } from './StatsPanel';
import { Toasts } from './Toasts';
import { ImportModal } from './ImportModal';
import { useToasts } from '../hooks/useToasts';

interface Props {
  projectId: string;
  onBack: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved';

export function Editor({ projectId, onBack }: Props) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [inputText, setInputText] = useState('');
  const [parentheticalText, setParentheticalText] = useState('');
  const [statsOpen, setStatsOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toasts, notify, dismiss } = useToasts();

  const { project, activeSpeakerId, composeMode, activeSceneId, collapsedScenes } = state;

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    getProject(projectId)
      .then((p) => dispatch({ type: 'LOAD_PROJECT', payload: p }))
      .catch(() => dispatch({ type: 'SET_ERROR', payload: 'Nie udało się załadować projektu.' }));
  }, [projectId]);

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

  async function handleAddScene(heading: string) {
    const scene = await persist(() => addScene(projectId, heading), 'Nie udało się dodać sceny.');
    if (scene) {
      dispatch({ type: 'ADD_SCENE', payload: scene });
      dispatch({ type: 'SET_ACTIVE_SCENE', payload: scene.id });
    }
  }

  async function handleUpdateSceneHeading(sceneId: string, heading: string) {
    const scene = await persist(
      () => updateScene(projectId, sceneId, heading),
      'Nie udało się zmienić nagłówka sceny.',
    );
    if (scene) dispatch({ type: 'UPDATE_SCENE', payload: scene });
  }

  async function handleDeleteScene(sceneId: string) {
    const scene = project?.scenes.find((s) => s.id === sceneId);
    if (
      !confirm(
        `Usunąć scenę „${scene?.heading}”? Wszystkie kwestie w tej scenie zostaną usunięte.`,
      )
    ) {
      return;
    }
    const ok = await persist(() => deleteScene(projectId, sceneId), 'Nie udało się usunąć sceny.');
    if (ok !== undefined) dispatch({ type: 'REMOVE_SCENE', payload: sceneId });
  }

  async function handleReorderScenes(orderedIds: string[]) {
    const updated = await persist(
      () => reorderScenes(projectId, orderedIds),
      'Nie udało się zmienić kolejności scen.',
    );
    if (updated) dispatch({ type: 'REORDER_SCENES', payload: updated.scenes });
  }

  async function submitLine() {
    const text = inputText.trim();
    if (!text || !project) return;

    const sceneId = activeSceneId;
    if (!sceneId) {
      notify('Najpierw wybierz scenę.', 'info');
      return;
    }

    if (composeMode === 'dialogue' && !activeSpeakerId) {
      notify('Najpierw dodaj i wybierz postać.', 'info');
      return;
    }

    const line = await persist(
      () =>
        addLine(projectId, sceneId, {
          text,
          type: composeMode,
          characterId: composeMode === 'dialogue' ? activeSpeakerId : null,
          parenthetical: parentheticalText.trim() || null,
        }),
      'Nie udało się dodać kwestii.',
    );
    if (line) {
      dispatch({ type: 'ADD_LINE', payload: { sceneId, line } });
      setInputText('');
      setParentheticalText('');
    }
  }

  async function handleEditLine(lineId: string, sceneId: string, text: string) {
    const line = await persist(
      () => updateLine(projectId, sceneId, lineId, { text }),
      'Nie udało się zapisać zmiany.',
    );
    if (line) dispatch({ type: 'UPDATE_LINE', payload: { sceneId, line } });
  }

  async function handleDeleteLine(lineId: string, sceneId: string) {
    const ok = await persist(
      () => deleteLine(projectId, sceneId, lineId),
      'Nie udało się usunąć kwestii.',
    );
    if (ok !== undefined) dispatch({ type: 'REMOVE_LINE', payload: { sceneId, lineId } });
  }

  async function handleReorderLines(sceneId: string, orderedIds: string[]) {
    const updated = await persist(
      () => reorderLines(projectId, sceneId, orderedIds),
      'Nie udało się zmienić kolejności kwestii.',
    );
    if (updated) dispatch({ type: 'REORDER_LINES', payload: { sceneId, lines: updated.lines } });
  }

  async function handleRestoreLine(
    lineId: string,
    sceneId: string,
    text: string,
    parenthetical: string | null,
  ) {
    const line = await persist(
      () => updateLine(projectId, sceneId, lineId, { text, parenthetical }),
      'Nie udało się przywrócić wersji.',
    );
    if (line) {
      dispatch({ type: 'UPDATE_LINE', payload: { sceneId, line } });
      notify('Wersja przywrócona.', 'success');
    }
  }

  async function handleAddCharacter(name: string) {
    const char = await persist(() => addCharacter(projectId, name), 'Nie udało się dodać postaci.');
    if (char) {
      dispatch({ type: 'ADD_CHARACTER', payload: char });
      notify(`Dodano postać „${char.name}”.`, 'success');
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
    const linesCount =
      project?.scenes.reduce(
        (sum, scene) => sum + scene.lines.filter((l) => l.characterId === charId).length,
        0,
      ) ?? 0;
    if (
      linesCount > 0 &&
      !confirm(
        `Postać „${char?.name}” ma ${linesCount} kwestii. Po usunięciu pozostaną jako „nieznana postać”. Kontynuować?`,
      )
    ) {
      return;
    }
    const ok = await persist(
      () => deleteCharacter(projectId, charId),
      'Nie udało się usunąć postaci.',
    );
    if (ok !== undefined) dispatch({ type: 'REMOVE_CHARACTER', payload: charId });
  }

  async function handleAddComment(lineId: string, text: string) {
    const scene = project?.scenes.find((s) => s.lines.some((l) => l.id === lineId));
    if (!scene) return;
    const comment = await persist(
      () => addComment(projectId, lineId, text),
      'Nie udało się dodać komentarza.',
    );
    if (comment) {
      dispatch({ type: 'ADD_COMMENT', payload: { lineId, sceneId: scene.id, comment } });
    }
  }

  async function handleResolveComment(commentId: string) {
    let sceneId = '';
    let lineId = '';
    for (const scene of project?.scenes ?? []) {
      for (const line of scene.lines) {
        if ((line.comments ?? []).some((c) => c.id === commentId)) {
          sceneId = scene.id;
          lineId = line.id;
        }
      }
    }
    const updated = await persist(
      () => resolveComment(projectId, commentId),
      'Nie udało się oznaczyć komentarza.',
    );
    if (updated && sceneId && lineId) {
      dispatch({ type: 'RESOLVE_COMMENT', payload: { lineId, sceneId, commentId } });
    }
  }

  async function handleDeleteComment(commentId: string) {
    let sceneId = '';
    let lineId = '';
    for (const scene of project?.scenes ?? []) {
      for (const line of scene.lines) {
        if ((line.comments ?? []).some((c) => c.id === commentId)) {
          sceneId = scene.id;
          lineId = line.id;
        }
      }
    }
    const ok = await persist(
      () => deleteComment(projectId, commentId),
      'Nie udało się usunąć komentarza.',
    );
    if (ok !== undefined && sceneId && lineId) {
      dispatch({ type: 'REMOVE_COMMENT', payload: { lineId, sceneId, commentId } });
    }
  }

  async function handleImport(text: string) {
    const updated = await persist(
      () => importText(projectId, text),
      'Nie udało się zaimportować tekstu.',
    );
    if (updated) {
      dispatch({ type: 'LOAD_PROJECT', payload: updated });
      notify('Import zakończony pomyślnie.', 'success');
    }
  }

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
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project]);

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
  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? null;

  return (
    <div className="editor-layout">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <Sidebar
        project={project}
        activeSpeakerId={activeSpeakerId}
        activeSceneId={activeSceneId}
        composeMode={composeMode}
        onSetSpeaker={(id) => dispatch({ type: 'SET_ACTIVE_SPEAKER', payload: id })}
        onSetMode={(m: ComposeMode) => dispatch({ type: 'SET_COMPOSE_MODE', payload: m })}
        onAddCharacter={handleAddCharacter}
        onUpdateCharacter={handleUpdateCharacter}
        onDeleteCharacter={handleDeleteCharacter}
        onAddScene={handleAddScene}
        onSetActiveScene={(id) => dispatch({ type: 'SET_ACTIVE_SCENE', payload: id })}
        onBack={onBack}
        pdfUrl={getPdfUrl(projectId)}
        fountainUrl={getFountainUrl(projectId)}
        docxUrl={getDocxUrl(projectId)}
        onImport={() => setShowImportModal(true)}
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
          scenes={project.scenes}
          activeSceneId={activeSceneId}
          collapsedScenes={collapsedScenes}
          projectId={projectId}
          onToggleCollapse={(sceneId) =>
            dispatch({ type: 'TOGGLE_SCENE_COLLAPSE', payload: sceneId })
          }
          onSetActiveScene={(sceneId) =>
            dispatch({ type: 'SET_ACTIVE_SCENE', payload: sceneId })
          }
          onUpdateSceneHeading={handleUpdateSceneHeading}
          onDeleteScene={handleDeleteScene}
          onEditLine={handleEditLine}
          onDeleteLine={handleDeleteLine}
          onReorderScenes={handleReorderScenes}
          onReorderLines={handleReorderLines}
          onAddComment={handleAddComment}
          onResolveComment={handleResolveComment}
          onDeleteComment={handleDeleteComment}
          onRestoreLine={handleRestoreLine}
        />
        <div ref={bottomRef} />

        <Composer
          composeMode={composeMode}
          speaker={activeSpeaker}
          hasCharacters={project.characters.length > 0}
          activeScene={activeScene}
          value={inputText}
          parenthetical={parentheticalText}
          onChange={setInputText}
          onParentheticalChange={setParentheticalText}
          onSubmit={submitLine}
        />
      </div>

      {statsOpen && <StatsPanel project={project} onClose={() => setStatsOpen(false)} />}

      {showImportModal && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}
