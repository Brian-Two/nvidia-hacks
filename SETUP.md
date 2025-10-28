# ASTAR Setup Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Clone Repository
```bash
git clone https://github.com/Brian-Two/nvidia-hacks.git
cd nvidia-hacks
```

### 2. Install Root Dependencies
```bash
npm install
```

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and add your API keys:
```env
NV_API_KEY=your_nvidia_api_key
CANVAS_API_TOKEN=your_canvas_token
```

**Get API Keys:**
- **NVIDIA:** https://build.nvidia.com/
- **Canvas:** Canvas Account → Settings → New Access Token

### 4. Setup Frontend (After Lovable Build)

**Download from Lovable:**
1. Export your Lovable project as ZIP
2. Extract all contents

**Copy to Project:**
```bash
cd nvidia-hacks
# Copy Lovable files to frontend/
cp -r /path/to/lovable-export/* frontend/
```

**Install & Configure:**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3001" > .env
```

### 5. Run Everything
```bash
# From root directory
cd nvidia-hacks
npm run dev
```

This starts:
- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

---

## 📁 Project Structure

```
nvidia-hacks/
│
├── backend/                    # Node.js + Express + LangGraph
│   ├── src/
│   │   ├── api/               # REST API endpoints
│   │   │   └── server.js      # Main API server
│   │   ├── mcp/               # MCP server management
│   │   │   ├── mcpManager.js  # Multi-MCP orchestration
│   │   │   └── clients/       # GitHub, Drive, Notion, Slack
│   │   ├── tools/             # AI tools
│   │   │   ├── canvasTools.js # Canvas integration
│   │   │   ├── assignmentStarter.js
│   │   │   └── materialGenerator.js
│   │   ├── canvasMCP.js       # Canvas API client
│   │   ├── graph.js           # LangGraph workflow
│   │   ├── llm.js             # NVIDIA NIM client
│   │   ├── main.js            # CLI entry point
│   │   └── systemPrompt.js    # AI personality
│   │
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                   # React + Vite (from Lovable)
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── README.md
│
├── package.json               # Root monorepo scripts
├── README.md                  # Main documentation
└── SETUP.md                   # This file
```

---

## 🔧 Available Commands

### Root Level (Run from `nvidia-hacks/`)

```bash
npm run dev              # Run both backend + frontend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
npm run install:all      # Install all dependencies
npm run build            # Build both projects
npm run test             # Test both projects
npm run clean            # Remove all node_modules
```

### Backend Only (Run from `backend/`)

```bash
npm run dev              # Start with auto-reload
npm start                # Production mode
npm run chat             # CLI test mode
npm run canvas           # Canvas CLI test
```

### Frontend Only (Run from `frontend/`)

```bash
npm run dev              # Development server
npm run build            # Production build
npm run preview          # Preview production build
```

---

## ✅ Verification Steps

### 1. Check Backend
```bash
# Terminal 1
cd nvidia-hacks/backend
npm run dev
```

Expected output:
```
🚀 ASTAR API Server running on http://localhost:3001
📚 Canvas integration: Ready
🤖 LLM Model: nvidia/llama-3.3-nemotron-super-49b-v1.5
🔌 MCP Servers: 1/1 connected
✨ Ready to receive requests!
```

**Test it:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok", ...}
```

### 2. Check Frontend
```bash
# Terminal 2
cd nvidia-hacks/frontend
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**Open:** http://localhost:5173

---

## 🐛 Troubleshooting

### Backend Won't Start

**Port already in use:**
```bash
# Change port in backend/.env
PORT=3002
```

**Missing API keys:**
```bash
# Check backend/.env has:
NV_API_KEY=xxxxx
CANVAS_API_TOKEN=xxxxx
```

**Dependencies issues:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Won't Start

**Not installed yet:**
```bash
# Make sure you copied Lovable files first
ls frontend/src  # Should show files

cd frontend
npm install
```

**Can't reach API:**
```bash
# Check frontend/.env has:
VITE_API_URL=http://localhost:3001

# Test backend is running:
curl http://localhost:3001/health
```

**CORS errors:**
```bash
# Check backend/.env has:
FRONTEND_URL=http://localhost:5173
```

### Canvas Connection Fails

**Invalid token:**
1. Go to Canvas: Account → Settings
2. Scroll to "Approved Integrations"
3. Click "+ New Access Token"
4. Purpose: "ASTAR Integration"
5. Copy token immediately
6. Paste in `backend/.env`

**Wrong URL:**
```bash
# If your school uses custom Canvas domain:
CANVAS_API_URL=https://canvas.yourschool.edu/api/v1
```

---

## 📚 Documentation

- **[Main README](./README.md)** - Project overview
- **[Backend README](./backend/README.md)** - Backend details
- **[Frontend README](./frontend/README.md)** - Frontend setup
- **[API Docs](./backend/API_DOCUMENTATION.md)** - Complete API reference
- **[MCP Docs](./backend/MCP_API_DOCUMENTATION.md)** - MCP server management
- **[Integration Guide](./backend/FRONTEND_INTEGRATION.md)** - Connect frontend to backend
- **[Lovable Prompt](./backend/LOVABLE_PROMPT.md)** - UI specifications

---

## 🎯 Next Steps After Setup

1. **Connect Canvas**
   - Open frontend at http://localhost:5173
   - Enter your Canvas API token
   - Test connection

2. **View Assignments**
   - Navigate to Board page
   - See all upcoming assignments
   - Click "Start with ASTAR" on any assignment

3. **Chat with AI**
   - Opens ASTAR workbench
   - AI pulls assignment details and course materials
   - Asks Socratic questions to guide learning

4. **Add More MCP Servers**
   - Go to Connections page
   - Add GitHub, Google Drive, Notion, Slack
   - Test each connection
   - AI can now use tools from all services

---

## 🔐 Security Notes

- **Never commit `.env` files**
- API keys are stored server-side only
- Frontend never has access to raw API keys
- Canvas data stays local (not sent to third parties)
- All MCP connections are user-managed

---

## 🚢 Deployment

See deployment guides:
- **Backend:** [backend/README.md#deployment](./backend/README.md)
- **Frontend:** Deploy to Vercel/Netlify

---

## 🆘 Need Help?

- **Documentation:** Check `/backend/` for detailed docs
- **API Issues:** Test with `curl http://localhost:3001/health`
- **GitHub Issues:** https://github.com/Brian-Two/nvidia-hacks/issues

---

**You're all set! Start learning with ASTAR! ✨**

