# GitHubStar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个展示 GitHub 最近热门项目的静态网站

**Architecture:** 纯静态网站，使用 Vite 构建，原生 CSS + JS，多数据源降级策略获取 GitHub 趋势数据

**Tech Stack:** Vite, 原生 JavaScript (ES6+), CSS Variables, fetch API

---

## Task 1: 项目初始化与 Vite 配置

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/styles.css`
- Create: `src/app.js`

**Step 1: 创建 package.json**

```json
{
  "name": "githubstar",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

**Step 2: 创建 vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

**Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHubStar - GitHub 热门项目</title>
  <link rel="stylesheet" href="/src/styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/app.js"></script>
</body>
</html>
```

**Step 4: 创建 src/styles.css（基础样式）**

```css
:root {
  --primary: #24292f;
  --secondary: #57606a;
  --accent: #0969da;
  --bg: #ffffff;
  --bg-alt: #f6f8fa;
  --border: #d0d7de;
  --text: #24292f;
  --text-secondary: #57606a;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.5;
}

#app {
  min-height: 100vh;
}
```

**Step 5: 创建 src/app.js（入口文件）**

```js
console.log('GitHubStar app initialized');

document.getElementById('app').innerHTML = `
  <header>
    <h1>GitHubStar</h1>
    <p>GitHub 热门项目发现</p>
  </header>
  <main>
    <p>加载中...</p>
  </main>
`;
```

**Step 6: 安装依赖并验证**

```bash
npm install
npm run dev
```

预期：启动开发服务器，浏览器访问看到 "GitHubStar" 标题和 "加载中..." 文字

**Step 7: 提交**

```bash
git add package.json vite.config.js index.html src/
git commit -m "feat: initialize project with Vite and basic structure"
```

---

## Task 2: API 数据源与降级策略

**Files:**
- Create: `src/api/sources.js` - API 源配置
- Create: `src/api/github.js` - GitHub API 封装

**Step 1: 创建 src/api/sources.js**

```js
// 多数据源配置
export const API_SOURCES = [
  {
    name: 'gh-trending-api',
    getRepositories: ({ period, language }) => {
      const lang = language ? `?language=${language}` : '';
      return `https://gh-trending-api.herokuapp.com/repositories${lang}`;
    },
    parseResponse: async (response) => {
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const data = await response.json();
      return data.map(normalizeRepository);
    }
  },
  {
    name: 'github-search',
    getRepositories: ({ period, language, query }) => {
      const params = new URLSearchParams({
        q: query || `created:>${getDaysAgo(period)}`,
        sort: 'stars',
        order: 'desc',
        per_page: '50'
      });
      if (language) params.set('q', `${params.get('q')}+language:${language}`);
      return `https://api.github.com/search/repositories?${params}`;
    },
    parseResponse: async (response) => {
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const data = await response.json();
      return data.items.map(normalizeRepository);
    }
  }
];

function getDaysAgo(period) {
  const days = { daily: 1, weekly: 7, monthly: 30 };
  const date = new Date();
  date.setDate(date.getDate() - (days[period] || 7));
  return date.toISOString().split('T')[0];
}

// 统一数据格式
function normalizeRepository(repo) {
  return {
    id: repo.id || repo.fullName,
    name: repo.name || repo.fullName,
    owner: repo.owner?.login || repo.owner || '',
    description: repo.description || '',
    language: repo.language || '',
    stars: repo.stars || repo.stargazersCount || 0,
    forks: repo.forks || repo.forksCount || 0,
    watchers: repo.watchers || repo.watchersCount || 0,
    starsToday: repo.starsToday || 0,
    starsWeekly: repo.starsWeekly || 0,
    updatedAt: repo.updatedAt || repo.updated_at || '',
    url: repo.url || repo.htmlUrl || '',
    avatar: repo.owner?.avatarUrl || repo.owner?.avatar_url || '',
    currentPeriodStars: repo.currentPeriodStars || 0
  };
}
```

**Step 2: 创建 src/api/github.js**

```js
import { API_SOURCES } from './sources.js';

export class GitHubTrendingAPI {
  constructor() {
    this.currentSourceIndex = 0;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟
  }

