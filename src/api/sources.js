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
