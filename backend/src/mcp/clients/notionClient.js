// Notion MCP Client
export class NotionClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.notion.com/v1';
    this.version = '2022-06-28';
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Notion-Version': this.version,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  async searchPages(query) {
    return this.makeRequest('/search', 'POST', {
      query,
      filter: {
        property: 'object',
        value: 'page'
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    });
  }

  async getPage(pageId) {
    return this.makeRequest(`/pages/${pageId}`);
  }

  async getPageContent(pageId) {
    return this.makeRequest(`/blocks/${pageId}/children`);
  }

  async getDatabase(databaseId) {
    return this.makeRequest(`/databases/${databaseId}`);
  }

  async queryDatabase(databaseId, filter = {}) {
    return this.makeRequest(`/databases/${databaseId}/query`, 'POST', filter);
  }

  async listDatabases() {
    return this.makeRequest('/search', 'POST', {
      filter: {
        property: 'object',
        value: 'database'
      }
    });
  }
}