  async fetchRepositories(options = {}) {
    const { period = 'weekly', language = '', sort = 'trending', query = '' } = options;

    // 检查缓存
    const cacheKey = JSON.stringify({ period, language, sort, query });
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // 尝试所有数据源
    let lastError;
    for (let i = 0; i < API_SOURCES.length; i++) {
      const source = API_SOURCES[(this.currentSourceIndex + i) % API_SOURCES.length];
      try {
        const url = source.getRepositories({ period, language, query });
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GitHubStar'
          }
        });

        const data = await source.parseResponse(response);

        // 缓存结果
        this.cache.set(cacheKey, { data, timestamp: Date.now() });

        // 更新当前源索引
        this.currentSourceIndex = (this.currentSourceIndex + i) % API_SOURCES.length;

        return {
          data,
          source: source.name,
          isFallback: i > 0
        };
      } catch (error) {
        console.warn(`Source ${source.name} failed:`, error.message);
        lastError = error;
      }
    }

    throw new Error(`所有数据源均不可用: ${lastError.message}`);
  }

  async fetchTrending(options) {
    return this.fetchRepositories(options);
  }

  async search({ query, language }) {
    return this.fetchRepositories({ query, language, sort: 'trending' });
  }

  clearCache() {
    this.cache.clear();
  }
}

export const api = new GitHubTrendingAPI();
```

**Step 3: 提交**

```bash
git add src/api/
git commit -m "feat: add API sources with fallback strategy"
```

---

## Task 3: 状态管理

**Files:**
- Create: `src/state/store.js` - 简单状态管理

**Step 1: 创建 src/state/store.js**

```js
import { api } from '../api/github.js';

// 状态定义
const state = {
  repositories: [],
  loading: false,
  error: null,
  filters: {
    period: 'weekly',
    language: '',
    query: ''
  },
  source: null,
  isFallback: false
};

// 订阅者
const listeners = new Set();

// 从 URL 读取初始状态
function initFromURL() {
  const params = new URLSearchParams(window.location.search);
  state.filters.period = params.get('period') || 'weekly';
  state.filters.language = params.get('language') || '';
  state.filters.query = params.get('q') || '';

  // 从 localStorage 读取用户偏好
  const saved = localStorage.getItem('githubstar-filters');
  if (saved && !state.filters.period && !state.filters.language) {
    const parsed = JSON.parse(saved);
    state.filters = { ...state.filters, ...parsed };
  }
}

// 更新 URL
function updateURL() {
  const params = new URLSearchParams();
  if (state.filters.period) params.set('period', state.filters.period);
  if (state.filters.language) params.set('language', state.filters.language);
  if (state.filters.query) params.set('q', state.filters.query);

  const newURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newURL);
}

// 保存偏好到 localStorage
function savePreferences() {
  localStorage.setItem('githubstar-filters', JSON.stringify(state.filters));
}

// 获取状态
export function getState() {
  return { ...state };
}

// 订阅状态变化
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 通知订阅者
function notify() {
  listeners.forEach(listener => listener({ ...state }));
}

// 设置筛选条件
export function setFilters(newFilters) {
  state.filters = { ...state.filters, ...newFilters };
  updateURL();
  savePreferences();
  notify();
}

// 加载数据
export async function loadRepositories() {
  state.loading = true;
  state.error = null;
  notify();

  try {
    const result = await api.fetchRepositories(state.filters);
    state.repositories = result.data;
    state.source = result.source;
    state.isFallback = result.isFallback;
    state.loading = false;
    notify();
  } catch (error) {
    state.error = error.message;
    state.loading = false;
    state.repositories = [];
    notify();
  }
}

// 重试加载
export function retry() {
  api.clearCache();
  return loadRepositories();
}

