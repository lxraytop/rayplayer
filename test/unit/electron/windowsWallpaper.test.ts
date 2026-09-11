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
  buildSinkToDesktopPowerShellCommand: (
    hwndDecimal: string | number,
    viewport?: { width?: number; height?: number },
  ) => string | null;
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

  it('repaints the window over the host client area after reparenting', () => {
    const script = buildSinkToDesktopPowerShellCommand('42', { width: 1920, height: 1080 }) ?? '';
    expect(script).toContain('SetWindowPos');
    // 0x0070 = SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW
    expect(script).toContain('$insertAfter, 0, 0, $layerWidth, $layerHeight, 0x0070');
  });

  it('sizes the layer from the host client area, not from the display', () => {
    const script = buildSinkToDesktopPowerShellCommand('42', { width: 1920, height: 1080 }) ?? '';
    // The display size and the host client area disagree under DPI scaling, and only the client area
    // matches what the layer is clipped to.
    expect(script).toContain('HostWidth($wallpaperHost)');
    expect(script).toContain('HostHeight($wallpaperHost)');
    // The display size survives only as the degenerate-host fallback.
    expect(script).toContain('if ($layerWidth -le 0) { $layerWidth = 1920 }');
    expect(script).toContain('if ($layerHeight -le 0) { $layerHeight = 1080 }');
  });

  it('promotes the window to a real child before repositioning it', () => {
    const script = buildSinkToDesktopPowerShellCommand('42', { width: 800, height: 600 }) ?? '';
    expect(script).toContain('MakeChildWindow');
    expect(script).toContain('SetWindowLong');
    // 0x40000000 = WS_CHILD; without it SetParent only records an owner and nothing is reparented.
    expect(script).toContain('| 0x40000000');
    // The style change must land before the reposition, otherwise the frame change is applied twice.
    // Compare the call sites, not the first mention: both names also appear in the C# declaration.
    expect(script.lastIndexOf('::MakeChildWindow(')).toBeLessThan(script.lastIndexOf('::SetWindowPos('));
  });

  it('falls back to a sane size when the caller does not report the screen', () => {
    const script = buildSinkToDesktopPowerShellCommand('42') ?? '';
    expect(script).toContain('if ($layerWidth -le 0) { $layerWidth = 1 }');
    expect(script).toContain('if ($layerHeight -le 0) { $layerHeight = 1 }');
  });

  it('places the layer at the bottom only when the host is Progman itself', () => {
    const script = buildSinkToDesktopPowerShellCommand('42', { width: 800, height: 600 }) ?? '';
    // Inside a wallpaper WorkerW the layer goes on top; under Progman it must drop below the icon view,
    // otherwise the wallpaper paints over the desktop icons.
    expect(script).toContain("ClassNameOf($wallpaperHost) -eq 'Progman'");
    expect(script).toContain('$insertAfter = [IntPtr]([int64]1)');
  });

  it('also searches Progman children for the wallpaper WorkerW', () => {
    const script = buildSinkToDesktopPowerShellCommand('42') ?? '';
    // Windows 11 keeps the wallpaper WorkerW nested under Progman rather than at the top level, so a
    // top-level-only search falls back to Progman and ends up behind the desktop WorkerW it looks for.
    expect(script).toContain('FindWindowEx(progman, IntPtr.Zero, "SHELLDLL_DefView", null)');
    expect(script).toContain('FindWindowEx(progman, IntPtr.Zero, "WorkerW", null)');
  });

  it('reports the host and the resulting window state on stderr for diagnosis', () => {
    const script = buildSinkToDesktopPowerShellCommand('42', { width: 800, height: 600 }) ?? '';
    expect(script).toContain('Describe');
    expect(script).toContain("[Console]::Error.WriteLine('host: '");
    expect(script).toContain("[Console]::Error.WriteLine('after: '");
  });

  it('keeps every comment outside the C# block valid for PowerShell', () => {
    const script = buildSinkToDesktopPowerShellCommand('42', { width: 800, height: 600 }) ?? '';
    // The shim's own C# comments are indented inside the here-string; a column-0 `//` line would be a
    // PowerShell syntax error and abort the script before it ever touches the window.
    expect(script).not.toMatch(/^\/\//m);
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
