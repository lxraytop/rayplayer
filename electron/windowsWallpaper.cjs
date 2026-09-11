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
//
// Reparenting alone is not always enough: a window moved into a foreign parent keeps its previous
// placement and may never be recomposited there, so the script finishes with an explicit
// SetWindowPos over the host's client area. The Describe() output goes to stderr so the main-process
// log records what was actually found when the layer still fails to appear.
function buildSinkToDesktopPowerShellCommand(hwndDecimal, viewport = {}) {
  const target = String(hwndDecimal ?? '').replace(/[^0-9]/g, '');
  if (!target) {
    return null;
  }

  const width = Math.max(1, Math.round(Number(viewport.width) || 0));
  const height = Math.max(1, Math.round(Number(viewport.height) || 0));

  return [
    "$ErrorActionPreference='Stop'",
    '$src=@\'',
    'using System;',
    'using System.Text;',
    'using System.Runtime.InteropServices;',
    'public static class RayWallpaperNative {',
    '  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }',
    '  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string win);',
    '  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string cls, string win);',
    '  [DllImport("user32.dll")] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam, uint flags, uint timeout, out IntPtr result);',
    '  [DllImport("user32.dll", SetLastError=true)] public static extern bool SetParent(IntPtr child, IntPtr parent);',
    '  [DllImport("user32.dll", SetLastError=true)] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);',
    '  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);',
    '  [DllImport("user32.dll")] public static extern IntPtr GetParent(IntPtr hWnd);',
    '  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hWnd, int index);',
    '  [DllImport("user32.dll")] public static extern int SetWindowLong(IntPtr hWnd, int index, int value);',
    '  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr hWnd, StringBuilder name, int max);',
    '  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);',
    '  [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT rect);',
    '  // The host client area is the only size that is guaranteed to match the surface the layer is',
    '  // clipped to. Passing the display size instead leaves a gap whenever the two disagree (DPI',
    '  // scaling, a host that is not exactly the display rect, or a mixed-DPI multi-monitor setup).',
    '  public static int HostWidth(IntPtr hWnd) {',
    '    RECT r;',
    '    GetClientRect(hWnd, out r);',
    '    return r.Right - r.Left;',
    '  }',
    '  public static int HostHeight(IntPtr hWnd) {',
    '    RECT r;',
    '    GetClientRect(hWnd, out r);',
    '    return r.Bottom - r.Top;',
    '  }',
    '  // A top-level Electron window has no WS_CHILD bit, so SetParent would only record an owner and',
    '  // the window would keep rendering in the top-level z-order. Setting WS_CHILD is what actually',
    '  // makes the window part of the desktop host and clips it to the desktop.',
    '  public static void MakeChildWindow(IntPtr hWnd) {',
    '    int style = GetWindowLong(hWnd, -16);',
    '    SetWindowLong(hWnd, -16, (style & ~unchecked((int)0x80000000)) | 0x40000000);',
    '  }',
    '  public static IntPtr FindWallpaperHost() {',
    '    IntPtr progman = FindWindow("Progman", null);',
    '    IntPtr unused;',
    '    if (progman != IntPtr.Zero) { SendMessageTimeout(progman, 0x052C, IntPtr.Zero, IntPtr.Zero, 0, 1000, out unused); }',
    '    // Classic layout (Windows 10): the shell moves the icon view into a top-level WorkerW and',
    '    // leaves a sibling WorkerW underneath it. That sibling is the wallpaper surface.',
    '    IntPtr worker = IntPtr.Zero;',
    '    while (true) {',
    '      worker = FindWindowEx(IntPtr.Zero, worker, "WorkerW", null);',
    '      if (worker == IntPtr.Zero) { break; }',
    '      if (FindWindowEx(worker, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero) {',
    '        IntPtr sibling = FindWindowEx(IntPtr.Zero, worker, "WorkerW", null);',
    '        if (sibling != IntPtr.Zero) { return sibling; }',
    '      }',
    '    }',
    '    // Windows 11 layout: the icon view stays under Progman and the wallpaper WorkerW is a child of',
    '    // Progman placed *below* it, so it is only reachable by searching Progman children.',
    '    if (progman != IntPtr.Zero && FindWindowEx(progman, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero) {',
    '      IntPtr nested = FindWindowEx(progman, IntPtr.Zero, "WorkerW", null);',
    '      if (nested != IntPtr.Zero) { return nested; }',
    '    }',
    '    return progman;',
    '  }',
    '  public static string ClassNameOf(IntPtr hWnd) {',
    '    if (hWnd == IntPtr.Zero) { return ""; }',
    '    StringBuilder name = new StringBuilder(256);',
    '    GetClassName(hWnd, name, name.Capacity);',
    '    return name.ToString();',
    '  }',
    '  // Lists the host\'s child window classes, which is the only way to tell whether the icon view',
    '  // (SHELLDLL_DefView) really lives under the chosen host or somewhere the search did not reach.',
    '  public static string ListChildren(IntPtr parent) {',
    '    StringBuilder listing = new StringBuilder();',
    '    IntPtr child = IntPtr.Zero;',
    '    while (true) {',
    '      child = FindWindowEx(parent, child, null, null);',
    '      if (child == IntPtr.Zero) { break; }',
    '      StringBuilder name = new StringBuilder(256);',
    '      GetClassName(child, name, name.Capacity);',
    '      if (listing.Length > 0) { listing.Append(", "); }',
    '      listing.Append(name.ToString());',
    '    }',
    '    return listing.ToString();',
    '  }',
    '  public static string Describe(IntPtr hWnd) {',
    '    if (hWnd == IntPtr.Zero) { return "<null>"; }',
    '    StringBuilder sb = new StringBuilder(256);',
    '    GetClassName(hWnd, sb, sb.Capacity);',
    '    RECT r;',
    '    GetWindowRect(hWnd, out r);',
    '    int style = GetWindowLong(hWnd, -16);',
    '    int exStyle = GetWindowLong(hWnd, -20);',
    '    return "class=" + sb + " visible=" + IsWindowVisible(hWnd) + " parent=0x" + GetParent(hWnd).ToInt64().ToString("X")',
    '      + " rect=" + r.Left + "," + r.Top + "," + r.Right + "," + r.Bottom',
    '      + " style=0x" + unchecked((uint)style).ToString("X8")',
    '      + " exstyle=0x" + unchecked((uint)exStyle).ToString("X8");',
    '  }',
    '}',
    "'@",
    'Add-Type -TypeDefinition $src',
    `$targetHwnd=[IntPtr]([int64]${target})`,
    '$wallpaperHost=[RayWallpaperNative]::FindWallpaperHost()',
    "if ($wallpaperHost -eq [IntPtr]::Zero) { [Console]::Error.WriteLine('desktop host window not found'); exit 2 }",
    "[Console]::Error.WriteLine('host: ' + [RayWallpaperNative]::Describe($wallpaperHost))",
    "[Console]::Error.WriteLine('host children: ' + [RayWallpaperNative]::ListChildren($wallpaperHost))",
    "[Console]::Error.WriteLine('before: ' + [RayWallpaperNative]::Describe($targetHwnd))",
    "if (-not [RayWallpaperNative]::SetParent($targetHwnd, $wallpaperHost)) { [Console]::Error.WriteLine('SetParent failed'); exit 3 }",
    '[RayWallpaperNative]::MakeChildWindow($targetHwnd)',
    '# Inside a wallpaper WorkerW the layer belongs above that WorkerW\'s own background, so it goes on',
    '# top; only when the search fell back to Progman itself must it go to the bottom of the sibling',
    '# order, otherwise it would paint over the desktop icon view.',
    '$insertAfter = [IntPtr]::Zero',
    "if ([RayWallpaperNative]::ClassNameOf($wallpaperHost) -eq 'Progman') { $insertAfter = [IntPtr]([int64]1) }",
    '# Fill the host client area exactly, falling back to the reported screen size only if the host',
    '# reports a degenerate rect, so the layer never ends up smaller than the surface it is drawn on.',
    '$layerWidth = [RayWallpaperNative]::HostWidth($wallpaperHost)',
    '$layerHeight = [RayWallpaperNative]::HostHeight($wallpaperHost)',
    `if ($layerWidth -le 0) { $layerWidth = ${width} }`,
    `if ($layerHeight -le 0) { $layerHeight = ${height} }`,
    "[Console]::Error.WriteLine('layer size: ' + $layerWidth + 'x' + $layerHeight)",
    `if (-not [RayWallpaperNative]::SetWindowPos($targetHwnd, $insertAfter, 0, 0, $layerWidth, $layerHeight, 0x0070)) { [Console]::Error.WriteLine('SetWindowPos failed'); exit 4 }`,
    "[Console]::Error.WriteLine('after: ' + [RayWallpaperNative]::Describe($targetHwnd))",
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
