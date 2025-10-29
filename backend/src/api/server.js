// ASTAR API Server - Express server wrapping LangGraph workflow
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { buildGraph } from '../graph.js';
import { canvasClient } from '../canvasMCP.js';
import { mcpManager, MCP_TYPES } from '../mcp/mcpManager.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS - Allow multiple frontend origins during development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Canvas Connection Endpoints
app.post('/api/canvas/connect', async (req, res) => {
  try {
    const { apiToken, apiUrl } = req.body;
    
    if (!apiToken) {
      return res.status(400).json({ 
        error: 'Canvas API token is required' 
      });
    }

    // Test connection by fetching courses
    const testClient = canvasClient;
    testClient.token = apiToken;
    if (apiUrl) {
      testClient.baseUrl = apiUrl;
    }

    const courses = await testClient.getCourses();
    
    if (courses.error) {
      return res.status(401).json({ 
        success: false,
        error: courses.error 
      });
    }

    res.json({ 
      success: true,
      message: 'Successfully connected to Canvas',
      courses: courses.slice(0, 5) // Return first 5 courses
    });
  } catch (error) {
    console.error('Canvas connection error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/canvas/status', async (req, res) => {
  try {
    const hasToken = !!canvasClient.token;
    
    if (!hasToken) {
      return res.json({
        connected: false,
        message: 'Canvas API token not configured'
      });
    }

    // Test connection
    const courses = await canvasClient.getCourses();
    
    res.json({
      connected: !courses.error,
      lastSync: new Date().toISOString(),
      courseCount: courses.error ? 0 : courses.length
    });
  } catch (error) {
    res.json({
      connected: false,
      error: error.message
    });
  }
});

// MCP Server Management Endpoints
app.get('/api/mcp/servers', async (req, res) => {
  try {
    const servers = mcpManager.getAllServers();
    res.json({
      success: true,
      count: servers.length,
      servers: servers.map(s => s.toJSON())
    });
  } catch (error) {
    console.error('Get MCP servers error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mcp/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const server = mcpManager.getServer(id);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json({
      success: true,
      server: server.toJSON()
    });
  } catch (error) {
    console.error('Get MCP server error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mcp/servers', async (req, res) => {
  try {
    const { type, name, apiKey, apiUrl, config } = req.body;
    
    if (!type || !name) {
      return res.status(400).json({ 
        error: 'Type and name are required' 
      });
    }

    // Validate type
    if (!Object.values(MCP_TYPES).includes(type)) {
      return res.status(400).json({ 
        error: `Invalid MCP type. Must be one of: ${Object.values(MCP_TYPES).join(', ')}` 
      });
    }

    const server = mcpManager.addServer({
      type,
      name,
      apiKey,
      apiUrl,
      config
    });

    res.json({
      success: true,
      message: 'MCP server added successfully',
      server: server.toJSON()
    });
  } catch (error) {
    console.error('Add MCP server error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/mcp/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const server = mcpManager.updateServer(id, updates);
    
    res.json({
      success: true,
      message: 'MCP server updated successfully',
      server: server.toJSON()
    });
  } catch (error) {
    console.error('Update MCP server error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/mcp/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await mcpManager.deleteServer(id);
    
    res.json(result);
  } catch (error) {
    console.error('Delete MCP server error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mcp/servers/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await mcpManager.testServer(id);
    
    res.json(result);
  } catch (error) {
    console.error('Test MCP server error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/mcp/stats', async (req, res) => {
  try {
    const stats = mcpManager.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get MCP stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mcp/tools', async (req, res) => {
  try {
    const tools = await mcpManager.getAvailableTools();
    res.json({
      success: true,
      count: tools.length,
      tools
    });
  } catch (error) {
    console.error('Get MCP tools error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assignment Endpoints
app.post('/api/assignments', async (req, res) => {
  try {
    const { canvasUrl, apiToken, limit = 20 } = req.body;
    
    if (!apiToken) {
      return res.status(400).json({ 
        error: 'Canvas API token is required' 
      });
    }

    // Set credentials on the shared client (will be overridden per request)
    const originalToken = canvasClient.token;
    const originalBaseUrl = canvasClient.baseUrl;
    
    try {
      canvasClient.token = apiToken;
      if (canvasUrl) {
        canvasClient.baseUrl = canvasUrl.endsWith('/api/v1') 
          ? canvasUrl 
          : `${canvasUrl}/api/v1`;
      }

      const assignments = await canvasClient.getUpcomingAssignments(limit);
      
      if (assignments.error) {
        return res.status(500).json({ error: assignments.error });
      }

      res.json({
        success: true,
        count: assignments.length,
        assignments
      });
    } finally {
      // Restore original credentials
      canvasClient.token = originalToken;
      canvasClient.baseUrl = originalBaseUrl;
    }
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/assignments/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ error: 'courseId query parameter required' });
    }

    const assignment = await canvasClient.getAssignmentDetails(
      parseInt(courseId), 
      parseInt(assignmentId)
    );
    
    if (assignment.error) {
      return res.status(500).json({ error: assignment.error });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit Assignment
app.post('/api/assignments/:assignmentId/submit', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { canvasUrl, apiToken, courseId, submissionData } = req.body;
    
    if (!apiToken) {
      return res.status(400).json({ 
        error: 'Canvas API token is required' 
      });
    }

    if (!courseId) {
      return res.status(400).json({ 
        error: 'Course ID is required' 
      });
    }

    if (!submissionData || !submissionData.body) {
      return res.status(400).json({ 
        error: 'Submission content is required' 
      });
    }

    // Set credentials on the shared client
    const originalToken = canvasClient.token;
    const originalBaseUrl = canvasClient.baseUrl;
    
    try {
      canvasClient.token = apiToken;
      if (canvasUrl) {
        canvasClient.baseUrl = canvasUrl.endsWith('/api/v1') 
          ? canvasUrl 
          : `${canvasUrl}/api/v1`;
      }

      const result = await canvasClient.submitAssignment(
        parseInt(courseId),
        parseInt(assignmentId),
        submissionData
      );
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        message: 'Assignment submitted successfully',
        submission: result
      });
    } finally {
      // Restore original credentials
      canvasClient.token = originalToken;
      canvasClient.baseUrl = originalBaseUrl;
    }
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Course Material Endpoints
app.get('/api/courses/:courseId/materials', async (req, res) => {
  try {
    const { courseId } = req.params;
    const materials = await canvasClient.getCourseMaterials(parseInt(courseId));
    
    if (materials.error) {
      return res.status(500).json({ error: materials.error });
    }

    res.json({
      success: true,
      materials
    });
  } catch (error) {
    console.error('Get course materials error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/courses/:courseId/syllabus', async (req, res) => {
  try {
    const { courseId } = req.params;
    const syllabus = await canvasClient.getCourseSyllabus(parseInt(courseId));
    
    if (syllabus.error) {
      return res.status(500).json({ error: syllabus.error });
    }

    res.json({
      success: true,
      syllabus
    });
  } catch (error) {
    console.error('Get syllabus error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat Endpoint (LangGraph + LLM)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, assignmentId, courseId, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context hint based on assignment if provided
    let contextHint = 'Mode: Question/Dialogue. Ask me what I currently believe first.';
    
    if (assignmentId && courseId) {
      // Fetch assignment details for context
      const assignment = await canvasClient.getAssignmentDetails(
        parseInt(courseId), 
        parseInt(assignmentId)
      );
      
      if (!assignment.error) {
        contextHint = `Mode: Canvas/Assignments. Student is working on: "${assignment.name}" in ${assignment.course_name}. 
Use Canvas tools to gather course materials and help them think critically through this assignment.`;
      }
    }

    // Build message history
    const messages = [
      ...conversationHistory,
      { 
        role: 'user', 
        content: `${contextHint}\n\nUser: ${message}` 
      }
    ];

    // Invoke LangGraph
    const graph = buildGraph();
    const result = await graph.invoke({ messages });

    // Extract final assistant message
    const finalMessage = [...result.messages]
      .reverse()
      .find(m => m.role === 'assistant');

    res.json({
      success: true,
      response: finalMessage?.content || 'No response generated',
      conversationHistory: result.messages,
      toolCalls: finalMessage?.tool_calls || []
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

// Streaming chat endpoint (Server-Sent Events)
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, assignmentId, courseId, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build context
    let contextHint = 'Mode: Question/Dialogue. Ask me what I currently believe first.';
    
    if (assignmentId && courseId) {
      res.write(`data: ${JSON.stringify({ type: 'status', message: 'Loading assignment details...' })}\n\n`);
      
      const assignment = await canvasClient.getAssignmentDetails(
        parseInt(courseId), 
        parseInt(assignmentId)
      );
      
      if (!assignment.error) {
        contextHint = `Mode: Canvas/Assignments. Student is working on: "${assignment.name}". 
Use Canvas tools to help them think critically.`;
        
        res.write(`data: ${JSON.stringify({ 
          type: 'context', 
          assignment: assignment.name,
          course: assignment.course_name 
        })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Thinking...' })}\n\n`);

    // Build and invoke graph
    const messages = [
      ...conversationHistory,
      { role: 'user', content: `${contextHint}\n\nUser: ${message}` }
    ];

    const graph = buildGraph();
    const result = await graph.invoke({ messages });

    const finalMessage = [...result.messages]
      .reverse()
      .find(m => m.role === 'assistant');

    // Stream the response
    res.write(`data: ${JSON.stringify({ 
      type: 'response', 
      content: finalMessage?.content || 'No response generated' 
    })}\n\n`);

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Streaming chat error:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error.message 
    })}\n\n`);
    res.end();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Start server
app.listen(PORT, () => {
  const mcpStats = mcpManager.getStats();
  
  console.log(`\n🚀 ASTAR API Server running on http://localhost:${PORT}`);
  console.log(`📚 Canvas integration: ${canvasClient.token ? 'Ready' : 'Not configured'}`);
  console.log(`🤖 LLM Model: ${process.env.NV_MODEL || 'nvidia/llama-3.3-nemotron-super-49b-v1.5'}`);
  console.log(`🔌 MCP Servers: ${mcpStats.connected}/${mcpStats.total} connected`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health`);
  console.log(`\n  Canvas:`);
  console.log(`    POST /api/canvas/connect`);
  console.log(`    GET  /api/canvas/status`);
  console.log(`\n  MCP Servers:`);
  console.log(`    GET    /api/mcp/servers`);
  console.log(`    GET    /api/mcp/servers/:id`);
  console.log(`    POST   /api/mcp/servers`);
  console.log(`    PUT    /api/mcp/servers/:id`);
  console.log(`    DELETE /api/mcp/servers/:id`);
  console.log(`    POST   /api/mcp/servers/:id/test`);
  console.log(`    GET    /api/mcp/stats`);
  console.log(`    GET    /api/mcp/tools`);
  console.log(`\n  Assignments:`);
  console.log(`    GET  /api/assignments`);
  console.log(`    GET  /api/assignments/:id`);
  console.log(`\n  Courses:`);
  console.log(`    GET  /api/courses/:id/materials`);
  console.log(`    GET  /api/courses/:id/syllabus`);
  console.log(`\n  Chat:`);
  console.log(`    POST /api/chat`);
  console.log(`    POST /api/chat/stream`);
  console.log(`\n✨ Ready to receive requests!\n`);
});

export default app;

