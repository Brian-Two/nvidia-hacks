// MCP Server Manager - Handle multiple MCP server connections
import 'dotenv/config';
import { canvasClient } from '../canvasMCP.js';
import { createGitHubClient } from './clients/githubMCP.js';

// In-memory storage for MCP servers (replace with database in production)
const mcpServers = new Map();

// MCP Server Types
export const MCP_TYPES = {
  CANVAS: 'canvas',
  GOOGLE_DRIVE: 'google_drive',
  GITHUB: 'github',
  NOTION: 'notion',
  SLACK: 'slack',
  CUSTOM: 'custom'
};

// MCP Server Configuration Class
class MCPServer {
  constructor(config) {
    this.id = config.id || `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = config.type;
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.config = config.config || {}; // Additional configuration
    this.status = 'disconnected';
    this.lastSync = null;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  async testConnection() {
    try {
      switch (this.type) {
        case MCP_TYPES.CANVAS:
          return await this.testCanvasConnection();
        case MCP_TYPES.GOOGLE_DRIVE:
          return await this.testGoogleDriveConnection();
        case MCP_TYPES.GITHUB:
          return await this.testGitHubConnection();
        case MCP_TYPES.NOTION:
          return await this.testNotionConnection();
        case MCP_TYPES.SLACK:
          return await this.testSlackConnection();
        case MCP_TYPES.CUSTOM:
          return await this.testCustomConnection();
        default:
          throw new Error(`Unknown MCP type: ${this.type}`);
      }
    } catch (error) {
      this.status = 'error';
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testCanvasConnection() {
    const testClient = canvasClient;
    testClient.token = this.apiKey;
    if (this.apiUrl) {
      testClient.baseUrl = this.apiUrl;
    }

    const courses = await testClient.getCourses();
    
    if (courses.error) {
      this.status = 'error';
      return { success: false, error: courses.error };
    }

    this.status = 'connected';
    this.lastSync = new Date().toISOString();
    return { 
      success: true, 
      message: 'Canvas connected successfully',
      data: { courseCount: courses.length }
    };
  }

  async testGoogleDriveConnection() {
    // Google Drive API test
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      this.status = 'error';
      return { 
        success: false, 
        error: 'Invalid Google Drive API key or insufficient permissions' 
      };
    }

    const data = await response.json();
    this.status = 'connected';
    this.lastSync = new Date().toISOString();
    return { 
      success: true, 
      message: 'Google Drive connected successfully',
      data: { user: data.user?.emailAddress }
    };
  }

  async testGitHubConnection() {
    try {
      const githubClient = createGitHubClient(this.apiKey);
      const result = await githubClient.testConnection();
      
      if (!result.success) {
        this.status = 'error';
        return { 
          success: false, 
          error: result.error || 'Invalid GitHub token or insufficient permissions' 
        };
      }

      this.status = 'connected';
      this.lastSync = new Date().toISOString();
      return { 
        success: true, 
        message: 'GitHub connected successfully',
        data: { 
          username: result.user, 
          name: result.name,
          email: result.email 
        }
      };
    } catch (error) {
      this.status = 'error';
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get GitHub client instance
  getGitHubClient() {
    if (this.type !== MCP_TYPES.GITHUB) {
      throw new Error('Not a GitHub MCP server');
    }
    if (this.status !== 'connected') {
      throw new Error('GitHub MCP not connected');
    }
    return createGitHubClient(this.apiKey);
  }

  async testNotionConnection() {
    // Notion API test
    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      this.status = 'error';
      return { 
        success: false, 
        error: 'Invalid Notion integration token' 
      };
    }

    const data = await response.json();
    this.status = 'connected';
    this.lastSync = new Date().toISOString();
    return { 
      success: true, 
      message: 'Notion connected successfully',
      data: { user: data.name }
    };
  }

  async testSlackConnection() {
    // Slack API test
    const response = await fetch('https://slack.com/api/auth.test', {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    const data = await response.json();
    
    if (!data.ok) {
      this.status = 'error';
      return { 
        success: false, 
        error: data.error || 'Invalid Slack token' 
      };
    }

    this.status = 'connected';
    this.lastSync = new Date().toISOString();
    return { 
      success: true, 
      message: 'Slack connected successfully',
      data: { team: data.team, user: data.user }
    };
  }

  async testCustomConnection() {
    // Custom MCP server test (generic HTTP health check)
    if (!this.apiUrl) {
      return { success: false, error: 'API URL required for custom server' };
    }

    const healthEndpoint = this.config.healthEndpoint || '/health';
    const response = await fetch(`${this.apiUrl}${healthEndpoint}`, {
      headers: this.apiKey ? {
        'Authorization': `Bearer ${this.apiKey}`
      } : {}
    });

    if (!response.ok) {
      this.status = 'error';
      return { 
        success: false, 
        error: `Custom server returned ${response.status}` 
      };
    }

    this.status = 'connected';
    this.lastSync = new Date().toISOString();
    return { 
      success: true, 
      message: 'Custom server connected successfully'
    };
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      apiUrl: this.apiUrl,
      status: this.status,
      lastSync: this.lastSync,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Don't expose API keys in responses
      hasApiKey: !!this.apiKey
    };
  }
}

// MCP Manager Class
export class MCPManager {
  constructor() {
    this.servers = mcpServers;
    this.loadFromEnv();
  }

  loadFromEnv() {
    // Load Canvas from .env if available
    if (process.env.CANVAS_API_TOKEN) {
      const canvasServer = new MCPServer({
        id: 'canvas_default',
        type: MCP_TYPES.CANVAS,
        name: 'Canvas LMS',
        apiKey: process.env.CANVAS_API_TOKEN,
        apiUrl: process.env.CANVAS_API_URL || 'https://canvas.instructure.com/api/v1'
      });
      this.servers.set('canvas_default', canvasServer);
    }
  }

  addServer(config) {
    const server = new MCPServer(config);
    this.servers.set(server.id, server);
    return server;
  }

  getServer(id) {
    return this.servers.get(id);
  }

  getAllServers() {
    return Array.from(this.servers.values());
  }

  getServersByType(type) {
    return this.getAllServers().filter(s => s.type === type);
  }

  getConnectedServers() {
    return this.getAllServers().filter(s => s.status === 'connected');
  }

  updateServer(id, updates) {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server ${id} not found`);
    }

    // Update allowed fields
    if (updates.name) server.name = updates.name;
    if (updates.apiKey) server.apiKey = updates.apiKey;
    if (updates.apiUrl) server.apiUrl = updates.apiUrl;
    if (updates.config) server.config = { ...server.config, ...updates.config };
    
    server.updatedAt = new Date().toISOString();
    return server;
  }

  async deleteServer(id) {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server ${id} not found`);
    }
    
    this.servers.delete(id);
    return { success: true, message: `Server ${id} deleted` };
  }

  async testServer(id) {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server ${id} not found`);
    }

    return await server.testConnection();
  }

  async testAllServers() {
    const results = [];
    for (const server of this.servers.values()) {
      const result = await server.testConnection();
      results.push({
        id: server.id,
        name: server.name,
        type: server.type,
        ...result
      });
    }
    return results;
  }

  // Get tools from all connected MCP servers
  async getAvailableTools() {
    const tools = [];
    
    // Canvas tools
    const canvasServers = this.getServersByType(MCP_TYPES.CANVAS)
      .filter(s => s.status === 'connected');
    
    if (canvasServers.length > 0) {
      tools.push(
        {
          name: 'list_upcoming_assignments',
          description: 'List upcoming assignments from Canvas',
          mcpType: MCP_TYPES.CANVAS
        },
        {
          name: 'get_course_materials',
          description: 'Get course materials from Canvas',
          mcpType: MCP_TYPES.CANVAS
        },
        {
          name: 'get_assignment_details',
          description: 'Get assignment details from Canvas',
          mcpType: MCP_TYPES.CANVAS
        }
      );
    }

    // GitHub tools
    const githubServers = this.getServersByType(MCP_TYPES.GITHUB)
      .filter(s => s.status === 'connected');
    
    if (githubServers.length > 0) {
      tools.push(
        {
          name: 'github_create_repo',
          description: 'Create a new GitHub repository with README, .gitignore, and license. Use this to set up new projects.',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Repository name (e.g., "learning-styles-ml")' },
              description: { type: 'string', description: 'Repository description' },
              private: { type: 'boolean', description: 'Make repository private (default: false)' },
              autoInit: { type: 'boolean', description: 'Initialize with README (default: true)' },
              gitignoreTemplate: { type: 'string', description: 'Language for .gitignore (e.g., "Python", "Node", "TeX")' },
              licenseTemplate: { type: 'string', description: 'License type (e.g., "mit", "apache-2.0")' }
            },
            required: ['name']
          }
        },
        {
          name: 'github_create_file',
          description: 'Create a new file in a GitHub repository. Use this to add code, documentation, or configuration files.',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner (username)' },
              repo: { type: 'string', description: 'Repository name' },
              path: { type: 'string', description: 'File path (e.g., "README.md", "src/main.py", "paper/main.tex")' },
              content: { type: 'string', description: 'File content' },
              message: { type: 'string', description: 'Commit message (e.g., "Add initial paper structure")' },
              branch: { type: 'string', description: 'Branch name (optional, default: main)' }
            },
            required: ['owner', 'repo', 'path', 'content']
          }
        },
        {
          name: 'github_update_file',
          description: 'Update an existing file in a GitHub repository',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner (username)' },
              repo: { type: 'string', description: 'Repository name' },
              path: { type: 'string', description: 'File path' },
              content: { type: 'string', description: 'New file content' },
              message: { type: 'string', description: 'Commit message' },
              sha: { type: 'string', description: 'Current file SHA (required for updates)' },
              branch: { type: 'string', description: 'Branch name (optional)' }
            },
            required: ['owner', 'repo', 'path', 'content', 'sha']
          }
        },
        {
          name: 'github_get_file',
          description: 'Get file contents from a GitHub repository',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner (username)' },
              repo: { type: 'string', description: 'Repository name' },
              path: { type: 'string', description: 'File path' },
              branch: { type: 'string', description: 'Branch name (optional)' }
            },
            required: ['owner', 'repo', 'path']
          }
        },
        {
          name: 'github_create_branch',
          description: 'Create a new branch in a GitHub repository',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner (username)' },
              repo: { type: 'string', description: 'Repository name' },
              branch: { type: 'string', description: 'New branch name' },
              fromBranch: { type: 'string', description: 'Source branch (default: "main")' }
            },
            required: ['owner', 'repo', 'branch']
          }
        },
        {
          name: 'github_list_repos',
          description: 'List user\'s GitHub repositories',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              sort: { type: 'string', description: 'Sort by: "created", "updated", "pushed", "full_name"' },
              perPage: { type: 'number', description: 'Results per page (default: 30)' }
            }
          }
        },
        {
          name: 'github_get_repo',
          description: 'Get details about a specific GitHub repository',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner (username)' },
              repo: { type: 'string', description: 'Repository name' }
            },
            required: ['owner', 'repo']
          }
        },
        {
          name: 'github_create_issue',
          description: 'Create an issue in a GitHub repository',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner (username)' },
              repo: { type: 'string', description: 'Repository name' },
              title: { type: 'string', description: 'Issue title' },
              body: { type: 'string', description: 'Issue description' },
              labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' }
            },
            required: ['owner', 'repo', 'title']
          }
        },
        {
          name: 'search_github_repos',
          description: 'Search GitHub repositories by keyword',
          mcpType: MCP_TYPES.GITHUB,
          input_schema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              sort: { type: 'string', description: 'Sort by: "stars", "forks", "updated"' },
              order: { type: 'string', description: 'Order: "asc" or "desc"' }
            },
            required: ['query']
          }
        }
      );
    }

    // Google Drive tools
    const driveServers = this.getServersByType(MCP_TYPES.GOOGLE_DRIVE)
      .filter(s => s.status === 'connected');
    
    if (driveServers.length > 0) {
      tools.push(
        {
          name: 'search_drive_files',
          description: 'Search Google Drive files',
          mcpType: MCP_TYPES.GOOGLE_DRIVE
        },
        {
          name: 'get_drive_file',
          description: 'Get file from Google Drive',
          mcpType: MCP_TYPES.GOOGLE_DRIVE
        }
      );
    }

    // Notion tools
    const notionServers = this.getServersByType(MCP_TYPES.NOTION)
      .filter(s => s.status === 'connected');
    
    if (notionServers.length > 0) {
      tools.push(
        {
          name: 'search_notion_pages',
          description: 'Search Notion pages',
          mcpType: MCP_TYPES.NOTION
        },
        {
          name: 'get_notion_page',
          description: 'Get Notion page content',
          mcpType: MCP_TYPES.NOTION
        }
      );
    }

    // Slack tools
    const slackServers = this.getServersByType(MCP_TYPES.SLACK)
      .filter(s => s.status === 'connected');
    
    if (slackServers.length > 0) {
      tools.push(
        {
          name: 'search_slack_messages',
          description: 'Search Slack messages',
          mcpType: MCP_TYPES.SLACK
        },
        {
          name: 'send_slack_message',
          description: 'Send message to Slack',
          mcpType: MCP_TYPES.SLACK
        }
      );
    }

    return tools;
  }

  // Get statistics
  getStats() {
    const all = this.getAllServers();
    return {
      total: all.length,
      connected: all.filter(s => s.status === 'connected').length,
      disconnected: all.filter(s => s.status === 'disconnected').length,
      error: all.filter(s => s.status === 'error').length,
      byType: {
        canvas: this.getServersByType(MCP_TYPES.CANVAS).length,
        github: this.getServersByType(MCP_TYPES.GITHUB).length,
        google_drive: this.getServersByType(MCP_TYPES.GOOGLE_DRIVE).length,
        notion: this.getServersByType(MCP_TYPES.NOTION).length,
        slack: this.getServersByType(MCP_TYPES.SLACK).length,
        custom: this.getServersByType(MCP_TYPES.CUSTOM).length
      }
    };
  }
}

// Singleton instance
export const mcpManager = new MCPManager();