// 初始化
initFromURL();
```

**Step 2: 提交**

```bash
git add src/state/
git commit -m "feat: add state management with URL sync and localStorage"
```

---

## Task 4: 筛选器 UI 组件

**Files:**
- Create: `src/ui/filters.js` - 筛选器组件

**Step 1: 创建 src/ui/filters.js**

```js
// 筛选选项配置
export const FILTER_OPTIONS = {
  period: [
    { value: 'daily', label: '今日' },
    { value: 'weekly', label: '本周' },
    { value: 'monthly', label: '本月' }
  ],
  language: [
    { value: '', label: '全部语言' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' }
  ]
};

// 创建筛选器 HTML
export function createFilters(state) {
  const container = document.createElement('div');
  container.className = 'filters';

  // 时间周期选择
  const periodGroup = createSelectGroup('时间', FILTER_OPTIONS.period, state.filters.period, (value) => {
    window.setFilters({ period: value });
  });

  // 语言选择
  const langGroup = createSelectGroup('语言', FILTER_OPTIONS.language, state.filters.language, (value) => {
    window.setFilters({ language: value });
  });

  // 搜索框
  const searchGroup = createSearchGroup(state.filters.query, (value) => {
    window.setFilters({ query: value });
  });

  container.appendChild(periodGroup);
  container.appendChild(langGroup);
  container.appendChild(searchGroup);

  return container;
}

function createSelectGroup(label, options, value, onChange) {
  const group = document.createElement('div');
  group.className = 'filter-group';

  const select = document.createElement('select');
  select.className = 'filter-select';
  select.setAttribute('aria-label', label);

  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === value) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => onChange(e.target.value));

  group.appendChild(select);
  return group;
}

function createSearchGroup(value, onChange) {
  let debounceTimer;

  const group = document.createElement('div');
  group.className = 'filter-group filter-search';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'filter-input';
  input.placeholder = '搜索项目...';
  input.value = value;

  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onChange(e.target.value);
    }, 300);
  });

  group.appendChild(input);
  return group;
}

// 筛选器样式
export const filterStyles = `
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
    background: var(--bg-alt);
    border-radius: 8px;
    margin-bottom: 24px;
  }

  .filter-group {
    display: flex;
    align-items: center;
  }

  .filter-select,
  .filter-input {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 14px;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
  }

  .filter-select:hover,
  .filter-input:hover {
    border-color: var(--accent);
  }

  .filter-select:focus,
  .filter-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
  }

  .filter-input {
    width: 200px;
  }

  .filter-search {
    flex: 1;
    min-width: 200px;
  }

  .filter-search .filter-input {
    width: 100%;
  }

  @media (max-width: 600px) {
    .filters {
      flex-direction: column;
    }

    .filter-search .filter-input {
      width: 100%;
    }
  }
`;
```

**Step 2: 提交**

```bash
git add src/ui/filters.js
git commit -m "feat: add filter UI component"
```

---

## Task 5: 项目卡片组件

**Files:**
- Create: `src/ui/card.js` - 项目卡片渲染

**Step 1: 创建 src/ui/card.js**

```js
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
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

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
```

**Step 2: 提交**

```bash
git add src/ui/card.js
git commit -m "feat: add repository card component"
```

---

## Task 6: 加载与错误状态组件

**Files:**
- Create: `src/ui/status.js` - 状态显示组件

**Step 1: 创建 src/ui/status.js**

```js
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
```

**Step 2: 提交**

```bash
git add src/ui/status.js
git commit -m "feat: add loading and error status components"
```

---

## Task 7: 页面布局组件

**Files:**
- Create: `src/ui/layout.js` - 页面布局

**Step 1: 创建 src/ui/layout.js**

```js
// 创建页面头部
export function createHeader() {
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-content">
      <div class="logo">
        <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <span>GitHubStar</span>
      </div>
      <p class="tagline">发现 GitHub 上最热门的项目</p>
    </div>
  `;
  return header;
}

// 创建页面主体
export function createMain() {
  const main = document.createElement('main');
  main.className = 'main';
  return main;
}

// 创建页面底部
export function createFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <p>数据来源: GitHub Trending API | 由 <a href="https://github.com" target="_blank">GitHub</a> 驱动</p>
  `;
  return footer;
}

