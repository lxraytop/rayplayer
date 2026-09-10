import { describe, expect, it } from 'vitest';

// test/unit/electron/updateChannels.test.ts

const {
    getReleaseUrl,
    getUpdateProviderConfig,
    resolveReleaseChannel,
} = require('../../../electron/updateChannels.cjs') as {
    getReleaseUrl: (channel: string | null, version: string, releasesUrl: string) => string;
    getUpdateProviderConfig: (
        releaseChannel: {
            updaterChannel: string | null;
            updateEnabled: boolean;
        },
        github: { owner: string; repo: string },
    ) => Record<string, unknown> | null;
    resolveReleaseChannel: (version: string, declaredChannel?: string | null) => {
        id: string;
        updaterChannel: string | null;
        allowPrerelease: boolean;
        updateEnabled: boolean;
    };
};

describe('release update channels', () => {
    it('always resolves to the stable channel regardless of version suffix', () => {
        expect(resolveReleaseChannel('1.5.0')).toMatchObject({
            id: 'stable',
            updaterChannel: 'latest',
            updateEnabled: true,
            allowPrerelease: false,
        });
    });

    it('ignores declared channel and always returns stable', () => {
        expect(resolveReleaseChannel('1.5.0', 'anything')).toMatchObject({
            id: 'stable',
            updateEnabled: true,
        });
    });

    it('builds a semver release URL', () => {
        const releasesUrl = 'https://github.com/lxraytop/rayplayer/releases';
        expect(getReleaseUrl('stable', '1.5.0', releasesUrl)).toBe(`${releasesUrl}/tag/v1.5.0`);
    });

    it('returns GitHub provider config for stable channel', () => {
        const github = { owner: 'lxraytop', repo: 'rayplayer' };
        expect(getUpdateProviderConfig(resolveReleaseChannel('1.5.0', 'stable'), github)).toEqual({
            provider: 'github',
            owner: 'lxraytop',
            repo: 'rayplayer',
            channel: 'latest',
        });
    });

    it('returns null for disabled channel', () => {
        const github = { owner: 'lxraytop', repo: 'rayplayer' };
        expect(getUpdateProviderConfig({ updaterChannel: null, updateEnabled: false }, github)).toBeNull();
    });
});
