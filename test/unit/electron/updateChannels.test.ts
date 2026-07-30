import { describe, expect, it } from 'vitest';
import {
  RELEASE_CHANNELS,
  getReleaseUrl,
  getUpdateProviderConfig,
  resolveReleaseChannel,
} from '../../../electron/updateChannels.cjs';

describe('updateChannels', () => {
  const releasesUrl = 'https://github.com/lxraytop/rayplayer/releases';
  const github = { owner: 'lxraytop', repo: 'rayplayer' };

  describe('resolveReleaseChannel', () => {
    it('always returns the stable channel', () => {
      expect(resolveReleaseChannel('1.2.0', 'stable')).toBe(RELEASE_CHANNELS.stable);
    });

    it('returns stable even for unknown channel names', () => {
      expect(resolveReleaseChannel('1.2.0', 'unknown')).toBe(RELEASE_CHANNELS.stable);
    });

    it('returns stable for alpha/beta version strings', () => {
      expect(resolveReleaseChannel('1.2.0-alpha.1', '')).toBe(RELEASE_CHANNELS.stable);
      expect(resolveReleaseChannel('1.2.0-beta.1', '')).toBe(RELEASE_CHANNELS.stable);
    });
  });

  describe('getReleaseUrl', () => {
    it('returns a versioned tag URL', () => {
      expect(getReleaseUrl('stable', '1.2.0', releasesUrl)).toBe(
        'https://github.com/lxraytop/rayplayer/releases/tag/v1.2.0'
      );
    });

    it('returns the base URL when version is empty', () => {
      expect(getReleaseUrl('stable', '', releasesUrl)).toBe(releasesUrl);
    });
  });

  describe('getUpdateProviderConfig', () => {
    it('returns a github provider for the stable channel', () => {
      const config = getUpdateProviderConfig(RELEASE_CHANNELS.stable, github);
      expect(config).toEqual({
        provider: 'github',
        owner: 'lxraytop',
        repo: 'rayplayer',
        channel: 'latest',
      });
    });

    it('returns null when updates are disabled', () => {
      expect(getUpdateProviderConfig({ updateEnabled: false }, github)).toBeNull();
    });
  });
});
