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