// 布局样式
export const layoutStyles = `
  .header {
    padding: 24px 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 700;
  }

  .logo svg {
    color: var(--primary);
  }

  .tagline {
    margin-top: 8px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
    min-height: calc(100vh - 200px);
  }

  .footer {
    padding: 24px 0;
    border-top: 1px solid var(--border);
    margin-top: 48px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .footer a {
    color: var(--accent);
    text-decoration: none;
  }

  .footer a:hover {
    text-decoration: underline;
  }
`;
```

**Step 2: 提交**

```bash
git add src/ui/layout.js
git commit -m "feat: add page layout components"
```

---

## Task 8: 整合所有组件

**Files:**
- Modify: `src/app.js` - 主应用入口
- Modify: `src/styles.css` - 导入所有样式

**Step 1: 更新 src/styles.css（导入所有组件样式）**

```css
:root {
  --primary: #24292f;
  --secondary: #57606a;
  --accent: #0969da;
  --bg: #ffffff;
  --bg-alt: #f6f8fa;
  --border: #d0d7de;
  --text: #24292f;
  --text-secondary: #57606a;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

**Step 2: 更新 src/app.js（整合所有组件）**

```js
import { subscribe, setFilters, loadRepositories, retry, getState } from './state/store.js';
import { createFilters, filterStyles } from './ui/filters.js';
import { createCardGrid, cardStyles } from './ui/card.js';
import { createLoading, createError, createFallbackAlert, createResultCount, statusStyles } from './ui/status.js';
import { createHeader, createMain, createFooter, layoutStyles } from './ui/layout.js';

// 注入所有样式
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    ${layoutStyles}
    ${filterStyles}
    ${cardStyles}
    ${statusStyles}
  `;
  document.head.appendChild(style);
}

// 渲染应用
function render(state) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // 头部
  app.appendChild(createHeader());

  // 主体
  const main = createMain();

  // 降级提示
  if (state.isFallback && state.source) {
    main.appendChild(createFallbackAlert(state.source));
  }

  // 筛选器
  main.appendChild(createFilters(state));

  // 状态显示或结果
  if (state.loading) {
    main.appendChild(createLoading());
  } else if (state.error) {
    main.appendChild(createError(state.error, retry));
  } else if (state.repositories.length > 0) {
    main.appendChild(createResultCount(state.repositories.length, state.source));
    main.appendChild(createCardGrid(state.repositories));
  } else {
    main.appendChild(createCardGrid([]));
  }

  app.appendChild(main);

  // 底部
  app.appendChild(createFooter());

  // 绑定筛选器事件
  window.setFilters = setFilters;
}

// 初始化
function init() {
  injectStyles();

  // 订阅状态变化
  subscribe((state) => {
    render(state);
  });

  // 初始渲染
  render(getState());

  // 加载数据
  loadRepositories();
}

// 启动应用
init();
```

**Step 3: 提交**

```bash
git add src/app.js src/styles.css
git commit -m "feat: integrate all components into main app"
```

---

## Task 9: 测试与验证

**Step 1: 启动开发服务器**

```bash
npm run dev
```

预期：服务器启动成功，访问 http://localhost:5173 看到页面

**Step 2: 验证功能**

- [ ] 页面正确显示头部、筛选器、内容区
- [ ] 加载状态显示正常
- [ ] 数据加载成功显示项目卡片
- [ ] 时间周期筛选工作正常
- [ ] 语言筛选工作正常
- [ ] 搜索功能工作正常（防抖）
- [ ] URL 同步工作正常
- [ ] 点击卡片跳转到 GitHub
- [ ] 响应式布局正常

**Step 3: 构建生产版本**

```bash
npm run build
npm run preview
```

预期：构建成功，预览正常

**Step 4: 提交**

```bash
git add -A
git commit -m "test: verify all features work correctly"
```

---

## Task 10: 部署准备

**Files:**
- Create: `README.md` - 项目说明

**Step 1: 创建 README.md**

```markdown
# GitHubStar

发现 GitHub 上最热门的项目

## 功能

- 多维度热门：Trending 排行、Star 增长最快
- 语言筛选：支持 10+ 种编程语言
- 时间筛选：今日/本周/本月
- 关键词搜索：快速找到感兴趣的项目
- 响应式设计：支持桌面、平板、手机

## 本地开发

\`\`\`bash
npm install
npm run dev
\`\`\`

## 构建

\`\`\`bash
npm run build
\`\`\`

## 数据来源

- [GitHub Trending API](https://github.com/hyr0n/py-Github-Trending-Api)
- [GitHub Search API](https://docs.github.com/en/rest/search)

## License

MIT
```

**Step 2: 最终提交**

```bash
git add README.md
git commit -m "docs: add README"

git tag v1.0.0
```

**Step 3: 合并到 main**

\`\`\`bash
git checkout main
git merge feature/impl
\`\`\`

---

## 完成

实施完成后：
1. 所有功能正常工作
2. 代码已提交到 feature/impl 分支
3. 已合并到 main 分支
4. 可以部署到 GitHub Pages / Netlify / Vercel
