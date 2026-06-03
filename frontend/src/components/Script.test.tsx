import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Script } from './Script';
import type { Scene } from '../types';

const noop = async () => {};
const noopSync = () => {};

const makeScene = (overrides: Partial<Scene> = {}): Scene => ({
  id: 's1',
  projectId: 'p1',
  heading: 'INT. POKÓJ — DZIEŃ',
  order: 0,
  lines: [],
  ...overrides,
});

describe('Script', () => {
  const defaultProps = {
    scenes: [],
    activeSceneId: null,
    collapsedScenes: new Set<string>(),
    projectId: 'p1',
    onToggleCollapse: noopSync,
    onSetActiveScene: noopSync,
    onUpdateSceneHeading: noopSync,
    onDeleteScene: noopSync,
    onEditLine: noopSync,
    onDeleteLine: noopSync,
    onReorderScenes: noopSync,
    onReorderLines: noopSync,
    onAddComment: noop,
    onResolveComment: noop,
    onDeleteComment: noop,
    onRestoreLine: noop,
  };

  it('renders an empty state when there are no scenes', () => {
    render(<Script {...defaultProps} />);
    expect(screen.getByText(/Pusty scenariusz/i)).toBeInTheDocument();
  });

  it('renders a scene heading', () => {
    const scene = makeScene({ heading: 'INT. KUCHNIA — DZIEŃ' });
    render(<Script {...defaultProps} scenes={[scene]} />);
    expect(screen.getByText('INT. KUCHNIA — DZIEŃ')).toBeInTheDocument();
  });

  it('renders narrator lines wrapped in parentheses', () => {
    const scene = makeScene({
      lines: [
        {
          id: 'l1',
          sceneId: 's1',
          characterId: null,
          text: 'Pada deszcz',
          parenthetical: null,
          order: 0,
          type: 'narrator',
        },
      ],
    });
    render(<Script {...defaultProps} scenes={[scene]} />);
    expect(screen.getByText('(Pada deszcz)')).toBeInTheDocument();
  });

  it('renders the speaker name uppercased for dialogue lines', () => {
    const scene = makeScene({
      lines: [
        {
          id: 'l1',
          sceneId: 's1',
          characterId: 'c1',
          text: 'Cześć',
          parenthetical: null,
          order: 0,
          type: 'dialogue',
          character: { id: 'c1', name: 'Bob', color: '#000', projectId: 'p1' },
        },
      ],
    });
    render(<Script {...defaultProps} scenes={[scene]} />);
    expect(screen.getByText('BOB')).toBeInTheDocument();
  });
});
