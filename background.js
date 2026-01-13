// background.js - WebAPI Cookie Updater 后台脚本

const ALARM_NAME = 'cookieRefresh';

// 日志系统
const Logger = {
    async log(level, message, details = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, details };
        console.log(`[${level}] ${message}`, details || '');

        const { logs = [] } = await chrome.storage.local.get(['logs']);
        logs.unshift(logEntry);
        if (logs.length > 50) logs.splice(50);
        await chrome.storage.local.set({ logs });
    },
    info(message, details) { return this.log('INFO', message, details); },
    error(message, details) { return this.log('ERROR', message, details); },
    success(message, details) { return this.log('SUCCESS', message, details); },
    async getLogs() {
        const { logs = [] } = await chrome.storage.local.get(['logs']);
        return logs;
    },
    async clearLogs() {
        await chrome.storage.local.set({ logs: [] });
    }
};

// 安装时初始化
chrome.runtime.onInstalled.addListener(async () => {
    await Logger.info('WebAPI Cookie Updater installed');
    await setupAlarm();
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateConfig') {
        setupAlarm().then(async () => {
            await Logger.info('Config updated, alarm reset');
        });
    } else if (request.action === 'testNow') {
        extractAndSendCookie().then((result) => {
            sendResponse(result);
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    } else if (request.action === 'getLogs') {
        Logger.getLogs().then((logs) => {
            sendResponse({ success: true, logs });
        });
        return true;
    } else if (request.action === 'clearLogs') {
        Logger.clearLogs().then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// 监听定时器触发
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        await Logger.info('定时任务触发');
        await performScheduledSync();
    }
});

// 执行计划同步任务
async function performScheduledSync() {
    try {
        await Logger.info('开始执行同步任务...');

        // 检查是否已有 Gemini 标签页
        const tabs = await chrome.tabs.query({ url: 'https://gemini.google.com/*' });
        let tabId = null;
        let isNewTab = false;

        if (tabs.length > 0) {
            // 已有标签页，使用第一个
            tabId = tabs[0].id;
            await Logger.info('发现现有 Gemini 标签页', { tabId });
            // 刷新页面以触发 Cookie 更新
            try {
                await chrome.tabs.reload(tabId);
            } catch (e) {
                // 标签页可能已被关闭，创建新标签页
                await Logger.info('现有标签页已关闭，创建新标签页');
                const tab = await chrome.tabs.create({ url: 'https://gemini.google.com', active: false });
                tabId = tab.id;
                isNewTab = true;
            }
        } else {
            // 没有标签页，创建一个后台标签页
            await Logger.info('未找到 Gemini 标签页，正在创建...');
            const tab = await chrome.tabs.create({ url: 'https://gemini.google.com', active: false });
            tabId = tab.id;
            isNewTab = true;
        }

        // 等待页面加载和脚本执行 (20秒)
        await Logger.info('等待页面加载(15s)...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        // 提取并发送 Cookie
        const result = await extractAndSendCookie();

        // 如果是新创建的标签页，任务完成后关闭
        if (isNewTab && tabId) {
            await Logger.info('关闭临时标签页', { tabId });
            await chrome.tabs.remove(tabId);
        }

        // 通知结果
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: result.success ? '✅ Cookie已同步' : '❌ Cookie同步失败',
            message: result.message || result.error || ''
        });

    } catch (error) {
        await Logger.error('同步任务执行出错', { error: error.message });
    }
}

// 设置定时器
async function setupAlarm() {
    await chrome.alarms.clear(ALARM_NAME);
    const config = await chrome.storage.sync.get(['refreshInterval']);
    const intervalMinutes = config.refreshInterval || 60;
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: intervalMinutes });
    await Logger.info(`定时任务已设置: 每 ${intervalMinutes} 分钟`);
}

// 提取cookie并发送到服务器
async function extractAndSendCookie() {
    try {
        await Logger.info('正在提取 Cookie 数据...');

        const config = await chrome.storage.sync.get(['apiUrl', 'connectionToken']);
        if (!config.apiUrl || !config.connectionToken) {
            return { success: false, error: '请先配置服务器地址和Token' };
        }

        // 获取 gemini.google.com 的所有 cookies
        const geminiCookies = await chrome.cookies.getAll({ domain: 'gemini.google.com' });
        const googleCookies = await chrome.cookies.getAll({ domain: '.google.com' });

        // 合并并去重
        const allCookies = [...geminiCookies, ...googleCookies];
        const uniqueCookies = Array.from(
            new Map(allCookies.map(c => [c.name, c])).values()
        );

        // 查找关键cookie
        let psid = '', psidts = '';

        for (const cookie of uniqueCookies) {
            if (cookie.name === '__Secure-1PSID') psid = cookie.value;
            if (cookie.name === '__Secure-1PSIDTS') psidts = cookie.value;
        }

        if (!psid) {
            await Logger.error('缺失关键 Cookie (__Secure-1PSID)');
            return { success: false, error: '未找到登录凭证，请登录 Gemini' };
        }

        // 构建完整cookie字符串
        const cookieStr = uniqueCookies.map(c => `${c.name}=${c.value}`).join('; ');

        // 发送到服务器
        await Logger.info('向服务器发送数据...');
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.connectionToken}`
            },
            body: JSON.stringify({
                cookie_str: cookieStr,
                psid: psid,
                psidts: psidts
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        if (result.success) {
            await Logger.success('同步成功', result);
            return { success: true, message: 'Cookie 已更新' };
        } else {
            throw new Error(result.message || '服务器返回失败');
        }

    } catch (error) {
        await Logger.error('同步失败', { error: error.message });
        return { success: false, error: error.message };
    }
}
