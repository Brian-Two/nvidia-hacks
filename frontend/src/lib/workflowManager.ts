/**
 * Workflow Management System for ASTAR
 * Manages MCP server workflows, connections, and user preferences
 */

export interface MCPServer {
  id: string;
  name: string;
  type: 'canvas' | 'github' | 'notion' | 'custom';
  connected: boolean;
  requiresAuth: boolean;
  apiToken?: string;
  description: string;
}

export interface WorkflowStep {
  serverId: string;
  serverName: string;
  action: string; // e.g., "fetch_assignment", "create_repo", "save_to_notion"
  description: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  rating?: 'up' | 'down'; // User rating
  usageCount: number;
  createdAt: Date;
  lastUsedAt: Date;
  tags: string[]; // e.g., ['assignment', 'github', 'coding']
}

const WORKFLOWS_KEY = 'astar_workflows';
const MCP_SERVERS_KEY = 'astar_mcp_servers';

// Default MCP Servers
const DEFAULT_MCP_SERVERS: MCPServer[] = [
  {
    id: 'canvas',
    name: 'Canvas LMS',
    type: 'canvas',
    connected: true, // Assume already connected
    requiresAuth: true,
    description: 'Access assignments, courses, and submissions from Canvas',
  },
  {
    id: 'github',
    name: 'GitHub',
    type: 'github',
    connected: false,
    requiresAuth: true,
    description: 'Create repositories, manage code, and collaborate',
  },
  {
    id: 'notion',
    name: 'Notion',
    type: 'notion',
    connected: false,
    requiresAuth: true,
    description: 'Save notes, organize knowledge, and track progress',
  },
];

