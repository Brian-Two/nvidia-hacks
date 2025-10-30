# 🧠⚡ MindMap Problem Solver - User Guide

## What You Just Got!

A **hybrid interactive learning system** that combines:
1. **🧠 Knowledge Graph** - Visual mind map that grows as you learn
2. **⚡ Step-by-Step Solver** - Guided problem solving with instant feedback

Both work together to make learning active, visual, and engaging!

---

## 🧠 Knowledge Graph (Mind Map)

### What It Does:
- **Automatically extracts concepts** from your conversations with ASTAR
- **Visualizes connections** between topics you're learning
- **Shows your progress** with color-coded status
- **Grows in real-time** as you chat

### Visual Indicators:

```
✓ Green Nodes  = Mastered (you got it!)
⚡ Yellow Nodes = In Progress (currently learning)
○ Gray Nodes   = Mentioned (briefly discussed)
🔒 Faded Nodes  = Locked (not yet unlocked)
```

### How to Use:
1. **Toggle On/Off:** Click "🧠 Mind Map" button in header
2. **See It Grow:** Chat about math, programming, etc.
3. **Click Nodes:** Explore concepts interactively
4. **Watch Connections:** See how topics relate

### Example:
```
You: "What's a derivative?"
ASTAR: "A derivative measures rate of change..."

Graph Updates:
- "Derivative" node appears (gray)
- Connects to "Calculus" (parent concept)
- Connects to "Rate" (related concept)

You complete a practice problem:
- "Derivative" turns yellow (in progress)

You master it:
- "Derivative" turns green ✓
```

---

## ⚡ Step-by-Step Problem Solver

### What It Does:
- **Breaks assignments** into 5-10 mini-steps
- **Guides you through** each step with questions
- **Checks your answers** with instant LLM feedback
- **Provides hints** when you're stuck (limited per step)
- **Tracks progress** with visual indicators

### Interface:

```
┌────────────────────────────────────┐
│ Step 2/5: Identify the Variables   │
│ ──────────────────────────────     │ 60% Complete
│ ● ● ○ ○ ○                          │
├────────────────────────────────────┤
│ ASTAR: "Looking at this equation,  │
│ what variables do you see?"        │
│                                    │
│ Your Answer:                       │
│ ┌────────────────────────────────┐ │
│ │ x, y, and z                    │ │
│ └────────────────────────────────┘ │
│                                    │
│ [Hint 1/3]  [Check Answer]        │
└────────────────────────────────────┘
```

### How to Use:
1. **Toggle Mode:** Click "⚡ Step Mode" button (currently disabled - will be enabled when you ask ASTAR to break down a problem)
2. **Read Prompt:** ASTAR asks you a question
3. **Type Answer:** Enter your response in the text area
4. **Check:** Click "Check Answer" for feedback
5. **Get Hints:** Use hint button if stuck (max 3 per step)
6. **Next Step:** Move forward when answer is correct

### Features:
- ✅ **Can't skip ahead** - Must complete steps in order
- ✅ **Immediate feedback** - Know if you're right or need to try again
- ✅ **Hint system** - Get help without giving away the answer
- ✅ **Concepts tracked** - Each step adds to your knowledge graph
- ✅ **Celebration** - Trophy icon when all steps complete!

---

## 🔗 How They Work Together

The magic happens when you use **both** features together:

### Learning Flow:

```
1. Start Step-by-Step Problem
   └─> Concepts appear on graph (gray)

2. Work Through Steps
   └─> Current concept turns yellow (in progress)
   └─> Graph shows what you're learning

3. Complete Step
   └─> Concept connects to related topics
   └─> See how it fits into bigger picture

4. Finish All Steps
   └─> Concept turns green (mastered) ✓
   └─> Graph shows your full learning path!
```

### Visual Example:

```
Problem: "Solve for x in the quadratic equation"

Graph Evolution:
┌────────────────────────────────┐
│ Start:                         │
│   [Algebra] (gray)             │
│                                │
│ After Step 1:                  │
│   [Algebra] ─┬─ [Variables]⚡  │
│              └─ [Equations]    │
│                                │
│ After Step 3:                  │
│   [Algebra] ─┬─ [Variables]✓  │
│              ├─ [Equations]⚡  │
│              └─ [Quadratic]⚡  │
│                                │
│ Completed:                     │
│   [Algebra]✓─┬─[Variables]✓   │
│              ├─[Equations]✓   │
│              └─[Quadratic]✓   │
└────────────────────────────────┘
```

---

## 🎯 Why This Is Better Than Regular Chat

### Traditional LLM Chat:
- ❌ Passive reading
- ❌ Easy to zone out
- ❌ No structure
- ❌ Can't see progress
- ❌ Boring after a while

### MindMap Problem Solver:
- ✅ **Active engagement** - Must answer questions
- ✅ **Visual feedback** - See your knowledge grow
- ✅ **Clear structure** - Step-by-step guidance
- ✅ **Progress tracking** - Know how far you've come
- ✅ **Gamified** - Feels like a game, not homework!

---

## 🧪 How to Test It Right Now

### Test 1: Watch the Mind Map Grow

