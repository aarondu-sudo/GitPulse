import { api } from '../api/github.js';

// 状态定义
const state = {
  repositories: [],
  loading: false,
  error: null,
  filters: {
    period: 'weekly',
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
  state.filters.query = params.get('q') || '';

  // 从 localStorage 读取用户偏好
  const saved = localStorage.getItem('githubstar-filters');
  if (saved && !state.filters.period) {
    const parsed = JSON.parse(saved);
    state.filters = { ...state.filters, ...parsed };
  }
}

// 更新 URL
function updateURL() {
  const params = new URLSearchParams();
  if (state.filters.period) params.set('period', state.filters.period);
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

  // Skip API call if only clearing query (no other filters active)
  const isOnlyQueryChange = Object.keys(newFilters).length === 1 && 'query' in newFilters;
  const queryCleared = !state.filters.query;
  const noOtherFilters = state.filters.period === 'weekly';

  if (isOnlyQueryChange && queryCleared && noOtherFilters) {
    // Set empty results without API call
    state.repositories = [];
    notify();
    return;
  }

  // 触发数据加载
  loadRepositories();
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
