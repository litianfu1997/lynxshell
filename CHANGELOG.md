# Changelog

All notable changes to this project will be documented in this file.

## [v0.3.5] - 2026-02-25

### ✨ Terminal History Enhancements
- **Manual Toggle**: Added a setting to enable/disable terminal history autocomplete suggestions.
- **Local Caching**: Command history is now cached locally per host, providing **instant suggestions** even on high-latency connections.
- **TUI Compatibility**: Smart detection (alternate buffer) to hide autocomplete popups when using TUI tools like `vim`, `nano`, or `top`.
- **UI Polish**: Refined the autocomplete popup style with better spacing, alignment, and typography.

## [v0.3.4] - 2026-02-25

### ✨ Features

- **Shell History Autocomplete**: The terminal now shows real-time command suggestions powered by the server's actual shell history (`~/.bash_history` / `~/.zsh_history` / fish history).
  - Suggestions appear as an **in-terminal floating popup** directly at the cursor position, without any separate input bar.
  - **Ghost text** previews the top suggestion inline.
  - History is fetched via a dedicated SFTP connection immediately after SSH login.
  - Supports **bash**, **zsh**, and **fish** history files.
  - `Tab` / `→` to accept · `↑ / ↓` to navigate · `Esc` to dismiss.
- **Improved CI/CD**: Added **Linux (x64)** build support to GitHub Actions. Now providing `.AppImage` and `.deb` packages in releases.

## [v0.3.2] - 2026-02-25

### 🔧 CI Fixes
- Fixed macOS Intel build by switching to `macos-latest` runner with cross-compilation.

## [v0.3.1] - 2026-02-25

### 🚀 Major Architectural Shift (Electron -> Tauri v2)
> [!IMPORTANT]
> This is a major update featuring a complete rewrite of the core engine. If you require absolute stability, please stick with the **v0.2.x** versions (Electron-based).
>
> 这是一个重大的架构更新，核心引擎已完全重构。如果您需要绝对的稳定性，请继续使用 **v0.2.x** 版本（基于 Electron）。

- **Core Migration**: Successfully migrated the entire backend from Node.js (Electron) to **Rust (Tauri v2)**.
- **Enhanced Performance**: 
  - Significant reduction in memory footprint and installation size.
  - Native SSH implementation using the `russh` crate for lower latency and better multi-threading.
- **SFTP Overhaul**:
  - Rewritten SFTP engine using asynchronous Rust I/O for faster file transfers.
  - Refined Transfer Queue with robust Pause, Resume, and Cancel support, fixing several race condition crashes found in previous versions.
- **Build System**: Updated GitHub Actions to automatically build and release optimized binaries for Windows (x64) and macOS (Intel & Silicon).

### 🐛 Bug Fixes
- Fixed SFTP transfer crashes related to concurrent file operations.
- Resolved memory leak issues during long SSH sessions.

## [v0.2.4] - 2026-02-24

### 🌐 Internationalization (i18n)
- **Comprehensive SFTP Locale Coverage**: Completely removed all hardcoded Chinese strings inside the SFTP interfaces.
  - Translated the SFTP Toolbar (actions, bookmarks, preview).
  - Translated the SFTP Transfer Queue (status, actions, progress indicators).
  - Translated the SFTP File List (table headers, empty states, and contextual right-click menus).
  - Translated the SFTP Directory Tree (loading states) and File Preview components.
- Now the entire SFTP workspace seamlessly switches between "English" and "中文 (简体)" based on user preference.


## [v0.2.3] - 2026-02-24

### 🚀 Features

- **SFTP Bookmarks System**: Instantly pin directories with custom aliases, complete with an inline search function to easily navigate your saved paths.
- **Terminal to SFTP Navigation**: Open the current working directory of your terminal directly into a new SFTP tab with a single right-click on the tab header.
- **Improved Settings / Safety**: Disabled `deleteAppDataOnUninstall` for Windows installers. Now, uninstalling or auto-updating the app will no longer wipe out your saved hosts, keys, and preferences.

### 🐛 Bug Fixes & Refactors
- **UI Adjustments**: Resolved scrollbar overlaps within the terminal pane making it easier to drag.
- **Toolbar Dropdown Fixes**: Fixed CSS clipping issues in the SFTP toolbar that caused the bookmark dropdown to be hidden.
- **Documentation**: Restructured README for better visibility of full-width screenshots.
