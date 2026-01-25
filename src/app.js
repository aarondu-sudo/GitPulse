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
