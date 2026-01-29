// 筛选选项配置
export const FILTER_OPTIONS = {
  period: [
    { value: 'daily', label: '今日' },
    { value: 'weekly', label: '本周' },
    { value: 'monthly', label: '本月' }
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

  // 搜索框
  const searchGroup = createSearchGroup(state.filters.query, (value) => {
    window.setFilters({ query: value });
  });

  container.appendChild(periodGroup);
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
  const group = document.createElement('div');
  group.className = 'filter-group filter-search';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'filter-input';
  input.placeholder = '搜索项目...';
  input.value = value;

  // Only trigger search on Enter key, not on typing
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      onChange(e.target.value);
    }
  });

  // Add search button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'search-button';
  button.textContent = '搜索';
  button.addEventListener('click', () => {
    onChange(input.value);
  });

  group.appendChild(input);
  group.appendChild(button);
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
    display: flex;
    gap: 8px;
  }

  .filter-search .filter-input {
    flex: 1;
  }

  .search-button {
    padding: 8px 16px;
    border: 1px solid var(--accent);
    border-radius: 6px;
    font-size: 14px;
    background: var(--accent);
    color: white;
    cursor: pointer;
    white-space: nowrap;
  }

  .search-button:hover {
    background: #0766ad;
    border-color: #0766ad;
  }

  .search-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.2);
  }

  @media (max-width: 600px) {
    .filters {
      flex-direction: column;
    }

    .filter-search {
      flex-direction: column;
    }

    .filter-search .filter-input {
      width: 100%;
    }

    .search-button {
      width: 100%;
    }
  }
`;
