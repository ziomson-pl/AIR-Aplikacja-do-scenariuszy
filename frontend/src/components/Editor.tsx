import { useReducer, useEffect, useRef, useState } from 'react';
import { editorReducer, initialState } from '../reducer';
import { getProject, addCharacter, deleteCharacter, addLine, deleteLine, getPdfUrl } from '../api';
import { DialogueView } from './DialogueView';
import { Sidebar } from './Sidebar';

interface Props {
  projectId: string;
  onBack: () => void;
}

export function Editor({ projectId, onBack }: Props) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [inputText, setInputText] = useState('');
  const [newCharName, setNewCharName] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    getProject(projectId)
      .then((p) => dispatch({ type: 'LOAD_PROJECT', payload: p }))
      .catch(() => dispatch({ type: 'SET_ERROR', payload: 'Błąd ładowania projektu.' }));
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.project?.lines.length]);

  async function handleAddLine(e: React.FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !state.project) return;
    try {
      const line = await addLine(
        projectId,
        text,
        state.narratorMode ? 'narrator' : 'dialogue',
        state.narratorMode ? null : state.activeSpeakerId,
      );
      dispatch({ type: 'ADD_LINE', payload: line });
      setInputText('');
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Błąd dodawania kwestii.' });
    }
  }

  async function handleDeleteLine(lineId: string) {
    try {
      await deleteLine(projectId, lineId);
      dispatch({ type: 'REMOVE_LINE', payload: lineId });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Błąd usuwania kwestii.' });
    }
  }

  async function handleAddCharacter(e: React.FormEvent) {
    e.preventDefault();
    const name = newCharName.trim();
    if (!name) return;
    try {
      const char = await addCharacter(projectId, name);
      dispatch({ type: 'ADD_CHARACTER', payload: char });
      setNewCharName('');
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Błąd dodawania postaci.' });
    }
  }

  async function handleDeleteCharacter(charId: string) {
    try {
      await deleteCharacter(projectId, charId);
      dispatch({ type: 'REMOVE_CHARACTER', payload: charId });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Błąd usuwania postaci.' });
    }
  }

  if (state.loading) {
    return <div className="editor-loading">Ładowanie projektu...</div>;
  }
  if (!state.project) {
    return (
      <div className="editor-loading">
        {state.error && <p className="error-msg">{state.error}</p>}
        <button className="btn btn-secondary" onClick={onBack}>Wróć</button>
      </div>
    );
  }

  const speakerLabel = state.narratorMode
    ? 'NARRATOR'
    : (state.project.characters.find((c) => c.id === state.activeSpeakerId)?.name.toUpperCase() ?? '—');

  return (
    <div className="editor-layout">
      <Sidebar
        project={state.project}
        activeSpeakerId={state.activeSpeakerId}
        narratorMode={state.narratorMode}
        newCharName={newCharName}
        onSetSpeaker={(id) => dispatch({ type: 'SET_ACTIVE_SPEAKER', payload: id })}
        onToggleNarrator={() => dispatch({ type: 'TOGGLE_NARRATOR_MODE' })}
        onNewCharNameChange={setNewCharName}
        onAddCharacter={handleAddCharacter}
        onDeleteCharacter={handleDeleteCharacter}
        onBack={onBack}
        pdfUrl={getPdfUrl(projectId)}
      />

      <div className="editor-main">
        <DialogueView lines={state.project.lines} onDeleteLine={handleDeleteLine} />
        <div ref={bottomRef} />

        <form className="input-bar" onSubmit={handleAddLine}>
          <span className={`input-bar-speaker${state.narratorMode ? ' narrator' : ''}`}>
            {speakerLabel}
          </span>
          <div className="input-bar-row">
            <input
              className={`input-bar-field${state.narratorMode ? ' narrator-mode' : ''}`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                state.narratorMode
                  ? 'Wpisz didaskalia narratora...'
                  : `Kwestia ${speakerLabel}...`
              }
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={!inputText.trim()}>
              Dodaj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
