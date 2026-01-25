// 创建加载状态
export function createLoading() {
  const div = document.createElement('div');
  div.className = 'status-loading';
  div.innerHTML = `
    <div class="spinner"></div>
    <p>加载中...</p>
  `;
  return div;
}

// 创建错误状态
export function createError(message, onRetry) {
  const div = document.createElement('div');
  div.className = 'status-error';
  div.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7v-2h2v2zm0-3H7V4h2v5z"/>
    </svg>
    <p>${escapeHtml(message)}</p>
    <button class="retry-btn">重试</button>
  `;

  div.querySelector('.retry-btn').addEventListener('click', onRetry);

  return div;
}

// 创建降级提示
export function createFallbackAlert(source) {
  const div = document.createElement('div');
  div.className = 'fallback-alert';
  div.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7 5h2v4H7V5zm0 5h2v2H7v-2z"/>
    </svg>
    <span>当前使用备用数据源 (${escapeHtml(source)})，部分数据可能不完整</span>
  `;
  return div;
}

// 创建结果计数
export function createResultCount(count, source) {
  const div = document.createElement('div');
  div.className = 'result-count';
  div.innerHTML = `
    找到 <strong>${count}</strong> 个项目
    ${source ? `<span class="data-source">来自 ${escapeHtml(source)}</span>` : ''}
  `;
  return div;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 状态样式
export const statusStyles = `
  .status-loading,
  .status-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status-loading p,
  .status-error p {
    margin-top: 16px;
    color: var(--text-secondary);
  }

  .retry-btn {
    margin-top: 16px;
    padding: 8px 16px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .retry-btn:hover {
    background: #085dc1;
  }

  .fallback-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #fff8c5;
    border: 1px solid #eac54f;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #735c0f;
  }

  .result-count {
    padding: 8px 16px;
    background: var(--bg-alt);
    border-radius: 6px;
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }

  .data-source {
    margin-left: 8px;
    opacity: 0.7;
  }
`;
