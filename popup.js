// popup.js - 弹出窗口脚本

document.addEventListener('DOMContentLoaded', async () => {
    // 加载保存的配置
    const config = await chrome.storage.sync.get(['apiUrl', 'connectionToken', 'refreshInterval']);

    document.getElementById('apiUrl').value = config.apiUrl || '';
    document.getElementById('connectionToken').value = config.connectionToken || '';
    document.getElementById('refreshInterval').value = config.refreshInterval || 60;
});

// 保存配置
document.getElementById('saveBtn').addEventListener('click', async () => {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const connectionToken = document.getElementById('connectionToken').value.trim();
    const refreshInterval = parseInt(document.getElementById('refreshInterval').value) || 60;

    if (!apiUrl || !connectionToken) {
        showStatus('请填写所有必填项', 'error');
        return;
    }

    await chrome.storage.sync.set({ apiUrl, connectionToken, refreshInterval });
    chrome.runtime.sendMessage({ action: 'updateConfig' });

    showStatus('配置已保存', 'success');
});

// 立即测试
document.getElementById('testBtn').addEventListener('click', async () => {
    const btn = document.getElementById('testBtn');
    btn.disabled = true;
    btn.textContent = '同步中...';
    showStatus('正在提取并同步Cookie...', 'info');

    try {
        const result = await chrome.runtime.sendMessage({ action: 'testNow' });

        if (result.success) {
            showStatus(result.message || 'Cookie同步成功！', 'success');
        } else {
            showStatus(result.error || '同步失败', 'error');
        }
    } catch (error) {
        showStatus('错误: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '立即同步';
    }
});

// 查看日志
document.getElementById('logsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'logs.html' });
});

// 显示状态
function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status ' + type;
    status.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
}
