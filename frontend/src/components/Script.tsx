import { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Scene, DialogueLine } from '../types';
import { CommentPanel } from './CommentPanel';
import { HistoryModal } from './HistoryModal';

interface SortableLineProps {
  line: DialogueLine;
  sceneId: string;
  onEdit: (lineId: string, sceneId: string, text: string) => void;
  onDelete: (lineId: string, sceneId: string) => void;
  onOpenComments: (line: DialogueLine) => void;
  onOpenHistory: (line: DialogueLine) => void;
}

function SortableLine({ line, onEdit, onDelete, onOpenComments, onOpenHistory }: SortableLineProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `line-${line.id}`,
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function startEdit() {
    setDraft(line.text);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const text = draft.trim();
    if (text && text !== line.text) onEdit(line.id, line.sceneId, text);
  }

  const commentCount = (line.comments ?? []).length;
  const unresolvedCount = (line.comments ?? []).filter((c) => !c.resolved).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`line line--${line.type}${isDragging ? ' line--dragging' : ''}`}
    >
      <div className="line-drag-handle" {...attributes} {...listeners} title="Przeciągnij">
        ⢿
      </div>

      <div className="line-body">
        {line.type === 'dialogue' && (
          <p className="line-speaker" style={{ color: line.character?.color ?? undefined }}>
            {line.character?.name?.toUpperCase() ?? 'NIEZNANA POSTAĆ'}
          </p>
        )}

        {line.parenthetical && (
          <p className="line-parenthetical">({line.parenthetical})</p>
        )}

        {editing ? (
          <textarea
            className="line-edit"
            value={draft}
            autoFocus
            rows={Math.max(1, draft.split('\n').length)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <p
            className="line-text"
            onDoubleClick={startEdit}
            title="Podwójne kliknięcie, aby edytować"
          >
            {line.type === 'narrator' ? `(${line.text})` : line.text}
          </p>
        )}
      </div>

      <div className="line-actions">
        {commentCount > 0 && (
          <button
            className={`comment-badge${unresolvedCount > 0 ? ' comment-badge--active' : ''}`}
            onClick={() => onOpenComments(line)}
            title={`${commentCount} komentarz(e)`}
          >
            💬 {unresolvedCount > 0 ? unresolvedCount : commentCount}
          </button>
        )}
        <button
          className="line-action-btn"
          onClick={() => onOpenComments(line)}
          title="Komentarze"
        >
          💬
        </button>
        <button
          className="line-action-btn line-history-btn"
          onClick={() => onOpenHistory(line)}
          title="Historia zmian"
        >
          🕐
        </button>
        <button
          className="line-action-btn line-action-btn--danger"
          onClick={() => onDelete(line.id, line.sceneId)}
          title="Usuń kwestię"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface SortableSceneProps {
  scene: Scene;
  collapsed: boolean;
  activeSceneId: string | null;
  onToggleCollapse: (sceneId: string) => void;
  onSetActive: (sceneId: string) => void;
  onUpdateHeading: (sceneId: string, heading: string) => void;
  onDelete: (sceneId: string) => void;
  onEditLine: (lineId: string, sceneId: string, text: string) => void;
  onDeleteLine: (lineId: string, sceneId: string) => void;
  onOpenComments: (line: DialogueLine) => void;
  onOpenHistory: (line: DialogueLine) => void;
}

function SortableScene({
  scene,
  collapsed,
  activeSceneId,
  onToggleCollapse,
  onSetActive,
  onUpdateHeading,
  onDelete,
  onEditLine,
  onDeleteLine,
  onOpenComments,
  onOpenHistory,
}: SortableSceneProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `scene-${scene.id}`,
  });

  const [editingHeading, setEditingHeading] = useState(false);
  const [headingDraft, setHeadingDraft] = useState('');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function startEditHeading() {
    setHeadingDraft(scene.heading);
    setEditingHeading(true);
  }

  function commitHeading() {
    setEditingHeading(false);
    const h = headingDraft.trim();
    if (h && h !== scene.heading) onUpdateHeading(scene.id, h);
  }

  const isActive = activeSceneId === scene.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`scene-container${isActive ? ' scene-container--active' : ''}`}
      id={`scene-${scene.id}`}
    >
      <div className={`scene-header${collapsed ? ' scene-header--collapsed' : ''}`}>
        <button
          className="scene-drag-handle"
          {...attributes}
          {...listeners}
          title="Przeciągnij scenę"
        >
          ⢿
        </button>

        <button
          className="scene-collapse-btn"
          onClick={() => onToggleCollapse(scene.id)}
          title={collapsed ? 'Rozwiń' : 'Zwiń'}
        >
          {collapsed ? '▶' : '▼'}
        </button>

        {editingHeading ? (
          <input
            className="scene-heading-input"
            value={headingDraft}
            autoFocus
            maxLength={300}
            onChange={(e) => setHeadingDraft(e.target.value)}
            onBlur={commitHeading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitHeading();
              if (e.key === 'Escape') setEditingHeading(false);
            }}
          />
        ) : (
          <button
            className="scene-heading-btn"
            onClick={() => onSetActive(scene.id)}
            onDoubleClick={startEditHeading}
            title="Kliknij aby ustawić aktywną · podwójne kliknięcie aby edytować"
          >
            {scene.heading}
          </button>
        )}

        {collapsed && (
          <span className="scene-line-count">{scene.lines.length} kwestii</span>
        )}

        <button
          className="scene-delete-btn"
          onClick={() => onDelete(scene.id)}
          title="Usuń scenę"
        >
          ✕
        </button>
      </div>

      {!collapsed && (
        <div className="scene-lines">
          <SortableContext
            items={scene.lines.map((l) => `line-${l.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {scene.lines.length === 0 && (
              <p className="scene-empty-hint">Brak kwestii w tej scenie. Dodaj pierwszą poniżej.</p>
            )}
            {scene.lines.map((line) => (
              <SortableLine
                key={line.id}
                line={line}
                sceneId={scene.id}
                onEdit={onEditLine}
                onDelete={onDeleteLine}
                onOpenComments={onOpenComments}
                onOpenHistory={onOpenHistory}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

interface Props {
  scenes: Scene[];
  activeSceneId: string | null;
  collapsedScenes: Set<string>;
  projectId: string;
  onToggleCollapse: (sceneId: string) => void;
  onSetActiveScene: (sceneId: string) => void;
  onUpdateSceneHeading: (sceneId: string, heading: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onEditLine: (lineId: string, sceneId: string, text: string) => void;
  onDeleteLine: (lineId: string, sceneId: string) => void;
  onReorderScenes: (orderedIds: string[]) => void;
  onReorderLines: (sceneId: string, orderedIds: string[]) => void;
  onAddComment: (lineId: string, text: string) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onRestoreLine: (lineId: string, sceneId: string, text: string, parenthetical: string | null) => Promise<void>;
}

export function Script({
  scenes,
  activeSceneId,
  collapsedScenes,
  projectId,
  onToggleCollapse,
  onSetActiveScene,
  onUpdateSceneHeading,
  onDeleteScene,
  onEditLine,
  onDeleteLine,
  onReorderScenes,
  onReorderLines,
  onAddComment,
  onResolveComment,
  onDeleteComment,
  onRestoreLine,
}: Props) {
  const [commentLine, setCommentLine] = useState<DialogueLine | null>(null);
  const [historyLine, setHistoryLine] = useState<DialogueLine | null>(null);

  const lineToScene = useRef<Map<string, string>>(new Map());

  for (const scene of scenes) {
    for (const line of scene.lines) {
      lineToScene.current.set(`line-${line.id}`, scene.id);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('scene-') && overId.startsWith('scene-')) {
      const activeSceneId = activeId.replace('scene-', '');
      const overSceneId = overId.replace('scene-', '');
      const oldIndex = scenes.findIndex((s) => s.id === activeSceneId);
      const newIndex = scenes.findIndex((s) => s.id === overSceneId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(scenes, oldIndex, newIndex);
        onReorderScenes(reordered.map((s) => s.id));
      }
    } else if (activeId.startsWith('line-') && overId.startsWith('line-')) {
      const activeLineId = activeId.replace('line-', '');
      const overLineId = overId.replace('line-', '');
      const sceneId = lineToScene.current.get(activeId);
      const overSceneId = lineToScene.current.get(overId);

      if (sceneId && sceneId === overSceneId) {
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene) return;
        const oldIndex = scene.lines.findIndex((l) => l.id === activeLineId);
        const newIndex = scene.lines.findIndex((l) => l.id === overLineId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(scene.lines, oldIndex, newIndex);
          onReorderLines(sceneId, reordered.map((l) => l.id));
        }
      }
    }
  }

  if (scenes.length === 0) {
    return (
      <div className="script-scroll">
        <div className="script-empty">
          <div className="script-empty-icon">🎭</div>
          <p className="script-empty-title">Pusty scenariusz</p>
          <p className="script-empty-text">
            Dodaj pierwszą scenę używając przycisku w panelu po lewej.
          </p>
        </div>
      </div>
    );
  }

  const allSceneIds = scenes.map((s) => `scene-${s.id}`);

  return (
    <>
      <div className="script-scroll">
        <div className="script-page">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allSceneIds} strategy={verticalListSortingStrategy}>
              {scenes.map((scene) => (
                <SortableScene
                  key={scene.id}
                  scene={scene}
                  collapsed={collapsedScenes.has(scene.id)}
                  activeSceneId={activeSceneId}
                  onToggleCollapse={onToggleCollapse}
                  onSetActive={onSetActiveScene}
                  onUpdateHeading={onUpdateSceneHeading}
                  onDelete={onDeleteScene}
                  onEditLine={onEditLine}
                  onDeleteLine={onDeleteLine}
                  onOpenComments={(line) => setCommentLine(line)}
                  onOpenHistory={(line) => setHistoryLine(line)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {commentLine && (
        <div className="comment-panel-overlay">
          <CommentPanel
            projectId={projectId}
            line={commentLine}
            onAddComment={onAddComment}
            onResolveComment={onResolveComment}
            onDeleteComment={onDeleteComment}
            onClose={() => setCommentLine(null)}
          />
        </div>
      )}

      {historyLine && (
        <HistoryModal
          projectId={projectId}
          line={historyLine}
          onRestore={onRestoreLine}
          onClose={() => setHistoryLine(null)}
        />
      )}
    </>
  );
}
