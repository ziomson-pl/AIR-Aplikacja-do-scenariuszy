import { buildScreenplayHtml, escapeHtml } from './pdf-template';

const sceneWith = (lines: { type: string; characterName?: string | null; text: string; parenthetical?: string | null }[]) => ({
  title: 'X',
  scenes: [{ heading: 'INT. POKÓJ — DZIEŃ', lines: lines as any }],
});

describe('escapeHtml', () => {
  it('escapes HTML-significant characters', () => {
    expect(escapeHtml('<b>"A" & \'B\'</b>')).toBe(
      '&lt;b&gt;&quot;A&quot; &amp; &#039;B&#039;&lt;/b&gt;',
    );
  });
});

describe('buildScreenplayHtml', () => {
  it('renders a title page with the project title', () => {
    const html = buildScreenplayHtml({ title: 'Test Film', scenes: [] });
    expect(html).toContain('Test Film');
    expect(html).toContain('class="title-page"');
  });

  it('renders scene headings uppercased', () => {
    const html = buildScreenplayHtml({
      title: 'X',
      scenes: [{ heading: 'wnętrze – kuchnia – dzień', lines: [] }],
    });
    expect(html).toContain('WNĘTRZE – KUCHNIA – DZIEŃ');
  });

  it('uppercases the character name for dialogue blocks', () => {
    const html = buildScreenplayHtml(sceneWith([{ type: 'dialogue', characterName: 'Anna', text: 'Cześć' }]));
    expect(html).toContain('class="character-name">ANNA<');
    expect(html).toContain('class="dialogue-text">Cześć<');
  });

  it('wraps narrator lines in parentheses and italics block', () => {
    const html = buildScreenplayHtml(sceneWith([{ type: 'narrator', text: 'Pada deszcz' }]));
    expect(html).toContain('class="narrator-text">(Pada deszcz)<');
  });

  it('renders parenthetical between character name and dialogue', () => {
    const html = buildScreenplayHtml(
      sceneWith([{ type: 'dialogue', characterName: 'Anna', text: 'Cześć', parenthetical: 'ironicznie' }]),
    );
    expect(html).toContain('class="parenthetical">(ironicznie)<');
    expect(html).toContain('class="dialogue-text">Cześć<');
  });

  it('escapes user text to prevent HTML injection', () => {
    const html = buildScreenplayHtml(sceneWith([{ type: 'narrator', text: '<script>alert(1)</script>' }]));
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('shows an empty note when there are no scenes', () => {
    const html = buildScreenplayHtml({ title: 'X', scenes: [] });
    expect(html).toContain('empty-note');
  });

  it('falls back to a placeholder when a dialogue line has no character', () => {
    const html = buildScreenplayHtml(sceneWith([{ type: 'dialogue', characterName: null, text: 'Hej' }]));
    expect(html).toContain('NIEZNANA POSTAĆ');
  });
});
