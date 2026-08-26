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

// Legends Never Die — Against The Current (2017 League of Legends World Championship anthem)
const LEGENDS_NEVER_DIE_PREVIEW_PLACEHOLDER_LINES: Line[] = [
    {
        startTime: 0.7,
        endTime: 3.6,
        fullText: 'Legends never die',
        translation: '传奇永不熄灭',
        romanization: 'Legends never die',
        words: createTokenWords(['Legends', 'never', 'die'], 0.7, 3.6),
        backgroundVocal: {
            text: 'Relentless you survive',
            startTime: 1.3,
            endTime: 3.1,
            words: createTokenWords(['Relentless', 'you', 'survive'], 1.3, 3.1),
            translation: '不屈的你得以幸存',
            romanization: 'Relentless you survive',
        },
    },
    {
        startTime: 4.2,
        endTime: 7.2,
        fullText: 'When the world is calling you',
        translation: '当世界在呼唤你',
        romanization: 'When the world is calling you',
        words: createTokenWords(['When', 'the', 'world', 'is', 'calling', 'you'], 4.2, 7.2),
        backgroundVocal: {
            text: 'Can you hear them screaming out your name?',
            startTime: 4.8,
            endTime: 6.6,
            words: createTokenWords(['Can', 'you', 'hear', 'them', 'screaming', 'out', 'your', 'name?'], 4.8, 6.6),
            translation: '你是否听见他们高呼你的名字？',
            romanization: 'Can you hear them screaming out your name?',
        },
    },
    {
        startTime: 7.8,
        endTime: 10.9,
        fullText: 'Every time you bleed for reaching greatness',
        translation: '每一次为登峰造极而流血',
        romanization: 'Every time you bleed for reaching greatness',
        words: createTokenWords(
            ['Every', 'time', 'you', 'bleed', 'for', 'reaching', 'greatness'],
            7.8,
            10.9,
        ),
        backgroundVocal: {
            text: 'They become a part of you',
            startTime: 8.4,
            endTime: 10.2,
            words: createTokenWords(['They', 'become', 'a', 'part', 'of', 'you'], 8.4, 10.2),
            translation: '他们已化作你的一部分',
            romanization: 'They become a part of you',
        },
    },
    {
        startTime: 11.5,
        endTime: 14.4,
        fullText: 'Oh, pick yourself up, cause legends never die',
        translation: '振作起来吧，因为传奇永不熄灭',
        romanization: 'Oh, pick yourself up, cause legends never die',
        words: createTokenWords(['Oh,', 'pick', 'yourself', 'up,', 'cause', 'legends', 'never', 'die'], 11.5, 14.4),
    },
];

// 何慕卿 — 徐良
const HE_MU_QING_PREVIEW_PLACEHOLDER_LINES: Line[] = [
    {
        startTime: 0,
        endTime: 3.1,
        fullText: '一纸油伞 独步在雨巷',
        translation: 'A paper umbrella, walking alone through the rainy lane',
        romanization: 'Yī zhǐ yóu sǎn dú bù zài yǔ xiàng',
        words: createCharacterWords('一纸油伞 独步在雨巷', 0, 3.1),
    },
    {
        startTime: 3.6,
        endTime: 6.9,
        fullText: '雁过一行 木窗哭两行',
        translation: 'Geese cross the sky in a line, the wooden window weeps two lines of tears',
        romanization: 'Yàn guò yī háng mù chuāng kū liǎng háng',
        words: createCharacterWords('雁过一行 木窗哭两行', 3.6, 6.9),
    },
    {
        startTime: 7.4,
        endTime: 10.3,
        fullText: '怕相爱太难 把秋水望穿',
        translation: 'Afraid that loving is too hard, gazing through the autumn waters',
        romanization: 'Pà xiāng ài tài nán bǎ qiū shuǐ wàng chuān',
        words: createCharacterWords('怕相爱太难 把秋水望穿', 7.4, 10.3),
    },
    {
        startTime: 10.8,
        endTime: 13.6,
        fullText: '愿肝肠寸断来交换你今生相伴',
        translation: 'Willing to be torn apart in exchange for your company in this life',
        romanization: 'Yuàn gān cháng cùn duàn lái jiāo huàn nǐ jīn shēng xiāng bàn',
        words: createCharacterWords('愿肝肠寸断来交换你今生相伴', 10.8, 13.6),
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
        lines: LEGENDS_NEVER_DIE_PREVIEW_PLACEHOLDER_LINES,
        loopDuration: 14.4,
        coverUrl: placeholderCoverUrl,
    },
    reserved: {
        id: 'reserved',
        title: '何慕卿 (徐良)',
        lines: HE_MU_QING_PREVIEW_PLACEHOLDER_LINES,
        loopDuration: 13.6,
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
