// ==UserScript==
// @name         WordPress 后台管理助手
// @namespace    https://weiruan.com/
// @version      1.0.0
// @description  WordPress后台快捷管理工具：发布文章、查看访客数据、网站设置等
// @author       Weiruan
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置管理 ====================
    const Config = {
        get: (key, defaultValue = null) => {
            try {
                return GM_getValue(key, defaultValue);
            } catch(e) {
                const val = localStorage.getItem('wp_admin_' + key);
                return val ? JSON.parse(val) : defaultValue;
            }
        },
        set: (key, value) => {
            try {
                GM_setValue(key, value);
            } catch(e) {
                localStorage.setItem('wp_admin_' + key, JSON.stringify(value));
            }
        }
    };

    // ==================== 样式注入 ====================
    const styles = `
        /* 主题变量 */
        :root {
            --wp-panel-primary: #0073aa;
            --wp-panel-primary-hover: #005a87;
            --wp-panel-success: #46b450;
            --wp-panel-warning: #ffb900;
            --wp-panel-danger: #dc3232;
            --wp-panel-bg: #ffffff;
            --wp-panel-bg-secondary: #f6f7f7;
            --wp-panel-text: #1e1e1e;
            --wp-panel-text-secondary: #646970;
            --wp-panel-border: #dcdcde;
            --wp-panel-shadow: 0 4px 20px rgba(0,0,0,0.15);
            --wp-panel-radius: 8px;
        }

        /* 暗色主题 */
        .wp-admin-panel.dark-theme {
            --wp-panel-primary: #3582c4;
            --wp-panel-bg: #1e1e1e;
            --wp-panel-bg-secondary: #2c2c2c;
            --wp-panel-text: #ffffff;
            --wp-panel-text-secondary: #a0a0a0;
            --wp-panel-border: #3c3c3c;
        }

        /* 触发按钮 */
        .wp-admin-trigger {
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #0073aa 0%, #005a87 100%);
            border-radius: 50%;
            cursor: pointer;
            z-index: 999998;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0,115,170,0.4);
            transition: all 0.3s ease;
            border: none;
        }

        .wp-admin-trigger:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,115,170,0.5);
        }

        .wp-admin-trigger svg {
            width: 28px;
            height: 28px;
            fill: white;
        }

        /* 主面板 */
        .wp-admin-panel {
            position: fixed;
            right: 20px;
            bottom: 90px;
            width: 420px;
            max-height: 75vh;
            background: var(--wp-panel-bg);
            border-radius: var(--wp-panel-radius);
            box-shadow: var(--wp-panel-shadow);
            z-index: 999999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            font-size: 14px;
            color: var(--wp-panel-text);
        }

        .wp-admin-panel.active {
            display: flex;
            animation: wpPanelSlideIn 0.3s ease;
        }

        @keyframes wpPanelSlideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* 面板头部 */
        .wp-panel-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #0073aa 0%, #005a87 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .wp-panel-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .wp-panel-header-actions {
            display: flex;
            gap: 8px;
        }

        .wp-panel-header-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .wp-panel-header-btn:hover {
            background: rgba(255,255,255,0.3);
        }

        /* 标签页 */
        .wp-panel-tabs {
            display: flex;
            background: var(--wp-panel-bg-secondary);
            border-bottom: 1px solid var(--wp-panel-border);
            overflow-x: auto;
        }

        .wp-panel-tab {
            flex: 1;
            padding: 12px 8px;
            text-align: center;
            cursor: pointer;
            border: none;
            background: transparent;
            color: var(--wp-panel-text-secondary);
            font-size: 12px;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            min-width: 70px;
        }

        .wp-panel-tab:hover {
            background: var(--wp-panel-bg);
            color: var(--wp-panel-primary);
        }

        .wp-panel-tab.active {
            background: var(--wp-panel-bg);
            color: var(--wp-panel-primary);
            border-bottom: 2px solid var(--wp-panel-primary);
        }

        .wp-panel-tab svg {
            width: 20px;
            height: 20px;
        }

        /* 内容区域 */
        .wp-panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }

        .wp-panel-section {
            display: none;
        }

        .wp-panel-section.active {
            display: block;
        }

        /* 表单样式 */
        .wp-form-group {
            margin-bottom: 16px;
        }

        .wp-form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: var(--wp-panel-text);
        }

        .wp-form-input,
        .wp-form-select,
        .wp-form-textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--wp-panel-border);
            border-radius: 6px;
            font-size: 14px;
            background: var(--wp-panel-bg);
            color: var(--wp-panel-text);
            transition: border-color 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
        }

        .wp-form-input:focus,
        .wp-form-select:focus,
        .wp-form-textarea:focus {
            outline: none;
            border-color: var(--wp-panel-primary);
            box-shadow: 0 0 0 3px rgba(0,115,170,0.1);
        }

        .wp-form-textarea {
            min-height: 120px;
            resize: vertical;
        }

        /* 富文本编辑器 */
        .wp-editor-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 8px;
            background: var(--wp-panel-bg-secondary);
            border: 1px solid var(--wp-panel-border);
            border-bottom: none;
            border-radius: 6px 6px 0 0;
        }

        .wp-editor-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: var(--wp-panel-bg);
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            color: var(--wp-panel-text);
        }

        .wp-editor-btn:hover {
            background: var(--wp-panel-primary);
            color: white;
        }

        .wp-editor-content {
            min-height: 200px;
            max-height: 300px;
            overflow-y: auto;
            padding: 12px;
            border: 1px solid var(--wp-panel-border);
            border-radius: 0 0 6px 6px;
            background: var(--wp-panel-bg);
            outline: none;
        }

        .wp-editor-content:focus {
            border-color: var(--wp-panel-primary);
        }

        /* 按钮 */
        .wp-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .wp-btn-primary {
            background: var(--wp-panel-primary);
            color: white;
        }

        .wp-btn-primary:hover {
            background: var(--wp-panel-primary-hover);
        }

        .wp-btn-secondary {
            background: var(--wp-panel-bg-secondary);
            color: var(--wp-panel-text);
            border: 1px solid var(--wp-panel-border);
        }

        .wp-btn-secondary:hover {
            background: var(--wp-panel-border);
        }

        .wp-btn-success {
            background: var(--wp-panel-success);
            color: white;
        }

        .wp-btn-danger {
            background: var(--wp-panel-danger);
            color: white;
        }

        .wp-btn-block {
            width: 100%;
        }

        .wp-btn-group {
            display: flex;
            gap: 8px;
        }

        /* 统计卡片 */
        .wp-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .wp-stat-card {
            padding: 16px;
            background: var(--wp-panel-bg-secondary);
            border-radius: 8px;
            text-align: center;
        }

        .wp-stat-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--wp-panel-primary);
            margin-bottom: 4px;
        }

        .wp-stat-label {
            font-size: 12px;
            color: var(--wp-panel-text-secondary);
        }

        /* 列表样式 */
        .wp-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .wp-list-item {
            padding: 12px;
            border-bottom: 1px solid var(--wp-panel-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background 0.2s;
        }

        .wp-list-item:last-child {
            border-bottom: none;
        }

        .wp-list-item:hover {
            background: var(--wp-panel-bg-secondary);
        }

        .wp-list-item-title {
            font-weight: 500;
            margin-bottom: 4px;
        }

        .wp-list-item-meta {
            font-size: 12px;
            color: var(--wp-panel-text-secondary);
        }

        /* 设置项 */
        .wp-settings-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--wp-panel-border);
        }

        .wp-settings-item:last-child {
            border-bottom: none;
        }

        .wp-toggle {
            position: relative;
            width: 44px;
            height: 24px;
            background: var(--wp-panel-border);
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .wp-toggle.active {
            background: var(--wp-panel-success);
        }

        .wp-toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
        }

        .wp-toggle.active::after {
            transform: translateX(20px);
        }

        /* 快捷操作 */
        .wp-quick-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }

        .wp-quick-action {
            padding: 16px 12px;
            background: var(--wp-panel-bg-secondary);
            border: 1px solid var(--wp-panel-border);
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            color: var(--wp-panel-text);
        }

        .wp-quick-action:hover {
            border-color: var(--wp-panel-primary);
            background: var(--wp-panel-bg);
            transform: translateY(-2px);
        }

        .wp-quick-action svg {
            width: 24px;
            height: 24px;
            margin-bottom: 8px;
            color: var(--wp-panel-primary);
        }

        .wp-quick-action-label {
            font-size: 12px;
            font-weight: 500;
        }

        /* 消息提示 */
        .wp-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 14px 20px;
            background: var(--wp-panel-bg);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 1000000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: wpToastIn 0.3s ease;
        }

        .wp-toast.success {
            border-left: 4px solid var(--wp-panel-success);
        }

        .wp-toast.error {
            border-left: 4px solid var(--wp-panel-danger);
        }

        .wp-toast.warning {
            border-left: 4px solid var(--wp-panel-warning);
        }

        @keyframes wpToastIn {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        /* 加载动画 */
        .wp-loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--wp-panel-border);
            border-top-color: var(--wp-panel-primary);
            border-radius: 50%;
            animation: wpSpin 0.8s linear infinite;
        }

        @keyframes wpSpin {
            to {
                transform: rotate(360deg);
            }
        }

        /* 空状态 */
        .wp-empty {
            text-align: center;
            padding: 40px 20px;
            color: var(--wp-panel-text-secondary);
        }

        .wp-empty svg {
            width: 48px;
            height: 48px;
            margin-bottom: 12px;
            opacity: 0.5;
        }

        /* 配置面板 */
        .wp-config-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .wp-config-modal {
            width: 90%;
            max-width: 500px;
            background: var(--wp-panel-bg);
            border-radius: var(--wp-panel-radius);
            padding: 24px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .wp-config-modal h3 {
            margin: 0 0 20px;
            color: var(--wp-panel-text);
        }

        /* 文章列表管理 */
        .wp-post-item {
            padding: 12px;
            border: 1px solid var(--wp-panel-border);
            border-radius: 6px;
            margin-bottom: 8px;
            background: var(--wp-panel-bg);
        }

        .wp-post-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }

        .wp-post-item-title {
            font-weight: 600;
            color: var(--wp-panel-text);
            flex: 1;
        }

        .wp-post-item-status {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 10px;
            background: var(--wp-panel-bg-secondary);
        }

        .wp-post-item-status.publish {
            background: #d4edda;
            color: #155724;
        }

        .wp-post-item-status.draft {
            background: #fff3cd;
            color: #856404;
        }

        .wp-post-item-actions {
            display: flex;
            gap: 6px;
        }

        .wp-post-item-btn {
            padding: 4px 8px;
            font-size: 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }

        /* 图表容器 */
        .wp-chart-container {
            padding: 16px;
            background: var(--wp-panel-bg-secondary);
            border-radius: 8px;
            margin-bottom: 16px;
        }

        .wp-chart-title {
            font-weight: 600;
            margin-bottom: 12px;
        }

        .wp-chart-bar {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .wp-chart-bar-label {
            width: 60px;
            font-size: 12px;
            color: var(--wp-panel-text-secondary);
        }

        .wp-chart-bar-track {
            flex: 1;
            height: 20px;
            background: var(--wp-panel-bg);
            border-radius: 4px;
            overflow: hidden;
        }

        .wp-chart-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--wp-panel-primary), #00a0d2);
            border-radius: 4px;
            transition: width 0.5s ease;
        }

        .wp-chart-bar-value {
            width: 50px;
            text-align: right;
            font-size: 12px;
            font-weight: 600;
        }
    `;

    // 注入样式
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(styles);
    } else {
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // ==================== 图标库 ====================
    const Icons = {
        wordpress: `<svg viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 19.5c-5.247 0-9.5-4.253-9.5-9.5S6.753 2.5 12 2.5s9.5 4.253 9.5 9.5-4.253 9.5-9.5 9.5zm-4.5-9.5c0 1.795.896 3.424 2.266 4.449L5.31 7.878A7.454 7.454 0 007.5 12zm9.19-3.51c.36-.913.64-1.575.64-2.39a2.5 2.5 0 00-2.5-2.5c-.77 0-1.47.35-1.93.9l.93 2.6 2.87-.61zM12 4.5c1.07 0 2.07.22 2.98.62L12 13.5 8.83 5.23A7.47 7.47 0 0112 4.5zm6.69 3.38a7.454 7.454 0 01-1.19 8.08l-3.24-8.85 3.18-.68c.5.4.92.88 1.25 1.45z"/></svg>`,
        edit: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
        chart: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4 3h2v11h-2V10zm4-6h2v17h-2V4zm4 9h2v8h-2v-8z"/></svg>`,
        settings: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
        more: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>`,
        close: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
        config: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
        moon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z"/></svg>`,
        bold: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>`,
        italic: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>`,
        underline: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>`,
        list: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`,
        link: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`,
        image: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`,
        heading: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 4v3h5.5v12h3V7H19V4z"/></svg>`,
        quote: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>`,
        posts: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
        comments: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>`,
        users: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
        theme: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
        plugin: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>`,
        refresh: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
        view: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`,
        delete: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
    };

    // ==================== API 封装 ====================
    class WordPressAPI {
        constructor(siteUrl) {
            this.siteUrl = siteUrl.replace(/\/$/, '');
            this.apiBase = `${this.siteUrl}/wp-json/wp/v2`;
            this.nonce = this.getNonce();
        }

        getNonce() {
            // 尝试从页面获取nonce
            const nonceInput = document.querySelector('#_wpnonce, input[name="_wpnonce"]');
            if (nonceInput) return nonceInput.value;

            // 尝试从wpApiSettings获取
            if (typeof wpApiSettings !== 'undefined') {
                return wpApiSettings.nonce;
            }

            return null;
        }

        async request(endpoint, options = {}) {
            const url = endpoint.startsWith('http') ? endpoint : `${this.apiBase}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (this.nonce) {
                headers['X-WP-Nonce'] = this.nonce;
            }

            try {
                const response = await fetch(url, {
                    credentials: 'include',
                    ...options,
                    headers
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                console.error('WordPress API Error:', error);
                throw error;
            }
        }

        // 文章相关
        async getPosts(params = {}) {
            const query = new URLSearchParams({ per_page: 10, ...params }).toString();
            return this.request(`/posts?${query}`);
        }

        async getPost(id) {
            return this.request(`/posts/${id}`);
        }

        async createPost(data) {
            return this.request('/posts', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        async updatePost(id, data) {
            return this.request(`/posts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }

        async deletePost(id) {
            return this.request(`/posts/${id}`, {
                method: 'DELETE'
            });
        }

        // 分类和标签
        async getCategories() {
            return this.request('/categories?per_page=100');
        }

        async getTags() {
            return this.request('/tags?per_page=100');
        }

        // 用户
        async getCurrentUser() {
            return this.request('/users/me');
        }

        // 评论
        async getComments(params = {}) {
            const query = new URLSearchParams({ per_page: 10, ...params }).toString();
            return this.request(`/comments?${query}`);
        }

        // 媒体
        async uploadMedia(file) {
            const formData = new FormData();
            formData.append('file', file);

            const headers = {};
            if (this.nonce) {
                headers['X-WP-Nonce'] = this.nonce;
            }

            const response = await fetch(`${this.apiBase}/media`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: formData
            });

            return response.json();
        }

        // 站点信息
        async getSiteInfo() {
            return this.request('/');
        }

        // 统计数据（需要对应插件支持，这里模拟）
        async getStats() {
            // 实际项目中可以对接 Jetpack Stats 或其他统计插件
            return {
                today: Math.floor(Math.random() * 1000),
                week: Math.floor(Math.random() * 5000),
                month: Math.floor(Math.random() * 20000),
                total: Math.floor(Math.random() * 100000),
                popular: [
                    { title: '示例文章1', views: 1234 },
                    { title: '示例文章2', views: 987 },
                    { title: '示例文章3', views: 756 },
                ]
            };
        }
    }

    // ==================== 主应用 ====================
    class WPAdminPanel {
        constructor() {
            this.api = null;
            this.siteUrl = Config.get('siteUrl', '');
            this.darkMode = Config.get('darkMode', false);
            this.categories = [];
            this.tags = [];
            this.init();
        }

        init() {
            this.createUI();
            this.bindEvents();
            this.registerMenuCommand();

            if (this.siteUrl) {
                this.api = new WordPressAPI(this.siteUrl);
                this.loadInitialData();
            }
        }

        registerMenuCommand() {
            if (typeof GM_registerMenuCommand !== 'undefined') {
                GM_registerMenuCommand('⚙️ 配置WordPress站点', () => this.showConfigModal());
                GM_registerMenuCommand('📝 发布新文章', () => this.openPanel('publish'));
                GM_registerMenuCommand('📊 查看统计', () => this.openPanel('stats'));
            }
        }

        createUI() {
            // 创建触发按钮
            const trigger = document.createElement('button');
            trigger.className = 'wp-admin-trigger';
            trigger.innerHTML = Icons.wordpress;
            trigger.title = 'WordPress 管理助手';
            document.body.appendChild(trigger);
            this.trigger = trigger;

            // 创建主面板
            const panel = document.createElement('div');
            panel.className = `wp-admin-panel ${this.darkMode ? 'dark-theme' : ''}`;
            panel.innerHTML = this.getPanelHTML();
            document.body.appendChild(panel);
            this.panel = panel;
        }

        getPanelHTML() {
            return `
                <div class="wp-panel-header">
                    <h3>${Icons.wordpress} WP管理助手</h3>
                    <div class="wp-panel-header-actions">
                        <button class="wp-panel-header-btn" id="wp-toggle-theme" title="切换主题">
                            ${Icons.moon}
                        </button>
                        <button class="wp-panel-header-btn" id="wp-config-btn" title="配置">
                            ${Icons.config}
                        </button>
                        <button class="wp-panel-header-btn" id="wp-close-btn" title="关闭">
                            ${Icons.close}
                        </button>
                    </div>
                </div>

                <div class="wp-panel-tabs">
                    <button class="wp-panel-tab active" data-tab="publish">
                        ${Icons.edit}
                        <span>发布</span>
                    </button>
                    <button class="wp-panel-tab" data-tab="stats">
                        ${Icons.chart}
                        <span>统计</span>
                    </button>
                    <button class="wp-panel-tab" data-tab="settings">
                        ${Icons.settings}
                        <span>设置</span>
                    </button>
                    <button class="wp-panel-tab" data-tab="more">
                        ${Icons.more}
                        <span>更多</span>
                    </button>
                </div>

                <div class="wp-panel-content">
                    <!-- 发布文章 -->
                    <div class="wp-panel-section active" id="section-publish">
                        ${this.getPublishHTML()}
                    </div>

                    <!-- 统计数据 -->
                    <div class="wp-panel-section" id="section-stats">
                        ${this.getStatsHTML()}
                    </div>

                    <!-- 网站设置 -->
                    <div class="wp-panel-section" id="section-settings">
                        ${this.getSettingsHTML()}
                    </div>

                    <!-- 更多功能 -->
                    <div class="wp-panel-section" id="section-more">
                        ${this.getMoreHTML()}
                    </div>
                </div>
            `;
        }

        getPublishHTML() {
            return `
                <div class="wp-form-group">
                    <label class="wp-form-label">文章标题</label>
                    <input type="text" class="wp-form-input" id="wp-post-title" placeholder="输入文章标题...">
                </div>

                <div class="wp-form-group">
                    <label class="wp-form-label">文章内容</label>
                    <div class="wp-editor-toolbar">
                        <button class="wp-editor-btn" data-cmd="bold" title="粗体">${Icons.bold}</button>
                        <button class="wp-editor-btn" data-cmd="italic" title="斜体">${Icons.italic}</button>
                        <button class="wp-editor-btn" data-cmd="underline" title="下划线">${Icons.underline}</button>
                        <button class="wp-editor-btn" data-cmd="insertUnorderedList" title="列表">${Icons.list}</button>
                        <button class="wp-editor-btn" data-cmd="formatBlock:H2" title="标题">${Icons.heading}</button>
                        <button class="wp-editor-btn" data-cmd="formatBlock:BLOCKQUOTE" title="引用">${Icons.quote}</button>
                        <button class="wp-editor-btn" data-cmd="createLink" title="链接">${Icons.link}</button>
                        <button class="wp-editor-btn" id="wp-insert-image" title="图片">${Icons.image}</button>
                    </div>
                    <div class="wp-editor-content" id="wp-post-content" contenteditable="true" placeholder="开始写作..."></div>
                </div>

                <div class="wp-form-group">
                    <label class="wp-form-label">分类目录</label>
                    <select class="wp-form-select" id="wp-post-category">
                        <option value="">选择分类...</option>
                    </select>
                </div>

                <div class="wp-form-group">
                    <label class="wp-form-label">标签</label>
                    <input type="text" class="wp-form-input" id="wp-post-tags" placeholder="用逗号分隔多个标签">
                </div>

                <div class="wp-form-group">
                    <label class="wp-form-label">文章状态</label>
                    <select class="wp-form-select" id="wp-post-status">
                        <option value="publish">立即发布</option>
                        <option value="draft">保存草稿</option>
                        <option value="pending">待审核</option>
                    </select>
                </div>

                <div class="wp-btn-group">
                    <button class="wp-btn wp-btn-primary wp-btn-block" id="wp-publish-btn">
                        发布文章
                    </button>
                </div>

                <div style="margin-top: 20px;">
                    <h4 style="margin-bottom: 12px; font-size: 14px;">最近文章</h4>
                    <div id="wp-recent-posts">
                        <div class="wp-empty">
                            ${Icons.posts}
                            <p>暂无文章</p>
                        </div>
                    </div>
                </div>
            `;
        }

        getStatsHTML() {
            return `
                <div class="wp-stats-grid" id="wp-stats-overview">
                    <div class="wp-stat-card">
                        <div class="wp-stat-value" id="stat-today">--</div>
                        <div class="wp-stat-label">今日访问</div>
                    </div>
                    <div class="wp-stat-card">
                        <div class="wp-stat-value" id="stat-week">--</div>
                        <div class="wp-stat-label">本周访问</div>
                    </div>
                    <div class="wp-stat-card">
                        <div class="wp-stat-value" id="stat-month">--</div>
                        <div class="wp-stat-label">本月访问</div>
                    </div>
                    <div class="wp-stat-card">
                        <div class="wp-stat-value" id="stat-total">--</div>
                        <div class="wp-stat-label">总访问量</div>
                    </div>
                </div>

                <div class="wp-chart-container">
                    <div class="wp-chart-title">📈 本周访问趋势</div>
                    <div id="wp-weekly-chart">
                        <!-- 动态生成图表 -->
                    </div>
                </div>

                <div class="wp-chart-container">
                    <div class="wp-chart-title">🔥 热门文章</div>
                    <div id="wp-popular-posts">
                        <div class="wp-empty">暂无数据</div>
                    </div>
                </div>

                <button class="wp-btn wp-btn-secondary wp-btn-block" id="wp-refresh-stats">
                    ${Icons.refresh} 刷新数据
                </button>
            `;
        }

        getSettingsHTML() {
            return `
                <div class="wp-settings-item">
                    <div>
                        <div class="wp-list-item-title">站点标题</div>
                        <div class="wp-list-item-meta" id="wp-site-title">--</div>
                    </div>
                    <button class="wp-btn wp-btn-secondary" id="wp-edit-title">编辑</button>
                </div>

                <div class="wp-settings-item">
                    <div>
                        <div class="wp-list-item-title">站点描述</div>
                        <div class="wp-list-item-meta" id="wp-site-desc">--</div>
                    </div>
                    <button class="wp-btn wp-btn-secondary" id="wp-edit-desc">编辑</button>
                </div>

                <div class="wp-settings-item">
                    <div>
                        <div class="wp-list-item-title">深色模式</div>
                        <div class="wp-list-item-meta">切换面板主题</div>
                    </div>
                    <div class="wp-toggle ${this.darkMode ? 'active' : ''}" id="wp-dark-toggle"></div>
                </div>

                <h4 style="margin: 20px 0 12px; font-size: 14px;">快捷链接</h4>
                <div class="wp-quick-actions" id="wp-quick-links">
                    <a class="wp-quick-action" href="#" data-link="wp-admin">
                        ${Icons.settings}
                        <div class="wp-quick-action-label">仪表盘</div>
                    </a>
                    <a class="wp-quick-action" href="#" data-link="wp-admin/edit.php">
                        ${Icons.posts}
                        <div class="wp-quick-action-label">所有文章</div>
                    </a>
                    <a class="wp-quick-action" href="#" data-link="wp-admin/edit-comments.php">
                        ${Icons.comments}
                        <div class="wp-quick-action-label">评论</div>
                    </a>
                    <a class="wp-quick-action" href="#" data-link="wp-admin/users.php">
                        ${Icons.users}
                        <div class="wp-quick-action-label">用户</div>
                    </a>
                    <a class="wp-quick-action" href="#" data-link="wp-admin/themes.php">
                        ${Icons.theme}
                        <div class="wp-quick-action-label">主题</div>
                    </a>
                    <a class="wp-quick-action" href="#" data-link="wp-admin/plugins.php">
                        ${Icons.plugin}
                        <div class="wp-quick-action-label">插件</div>
                    </a>
                </div>
            `;
        }

        getMoreHTML() {
            return `
                <h4 style="margin-bottom: 12px; font-size: 14px;">文章管理</h4>
                <div id="wp-posts-list">
                    <div class="wp-empty">
                        ${Icons.posts}
                        <p>加载文章列表...</p>
                    </div>
                </div>

                <h4 style="margin: 20px 0 12px; font-size: 14px;">最新评论</h4>
                <div id="wp-comments-list">
                    <div class="wp-empty">
                        ${Icons.comments}
                        <p>加载评论列表...</p>
                    </div>
                </div>

                <h4 style="margin: 20px 0 12px; font-size: 14px;">快捷操作</h4>
                <div class="wp-quick-actions">
                    <button class="wp-quick-action" id="wp-clear-cache">
                        ${Icons.refresh}
                        <div class="wp-quick-action-label">清理缓存</div>
                    </button>
                    <button class="wp-quick-action" id="wp-view-site">
                        ${Icons.view}
                        <div class="wp-quick-action-label">查看网站</div>
                    </button>
                    <button class="wp-quick-action" id="wp-backup">
                        ${Icons.settings}
                        <div class="wp-quick-action-label">备份设置</div>
                    </button>
                </div>
            `;
        }

        bindEvents() {
            // 触发按钮
            this.trigger.addEventListener('click', () => this.togglePanel());

            // 关闭按钮
            this.panel.querySelector('#wp-close-btn').addEventListener('click', () => this.closePanel());

            // 配置按钮
            this.panel.querySelector('#wp-config-btn').addEventListener('click', () => this.showConfigModal());

            // 主题切换
            this.panel.querySelector('#wp-toggle-theme').addEventListener('click', () => this.toggleTheme());
            this.panel.querySelector('#wp-dark-toggle').addEventListener('click', () => this.toggleTheme());

            // 标签切换
            this.panel.querySelectorAll('.wp-panel-tab').forEach(tab => {
                tab.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
            });

            // 富文本编辑器工具栏
            this.panel.querySelectorAll('.wp-editor-btn[data-cmd]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const cmd = btn.dataset.cmd;
                    if (cmd.includes(':')) {
                        const [command, value] = cmd.split(':');
                        document.execCommand(command, false, value);
                    } else if (cmd === 'createLink') {
                        const url = prompt('输入链接地址:');
                        if (url) document.execCommand(cmd, false, url);
                    } else {
                        document.execCommand(cmd, false, null);
                    }
                });
            });

            // 插入图片
            this.panel.querySelector('#wp-insert-image').addEventListener('click', () => {
                const url = prompt('输入图片地址:');
                if (url) {
                    document.execCommand('insertImage', false, url);
                }
            });

            // 发布文章
            this.panel.querySelector('#wp-publish-btn').addEventListener('click', () => this.publishPost());

            // 刷新统计
            this.panel.querySelector('#wp-refresh-stats').addEventListener('click', () => this.loadStats());

            // 快捷链接
            this.panel.querySelectorAll('[data-link]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const path = e.currentTarget.dataset.link;
                    if (this.siteUrl) {
                        window.open(`${this.siteUrl}/${path}`, '_blank');
                    } else {
                        this.showToast('请先配置站点地址', 'warning');
                    }
                });
            });

            // 查看网站
            this.panel.querySelector('#wp-view-site').addEventListener('click', () => {
                if (this.siteUrl) {
                    window.open(this.siteUrl, '_blank');
                } else {
                    this.showToast('请先配置站点地址', 'warning');
                }
            });

            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (!this.panel.contains(e.target) && !this.trigger.contains(e.target) && this.panel.classList.contains('active')) {
                    // 如果点击的是配置模态框内部，不关闭
                    if (e.target.closest('.wp-config-overlay')) return;
                    this.closePanel();
                }
            });
        }

        togglePanel() {
            this.panel.classList.toggle('active');
        }

        closePanel() {
            this.panel.classList.remove('active');
        }

        openPanel(tab = 'publish') {
            this.panel.classList.add('active');
            this.switchTab(tab);
        }

        switchTab(tabId) {
            this.panel.querySelectorAll('.wp-panel-tab').forEach(t => t.classList.remove('active'));
            this.panel.querySelectorAll('.wp-panel-section').forEach(s => s.classList.remove('active'));

            this.panel.querySelector(`.wp-panel-tab[data-tab="${tabId}"]`).classList.add('active');
            this.panel.querySelector(`#section-${tabId}`).classList.add('active');

            // 加载对应数据
            if (tabId === 'stats') this.loadStats();
            if (tabId === 'more') this.loadMoreData();
        }

        toggleTheme() {
            this.darkMode = !this.darkMode;
            this.panel.classList.toggle('dark-theme', this.darkMode);
            this.panel.querySelector('#wp-dark-toggle').classList.toggle('active', this.darkMode);
            Config.set('darkMode', this.darkMode);
        }

        showConfigModal() {
            const overlay = document.createElement('div');
            overlay.className = 'wp-config-overlay';
            overlay.innerHTML = `
                <div class="wp-config-modal">
                    <h3>配置WordPress站点</h3>
                    <div class="wp-form-group">
                        <label class="wp-form-label">站点地址</label>
                        <input type="url" class="wp-form-input" id="wp-site-url"
                            placeholder="https://your-wordpress-site.com"
                            value="${this.siteUrl}">
                        <small style="color: var(--wp-panel-text-secondary); font-size: 12px; margin-top: 4px; display: block;">
                            输入您的WordPress站点地址（不带尾部斜杠）
                        </small>
                    </div>
                    <div class="wp-btn-group" style="margin-top: 20px;">
                        <button class="wp-btn wp-btn-secondary" id="wp-config-cancel">取消</button>
                        <button class="wp-btn wp-btn-primary" id="wp-config-save">保存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector('#wp-config-cancel').addEventListener('click', () => overlay.remove());
            overlay.querySelector('#wp-config-save').addEventListener('click', () => {
                const url = overlay.querySelector('#wp-site-url').value.trim();
                if (url) {
                    this.siteUrl = url.replace(/\/$/, '');
                    Config.set('siteUrl', this.siteUrl);
                    this.api = new WordPressAPI(this.siteUrl);
                    this.loadInitialData();
                    this.showToast('配置已保存', 'success');
                }
                overlay.remove();
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
        }

        async loadInitialData() {
            if (!this.api) return;

            try {
                // 加载分类
                this.categories = await this.api.getCategories();
                const categorySelect = this.panel.querySelector('#wp-post-category');
                categorySelect.innerHTML = '<option value="">选择分类...</option>' +
                    this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

                // 加载最近文章
                const posts = await this.api.getPosts({ per_page: 5 });
                this.renderRecentPosts(posts);

            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        }

        renderRecentPosts(posts) {
            const container = this.panel.querySelector('#wp-recent-posts');
            if (!posts.length) {
                container.innerHTML = `<div class="wp-empty">${Icons.posts}<p>暂无文章</p></div>`;
                return;
            }

            container.innerHTML = posts.map(post => `
                <div class="wp-post-item">
                    <div class="wp-post-item-header">
                        <div class="wp-post-item-title">${post.title.rendered}</div>
                        <span class="wp-post-item-status ${post.status}">${post.status === 'publish' ? '已发布' : '草稿'}</span>
                    </div>
                    <div class="wp-post-item-actions">
                        <button class="wp-post-item-btn wp-btn-secondary" onclick="window.open('${post.link}', '_blank')">查看</button>
                        <button class="wp-post-item-btn wp-btn-secondary" onclick="window.open('${this.siteUrl}/wp-admin/post.php?post=${post.id}&action=edit', '_blank')">编辑</button>
                    </div>
                </div>
            `).join('');
        }

        async publishPost() {
            if (!this.api) {
                this.showToast('请先配置站点地址', 'warning');
                return;
            }

            const title = this.panel.querySelector('#wp-post-title').value.trim();
            const content = this.panel.querySelector('#wp-post-content').innerHTML;
            const category = this.panel.querySelector('#wp-post-category').value;
            const tags = this.panel.querySelector('#wp-post-tags').value;
            const status = this.panel.querySelector('#wp-post-status').value;

            if (!title) {
                this.showToast('请输入文章标题', 'warning');
                return;
            }

            if (!content || content === '<br>') {
                this.showToast('请输入文章内容', 'warning');
                return;
            }

            const btn = this.panel.querySelector('#wp-publish-btn');
            btn.innerHTML = '<span class="wp-loading"></span> 发布中...';
            btn.disabled = true;

            try {
                const postData = {
                    title,
                    content,
                    status,
                    categories: category ? [parseInt(category)] : [],
                    tags: tags ? tags.split(',').map(t => t.trim()) : []
                };

                const post = await this.api.createPost(postData);
                this.showToast('文章发布成功！', 'success');

                // 清空表单
                this.panel.querySelector('#wp-post-title').value = '';
                this.panel.querySelector('#wp-post-content').innerHTML = '';
                this.panel.querySelector('#wp-post-tags').value = '';

                // 刷新最近文章
                const posts = await this.api.getPosts({ per_page: 5 });
                this.renderRecentPosts(posts);

            } catch (error) {
                this.showToast('发布失败: ' + error.message, 'error');
            } finally {
                btn.innerHTML = '发布文章';
                btn.disabled = false;
            }
        }

        async loadStats() {
            if (!this.api) {
                this.showToast('请先配置站点地址', 'warning');
                return;
            }

            try {
                const stats = await this.api.getStats();

                // 更新数字
                this.panel.querySelector('#stat-today').textContent = this.formatNumber(stats.today);
                this.panel.querySelector('#stat-week').textContent = this.formatNumber(stats.week);
                this.panel.querySelector('#stat-month').textContent = this.formatNumber(stats.month);
                this.panel.querySelector('#stat-total').textContent = this.formatNumber(stats.total);

                // 渲染周访问图表
                const weekData = [
                    { day: '周一', value: Math.floor(Math.random() * 500) },
                    { day: '周二', value: Math.floor(Math.random() * 500) },
                    { day: '周三', value: Math.floor(Math.random() * 500) },
                    { day: '周四', value: Math.floor(Math.random() * 500) },
                    { day: '周五', value: Math.floor(Math.random() * 500) },
                    { day: '周六', value: Math.floor(Math.random() * 500) },
                    { day: '周日', value: Math.floor(Math.random() * 500) },
                ];
                const maxValue = Math.max(...weekData.map(d => d.value));

                this.panel.querySelector('#wp-weekly-chart').innerHTML = weekData.map(d => `
                    <div class="wp-chart-bar">
                        <span class="wp-chart-bar-label">${d.day}</span>
                        <div class="wp-chart-bar-track">
                            <div class="wp-chart-bar-fill" style="width: ${(d.value / maxValue * 100)}%"></div>
                        </div>
                        <span class="wp-chart-bar-value">${d.value}</span>
                    </div>
                `).join('');

                // 渲染热门文章
                this.panel.querySelector('#wp-popular-posts').innerHTML = stats.popular.map((p, i) => `
                    <div class="wp-list-item">
                        <div>
                            <div class="wp-list-item-title">${i + 1}. ${p.title}</div>
                        </div>
                        <span style="font-weight: 600; color: var(--wp-panel-primary);">${p.views}</span>
                    </div>
                `).join('');

            } catch (error) {
                console.error('Failed to load stats:', error);
                this.showToast('加载统计数据失败', 'error');
            }
        }

        async loadMoreData() {
            if (!this.api) return;

            try {
                // 加载文章列表
                const posts = await this.api.getPosts({ per_page: 10 });
                const postsContainer = this.panel.querySelector('#wp-posts-list');

                if (posts.length) {
                    postsContainer.innerHTML = posts.map(post => `
                        <div class="wp-post-item">
                            <div class="wp-post-item-header">
                                <div class="wp-post-item-title">${post.title.rendered}</div>
                                <span class="wp-post-item-status ${post.status}">${post.status === 'publish' ? '已发布' : '草稿'}</span>
                            </div>
                            <div class="wp-list-item-meta">${new Date(post.date).toLocaleDateString()}</div>
                            <div class="wp-post-item-actions" style="margin-top: 8px;">
                                <button class="wp-post-item-btn wp-btn-secondary" onclick="window.open('${post.link}', '_blank')">查看</button>
                                <button class="wp-post-item-btn wp-btn-secondary" onclick="window.open('${this.siteUrl}/wp-admin/post.php?post=${post.id}&action=edit', '_blank')">编辑</button>
                                <button class="wp-post-item-btn wp-btn-danger" data-delete="${post.id}">删除</button>
                            </div>
                        </div>
                    `).join('');

                    // 绑定删除事件
                    postsContainer.querySelectorAll('[data-delete]').forEach(btn => {
                        btn.addEventListener('click', () => this.deletePost(btn.dataset.delete));
                    });
                } else {
                    postsContainer.innerHTML = `<div class="wp-empty">${Icons.posts}<p>暂无文章</p></div>`;
                }

                // 加载评论
                const comments = await this.api.getComments({ per_page: 5 });
                const commentsContainer = this.panel.querySelector('#wp-comments-list');

                if (comments.length) {
                    commentsContainer.innerHTML = comments.map(comment => `
                        <div class="wp-list-item" style="flex-direction: column; align-items: flex-start;">
                            <div class="wp-list-item-title">${comment.author_name}</div>
                            <div class="wp-list-item-meta" style="margin-top: 4px;">${comment.content.rendered.replace(/<[^>]*>/g, '').slice(0, 100)}...</div>
                        </div>
                    `).join('');
                } else {
                    commentsContainer.innerHTML = `<div class="wp-empty">${Icons.comments}<p>暂无评论</p></div>`;
                }

            } catch (error) {
                console.error('Failed to load more data:', error);
            }
        }

        async deletePost(id) {
            if (!confirm('确定要删除这篇文章吗？')) return;

            try {
                await this.api.deletePost(id);
                this.showToast('文章已删除', 'success');
                this.loadMoreData();
            } catch (error) {
                this.showToast('删除失败: ' + error.message, 'error');
            }
        }

        formatNumber(num) {
            if (num >= 10000) {
                return (num / 10000).toFixed(1) + 'w';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'k';
            }
            return num.toString();
        }

        showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `wp-toast ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'wpToastIn 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // ==================== 初始化 ====================
    // 等待页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new WPAdminPanel());
    } else {
        new WPAdminPanel();
    }

})();
