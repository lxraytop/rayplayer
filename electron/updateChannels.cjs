// electron/updateChannels.cjs
// Resolves the user-facing release lane to the electron-updater channel stored in packaged metadata.

const RELEASE_CHANNELS = {
  stable: {
    id: 'stable',
    label: 'Stable',
    updaterChannel: 'latest',
    allowPrerelease: false,
    updateEnabled: true,
  },
};

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

function normalizeVersion(value) {
  return typeof value === 'string' ? value.trim().replace(/^v/i, '') : '';
}

function compareVersions(a, b) {
  const partsA = normalizeVersion(a).split('.').map(Number);
  const partsB = normalizeVersion(b).split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

module.exports = {
  RELEASE_CHANNELS,
  getReleaseUrl,
  getUpdateProviderConfig,
  resolveReleaseChannel,
  normalizeVersion,
  compareVersions,
};
