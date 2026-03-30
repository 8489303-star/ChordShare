export interface ChordLine {
  chunks: { chord: string | null; text: string }[];
}

export function parseChordPro(content: string): ChordLine[] {
  const lines = content.split('\n');
  return lines.map(line => {
    const chunks: { chord: string | null; text: string }[] = [];
    let currentChord: string | null = null;
    let currentText = '';
    let i = 0;

    while (i < line.length) {
      if (line[i] === '[') {
        // If we have text before this chord, push it
        if (currentText || currentChord !== null) {
          chunks.push({ chord: currentChord, text: currentText });
          currentText = '';
        }
        // Find end of chord
        let j = i + 1;
        while (j < line.length && line[j] !== ']') {
          j++;
        }
        currentChord = line.substring(i + 1, j);
        i = j + 1;
      } else {
        currentText += line[i];
        i++;
      }
    }

    // Push last chunk
    if (currentText || currentChord !== null) {
      chunks.push({ chord: currentChord, text: currentText });
    }

    // If line was empty, add an empty chunk to preserve the line
    if (chunks.length === 0) {
      chunks.push({ chord: null, text: ' ' });
    }

    return { chunks };
  });
}
