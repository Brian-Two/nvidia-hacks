// GitHub MCP Client
export class GitHubClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.github.com';
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `token ${this.apiKey}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  async searchRepositories(query, limit = 10) {
    return this.makeRequest(`/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}`);
  }

  async getFile(owner, repo, path, ref = 'main') {
    return this.makeRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);
  }

  async getRepository(owner, repo) {
    return this.makeRequest(`/repos/${owner}/${repo}`);
  }

  async listUserRepos() {
    return this.makeRequest('/user/repos?per_page=100&sort=updated');
  }

  async searchCode(query, limit = 10) {
    return this.makeRequest(`/search/code?q=${encodeURIComponent(query)}&per_page=${limit}`);
  }
}

