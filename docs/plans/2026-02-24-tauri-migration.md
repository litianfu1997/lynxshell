# OpenSSH 全平台统一迁移方案：Electron → Tauri 2.0

**日期：** 2026-02-24  
**版本：** v1.0  
**目标：** 将现有的 Electron + Vue3 桌面端 SSH 客户端迁移至 Tauri 2.0，实现 Windows / macOS / Linux / Android / iOS 五端统一

---

## 目录

- [1. 为什么选择 Tauri 2.0](#1-为什么选择-tauri-20)
- [2. 现有项目深度分析](#2-现有项目深度分析)
- [3. 目标架构设计](#3-目标架构设计)
- [4. Tauri 通信机制详解](#4-tauri-通信机制详解)
- [5. 各模块迁移详细方案](#5-各模块迁移详细方案)
- [6. 前端 Vue3 组件迁移与适配](#6-前端-vue3-组件迁移与适配)
- [7. 新项目目录结构](#7-新项目目录结构)
- [8. 开发环境搭建指南](#8-开发环境搭建指南)
- [9. 分阶段实施计划](#9-分阶段实施计划)
- [10. 技术风险与应对](#10-技术风险与应对)
- [11. 日常开发命令速查](#11-日常开发命令速查)

---

## 1. 为什么选择 Tauri 2.0

### 1.1 Tauri vs Electron vs Capacitor 对比

| 维度 | Electron (当前) | Capacitor | Tauri 2.0 |
|------|----------------|-----------|-----------|
| 后端语言 | Node.js | 无原生后端 | **Rust** |
| SSH 实现 | ssh2 (Node.js) | 需 Java+Swift 两套 | **russh (Rust) 一套代码全平台** |
| 桌面端 | ✅ | ❌ | ✅ |
| Android | ❌ | ✅ | ✅ |
| iOS | ❌ | ✅ | ✅ |
| 打包体积 | ~100-150MB | ~15-30MB | **~3-8MB** |
| 内存占用 | 高（Chromium 内核） | 中 | **低（系统 WebView）** |
| 前端框架 | Vue3 ✅ | Vue3 ✅ | Vue3 ✅ |
| 前端代码复用率 | - | ~70% | **~85%** |

### 1.2 核心优势

1. **SSH 只写一次**：Rust 的 `russh` 库编译后可以在 5 个平台上运行，不需要像 Capacitor 那样分别用 Java 和 Swift 各写一套
2. **顺便替掉 Electron**：迁移后桌面端也不再依赖 Chromium，包体积大幅缩小
3. **Tauri 2.0 已正式稳定**：2024年10月正式发布，移动端支持已是 stable 状态
4. **IPC 模式几乎一样**：Electron 的 `ipcRenderer.invoke()` → Tauri 的 `invoke()`，迁移成本很低

---

## 2. 现有项目深度分析

### 2.1 架构及文件清单

```
d:\IdeaProjects\openssh\
├── src/
│   ├── main/                          # Electron 主进程 (Node.js)
│   │   ├── index.js        (378行)    # IPC 处理器 + 窗口管理
│   │   ├── ssh-manager.js  (618行)    # SSH/SFTP 全部逻辑
│   │   ├── db.js           (112行)    # 主机数据持久化 (electron-store)
│   │   ├── crypto.js       (141行)    # AES-256-GCM 加密
│   │   └── config.js       ( 30行)    # 应用配置
│   ├── preload/
│   │   └── index.js        ( 76行)    # API 桥接层 (暴露给前端)
│   └── renderer/                      # Vue3 前端
│       ├── index.html
│       └── src/
│           ├── App.vue                # 主应用 (6807字节)
│           ├── main.js                # Vue 入口
│           ├── i18n.js                # 国际化配置
│           ├── locales/               # 中英文翻译
│           ├── styles/                # 全局样式
│           └── components/            # 18 个业务组件
│               ├── TerminalPane.vue   # xterm.js 终端 (14227字节)
│               ├── SftpPane.vue       # SFTP 主面板 (16739字节)
│               ├── SftpFileList.vue   # 文件列表 (10773字节)
│               ├── SftpToolbar.vue    # SFTP 工具栏 (11175字节)
│               ├── HostDialog.vue     # 主机编辑弹窗 (13365字节)
│               ├── SettingsDialog.vue # 设置对话框 (13432字节)
│               ├── Sidebar.vue        # 侧边栏 (11989字节)
│               ├── TabBar.vue         # 标签栏 (9836字节)
│               ├── TitleBar.vue       # 标题栏 (6353字节)
│               ├── MonacoEditor.vue   # 代码编辑器 (4339字节)
│               ├── SftpEditor.vue     # SFTP 编辑 (6945字节)
│               ├── SftpPreview.vue    # 文件预览 (6956字节)
│               ├── SftpBreadcrumb.vue # 面包屑导航 (3812字节)
│               ├── SftpTree.vue       # 目录树 (1892字节)
│               ├── SftpTreeNode.vue   # 树节点 (3813字节)
│               ├── TransferQueue.vue  # 传输队列 (4896字节)
│               ├── FileIcon.vue       # 文件图标 (4790字节)
│               └── WelcomeScreen.vue  # 欢迎页 (3033字节)
```

### 2.2 前端调用的全部 IPC 接口（33个）

从 `preload/index.js` 提取的完整调用列表，以下是每个接口在 Tauri 中的对应方式：

#### 窗口控制（5个）

| Electron IPC | 类型 | Tauri 替代方案 | 备注 |
|---|---|---|---|
| `window:minimize` | send | Tauri 内置窗口 API | 桌面端可用，移动端不需要 |
| `window:maximize` | send | Tauri 内置窗口 API | 同上 |
| `window:close` | send | Tauri 内置窗口 API | 同上 |
| `window:is-maximized` | invoke | Tauri 内置窗口 API | 同上 |
| `window:maximized` | 事件 | Tauri 窗口事件 | 同上 |

#### 主机管理（4个）

| Electron IPC | 类型 | Tauri 替代方案 |
|---|---|---|
| `hosts:get-all` | invoke | `#[tauri::command] fn get_hosts()` + `tauri-plugin-store` |
| `hosts:save` | invoke | `#[tauri::command] fn save_host()` |
| `hosts:delete` | invoke | `#[tauri::command] fn delete_host()` |
| `hosts:get` | invoke | `#[tauri::command] fn get_host()` |

#### SSH 操作（7个）

| Electron IPC | 类型 | Tauri 替代方案 |
|---|---|---|
| `ssh:connect` | invoke | `#[tauri::command] async fn ssh_connect()` 内部调用 russh |
| `ssh:input` | send | `#[tauri::command] fn ssh_input()` |
| `ssh:resize` | send | `#[tauri::command] fn ssh_resize()` |
| `ssh:disconnect` | invoke | `#[tauri::command] fn ssh_disconnect()` |
| `ssh:test` | invoke | `#[tauri::command] async fn ssh_test()` |
| `ssh:data` | 事件(后端→前端) | `app_handle.emit("ssh:data", payload)` |
| `ssh:closed` | 事件(后端→前端) | `app_handle.emit("ssh:closed", payload)` |

#### SFTP 操作（18个）

| Electron IPC | 类型 | Tauri 替代方案 |
|---|---|---|
| `sftp:realpath` | invoke | `#[tauri::command] async fn sftp_realpath()` |
| `sftp:ls` | invoke | `#[tauri::command] async fn sftp_list()` |
| `sftp:upload` | invoke | `#[tauri::command] async fn sftp_upload()` |
| `sftp:download` | invoke | `#[tauri::command] async fn sftp_download()` |
| `sftp:pause` | invoke | `#[tauri::command] fn sftp_pause()` |
| `sftp:resume` | invoke | `#[tauri::command] fn sftp_resume()` |
| `sftp:cancel` | invoke | `#[tauri::command] fn sftp_cancel()` |
| `sftp:delete` | invoke | `#[tauri::command] async fn sftp_delete()` |
| `sftp:rename` | invoke | `#[tauri::command] async fn sftp_rename()` |
| `sftp:mkdir` | invoke | `#[tauri::command] async fn sftp_mkdir()` |
| `sftp:move` | invoke | `#[tauri::command] async fn sftp_move()` |
| `sftp:getFile` | invoke | `#[tauri::command] async fn sftp_get_file()` |
| `sftp:putFile` | invoke | `#[tauri::command] async fn sftp_put_file()` |
| `sftp:stat` | invoke | `#[tauri::command] async fn sftp_stat()` |
| `sftp:tree` | invoke | `#[tauri::command] async fn sftp_tree()` |
| `sftp:upload-progress` | 事件 | `app_handle.emit("sftp:upload-progress", data)` |
| `sftp:download-progress` | 事件 | `app_handle.emit("sftp:download-progress", data)` |
| `sftp:editInVscode` | invoke | `#[tauri::command] async fn sftp_edit_external()` |

#### 对话框 & 更新（4个）

| Electron IPC | 类型 | Tauri 替代方案 |
|---|---|---|
| `dialog:open` | invoke | `tauri-plugin-dialog` (官方插件) |
| `dialog:save` | invoke | `tauri-plugin-dialog` (官方插件) |
| `updater:*` | 多个 | `tauri-plugin-updater` (桌面端) / 应用商店 (移动端) |
| `app:version` | invoke | `tauri::AppHandle::package_info().version` |

---

## 3. 目标架构设计

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Tauri 2.0 应用架构                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    前端层 (WebView)                             │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │                Vue3 + Vite (复用现有代码)                  │  │  │
│  │  │  App.vue │ 18 个组件 │ xterm.js │ Monaco │ i18n │ CSS    │  │  │
│  │  └──────────────────────────┬───────────────────────────────┘  │  │
│  │                             │                                  │  │
│  │  ┌──────────────────────────▼───────────────────────────────┐  │  │
│  │  │              Tauri API 桥接层 (替代 preload)               │  │  │
│  │  │                                                          │  │  │
│  │  │  import { invoke } from '@tauri-apps/api/core'           │  │  │
│  │  │  import { listen } from '@tauri-apps/api/event'          │  │  │
│  │  │                                                          │  │  │
│  │  │  // 所有 window.electronAPI.xxx 替换为:                    │  │  │
│  │  │  await invoke('ssh_connect', { sessionId, hostId })      │  │  │
│  │  │  await listen('ssh:data', callback)                      │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                             │ IPC (JSON序列化)                       │
│  ┌──────────────────────────▼─────────────────────────────────────┐  │
│  │                    后端层 (Rust)                                │  │
│  │                                                                │  │
│  │  src-tauri/src/                                                │  │
│  │  ├── main.rs           # 应用入口 + command 注册               │  │
│  │  ├── ssh_manager.rs    # SSH/SFTP 核心 (russh)                 │  │
│  │  ├── db.rs             # 主机数据管理 (tauri-plugin-store)      │  │
│  │  ├── crypto.rs         # 加密模块 (aes-gcm crate)              │  │
│  │  └── commands/         # Tauri command 处理器                   │  │
│  │      ├── ssh.rs        # SSH 相关命令                          │  │
│  │      ├── sftp.rs       # SFTP 相关命令                         │  │
│  │      └── hosts.rs      # 主机管理命令                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  运行平台: Windows │ macOS │ Linux │ Android │ iOS                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Tauri 通信机制详解

### 4.1 Electron IPC vs Tauri IPC 对照

理解这个对照关系后，前端迁移将非常直观。

#### 前端 → 后端调用（请求/响应）

```javascript
// ========== Electron 写法 (当前) ==========
// preload/index.js 暴露
const result = await window.electronAPI.ssh.connect(sessionId, hostId)

// ========== Tauri 写法 (迁移后) ==========
import { invoke } from '@tauri-apps/api/core'
const result = await invoke('ssh_connect', { sessionId, hostId })
```

```rust
// ========== Tauri Rust 端 ==========
#[tauri::command]
async fn ssh_connect(session_id: String, host_id: String) -> Result<SshConnectResult, String> {
    // 用 russh 建立连接...
    Ok(SshConnectResult { success: true })
}
```

#### 后端 → 前端推送（事件流，如终端输出）

```rust
// ========== Tauri Rust 端：推送数据 ==========
app_handle.emit("ssh:data", SshDataPayload {
    session_id: session_id.clone(),
    data: output_string,
}).unwrap();
```

```javascript
// ========== Tauri 前端：监听数据 ==========
import { listen } from '@tauri-apps/api/event'

// 替代 Electron 的: window.electronAPI.ssh.onData(callback)
const unlisten = await listen('ssh:data', (event) => {
    const { sessionId, data } = event.payload
    terminal.write(data)
})
```

#### 前端 → 后端单向通知（无需等待响应）

```javascript
// ========== Electron 写法 (send, 无返回值) ==========
window.electronAPI.ssh.input(sessionId, data)

// ========== Tauri 写法 (仍然用 invoke，但不 await 或忽略返回) ==========
invoke('ssh_input', { sessionId, data })
```

### 4.2 关键差异

| 项目 | Electron | Tauri |
|------|----------|-------|
| 调用方式 | `ipcRenderer.invoke(channel, args)` | `invoke(command, args)` |
| 事件监听 | `ipcRenderer.on(channel, callback)` | `listen(event, callback)` |
| 参数格式 | 任意（由 preload 定义） | **必须用对象**（`{ key: value }`） |
| 参数命名 | JS 驼峰 → JS 驼峰 | JS 驼峰 → Rust 蛇形（自动转换） |
| 后端函数注册 | `ipcMain.handle(channel, handler)` | `#[tauri::command]` 宏 + `generate_handler!` |
| 序列化 | Electron 结构化克隆 | JSON (serde) |

---

## 5. 各模块迁移详细方案

### 5.1 SSH 连接管理（ssh-manager.js → ssh_manager.rs）

这是最核心的迁移工作。将 618 行 Node.js (ssh2) 代码迁移为 Rust (russh) 代码。

#### Rust 依赖 (Cargo.toml)

```toml
[dependencies]
russh = "0.46"           # 纯 Rust SSH 客户端（异步），支持 Shell + SFTP
russh-keys = "0.46"      # SSH 密钥解析
russh-sftp = "2.0"       # SFTP 协议实现（基于 russh）
tokio = { version = "1", features = ["full"] }  # 异步运行时
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = [] }
tauri-plugin-store = "2"  # 持久化KV存储
aes-gcm = "0.10"          # AES-256-GCM 加密
uuid = { version = "1", features = ["v4"] }
```

#### 功能映射表

| Node.js ssh-manager.js 函数 | Rust ssh_manager.rs 函数 | russh API |
|---|---|---|
| `buildConnectConfig()` | `build_connect_config()` | `russh::client::Config` |
| `createSSHConnection()` | `create_ssh_connection()` | `russh::client::connect()` → `channel_open_session()` → `request_pty()` → `request_shell()` |
| `closeSSHConnection()` | `close_ssh_connection()` | `channel.close()` + `session.disconnect()` |
| `resizeSSHTerminal()` | `resize_ssh_terminal()` | `channel.window_change()` |
| `testSSHConnection()` | `test_ssh_connection()` | `connect()` → 验证成功 → `disconnect()` |
| `getSFTP()` | `get_sftp()` | `russh_sftp::client::SftpSession::new()` |
| `listRemoteDirectory()` | `list_remote_directory()` | `sftp.read_dir()` |
| `uploadFile()` | `upload_file()` | `sftp.create()` + tokio 异步写入 |
| `downloadFile()` | `download_file()` | `sftp.open()` + tokio 异步读取 |
| `deletePath()` | `delete_path()` | `sftp.remove_file()` |
| `deleteDirectoryRecursive()` | `delete_directory_recursive()` | 递归调用 `sftp.read_dir()` + `remove_file/dir` |
| `renamePath()` | `rename_path()` | `sftp.rename()` |
| `mkdir()` | `mkdir()` | `sftp.create_dir()` |
| `readFile()` | `read_file()` | `sftp.open()` + `read_to_end()` |
| `writeFile()` | `write_file()` | `sftp.create()` + `write_all()` |
| `getStats()` | `get_stats()` | `sftp.metadata()` |
| `getDirectoryTree()` | `get_directory_tree()` | 递归 `sftp.read_dir()` |

#### Rust 核心结构体示例

```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use russh::*;
use russh_keys::*;

// 全局连接池（类比 Node.js 的 Map）
pub struct SshConnectionPool {
    connections: Arc<Mutex<HashMap<String, SshSession>>>,
}

pub struct SshSession {
    handle: client::Handle<SshHandler>,
    channel: Channel<Msg>,
    sftp: Option<russh_sftp::client::SftpSession>,
}

// SSH 事件处理器（接收远程数据）
pub struct SshHandler {
    app_handle: tauri::AppHandle,
    session_id: String,
}

#[async_trait::async_trait]
impl client::Handler for SshHandler {
    type Error = russh::Error;

    async fn data(
        &mut self,
        channel: ChannelId,
        data: &[u8],
        session: &mut client::Session,
    ) -> Result<(), Self::Error> {
        let text = String::from_utf8_lossy(data).to_string();
        // 将终端输出推送给前端
        self.app_handle.emit("ssh:data", serde_json::json!({
            "sessionId": self.session_id,
            "data": text
        })).ok();
        Ok(())
    }
}
```

#### Tauri Command 注册示例

```rust
// src-tauri/src/commands/ssh.rs

#[tauri::command]
async fn ssh_connect(
    state: tauri::State<'_, SshConnectionPool>,
    app_handle: tauri::AppHandle,
    session_id: String,
    host_id: String,
) -> Result<serde_json::Value, String> {
    // 1. 从 store 读取主机配置
    // 2. 用 russh 建立连接
    // 3. 请求 PTY + Shell
    // 4. 启动数据接收循环，通过 app_handle.emit() 推送数据
    // 5. 将 session 存入 connections Map
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
fn ssh_input(
    state: tauri::State<'_, SshConnectionPool>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    // 向 channel 写入数据
    Ok(())
}

#[tauri::command]
fn ssh_resize(
    state: tauri::State<'_, SshConnectionPool>,
    session_id: String,
    cols: u32,
    rows: u32,
) -> Result<(), String> {
    // 调用 channel.window_change()
    Ok(())
}
```

### 5.2 数据持久化（db.js → db.rs + tauri-plugin-store）

| | Electron | Tauri |
|---|---|---|
| 存储方案 | `electron-store` | `tauri-plugin-store`（官方插件） |
| 底层实现 | JSON 文件 | JSON 文件 |
| 平台支持 | Win/Mac/Linux | **Win/Mac/Linux/Android/iOS** |

```rust
// src-tauri/src/db.rs
use tauri_plugin_store::StoreExt;

#[tauri::command]
async fn get_hosts(app: tauri::AppHandle) -> Result<Vec<HostConfig>, String> {
    let store = app.store("hosts.json").map_err(|e| e.to_string())?;
    let hosts: Vec<HostConfig> = store
        .get("hosts")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    // 解密敏感字段
    let decrypted: Vec<HostConfig> = hosts.iter().map(|h| decrypt_host(h)).collect();
    Ok(decrypted)
}

#[tauri::command]
async fn save_host(app: tauri::AppHandle, host: HostConfig) -> Result<String, String> {
    let store = app.store("hosts.json").map_err(|e| e.to_string())?;
    let mut hosts: Vec<HostConfig> = store
        .get("hosts")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let encrypted = encrypt_host(&host);
    // ... 新增或更新逻辑（与 db.js 一致）
    store.set("hosts", serde_json::to_value(&hosts).unwrap());
    store.save().map_err(|e| e.to_string())?;
    Ok(host.id)
}
```

### 5.3 加密模块（crypto.js → crypto.rs）

| | Electron | Tauri |
|---|---|---|
| 算法 | AES-256-GCM (Node.js crypto) | AES-256-GCM (`aes-gcm` crate) |
| 密钥派生 | scryptSync | argon2 或 scrypt (Rust crate) |

```rust
// src-tauri/src/crypto.rs
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};

pub fn encrypt(plaintext: &str, key: &[u8; 32]) -> EncryptedData {
    let cipher = Aes256Gcm::new(Key::from_slice(key));
    let nonce = Nonce::from_slice(b"unique nonce"); // 实际应使用随机 nonce
    let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes()).expect("encryption failed");
    EncryptedData { ciphertext, nonce: nonce.to_vec() }
}
```

> [!IMPORTANT]
> 加密密钥派生在 Rust 中可以使用 `scrypt` crate 来保持与原有 Node.js 实现兼容，以便迁移时能解密旧数据。或者设计一个"一次性迁移工具"来重新加密。

### 5.4 窗口管理

Tauri 内置了跨平台的窗口管理 API，无需自行实现：

```javascript
// 前端直接使用 Tauri 窗口 API（仅桌面端生效）
import { getCurrentWindow } from '@tauri-apps/api/window'

const appWindow = getCurrentWindow()
appWindow.minimize()
appWindow.toggleMaximize()
appWindow.close()

// 监听最大化状态
appWindow.onResized(() => {
    appWindow.isMaximized().then(maximized => {
        // 更新 UI 状态
    })
})
```

### 5.5 文件对话框

```javascript
// Electron 写法
const result = await window.electronAPI.dialog.showOpenDialog()

// Tauri 写法
import { open, save } from '@tauri-apps/plugin-dialog'
const files = await open({ multiple: true })
const savePath = await save({ defaultPath: 'file.txt' })
```

---

## 6. 前端 Vue3 组件迁移与适配

### 6.1 组件迁移工作量评估

| 组件 | 大小 | 迁移工作 | 复用率 |
|------|------|---------|-------|
| `TerminalPane.vue` | 14KB | 替换 `electronAPI.ssh.*` → `invoke()` / `listen()` | **90%** |
| `SftpPane.vue` | 17KB | 替换 `electronAPI.sftp.*` → `invoke()` | **90%** |
| `SftpFileList.vue` | 11KB | 同上 + 移动端长按菜单适配 | **85%** |
| `SftpToolbar.vue` | 11KB | 同上 + 移动端布局适配 | **80%** |
| `HostDialog.vue` | 13KB | 替换 hosts API 调用 | **90%** |
| `SettingsDialog.vue` | 13KB | 替换设置存储 + 更新检查 | **85%** |
| `Sidebar.vue` | 12KB | 替换 hosts API + 移动端抽屉化 | **80%** |
| `TabBar.vue` | 10KB | 纯 UI 逻辑，几乎不变 | **95%** |
| `TitleBar.vue` | 6KB | 窗口 API 替换 + 移动端隐藏 | **70%** |
| `MonacoEditor.vue` | 4KB | 无 IPC 调用，直接复用 | **100%** |
| `SftpEditor.vue` | 7KB | 替换 SFTP API | **90%** |
| `SftpPreview.vue` | 7KB | 替换 SFTP API | **90%** |
| `SftpBreadcrumb.vue` | 4KB | 纯 UI 逻辑 | **100%** |
| `SftpTree.vue` | 2KB | 纯 UI 逻辑 | **100%** |
| `SftpTreeNode.vue` | 4KB | 纯 UI 逻辑 | **100%** |
| `TransferQueue.vue` | 5KB | 替换进度事件监听 | **90%** |
| `FileIcon.vue` | 5KB | 纯 UI 逻辑 | **100%** |
| `WelcomeScreen.vue` | 3KB | 纯 UI 逻辑 | **100%** |

**总体复用率: ~90%** — 主要改动就是把 `window.electronAPI.xxx` 全局替换为 Tauri 的 `invoke()` 和 `listen()`

### 6.2 前端迁移核心改动方式

创建一个统一的 API 封装文件，逐行替换 electron 调用：

```javascript
// src/api/tauri-bridge.js — 新建此文件，统一封装所有后端调用

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open, save } from '@tauri-apps/plugin-dialog'
import { platform } from '@tauri-apps/plugin-os'

// === 窗口控制 ===
const appWindow = getCurrentWindow()
export const windowAPI = {
    minimize: () => appWindow.minimize(),
    maximize: () => appWindow.toggleMaximize(),
    close: () => appWindow.close(),
    isMaximized: () => appWindow.isMaximized(),
    onMaximized: (cb) => appWindow.onResized(async () => {
        cb(await appWindow.isMaximized())
    }),
}

// === 主机管理 ===
export const hostsAPI = {
    getAll: () => invoke('get_hosts'),
    save: (host) => invoke('save_host', { host }),
    delete: (id) => invoke('delete_host', { id }),
    get: (id) => invoke('get_host', { id }),
}

// === SSH 操作 ===
export const sshAPI = {
    connect: (sessionId, hostId) => invoke('ssh_connect', { sessionId, hostId }),
    input: (sessionId, data) => invoke('ssh_input', { sessionId, data }),
    resize: (sessionId, cols, rows) => invoke('ssh_resize', { sessionId, cols, rows }),
    disconnect: (sessionId) => invoke('ssh_disconnect', { sessionId }),
    test: (hostConfig) => invoke('ssh_test', { hostConfig }),
    onData: (cb) => listen('ssh:data', (e) => cb(e.payload)),
    onClosed: (cb) => listen('ssh:closed', (e) => cb(e.payload)),
}

// === SFTP 操作 ===
export const sftpAPI = {
    realpath: (sessionId, path) => invoke('sftp_realpath', { sessionId, path }),
    ls: (sessionId, path) => invoke('sftp_list', { sessionId, path }),
    upload: (sessionId, transferId, localPath, remotePath) =>
        invoke('sftp_upload', { sessionId, transferId, localPath, remotePath }),
    download: (sessionId, transferId, remotePath, localPath) =>
        invoke('sftp_download', { sessionId, transferId, remotePath, localPath }),
    pause: (transferId) => invoke('sftp_pause', { transferId }),
    resume: (transferId) => invoke('sftp_resume', { transferId }),
    cancel: (transferId) => invoke('sftp_cancel', { transferId }),
    delete: (sessionId, path) => invoke('sftp_delete', { sessionId, path }),
    rename: (sessionId, oldPath, newPath) => invoke('sftp_rename', { sessionId, oldPath, newPath }),
    mkdir: (sessionId, path) => invoke('sftp_mkdir', { sessionId, path }),
    move: (sessionId, oldPath, newPath) => invoke('sftp_move', { sessionId, oldPath, newPath }),
    getFile: (sessionId, path) => invoke('sftp_get_file', { sessionId, path }),
    putFile: (sessionId, path, content) => invoke('sftp_put_file', { sessionId, path, content }),
    stat: (sessionId, path) => invoke('sftp_stat', { sessionId, path }),
    tree: (sessionId, path, depth) => invoke('sftp_tree', { sessionId, path, depth }),
    onUploadProgress: (cb) => listen('sftp:upload-progress', (e) => cb(e.payload)),
    onDownloadProgress: (cb) => listen('sftp:download-progress', (e) => cb(e.payload)),
}

// === 对话框 ===
export const dialogAPI = {
    showOpenDialog: () => open({ multiple: true }),
    showSaveDialog: (options) => save(options),
}

// === 平台判断 ===
export const isMobile = () => {
    const p = platform()
    return p === 'android' || p === 'ios'
}
```

然后在每个 Vue 组件中，把原先的：

```javascript
// 旧：
const result = await window.electronAPI.ssh.connect(sessionId, hostId)
window.electronAPI.ssh.onData((payload) => { ... })
```

替换为：

```javascript
// 新：
import { sshAPI } from '@/api/tauri-bridge'
const result = await sshAPI.connect(sessionId, hostId)
sshAPI.onData((payload) => { ... })
```

> [!TIP]
> API 接口签名完全保持一致，组件内部的业务逻辑无需任何改动，只是换了调用入口。

### 6.3 移动端 UI 适配

| 场景 | 方案 |
|------|------|
| 桌面端显示标题栏，移动端隐藏 | `v-if="!isMobile()"` |
| 侧边栏 → 抽屉式 | 用 `isMobile()` 切换为 Drawer 组件 |
| 右键菜单 → 长按菜单 | 添加 `@contextmenu` + `@long-press` 双事件 |
| 终端软键盘 | xterm.js 配置中开启 `screenReaderMode` 并添加工具栏 |
| 安全区域（刘海屏） | CSS `env(safe-area-inset-*)` |

---

## 7. 新项目目录结构

```
openssh-tauri/
├── package.json                    # 前端依赖
├── vite.config.js                  # Vite 配置
├── src/                            # Vue3 前端 (从现有项目迁移)
│   ├── App.vue
│   ├── main.js
│   ├── api/
│   │   └── tauri-bridge.js         # [新建] 统一 API 桥接层
│   ├── components/                 # [复制] 18 个组件（改 import 路径）
│   ├── styles/
│   ├── locales/
│   └── i18n.js
├── src-tauri/                      # Rust 后端
│   ├── Cargo.toml                  # Rust 依赖
│   ├── tauri.conf.json             # Tauri 配置
│   ├── capabilities/               # 权限声明
│   │   └── default.json
│   ├── src/
│   │   ├── lib.rs                  # Tauri 插件/命令注册入口
│   │   ├── main.rs                 # 应用启动入口
│   │   ├── ssh_manager.rs          # [核心] SSH/SFTP 连接管理 (russh)
│   │   ├── db.rs                   # 主机数据存储
│   │   ├── crypto.rs               # AES-256-GCM 加密
│   │   └── commands/
│   │       ├── mod.rs
│   │       ├── ssh.rs              # SSH 相关 command
│   │       ├── sftp.rs             # SFTP 相关 command
│   │       └── hosts.rs            # 主机管理 command
│   ├── gen/                        # Tauri 为移动端自动生成的代码
│   │   ├── android/                # Android 工程
│   │   └── apple/                  # iOS 工程
│   └── icons/                      # 各平台图标
└── docs/
    └── plans/
```

---

## 8. 开发环境搭建指南

### 8.1 通用环境

| 工具 | 版本 | 安装方式 |
|------|------|---------|
| Node.js | 18+ | 官网下载 |
| Rust | stable (1.77+) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Tauri CLI | 2.x | `npm install -D @tauri-apps/cli@latest` |

### 8.2 桌面端（Windows 当前环境）

Windows 下 Rust 编译需要 MSVC Build Tools：
```powershell
# 安装 Rust
winget install Rustlang.Rust.MSVC

# 如果没有 Visual Studio，安装 Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools
```

### 8.3 Android 端

| 工具 | 说明 |
|------|------|
| Android Studio | 包含 SDK、模拟器 |
| Android SDK 34+ | 在 SDK Manager 中安装 |
| Android NDK | Rust 交叉编译到 ARM/x86 需要 |
| Rust 交叉编译目标 | 见下方命令 |

```powershell
# 添加 Android 交叉编译目标
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add i686-linux-android
rustup target add x86_64-linux-android
```

环境变量设置：
```powershell
# 设置 Android 环境变量
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\<version>"
```

### 8.4 iOS 端（需要 Mac）

| 工具 | 说明 |
|------|------|
| Xcode 15+ | App Store 安装 |
| CocoaPods | `sudo gem install cocoapods` |
| Rust iOS 目标 | 见下方命令 |

```bash
# 添加 iOS 交叉编译目标
rustup target add aarch64-apple-ios
rustup target add aarch64-apple-ios-sim  # 模拟器用
```

### 8.5 创建新项目

```powershell
# 方法一：使用 create-tauri-app 脚手架
npm create tauri-app@latest openssh-tauri -- --template vue-ts

# 方法二：在已有 Vite+Vue3 项目中添加 Tauri
cd your-vue-project
npm install -D @tauri-apps/cli@latest
npx tauri init
```

### 8.6 初始化移动端支持

```powershell
# 初始化 Android 项目结构
npx tauri android init

# 初始化 iOS 项目结构（Mac 上执行）
npx tauri ios init
```

---

## 9. 分阶段实施计划

### Phase 0：环境搭建 + 项目骨架（1天）

| 步骤 | 具体工作 | 产出 |
|------|---------|------|
| 0.1 | 安装 Rust + Tauri CLI | 开发环境就绪 |
| 0.2 | `npm create tauri-app` 创建新项目 (Vue3 + Vite模板) | 空白 Tauri 项目 |
| 0.3 | 将现有 `src/renderer/src/` 下的 Vue 代码复制到新项目的 `src/` | 前端代码就位 |
| 0.4 | 配置 `tauri.conf.json`（appId, 窗口大小, 标题等） | 基础配置完成 |
| 0.5 | 运行 `npx tauri dev`，确认前端页面能正常显示 | 第一次运行成功 |

### Phase 1：前端 API 桥接层（1-2天）

| 步骤 | 具体工作 | 产出 |
|------|---------|------|
| 1.1 | 创建 `src/api/tauri-bridge.js`，定义所有 API 封装函数 | 统一的 API 入口 |
| 1.2 | 在 Rust 端创建空的 `#[tauri::command]` 占位函数（返回 mock 数据） | 编译通过 |
| 1.3 | 逐个替换 18 个 Vue 组件中的 `window.electronAPI` 调用为 `tauri-bridge` 调用 | 前端编译通过 |
| 1.4 | 运行 `npx tauri dev`，UI 能渲染（功能暂不可用但不报错） | 前端迁移完成 |

### Phase 2：Rust 后端 — 主机管理 + 加密（2-3天）

| 步骤 | 具体工作 | 产出 |
|------|---------|------|
| 2.1 | 实现 `crypto.rs`：AES-256-GCM 加密/解密 | 加密模块就绪 |
| 2.2 | 实现 `db.rs`：基于 `tauri-plugin-store` 的主机 CRUD | 数据持久化就绪 |
| 2.3 | 实现 hosts commands：`get_hosts` / `save_host` / `delete_host` / `get_host` | 主机管理功能可用 |
| 2.4 | 联调测试：能在 UI 上添加、编辑、删除主机 | 第一个端到端功能打通 |

### Phase 3：Rust 后端 — SSH Shell 核心（5-7天）

| 步骤 | 具体工作 | 产出 |
|------|---------|------|
| 3.1 | 实现 `ssh_manager.rs` 基础框架：连接池 + SshHandler trait | 架构就绪 |
| 3.2 | 实现 `ssh_connect`：密码认证 + PTY + Shell 请求 | 能连上服务器 |
| 3.3 | 实现 `SshHandler::data()`：通过 `emit()` 推送终端数据给前端 | xterm.js 能显示输出 |
| 3.4 | 实现 `ssh_input`：前端输入 → Rust → channel.write() | 能输入命令 |
| 3.5 | 实现 `ssh_resize`：窗口大小同步 | 终端自适应 |
| 3.6 | 实现 `ssh_disconnect` + 连接断开事件 | 完整的连接生命周期 |
| 3.7 | 实现密钥认证 | 支持私钥登录 |
| 3.8 | 实现 `ssh_test` | 连接测试功能 |
| 3.9 | 桌面端全面测试 SSH 功能 | SSH 功能达到与 Electron 版同等水平 |

### Phase 4：Rust 后端 — SFTP（4-5天）

| 步骤 | 具体工作 | 产出 |
|------|---------|------|
| 4.1 | 集成 `russh-sftp`，实现 SFTP 会话初始化 | SFTP 基础就绪 |
| 4.2 | 实现 `sftp_list` / `sftp_realpath` / `sftp_stat` / `sftp_tree` | 目录浏览可用 |
| 4.3 | 实现 `sftp_mkdir` / `sftp_delete` / `sftp_rename` / `sftp_move` | 文件管理可用 |
| 4.4 | 实现 `sftp_upload` / `sftp_download` + 进度事件推送 | 文件传输可用 |
| 4.5 | 实现 `sftp_pause` / `sftp_resume` / `sftp_cancel` | 传输控制可用 |
| 4.6 | 实现 `sftp_get_file` / `sftp_put_file` | 文件预览/编辑可用 |
| 4.7 | 桌面端全面测试 SFTP 功能 | SFTP 功能完成 |

### Phase 5：移动端适配（3-5天）

| 步骤 | 具体工作 | 产出 |
|------|---------|------|
| 5.1 | `npx tauri android init` + `npx tauri ios init` | 移动端工程生成 |
| 5.2 | 在 Android 模拟器中运行，定位并修复崩溃和兼容性问题 | Android 端能启动 |
| 5.3 | 移动端 UI 适配（TitleBar 隐藏、Sidebar 抽屉化、响应式布局） | 手机界面友好 |
| 5.4 | xterm.js 移动端输入适配（软键盘、快捷键工具栏） | 终端能正常输入 |
| 5.5 | 文件选择器适配（使用 Tauri dialog 插件） | 移动端文件选择可用 |
| 5.6 | 安全区域适配 (iOS 刘海屏) | iOS 显示正常 |
| 5.7 | 在真机上测试 SSH 连接全流程 | 移动端核心功能验证 |

### Phase 6：打包发布（1-2天）

| 步骤 | 具体工作 | 产出 |
|------|---------|------|
| 6.1 | 桌面端打包测试：`npx tauri build` (Windows/Mac/Linux) | 安装包 |
| 6.2 | Android 端打包：`npx tauri android build` | APK / AAB |
| 6.3 | iOS 端打包（Mac 上）：`npx tauri ios build` | IPA |
| 6.4 | 配置 `tauri-plugin-updater` (桌面端自动更新) | 更新系统就绪 |

### 工期汇总

| 阶段 | 工期 | 累计 |
|------|------|------|
| Phase 0 环境搭建 | 1天 | 1天 |
| Phase 1 前端桥接 | 1-2天 | 2-3天 |
| Phase 2 主机管理 | 2-3天 | 4-6天 |
| Phase 3 SSH 核心 | 5-7天 | 9-13天 |
| Phase 4 SFTP | 4-5天 | 13-18天 |
| Phase 5 移动端适配 | 3-5天 | 16-23天 |
| Phase 6 打包发布 | 1-2天 | **17-25天** |

> [!TIP]
> Phase 3 完成后就可以发布一个"仅含 SSH 终端"的最小可用版，之后再持续迭代 SFTP 和移动端。这样可以尽早收集用户反馈。

---

## 10. 技术风险与应对

| 风险 | 影响 | 概率 | 应对方案 |
|------|------|------|---------|
| 开发者不熟悉 Rust | 开发效率低 | 高 | 先做 Rust 基础练习（2-3天），参考 russh 官方示例 |
| russh 在移动端的兼容性 | Android/iOS 编译问题 | 中 | russh 是纯 Rust 实现，理论上交叉编译无问题；万一不行可切换到 `ssh2` crate（基于 libssh2 C 库） |
| xterm.js 在移动端 WebView 中输入异常 | 软键盘无法触发 | 中 | 添加自定义输入工具栏；或用 Capacitor keyboard 插件辅助 |
| iOS 后台 SSH 连接被杀 | 切后台后断连 | 高 | 实现自动重连机制；使用 iOS Background Tasks 短暂保活 |
| Tauri 移动端生态不够成熟 | 某些插件不支持移动端 | 中 | 优先使用 Tauri 官方插件（dialog, store, updater）；必要时用 Tauri 的原生插件机制扩展 |
| SFTP 大文件传输在手机端内存不足 | OOM 崩溃 | 低 | 使用 Rust 流式传输（固定缓冲区），不一次性加载进内存 |
| Monaco Editor 在手机端过重 | 加载慢 | 低 | 移动端条件渲染，改用简单 textarea 或 CodeMirror |

---

## 11. 日常开发命令速查

```powershell
# =================== 桌面端开发 ===================
npx tauri dev                        # 启动开发模式 (热更新)
npx tauri build                      # 构建生产版本

# =================== Android 开发 ==================
npx tauri android init               # 初始化 Android 项目（首次）
npx tauri android dev                # 在模拟器/手机上运行
npx tauri android dev --open         # 打开 Android Studio 调试
npx tauri android build              # 构建 APK/AAB

# =================== iOS 开发 (Mac) =================
npx tauri ios init                   # 初始化 iOS 项目（首次）
npx tauri ios dev                    # 在模拟器/iPhone 上运行
npx tauri ios dev --open             # 打开 Xcode 调试
npx tauri ios build                  # 构建 IPA

# =================== Rust 相关 ======================
cargo check                          # 快速检查 Rust 编译错误
cargo test                           # 运行 Rust 单元测试
cargo clippy                         # Rust 代码规范检查

# =================== 交叉编译目标 ====================
rustup target list --installed       # 查看已安装的编译目标
rustup target add aarch64-linux-android   # 添加 Android ARM64
rustup target add aarch64-apple-ios       # 添加 iOS ARM64
```

---

## 附录 A：Rust 学习资源推荐

如果你之前没有 Rust 经验，以下资源可以帮助你快速上手：

| 资源 | 说明 | 链接 |
|------|------|------|
| Rust 官方教程 | 从零开始到进阶 | https://doc.rust-lang.org/book/ |
| Rust 中文教程 | 中文版官方教程 | https://kaisery.github.io/trpl-zh-cn/ |
| Tauri 2 官方文档 | 包含移动端指南 | https://v2.tauri.app/ |
| russh 仓库 | 包含连接示例 | https://github.com/warp-tech/russh |
| Rust by Example | 大量代码示例 | https://doc.rust-lang.org/rust-by-example/ |

## 附录 B：关键 Cargo.toml 依赖完整参考

```toml
[package]
name = "openssh-tauri"
version = "0.3.0"
edition = "2021"

[dependencies]
# --- Tauri 框架 ---
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-store = "2"        # 持久化存储 (全平台)
tauri-plugin-dialog = "2"       # 文件对话框 (全平台)
tauri-plugin-os = "2"           # 平台信息
tauri-plugin-updater = "2"      # 自动更新 (桌面端)

# --- SSH/SFTP ---
russh = "0.46"                  # SSH 协议 (纯 Rust, 异步)
russh-keys = "0.46"             # SSH 密钥
russh-sftp = "2.0"              # SFTP 协议

# --- 异步运行时 ---
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"

# --- 加密 ---
aes-gcm = "0.10"                # AES-256-GCM
scrypt = "0.11"                 # 密钥派生 (与 Node.js 兼容)
rand = "0.8"                    # 随机数

# --- 序列化 ---
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# --- 工具 ---
uuid = { version = "1", features = ["v4"] }
base64 = "0.22"
log = "0.4"
```
