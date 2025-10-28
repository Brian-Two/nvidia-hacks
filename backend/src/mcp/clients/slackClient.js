// Slack MCP Client
export class SlackClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://slack.com/api';
  }

  async makeRequest(endpoint, method = 'POST', body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, options);
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      return { error: error.message, ok: false };
    }
  }

  async searchMessages(query, limit = 20) {
    return this.makeRequest('search.messages', 'GET', {
      query,
      count: limit
    });
  }

  async sendMessage(channel, text) {
    return this.makeRequest('chat.postMessage', 'POST', {
      channel,
      text
    });
  }

  async listChannels() {
    return this.makeRequest('conversations.list', 'GET', {
      types: 'public_channel,private_channel',
      limit: 100
    });
  }

  async getChannel(channelId) {
    return this.makeRequest('conversations.info', 'GET', {
      channel: channelId
    });
  }

  async getChannelHistory(channelId, limit = 50) {
    return this.makeRequest('conversations.history', 'GET', {
      channel: channelId,
      limit
    });
  }

  async getUser(userId) {
    return this.makeRequest('users.info', 'GET', {
      user: userId
    });
  }

  async listUsers() {
    return this.makeRequest('users.list', 'GET', {
      limit: 100
    });
  }
}

