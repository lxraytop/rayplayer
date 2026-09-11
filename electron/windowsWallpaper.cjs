// electron/windowsWallpaper.cjs
// Windows-only helpers for the desktop lyrics wallpaper.
//
// The lyric animation itself is rendered by the existing OBS browser source pipeline, so this module
// only owns the Windows-specific pieces that have no Linux/macOS equivalent:
//   - the platform gate (Windows is the only platform that may use this path),
//   - reading the native window handle Electron returns,
//   - building the PowerShell that reparents the wallpaper window behind the desktop icons,
//   - encoding that script for `-EncodedCommand` so no shell quoting can corrupt it.
//
// Everything here is a pure function so it can be unit-tested without launching Electron.

const WINDOWS_PLATFORM = 'win32';

// Wallpaper mode exists for Windows and Linux only. Any other platform (macOS/Web) must treat the
// feature as unsupported so the renderer keeps the toggle disabled instead of failing at runtime.
function isWindowsWallpaperSupported(platform) {
  return platform === WINDOWS_PLATFORM;
}

// Electron returns the native window handle as a Buffer. On 64-bit Windows that value is a pointer,
// so it has to be read as an unsigned 64-bit little-endian integer: narrowing it to 32 bits produces
// a different HWND and the reparent silently targets the wrong window.
function readHwndFromHandleBuffer(handle) {
  if (!handle || typeof handle.length !== 'number' || handle.length < 4) {
    return null;
  }
  if (handle.length >= 8) {
    return handle.readBigUInt64LE(0).toString();
  }
  return String(handle.readUInt32LE(0));
}

// Wallpaper Engine-style desktop layering: the Shell hosts the icons inside SHELLDLL_DefView, and the
// WorkerW sibling of that view is the surface that sits *behind* the icons. Reparenting our window to
// that WorkerW makes it a real desktop background instead of a normal always-on-bottom window.
//
// Windows 11 (24H2 and later) keeps SHELLDLL_DefView directly under Progman with no WorkerW sibling,
// so Progman is used as the fallback host: the icons still live in the child view drawn on top, which
// keeps the wallpaper behind them.
//
// Add-Type compiles a tiny P/Invoke shim; the caller runs this best-effort and degrades gracefully.
// The local variable is named $wallpaperHost rather than $host because $host is a PowerShell
// automatic variable and shadowing it is both fragile and misleading.
function buildSinkToDesktopPowerShellCommand(hwndDecimal) {
  const target = String(hwndDecimal ?? '').replace(/[^0-9]/g, '');
  if (!target) {
    return null;
  }

  return [
    "$ErrorActionPreference='Stop'",
    '$src=@\'',
    'using System;',
    'using System.Runtime.InteropServices;',
    'public static class RayWallpaperNative {',
    '  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string win);',
    '  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string cls, string win);',
    '  [DllImport("user32.dll")] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam, uint flags, uint timeout, out IntPtr result);',
    '  [DllImport("user32.dll", SetLastError=true)] public static extern bool SetParent(IntPtr child, IntPtr parent);',
    '  public static IntPtr FindWallpaperHost() {',
    '    IntPtr progman = FindWindow("Progman", null);',
    '    IntPtr unused;',
    '    if (progman != IntPtr.Zero) { SendMessageTimeout(progman, 0x052C, IntPtr.Zero, IntPtr.Zero, 0, 1000, out unused); }',
    '    IntPtr worker = IntPtr.Zero;',
    '    while (true) {',
    '      worker = FindWindowEx(IntPtr.Zero, worker, "WorkerW", null);',
    '      if (worker == IntPtr.Zero) { break; }',
    '      if (FindWindowEx(worker, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero) {',
    '        IntPtr sibling = FindWindowEx(IntPtr.Zero, worker, "WorkerW", null);',
    '        if (sibling != IntPtr.Zero) { return sibling; }',
    '      }',
    '    }',
    '    return progman;',
    '  }',
    '}',
    "'@",
    'Add-Type -TypeDefinition $src',
    `$targetHwnd=[IntPtr]([int64]${target})`,
    '$wallpaperHost=[RayWallpaperNative]::FindWallpaperHost()',
    "if ($wallpaperHost -eq [IntPtr]::Zero) { [Console]::Error.WriteLine('ray-wallpaper: desktop host window not found'); exit 2 }",
    "if (-not [RayWallpaperNative]::SetParent($targetHwnd, $wallpaperHost)) { [Console]::Error.WriteLine('ray-wallpaper: SetParent failed'); exit 3 }",
    'exit 0',
  ].join('\n');
}

// `-Command <script>` depends on how CreateProcess quoting is applied to the embedded double quotes
// and newlines, which silently corrupts multi-line scripts. `-EncodedCommand` takes base64 of the
// UTF-16LE script instead, so the script reaches PowerShell byte-for-byte with no shell parsing.
function encodePowerShellCommand(script) {
  if (typeof script !== 'string' || !script) {
    return null;
  }
  return Buffer.from(script, 'utf16le').toString('base64');
}

module.exports = {
  WINDOWS_PLATFORM,
  isWindowsWallpaperSupported,
  readHwndFromHandleBuffer,
  buildSinkToDesktopPowerShellCommand,
  encodePowerShellCommand,
};
