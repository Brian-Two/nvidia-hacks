// Google Drive MCP Client
export class GoogleDriveClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.googleapis.com/drive/v3';
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  async searchFiles(query, limit = 10) {
    const q = encodeURIComponent(query);
    return this.makeRequest(`/files?q=fullText contains '${q}'&pageSize=${limit}&fields=files(id,name,mimeType,webViewLink,modifiedTime)`);
  }

  async getFile(fileId) {
    return this.makeRequest(`/files/${fileId}?fields=id,name,mimeType,webViewLink,modifiedTime,description`);
  }

  async getFileContent(fileId) {
    // For text files, get the actual content
    return this.makeRequest(`/files/${fileId}?alt=media`);
  }

  async listFiles(limit = 20) {
    return this.makeRequest(`/files?pageSize=${limit}&fields=files(id,name,mimeType,webViewLink,modifiedTime)&orderBy=modifiedTime desc`);
  }

  async exportFile(fileId, mimeType = 'text/plain') {
    // Export Google Docs/Sheets/Slides to standard formats
    return this.makeRequest(`/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`);
  }
}

