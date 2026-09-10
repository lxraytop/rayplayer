import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

// test/unit/electron/windowsWallpaper.test.ts
// Locks down the Windows wallpaper helpers: the platform gate must reject every non-Windows platform
// (so the feature stays off there), the native handle must be read as a full 64-bit value, and the
// generated PowerShell must actually target the desktop icon host (WorkerW / SHELLDLL_DefView).

const require = createRequire(import.meta.url);
const {
  isWindowsWallpaperSupported,
  readHwndFromHandleBuffer,
  buildSinkToDesktopPowerShellCommand,
} = require('../../../electron/windowsWallpaper.cjs') as {
  isWindowsWallpaperSupported: (platform: string) => boolean;
  readHwndFromHandleBuffer: (handle: Buffer | null | undefined) => string | null;
  buildSinkToDesktopPowerShellCommand: (hwndDecimal: string | number) => string | null;
};

describe('isWindowsWallpaperSupported', () => {
  it('only accepts win32', () => {
    expect(isWindowsWallpaperSupported('win32')).toBe(true);
    expect(isWindowsWallpaperSupported('linux')).toBe(false);
    expect(isWindowsWallpaperSupported('darwin')).toBe(false);
    expect(isWindowsWallpaperSupported('')).toBe(false);
  });
});

describe('readHwndFromHandleBuffer', () => {
  it('reads a 64-bit handle without truncating it', () => {
    const handle = Buffer.alloc(8);
    handle.writeBigUInt64LE(123456789012n, 0);
    expect(readHwndFromHandleBuffer(handle)).toBe('123456789012');
  });

  it('reads a 32-bit handle on 32-bit builds', () => {
    const handle = Buffer.alloc(4);
    handle.writeUInt32LE(4294967295, 0);
    expect(readHwndFromHandleBuffer(handle)).toBe('4294967295');
  });

  it('rejects missing or undersized handles', () => {
    expect(readHwndFromHandleBuffer(null)).toBeNull();
    expect(readHwndFromHandleBuffer(undefined)).toBeNull();
    expect(readHwndFromHandleBuffer(Buffer.alloc(2))).toBeNull();
  });
});

describe('buildSinkToDesktopPowerShellCommand', () => {
  it('targets the desktop icon host and casts the handle to int64', () => {
    const script = buildSinkToDesktopPowerShellCommand('9876543210');
    expect(script).toBeTruthy();
    expect(script).toContain('WorkerW');
    expect(script).toContain('SHELLDLL_DefView');
    expect(script).toContain('SetParent');
    expect(script).toContain('[int64]9876543210');
  });

  it('returns null when no usable handle is provided', () => {
    expect(buildSinkToDesktopPowerShellCommand('')).toBeNull();
    expect(buildSinkToDesktopPowerShellCommand('abc')).toBeNull();
  });
});
