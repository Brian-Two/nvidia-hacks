# Frontend Integration Guide

## 📦 Setup After Lovable Build

### Step 1: Download Your Lovable Frontend

1. Go to your Lovable project
2. Click "Download" or "Export"
3. Save the ZIP file

### Step 2: Extract to Project

```bash
# Navigate to nvidia-hacks directory
cd /path/to/nvidia-hacks

# Create frontend directory
mkdir astar-frontend

# Extract Lovable ZIP contents into astar-frontend/
# Your structure should look like:
# nvidia-hacks/
#   ├── astar-tutor/        (backend - already here)
#   └── astar-frontend/     (frontend - newly added)
```

### Step 3: Install Dependencies

```bash
# Backend
cd astar-tutor
npm install

# Frontend
cd ../astar-frontend
npm install
```

### Step 4: Configure Environment Variables

**Backend** (`astar-tutor/.env`):
```env
NV_API_KEY=your_nvidia_key
CANVAS_API_TOKEN=your_canvas_token
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`astar-frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
```

### Step 5: Run Both Servers

**Terminal 1 - Backend:**
```bash
cd astar-tutor
npm run dev
```
Server runs on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd astar-frontend
npm run dev
```
App runs on `http://localhost:5173`

---

## 🔌 API Integration in Frontend

### Create API Client

