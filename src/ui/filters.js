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
