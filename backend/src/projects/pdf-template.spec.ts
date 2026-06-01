import { buildScreenplayHtml, escapeHtml } from './pdf-template';

describe('escapeHtml', () => {
  it('escapes HTML-significant characters', () => {
    expect(escapeHtml('<b>"A" & \'B\'</b>')).toBe(
      '&lt;b&gt;&quot;A&quot; &amp; &#039;B&#039;&lt;/b&gt;',
    );
  });
});

describe('buildScreenplayHtml', () => {
  it('renders a title page with the project title', () => {
    const html = buildScreenplayHtml({ title: 'Test Film', lines: [] });
    expect(html).toContain('<h1>Test Film</h1>');
    expect(html).toContain('class="title-page"');
  });

  it('uppercases the character name for dialogue blocks', () => {
    const html = buildScreenplayHtml({
      title: 'X',
      lines: [{ type: 'dialogue', characterName: 'Anna', text: 'Cześć' }],
    });
    expect(html).toContain('class="character-name">ANNA<');
    expect(html).toContain('class="dialogue-text">Cześć<');
  });

  it('wraps narrator lines in parentheses and italics block', () => {
    const html = buildScreenplayHtml({
      title: 'X',
      lines: [{ type: 'narrator', text: 'Pada deszcz' }],
    });
    expect(html).toContain('class="narrator-text">(Pada deszcz)<');
  });

  it('renders scene headings uppercased', () => {
    const html = buildScreenplayHtml({
      title: 'X',
      lines: [{ type: 'scene', text: 'wnętrze – kuchnia – dzień' }],
    });
    expect(html).toContain('class="scene-heading">WNĘTRZE – KUCHNIA – DZIEŃ<');
  });

  it('escapes user text to prevent HTML injection', () => {
    const html = buildScreenplayHtml({
      title: 'X',
      lines: [{ type: 'narrator', text: '<script>alert(1)</script>' }],
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('shows an empty note when there are no lines', () => {
    const html = buildScreenplayHtml({ title: 'X', lines: [] });
    expect(html).toContain('empty-note');
  });

  it('falls back to a placeholder when a dialogue line has no character', () => {
    const html = buildScreenplayHtml({
      title: 'X',
      lines: [{ type: 'dialogue', characterName: null, text: 'Hej' }],
    });
    expect(html).toContain('NIEZNANA POSTAĆ');
  });
});
