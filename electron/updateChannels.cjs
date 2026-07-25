// electron/updateChannels.cjs
// Simplified single-channel update configuration for stable releases only.

const RELEASE_CHANNELS = {
  stable: {
    id: 'stable',
    label: 'Stable',
    updaterChannel: 'latest',
    allowPrerelease: false,
    updateEnabled: true,
  },
};

function normalizeReleaseChannel(_version, _declaredChannel) {
  return RELEASE_CHANNELS.stable;
}

function resolveReleaseChannel(version, declaredChannel) {
  return RELEASE_CHANNELS.stable;
}

function getReleaseUrl(channel, version, releasesUrl) {
  const normalizedVersion = typeof version === 'string' ? version.trim().replace(/^v/i, '') : '';
  return normalizedVersion ? `${releasesUrl}/tag/v${normalizedVersion}` : releasesUrl;
}

function getUpdateProviderConfig(releaseChannel, github) {
  if (!releaseChannel?.updateEnabled) {
    return null;
  }

  return {
    provider: 'github',
    owner: github.owner,
    repo: github.repo,
    channel: releaseChannel.updaterChannel,
  };
}

module.exports = {
  RELEASE_CHANNELS,
  getReleaseUrl,
  getUpdateProviderConfig,
  resolveReleaseChannel,
};