1. **Refresh browser**
2. **Go to ASTAR Workbench**
3. **Make sure "🧠 Mind Map" is enabled** (button should be highlighted)
4. **Ask ASTAR:** "Can you explain derivatives in calculus?"
5. **Watch the left panel** - Nodes will start appearing!
6. **Keep chatting** - Ask follow-up questions
7. **See connections form** - Lines connect related concepts

### Test 2: Try the Interactive Experience

Currently, the graph extracts concepts from normal chat. The Step Mode will be most useful when:

1. **You have an assignment** - Upload it via Context window
2. **Ask ASTAR to break it down:**
   - "Can you help me solve this step by step?"
   - "Break this problem into smaller steps"
3. **Follow the prompts** - Answer each step
4. **Get hints when stuck**
5. **Watch concepts turn from gray → yellow → green ✓**

---

## 💾 Persistence

### Knowledge Graph Saves Automatically:
- ✅ **LocalStorage:** `astar_knowledge_graph`
- ✅ **Survives refresh**
- ✅ **Survives browser close**
- ✅ **Per assignment** (clear when starting new topic)

### To Clear Graph:
1. Open browser console (F12)
2. Run: `localStorage.removeItem('astar_knowledge_graph')`
3. Refresh page
4. Start fresh!

---

## 🎨 UI Controls

### Header Buttons:

```
┌────────────────────────────────────┐
│ [☰] ASTAR Workbench [🧠][⚡]      │
└────────────────────────────────────┘
         ↑             ↑   ↑
    Menu Toggle      │   └─ Step Mode (disabled until steps loaded)
                     └───── Mind Map (toggle on/off)
```

**Mind Map Button:**
- **Default:** ON (shows graph panel)
- **Click:** Toggle graph visibility
- **Useful:** Turn off for more chat space

**Step Mode Button:**
- **Default:** Disabled
- **Enabled When:** LLM provides structured steps
- **Click:** Switch between chat and step-by-step interface

---

## 📚 Based on Learning Science

This feature implements proven cognitive science principles:

### 1. **Active Retrieval**
- Forcing you to answer = better retention
- Can't passively read - must engage

### 2. **Visual Schema Building**
- Mind map = external representation of mental model
- See connections = understand relationships

### 3. **Spaced Practice**
- Steps spread out the learning
- Review previous concepts on graph

### 4. **Immediate Feedback**
- Know right away if you're correct
- Adjust understanding in real-time

### 5. **Priming Effect**
- Seeing related concepts activates prior knowledge
- Easier to learn connected information

---

## 🚀 Future Enhancements

Ideas for v2:
- [ ] **Auto-generate steps** from assignment text
- [ ] **Export graph** as image/PDF
- [ ] **Share graphs** with classmates
- [ ] **Achievement system** (badges, points, levels)
- [ ] **Collaborative graphs** (study groups)
- [ ] **AI-suggested topics** ("Learn this next!")
- [ ] **Progress over time** (weekly/monthly view)
- [ ] **Concept deep-dive** (click node → mini-lesson)

---

## 🐛 Known Limitations

1. **Step Mode Activation:**
   - Currently manual - need to ask ASTAR to create steps
   - Future: Auto-detect assignments and offer step mode

2. **Concept Extraction:**
   - Uses pattern matching - may miss custom terms
   - Works best with standard academic language

3. **Graph Layout:**
   - Fixed circular layout
   - Future: Allow dragging/rearranging nodes

4. **Mobile:**
   - Graph best viewed on tablet/desktop
   - May need to toggle off on phone

---

## 💡 Pro Tips

### For Best Results:

1. **Keep Mind Map Open:**
   - Always visible while studying
   - Reinforces connections

2. **Review the Graph:**
   - Before exams, look at your graph
   - See what you've mastered

3. **Use Context Window:**
   - Upload textbook chapters
   - Better concept extraction

4. **Ask for Steps:**
   - "Break this down step by step"
   - "Guide me through this problem"

5. **Take Your Time:**
   - Don't rush through steps
   - Think critically at each stage

---

## 🎯 Quick Start Checklist

Ready to try it? Follow these steps:

- [ ] **Refresh browser** (Cmd+R or F5)
- [ ] **Go to ASTAR Workbench**
- [ ] **Check "Mind Map" button is ON** (should be highlighted green)
- [ ] **Ask ASTAR about a topic:** "Explain [concept]"
- [ ] **Watch left panel** - Nodes appear!
- [ ] **Keep chatting** - Graph grows
- [ ] **Click a node** - Explore it
- [ ] **Ask for step-by-step help** with a problem
- [ ] **Watch concepts turn green** as you learn ✓

---

## 🎉 You're All Set!

The **MindMap Problem Solver** is now part of your ASTAR experience!

### What makes it special:
1. **Visual Learning** - See your knowledge grow
2. **Active Engagement** - Can't zone out
3. **Structured Practice** - Step-by-step guidance
4. **Immediate Feedback** - Know if you're right
5. **Progress Tracking** - See how far you've come

**Go try it out!** Start a conversation and watch the magic happen! ✨

---

*Built with ❤️ using React, TypeScript, and cognitive science principles*

