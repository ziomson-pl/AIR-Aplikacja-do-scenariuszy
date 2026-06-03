import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from 'docx';

export async function buildDocxBuffer(project: any): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: project.title.toUpperCase(),
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  );

  for (const scene of project.scenes) {
    // Scene heading
    children.push(
      new Paragraph({
        text: scene.heading.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );

    for (const line of scene.lines) {
      if (line.type === 'narrator') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line.text, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        );
      } else {
        // Character name
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.character?.name?.toUpperCase() ?? 'NIEZNANA POSTAĆ',
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }),
        );

        // Parenthetical
        if (line.parenthetical) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `(${line.parenthetical})`, italics: true }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 40 },
            }),
          );
        }

        // Dialogue
        children.push(
          new Paragraph({
            text: line.text,
            indent: { left: 1440, right: 1440 },
            spacing: { after: 200 },
          }),
        );
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
