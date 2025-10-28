# ASTAR Frontend

## 📦 Setup Instructions

### After Building in Lovable:

1. **Download your Lovable project**
   - Export as ZIP from Lovable
   - Extract all contents

2. **Copy files here**
   ```bash
   # From your downloads folder:
   cp -r lovable-project/* nvidia-hacks/frontend/
   ```

3. **Install dependencies**
   ```bash
   cd nvidia-hacks/frontend
   npm install
   ```

4. **Configure environment**
   ```bash
   # Create .env file
   echo "VITE_API_URL=http://localhost:3001" > .env
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Frontend will run on: **http://localhost:5173**

---

## 🔌 Connecting to Backend

The backend API is already running and ready at `http://localhost:3001`

### Available Endpoints:

**Canvas:**
- `POST /api/canvas/connect` - Connect Canvas account
- `GET /api/canvas/status` - Check connection status

**MCP Servers:**
- `GET /api/mcp/servers` - List all MCP servers
- `POST /api/mcp/servers` - Add new server
- `POST /api/mcp/servers/:id/test` - Test connection
- `PUT /api/mcp/servers/:id` - Update server
- `DELETE /api/mcp/servers/:id` - Remove server

**Assignments:**
- `GET /api/assignments` - List upcoming assignments
- `GET /api/assignments/:id?courseId=:courseId` - Get details

**Chat:**
- `POST /api/chat` - Send message to AI
- `POST /api/chat/stream` - Streaming responses

**Full Documentation:** See [../backend/API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md)

---

## 📚 Integration Examples

All ready-to-use integration code is in:
- **[../backend/FRONTEND_INTEGRATION.md](../backend/FRONTEND_INTEGRATION.md)**

Includes:
- Complete API client setup
- Onboarding page component
- Board page component
- ASTAR chat page component
- MCP connections page component

---

## 🎨 Design System

Your Lovable build should already have these colors:

```css
Background: #0F1419 (very dark)
Cards: #1C1F26
Primary: #10B981 (emerald green)
Accent: #A855F7 (purple)
Text: White/light gray
Font: Inter
```

---

## 🚀 Running Both Servers

**From root directory:**
```bash
cd nvidia-hacks
npm run dev
```

This runs both backend and frontend simultaneously!

**Or separately:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

---

## ✅ Checklist

- [ ] Lovable project built
- [ ] Files copied to this directory
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with `VITE_API_URL`
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can connect Canvas account
- [ ] Can view assignments
- [ ] Can chat with AI
- [ ] Can manage MCP servers

---

## 🐛 Troubleshooting

**CORS errors?**
- Make sure backend `.env` has `FRONTEND_URL=http://localhost:5173`

**Can't reach API?**
- Check backend is running: `curl http://localhost:3001/health`
- Verify `VITE_API_URL` in frontend `.env`

**Build errors?**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

---

## 📖 Resources

- **Backend API Docs:** [../backend/API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md)
- **MCP API Docs:** [../backend/MCP_API_DOCUMENTATION.md](../backend/MCP_API_DOCUMENTATION.md)
- **Integration Guide:** [../backend/FRONTEND_INTEGRATION.md](../backend/FRONTEND_INTEGRATION.md)
- **Lovable Prompt:** [../backend/LOVABLE_PROMPT.md](../backend/LOVABLE_PROMPT.md)

---

**Ready to bring back critical thinking! ✨**

