import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Composer } from './Composer';
import type { Character } from '../types';

const speaker: Character = { id: 'a', name: 'Anna', color: '#6366f1', projectId: 'p1' };

describe('Composer', () => {
  it('shows the speaker name (uppercased) in dialogue mode', () => {
    render(
      <Composer
        composeMode="dialogue"
        speaker={speaker}
        hasCharacters
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText('ANNA')).toBeInTheDocument();
  });

  it('blocks dialogue input when there are no characters', () => {
    render(
      <Composer
        composeMode="dialogue"
        speaker={null}
        hasCharacters={false}
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText(/Dodaj postać/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('labels the badge NARRATOR in narrator mode', () => {
    render(
      <Composer
        composeMode="narrator"
        speaker={null}
        hasCharacters
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText('NARRATOR')).toBeInTheDocument();
  });

  it('submits on Enter without shift', () => {
    const onSubmit = vi.fn();
    render(
      <Composer
        composeMode="narrator"
        speaker={null}
        hasCharacters
        value="Pada deszcz"
        onChange={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit on Shift+Enter (newline)', () => {
    const onSubmit = vi.fn();
    render(
      <Composer
        composeMode="narrator"
        speaker={null}
        hasCharacters
        value="x"
        onChange={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
