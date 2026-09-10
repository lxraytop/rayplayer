import type { Line } from '../../../types';
import { buildDisplayWordsFromLayoutUnits, buildPostLyricLayoutUnits } from '../../../utils/lyrics/cjkSemanticLayout';
import { buildWordGraphemeTimings, type GraphemeTiming } from '../../../utils/lyrics/graphemeTiming';

// src/components/visualizer/ripple/rippleModel.ts
// Pure layout and reveal-state helpers for the Ripple mode. They live outside the component so the
// word drop timing can be unit-tested without a DOM or a running playback clock.

export type RippleWordState = 'waiting' | 'active' | 'passed';

export interface RippleWord {
    index: number;
    text: string;
    startTime: number;
    endTime: number;
    graphemes: GraphemeTiming[];
}

// Words come from the shared layout pipeline (CJK semantic grouping + sticky punctuation) so Ripple
// never re-invents how a line is split. Blank tokens are dropped because they would render an empty
// clickable-looking word with its own ripple.
export const buildRippleWords = (line: Line | null | undefined): RippleWord[] => {
    if (!line) {
        return [];
    }

    const units = buildPostLyricLayoutUnits(line, { semantic: true, sticky: true });
    return buildDisplayWordsFromLayoutUnits(units)
        .filter(word => word.text.trim().length > 0)
        .map((word, index) => ({
            index,
            text: word.text,
            startTime: word.startTime,
            endTime: word.endTime,
            graphemes: buildWordGraphemeTimings(word, index),
        }));
};

// Returns the index of the word that is currently dropping, or -1 before the first word starts. The
// last index stays "active" once the line is over so the settled state does not flash back to waiting.
export const resolveRippleActiveWordIndex = (words: RippleWord[], time: number): number => {
    let active = -1;
    for (let i = 0; i < words.length; i += 1) {
        if (time >= words[i].startTime) {
            active = i;
        }
    }
    return active;
};

export const resolveRippleWordState = (word: RippleWord, activeWordIndex: number): RippleWordState => {
    if (word.index < activeWordIndex) {
        return 'passed';
    }
    if (word.index === activeWordIndex) {
        return 'active';
    }
    return 'waiting';
};
