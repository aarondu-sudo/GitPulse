import { escapeHtml } from '../utils.js';

// 语言颜色映射
const LANGUAGE_COLORS = {
  javascript: '#f1e05a',
  typescript: '#3178c6',
  python: '#3572A5',
  go: '#00ADD8',
  rust: '#dea584',
  java: '#b07219',
  'c++': '#f34b7d',
  cpp: '#f34b7d',
  html: '#e34c26',
  css: '#563d7c',
  default: '#8b949e'
};

// 创建单个项目卡片
export function createCard(repo) {
  const card = document.createElement('article');
  card.className = 'repo-card';

  const langColor = LANGUAGE_COLORS[repo.language?.toLowerCase()] || LANGUAGE_COLORS.default;

  card.innerHTML = `
    <div class="repo-header">
      <div class="repo-owner">
        <img src="${repo.avatar}" alt="" class="repo-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2212%22 font-size=%2212%22>📦</text></svg>'">
        <span class="repo-name">${escapeHtml(repo.owner)}</span>
      </div>
      <a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener" class="repo-link" title="在 GitHub 上查看">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
    </div>
    <h3 class="repo-title">
      <a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a>
    </h3>
    <p class="repo-description">${escapeHtml(repo.description || '暂无描述')}</p>
    <div class="repo-stats">
      <span class="repo-stat" title="Stars">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
        </svg>
        ${formatNumber(repo.stars)}
      </span>
      <span class="repo-stat" title="Forks">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
        </svg>
        ${formatNumber(repo.forks)}
      </span>
      ${repo.starsToday > 0 ? `
      <span class="repo-stat repo-stat-gain" title="今日新增">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 12a.75.75 0 01-.75-.75V5.56L4.28 7.78a.75.75 0 01-1.06-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 11-1.06 1.06L8.75 5.56v5.69A.75.75 0 018 12z"/>
        </svg>
        +${formatNumber(repo.starsToday)}
      </span>
      ` : ''}
      <span class="repo-stat" title="更新时间">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 4.5a.75.75 0 011.5 0v3.5a.75.75 0 01-.47.7l-2.5 1a.75.75 0 01-.56-1.39L7 7.7V4.5z"/>
        </svg>
        ${formatDate(repo.updatedAt)}
      </span>
    </div>
    ${repo.language ? `
    <div class="repo-language">
      <span class="lang-dot" style="background: ${langColor}"></span>
      ${escapeHtml(repo.language)}
    </div>
    ` : ''}
  `;

  return card;
}

// 创建卡片网格
export function createCardGrid(repositories) {
  const grid = document.createElement('div');
  grid.className = 'repo-grid';

  if (repositories.length === 0) {
    grid.innerHTML = '<p class="empty-state">暂无相关项目</p>';
    return grid;
  }

  repositories.forEach(repo => {
    grid.appendChild(createCard(repo));
  });

  return grid;
}

// 工具函数
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function formatDate(dateStr) {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}月前`;
}

// 卡片样式
export const cardStyles = `
  .repo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .repo-card {
    padding: 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: box-shadow 0.2s, transform 0.2s;
  }

  .repo-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .repo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .repo-owner {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .repo-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  .repo-link {
    color: var(--text-secondary);
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .repo-link:hover {
    opacity: 1;
  }

  .repo-title {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .repo-title a {
    color: var(--accent);
    text-decoration: none;
  }

  .repo-title a:hover {
    text-decoration: underline;
  }

  .repo-description {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0 0 12px 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .repo-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 8px;
  }

  .repo-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .repo-stat svg {
    opacity: 0.7;
  }

  .repo-stat-gain {
    color: #1a7f37;
  }

  .repo-language {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .lang-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 48px;
    color: var(--text-secondary);
  }

  @media (max-width: 768px) {
    .repo-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
  }

  @media (max-width: 480px) {
    .repo-grid {
      grid-template-columns: 1fr;
    }
  }
`;