**File: `astar-frontend/src/lib/api.ts`**

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Assignment {
  id: number;
  name: string;
  course_name: string;
  course_id: number;
  due_at: string;
  points_possible: number;
  url: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const api = {
  // Canvas Connection
  async connectCanvas(apiToken: string, apiUrl?: string) {
    const response = await fetch(`${API_URL}/api/canvas/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiToken, apiUrl }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to connect to Canvas');
    }
    
    return response.json();
  },

  async getCanvasStatus() {
    const response = await fetch(`${API_URL}/api/canvas/status`);
    return response.json();
  },

  // Assignments
  async getAssignments(limit = 20): Promise<{ success: boolean; assignments: Assignment[] }> {
    const response = await fetch(`${API_URL}/api/assignments?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch assignments');
    }
    
    return response.json();
  },

  async getAssignment(assignmentId: number, courseId: number) {
    const response = await fetch(
      `${API_URL}/api/assignments/${assignmentId}?courseId=${courseId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch assignment details');
    }
    
    return response.json();
  },

  // Course Materials
  async getCourseMaterials(courseId: number) {
    const response = await fetch(`${API_URL}/api/courses/${courseId}/materials`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch course materials');
    }
    
    return response.json();
  },

  // Chat
  async sendMessage(
    message: string,
    options?: {
      assignmentId?: number;
      courseId?: number;
      conversationHistory?: ChatMessage[];
    }
  ) {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        ...options,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }
    
    return response.json();
  },

  // Streaming Chat (Server-Sent Events)
  createChatStream(
    message: string,
    options?: {
      assignmentId?: number;
      courseId?: number;
      conversationHistory?: ChatMessage[];
    }
  ) {
    return new EventSource(
      `${API_URL}/api/chat/stream?${new URLSearchParams({
        message,
        assignmentId: options?.assignmentId?.toString() || '',
        courseId: options?.courseId?.toString() || '',
      })}`
    );
  },
};
```

---

## 🎨 Component Integration Examples

### 1. Onboarding Page (Canvas Connection)

```tsx
// File: astar-frontend/src/pages/Onboarding.tsx
import { useState } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const [apiToken, setApiToken] = useState('');
  const [university, setUniversity] = useState('canvas.instructure.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await api.connectCanvas(
        apiToken,
        university === 'custom' ? customUrl : undefined
      );

      if (result.success) {
        // Store token locally (consider encryption in production)
        localStorage.setItem('canvas_token', apiToken);
        localStorage.setItem('canvas_url', university);
        
        // Navigate to Board
        navigate('/board');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
      <div className="bg-[#1C1F26] p-8 rounded-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to ASTAR</h1>
        <p className="text-gray-400 mb-6">Bring Back Critical Thinking</p>
        
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">University</label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full bg-[#252930] border border-gray-700 rounded-lg px-4 py-3 text-white"
            >
              <option value="canvas.instructure.com">Canvas (Default)</option>
              <option value="custom">Custom URL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Canvas API Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Paste your token here"
              className="w-full bg-[#252930] border border-gray-700 rounded-lg px-4 py-3 text-white"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect to Canvas'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 2. Board Page (Assignments List)

```tsx
// File: astar-frontend/src/pages/Board.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function Board() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const result = await api.getAssignments();
      setAssignments(result.assignments);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssignment = (assignment) => {
    navigate('/astar', {
      state: {
        assignmentId: assignment.id,
        courseId: assignment.course_id,
        assignmentName: assignment.name,
      },
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days < 0) return 'Overdue';
    return `Due in ${days} days`;
  };

  if (loading) {
    return <div>Loading assignments...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Your Assignments</h1>
      
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-[#1C1F26] border border-gray-800 rounded-xl p-6 hover:transform hover:-translate-y-1 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-white">{assignment.name}</h3>
              <span className="text-[#A855F7] text-sm font-semibold">
                {assignment.points_possible} pts
              </span>
            </div>
            
            <p className="text-gray-400 text-sm mb-3">
              <span className="text-[#10B981]">●</span> {assignment.course_name}
            </p>
            
            <p className="text-gray-300 text-sm mb-4">
              {assignment.description?.substring(0, 150)}...
            </p>
            
            <div className="flex justify-between items-center">
              <span className="text-orange-400 text-sm">
                {getDaysUntilDue(assignment.due_at)}
              </span>
              
              <button
                onClick={() => handleStartAssignment(assignment)}
                className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Start with ASTAR →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. ASTAR Page (Chat Interface)

```tsx
// File: astar-frontend/src/pages/Astar.tsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '@/lib/api';

export default function Astar() {
  const location = useLocation();
  const { assignmentId, courseId, assignmentName } = location.state || {};
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-start conversation if assignment provided
  useEffect(() => {
    if (assignmentId && courseId && messages.length === 0) {
      handleSend(`Help me with this assignment: ${assignmentName}`);
    }
  }, [assignmentId, courseId]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await api.sendMessage(text, {
        assignmentId,
        courseId,
        conversationHistory: messages,
      });

      const aiMessage = { role: 'assistant', content: result.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0F1419]">
      {/* Sidebar */}
      {assignmentName && (
        <div className="w-80 bg-[#1C1F26] border-r border-gray-800 p-6">
          <h3 className="text-white font-semibold mb-2">Current Assignment</h3>
          <p className="text-gray-400 text-sm">{assignmentName}</p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#1C1F26] border border-[#A855F7] text-gray-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1C1F26] rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question... (ASTAR guides you to think through it)"
              className="flex-1 bg-[#1C1F26] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#10B981] focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Quick Start Commands

### Development Mode (Both Servers):

**Option 1: Separate Terminals**
```bash
# Terminal 1
cd astar-tutor && npm run dev

# Terminal 2
cd astar-frontend && npm run dev
```

**Option 2: Using concurrently (recommended)**

Create `nvidia-hacks/package.json`:
```json
{
  "name": "astar-monorepo",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd astar-tutor && npm run dev",
    "dev:frontend": "cd astar-frontend && npm run dev",
    "install:all": "cd astar-tutor && npm install && cd ../astar-frontend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Then run:
```bash
npm install
npm run dev
```

---

## 🐛 Troubleshooting

### CORS Errors
**Problem:** Browser blocks requests from frontend to backend

**Solution:** Make sure backend `.env` has:
```env
FRONTEND_URL=http://localhost:5173
```

### Connection Refused
**Problem:** Frontend can't reach backend API

**Solution:** 
1. Check backend is running: `curl http://localhost:3001/health`
2. Verify `VITE_API_URL` in frontend `.env`
3. Check firewall settings

### Canvas Token Invalid
**Problem:** Canvas connection fails

**Solution:**
1. Generate new token from Canvas: Account → Settings → New Access Token
2. Copy immediately (you won't see it again!)
3. Update backend `.env` with new token

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Canvas Integration Guide](./CANVAS_INTEGRATION.md)
- [Future Vision](./FUTURE_VISION.md)
- [GitHub Repository](https://github.com/Brian-Two/nvidia-hacks)

---

## ✅ Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Environment variables configured
- [ ] Canvas API token valid
- [ ] CORS properly configured
- [ ] Test health endpoint works
- [ ] Test assignment fetch works
- [ ] Test chat functionality works

