import { type Line, type VisualizerMode } from '../../types';
import { getLineRenderEndTime } from '../../utils/lyrics/renderHints';
import placeholderCoverUrl from '../../../assets/placeholder_cover.jpg';
import placeholderCover2Url from '../../../assets/placeholder_cover-2.jpg';
import { getVisualizerPreviewStartOffset } from './registry';

const createCharacterWords = (text: string, startTime: number, endTime: number) => {
    const chars = Array.from(text);
    const duration = endTime - startTime;

    return chars.map((char, index) => {
        const charStart = startTime + duration * (index / chars.length);
        const charEnd = startTime + duration * ((index + 1) / chars.length);

        return {
            text: char,
            startTime: charStart,
            endTime: charEnd,
        };
    });
};

const createTokenWords = (tokens: string[], startTime: number, endTime: number) => {
    const duration = endTime - startTime;

    return tokens.map((token, index) => ({
        text: token,
        startTime: startTime + duration * (index / tokens.length),
        endTime: startTime + duration * ((index + 1) / tokens.length),
    }));
};

const LEGEND_NEVER_DIE_LINES: Line[] = [
    {
        startTime: 0,
        endTime: 3.5,
        fullText: 'Welcome to the wild, wild wilderness',
        translation: '欢迎来到这狂野的荒野',
        romanization: 'Welcome to the wild, wild wilderness',
        words: createTokenWords(['Welcome', 'to', 'the', 'wild,', 'wild', 'wilderness'], 0, 3.5),
    },
    {
        startTime: 4.0,
        endTime: 6.5,
        fullText: 'Come with me, come with me',
        translation: '跟我来，跟我来',
        romanization: 'Come with me, come with me',
        words: createTokenWords(['Come', 'with', 'me,', 'come', 'with', 'me'], 4.0, 6.5),
    },
    {
        startTime: 7.0,
        endTime: 10.5,
        fullText: "We'll find a brand new destiny",
        translation: '我们将找到崭新的命运',
        romanization: "We'll find a brand new destiny",
        words: createTokenWords(["We'll", 'find', 'a', 'brand', 'new', 'destiny'], 7.0, 10.5),
    },
    {
        startTime: 11.0,
        endTime: 14.0,
        fullText: 'Legends never die',
        translation: '传奇永不熄灭',
        romanization: 'Legends never die',
        words: createTokenWords(['Legends', 'never', 'die'], 11.0, 14.0),
    },
];

const HE_MU_QING_LINES: Line[] = [
    {
        startTime: 0,
        endTime: 3.8,
        fullText: '一纸油伞 独步在雨巷',
        translation: '一纸油伞 独步在雨巷',
        romanization: 'Yī zhǐ yóu sǎn, dú bù zài yǔ xiàng',
        words: createCharacterWords('一纸油伞 独步在雨巷', 0, 3.8),
    },
    {
        startTime: 4.2,
        endTime: 7.8,
        fullText: '雁过一行 木窗哭两行',
        translation: '雁过一行 木窗哭两行',
        romanization: 'Yàn guò yī háng, mù chuāng kū liǎng háng',
        words: createCharacterWords('雁过一行 木窗哭两行', 4.2, 7.8),
    },
    {
        startTime: 8.2,
        endTime: 11.5,
        fullText: '俯首掩面的过往 四下无人讲',
        translation: '俯首掩面的过往 四下无人讲',
        romanization: 'Fǔ shǒu yǎn miàn de guò wǎng, sì xià wú rén jiǎng',
        words: createCharacterWords('俯首掩面的过往 四下无人讲', 8.2, 11.5),
    },
    {
        startTime: 12.0,
        endTime: 15.5,
        fullText: '一生一世一双人',
        translation: '一生一世一双人',
        romanization: 'Yī shēng yī shì yī shuāng rén',
        words: createCharacterWords('一生一世一双人', 12.0, 15.5),
        backgroundVocal: {
            text: '一灯一影一销魂',
            startTime: 12.6,
            endTime: 15.0,
            words: createCharacterWords('一灯一影一销魂', 12.6, 15.0),
            translation: '一灯一影一销魂',
            romanization: 'Yī dēng yī yǐng yī xiāo hún',
        },
    },
];

export type PreviewPlaceholderId = 'default' | 'reserved';

export interface PreviewPlaceholder {
    id: PreviewPlaceholderId;
    title: string;
    lines: Line[];
    loopDuration: number;
    coverUrl: string;
}

export const VIS_PLAYGROUND_PREVIEW_PLACEHOLDERS: Record<PreviewPlaceholderId, PreviewPlaceholder> = {
    default: {
        id: 'default',
        title: 'Legend Never Die',
        lines: LEGEND_NEVER_DIE_LINES,
        loopDuration: 14.0,
        coverUrl: placeholderCoverUrl,
    },
    reserved: {
        id: 'reserved',
        title: '何慕卿',
        lines: HE_MU_QING_LINES,
        loopDuration: 15.5,
        coverUrl: placeholderCover2Url,
    },
};

export const VIS_PLAYGROUND_PREVIEW_LINES = VIS_PLAYGROUND_PREVIEW_PLACEHOLDERS.default.lines;
export const VIS_PLAYGROUND_PREVIEW_LOOP_DURATION = VIS_PLAYGROUND_PREVIEW_PLACEHOLDERS.default.loopDuration;
export const VIS_PLAYGROUND_PREVIEW_COVER_URL = VIS_PLAYGROUND_PREVIEW_PLACEHOLDERS.default.coverUrl;

export const getPreviewPlaceholderStartOffset = (mode: VisualizerMode, loopDuration: number) =>
    getVisualizerPreviewStartOffset(mode, loopDuration);

export const findPreviewPlaceholderLineIndex = (lines: Line[], time: number) => {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index];
        if (!line || time < line.startTime) {
            continue;
        }

        if (time <= getLineRenderEndTime(line)) {
            return index;
        }
    }

    return -1;
};