// Workflow Management
export const getWorkflows = (): Workflow[] => {
  try {
    const saved = localStorage.getItem(WORKFLOWS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load workflows:', error);
    return [];
  }
};

export const saveWorkflows = (workflows: Workflow[]): void => {
  try {
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
  } catch (error) {
    console.error('Failed to save workflows:', error);
  }
};

export const createWorkflow = (
  name: string,
  description: string,
  steps: WorkflowStep[],
  tags: string[] = []
): Workflow => {
  const newWorkflow: Workflow = {
    id: `workflow-${Date.now()}`,
    name,
    description,
    steps,
    usageCount: 0,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    tags,
  };

  const workflows = getWorkflows();
  workflows.push(newWorkflow);
  saveWorkflows(workflows);

  return newWorkflow;
};

export const updateWorkflow = (workflowId: string, updates: Partial<Workflow>): void => {
  const workflows = getWorkflows();
  const workflow = workflows.find(w => w.id === workflowId);
  
  if (workflow) {
    Object.assign(workflow, updates);
    saveWorkflows(workflows);
  }
};

export const rateWorkflow = (workflowId: string, rating: 'up' | 'down'): void => {
  updateWorkflow(workflowId, { rating });
};

export const incrementWorkflowUsage = (workflowId: string): void => {
  const workflows = getWorkflows();
  const workflow = workflows.find(w => w.id === workflowId);
  
  if (workflow) {
    workflow.usageCount += 1;
    workflow.lastUsedAt = new Date();
    saveWorkflows(workflows);
  }
};

export const deleteWorkflow = (workflowId: string): void => {
  const workflows = getWorkflows().filter(w => w.id !== workflowId);
  saveWorkflows(workflows);
};

export const getWorkflowById = (workflowId: string): Workflow | undefined => {
  return getWorkflows().find(w => w.id === workflowId);
};

export const searchWorkflows = (query: string): Workflow[] => {
  const workflows = getWorkflows();
  const lowerQuery = query.toLowerCase();
  
  return workflows.filter(w => 
    w.name.toLowerCase().includes(lowerQuery) ||
    w.description.toLowerCase().includes(lowerQuery) ||
    w.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// MCP Server Management
export const getMCPServers = (): MCPServer[] => {
  try {
    const saved = localStorage.getItem(MCP_SERVERS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_MCP_SERVERS;
  } catch (error) {
    console.error('Failed to load MCP servers:', error);
    return DEFAULT_MCP_SERVERS;
  }
};

export const saveMCPServers = (servers: MCPServer[]): void => {
  try {
    localStorage.setItem(MCP_SERVERS_KEY, JSON.stringify(servers));
  } catch (error) {
    console.error('Failed to save MCP servers:', error);
  }
};

export const connectMCPServer = (serverId: string, apiToken?: string): void => {
  const servers = getMCPServers();
  const server = servers.find(s => s.id === serverId);
  
  if (server) {
    server.connected = true;
    if (apiToken) {
      server.apiToken = apiToken;
    }
    saveMCPServers(servers);
  }
};

export const disconnectMCPServer = (serverId: string): void => {
  const servers = getMCPServers();
  const server = servers.find(s => s.id === serverId);
  
  if (server) {
    server.connected = false;
    server.apiToken = undefined;
    saveMCPServers(servers);
  }
};

export const getMCPServerById = (serverId: string): MCPServer | undefined => {
  return getMCPServers().find(s => s.id === serverId);
};

export const getConnectedServers = (): MCPServer[] => {
  return getMCPServers().filter(s => s.connected);
};

export const getDisconnectedServers = (): MCPServer[] => {
  return getMCPServers().filter(s => !s.connected);
};

// Task/Assignment Detection Helpers
export const detectRequiredServers = (userMessage: string, assignmentDescription?: string): string[] => {
  const requiredServers: string[] = [];
  const text = (userMessage + ' ' + (assignmentDescription || '')).toLowerCase();

  // GitHub detection
  if (
    text.includes('github') ||
    text.includes('repository') ||
    text.includes('repo') ||
    text.includes('push code') ||
    text.includes('commit') ||
    text.includes('version control')
  ) {
    requiredServers.push('github');
  }

  // Notion detection
  if (
    text.includes('notion') ||
    text.includes('notes') ||
    text.includes('document') ||
    text.includes('organize')
  ) {
    requiredServers.push('notion');
  }

  // Canvas is always available
  if (
    text.includes('assignment') ||
    text.includes('canvas') ||
    text.includes('submit') ||
    text.includes('due date')
  ) {
    requiredServers.push('canvas');
  }

  return [...new Set(requiredServers)]; // Remove duplicates
};

export const isTaskOrAssignment = (userMessage: string): boolean => {
  const lowerMessage = userMessage.toLowerCase();
  
  const taskKeywords = [
    'help me',
    'get started',
    'how do i',
    'assignment',
    'project',
    'homework',
    'task',
    'submit',
    'complete',
    'finish',
    'work on',
    'need to',
    'have to',
  ];

  return taskKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Workflow Suggestion
export const suggestWorkflowForTask = (
  userMessage: string,
  assignmentDescription?: string
): Workflow | null => {
  const requiredServers = detectRequiredServers(userMessage, assignmentDescription);
  const workflows = getWorkflows();

  // Find workflows that match the required servers
  for (const workflow of workflows) {
    const workflowServers = workflow.steps.map(step => step.serverId);
    const hasAllServers = requiredServers.every(server => 
      workflowServers.includes(server)
    );

    if (hasAllServers && workflow.rating === 'up') {
      return workflow;
    }
  }

  return null;
};

// Create default workflows
export const initializeDefaultWorkflows = (): void => {
  const existing = getWorkflows();
  if (existing.length > 0) return; // Already initialized

  const defaultWorkflows: Workflow[] = [
    {
      id: 'workflow-canvas-github',
      name: 'Canvas → GitHub',
      description: 'Fetch assignment from Canvas and create GitHub repository',
      steps: [
        {
          serverId: 'canvas',
          serverName: 'Canvas LMS',
          action: 'fetch_assignment',
          description: 'Get assignment details and requirements',
        },
        {
          serverId: 'github',
          serverName: 'GitHub',
          action: 'create_repo',
          description: 'Create repository with assignment structure',
        },
      ],
      usageCount: 0,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      tags: ['assignment', 'coding', 'github'],
    },
    {
      id: 'workflow-canvas-github-notion',
      name: 'Canvas → GitHub → Notion',
      description: 'Complete workflow: Assignment to code to notes',
      steps: [
        {
          serverId: 'canvas',
          serverName: 'Canvas LMS',
          action: 'fetch_assignment',
          description: 'Get assignment details',
        },
        {
          serverId: 'github',
          serverName: 'GitHub',
          action: 'create_repo',
          description: 'Set up code repository',
        },
        {
          serverId: 'notion',
          serverName: 'Notion',
          action: 'create_page',
          description: 'Create project notes and tracker',
        },
      ],
      usageCount: 0,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      tags: ['assignment', 'organization', 'full-workflow'],
    },
  ];

  saveWorkflows(defaultWorkflows);
};

