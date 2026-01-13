# Gemini Cookie Auto Sync Extension

**[English](#english) | [中文](#chinese)**

<a name="chinese"></a>
## 简介

这是一个 Chrome 浏览器扩展，专为 **[GeminiWeb2API](https://github.com/lumia1998/geminiweb2api)** 项目设计。

它的主要功能是：
1.  **自动提取 Cookie**：当您登录 Google Gemini 时，自动获取认证所需的 Cookie (`__Secure-1PSID` 和 `__Secure-1PSIDTS`)。
2.  **自动同步**：将获取到的 Cookie 自动同步发送到您的 GeminiWeb2API 服务器。
3.  **自动保活**：定时间隔（默认 30 分钟）在后台自动打开/刷新 Gemini 页面，防止 Cookie 过期，确保持续可用。

此扩展实现了 Gemini API 服务的"全自动托管"，无需人工手动复制 Cookie。

## 使用方法

1.  **部署主服务**：首先部署 [GeminiWeb2API](https://github.com/lumia1998/geminiweb2api) 服务端。
2.  **安装扩展**：
    *   下载本项目代码。
    *   打开 Chrome 浏览器，进入扩展程序页面 (`chrome://extensions/`)。
    *   开启右上角的"开发者模式"。
    *   点击左上角的"加载已解压的扩展程序"，选择本项目文件夹。
3.  **配置连接**：
    *   点击浏览器工具栏的插件图标。
    *   **Server URL**: 填入您的 WebAPI 地址，例如 `http://localhost:8000/api/plugin/update-cookie` (注意路径)。
    *   **Connection Token**: 填入 WebAPI 管理面板中生成的插件 Token。
    *   点击 "Save Configuration"。
4.  **测试**：
    *   点击 "Test Connection" 确保连接成功。
    *   在浏览器中登录 [Gemini 官网](https://gemini.google.com)。
    *   插件会自动捕获并上传 Cookie。

---

<a name="english"></a>
## Introduction

This is a Chrome browser extension designed specifically for the **[GeminiWeb2API](https://github.com/lumia1998/geminiweb2api)** project.

Key Features:
1.  **Auto Cookie Extraction**: Automatically captures necessary cookies (`__Secure-1PSID` and `__Secure-1PSIDTS`) when you login to Google Gemini.
2.  **Auto Sync**: Automatically sends these cookies to your GeminiWeb2API server.
3.  **Keep-Alive**: Periodically opens/reloads the Gemini page in the background (default every 30 mins) to prevent cookie expiration.

This extension enables a "fully managed" experience for the Gemini API service, eliminating the need for manual cookie copying.

## Usage

1.  **Deploy Main Service**: First, deploy the [GeminiWeb2API](https://github.com/lumia1998/geminiweb2api) server.
2.  **Install Extension**:
    *   Download this repository.
    *   Open Chrome and go to Extensions (`chrome://extensions/`).
    *   Enable "Developer mode" in the top right.
    *   Click "Load unpacked" and select this project folder.
3.  **Configure**:
    *   Click the extension icon.
    *   **Server URL**: Enter your WebAPI endpoint, e.g., `http://localhost:8000/api/plugin/update-cookie`.
    *   **Connection Token**: Enter the plugin token from the WebAPI admin panel.
    *   Click "Save Configuration".
4.  **Test**:
    *   Click "Test Connection" to verify.
    *   Login to [Gemini](https://gemini.google.com).
    *   The extension will automatically capture and upload the cookies.
