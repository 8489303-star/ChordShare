export interface ChordLine {
  chunks: { chord: string | null; text: string }[];
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
};

export function transposeChord(chord: string, semitones: number): string {
  if (!semitones) return chord;
  
  // Regex to match the root note (e.g., C, C#, Db)
  const rootMatch = chord.match(/^([A-G][#b]?)/);
  if (!rootMatch) return chord;
  
  let root = rootMatch[1];
  const rest = chord.substring(root.length);
  
  // Normalize flats to sharps
  if (FLAT_TO_SHARP[root]) {
    root = FLAT_TO_SHARP[root];
  }
  
  const index = NOTES.indexOf(root);
  if (index === -1) return chord;
  
  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return NOTES[newIndex] + rest;
}

export function parseChordPro(content: string, transpose: number = 0): ChordLine[] {
  const lines = content.split('\n');
  return lines.map(line => {
    const chunks: { chord: string | null; text: string }[] = [];
    let currentChord: string | null = null;
    let currentText = '';
    let i = 0;

    while (i < line.length) {
      if (line[i] === '[') {
        // Push previous chunk if exists
        if (currentText || currentChord !== null) {
          chunks.push({ chord: currentChord, text: currentText });
          currentText = '';
        }
        
        const start = i + 1;
        const end = line.indexOf(']', start);
        if (end !== -1) {
          const rawChord = line.substring(start, end);
          currentChord = transpose !== 0 ? transposeChord(rawChord, transpose) : rawChord;
          i = end + 1;
        } else {
          currentText += line[i];
          i++;
        }
      } else {
        currentText += line[i];
        i++;
      }
    }

    if (currentText || currentChord !== null) {
      chunks.push({ chord: currentChord, text: currentText });
    }

    if (chunks.length === 0) {
      chunks.push({ chord: null, text: ' ' });
    }

    return { chunks };
  });
}
