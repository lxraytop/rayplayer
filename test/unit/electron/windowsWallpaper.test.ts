import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

// test/unit/electron/windowsWallpaper.test.ts
// Locks down the Windows wallpaper helpers: the platform gate must reject every non-Windows platform
// (so the feature stays off there), the native handle must be read as a full 64-bit value, the
// generated PowerShell must target the desktop icon host (WorkerW / SHELLDLL_DefView) with a Progman
// fallback, and the script must survive `-EncodedCommand` round-tripping byte-for-byte.

const require = createRequire(import.meta.url);
const {
  isWindowsWallpaperSupported,
  readHwndFromHandleBuffer,
  buildSinkToDesktopPowerShellCommand,
  encodePowerShellCommand,
} = require('../../../electron/windowsWallpaper.cjs') as {
  isWindowsWallpaperSupported: (platform: string) => boolean;
  readHwndFromHandleBuffer: (handle: Buffer | null | undefined) => string | null;
  buildSinkToDesktopPowerShellCommand: (hwndDecimal: string | number) => string | null;
  encodePowerShellCommand: (script: string | null | undefined) => string | null;
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

  it('falls back to Progman for shells that keep the icons out of a WorkerW sibling', () => {
    const script = buildSinkToDesktopPowerShellCommand('42') ?? '';
    expect(script).toContain('FindWindow("Progman", null)');
    expect(script).toContain('return progman;');
  });

  it('does not shadow the reserved $host automatic variable', () => {
    const script = buildSinkToDesktopPowerShellCommand('42') ?? '';
    expect(script).toContain('$wallpaperHost');
    expect(script).not.toContain('$host=');
  });

  it('reports failures on stderr with a distinct exit code', () => {
    const script = buildSinkToDesktopPowerShellCommand('42') ?? '';
    expect(script).toContain('exit 2');
    expect(script).toContain('exit 3');
    expect(script).toContain('[Console]::Error.WriteLine');
  });

  it('returns null when no usable handle is provided', () => {
    expect(buildSinkToDesktopPowerShellCommand('')).toBeNull();
    expect(buildSinkToDesktopPowerShellCommand('abc')).toBeNull();
  });
});

describe('encodePowerShellCommand', () => {
  it('round-trips the script through base64 / UTF-16LE', () => {
    const script = buildSinkToDesktopPowerShellCommand('9876543210') ?? '';
    const encoded = encodePowerShellCommand(script);
    expect(encoded).toBeTruthy();
    expect(Buffer.from(encoded as string, 'base64').toString('utf16le')).toBe(script);
  });

  it('keeps the payload free of characters a shell would re-interpret', () => {
    const encoded = encodePowerShellCommand(buildSinkToDesktopPowerShellCommand('7')) ?? '';
    expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('rejects empty input', () => {
    expect(encodePowerShellCommand('')).toBeNull();
    expect(encodePowerShellCommand(null)).toBeNull();
    expect(encodePowerShellCommand(undefined)).toBeNull();
  });
});
