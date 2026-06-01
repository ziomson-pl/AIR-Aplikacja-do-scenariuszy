import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Script } from './Script';
import type { DialogueLine } from '../types';

const noop = () => {};

const line = (over: Partial<DialogueLine>): DialogueLine => ({
  id: 'l1',
  projectId: 'p1',
  characterId: null,
  text: 'tekst',
  order: 0,
  type: 'narrator',
  ...over,
});

describe('Script', () => {
  it('renders an empty state when there are no lines', () => {
    render(<Script lines={[]} onEditLine={noop} onDeleteLine={noop} onMoveLine={noop} />);
    expect(screen.getByText(/Pusty scenariusz/i)).toBeInTheDocument();
  });

  it('wraps narrator text in parentheses', () => {
    render(
      <Script
        lines={[line({ type: 'narrator', text: 'Pada deszcz' })]}
        onEditLine={noop}
        onDeleteLine={noop}
        onMoveLine={noop}
      />,
    );
    expect(screen.getByText('(Pada deszcz)')).toBeInTheDocument();
  });

  it('renders the speaker name uppercased for dialogue lines', () => {
    render(
      <Script
        lines={[
          line({
            type: 'dialogue',
            text: 'Cześć',
            characterId: 'a',
            character: { id: 'a', name: 'Bob', color: '#000', projectId: 'p1' },
          }),
        ]}
        onEditLine={noop}
        onDeleteLine={noop}
        onMoveLine={noop}
      />,
    );
    expect(screen.getByText('BOB')).toBeInTheDocument();
  });

  it('enters edit mode on double click and saves on Enter', () => {
    const onEditLine = vi.fn();
    render(
      <Script
        lines={[line({ text: 'stary' })]}
        onEditLine={onEditLine}
        onDeleteLine={noop}
        onMoveLine={noop}
      />,
    );
    fireEvent.doubleClick(screen.getByText('(stary)'));
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'nowy' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(onEditLine).toHaveBeenCalledWith('l1', 'nowy');
  });

  it('calls onMoveLine when pressing the down control', () => {
    const onMoveLine = vi.fn();
    render(
      <Script
        lines={[line({ id: 'l1' }), line({ id: 'l2' })]}
        onEditLine={noop}
        onDeleteLine={noop}
        onMoveLine={onMoveLine}
      />,
    );
    fireEvent.click(screen.getAllByTitle('W dół')[0]);
    expect(onMoveLine).toHaveBeenCalledWith('l1', 1);
  });
});
