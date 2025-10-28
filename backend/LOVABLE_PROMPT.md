# A★ Tutor - Lovable UI Build Prompt

## Project Overview
Build a modern, dark-themed web application for ASTAR - an AI-powered learning platform that integrates with Canvas LMS to help anyone think critically through complex problems and assignments. Uses Socratic questioning to guide deep understanding at a fundamental level.

## Backend Context
The backend is already built using:
- **Node.js + TypeScript**
- **LangGraph** for AI agent workflow
- **NVIDIA NIM** (Llama 3.3 Nemotron) for LLM
- **Canvas MCP Integration** for fetching course data
- **API Endpoints** available at `/api/*` (to be connected)

Canvas API returns assignments with this structure:
```typescript
interface Assignment {
  id: number;
  name: string;
  course_name: string;
  course_id: number;
  due_at: string; // ISO date
  points_possible: number;
  description: string; // HTML content
  html_url: string;
  submission_types: string[];
}
```

## Application Structure

### 3 Main Pages

#### 1. BOARD (Dashboard)
**Purpose:** Display all upcoming assignments and tests from Canvas

**Layout:**
- Top navigation bar with app logo "ASTAR" (star icon)
- Sidebar with 3 navigation items: Board, ASTAR, Connections
- Main content area showing assignment cards in a vertical list
- Cards ranked from top to bottom by due date (soonest first)

**Assignment Card Design:**
Each card should contain:
- **Title:** Assignment/test name (large, bold)
- **Class:** Course name (smaller, muted color with a colored dot indicator)
- **Summary:** First 150 characters of assignment description (truncated with "...")
- **Due Date Badge:** Shows days until due (e.g., "Due in 2 days" or "Due tomorrow")
- **Points Badge:** Shows point value (e.g., "50 pts")
- **Action Button:** "Start with ASTAR" button in emerald green
  - On click: Navigate to ASTAR page with assignment context

**Visual Hierarchy:**
- Urgent assignments (due in ≤2 days) should have a subtle red/orange glow
- Assignments due soon (≤7 days) should appear more prominent
- Past assignments should be slightly faded with "Overdue" badge in red

**Empty State:**
- Show when no assignments: "🎉 All caught up! No upcoming assignments."

#### 2. ASTAR (Workbench)
**Purpose:** Interactive AI tutoring workspace

**Layout:**
- Split view or full-screen chat interface
- Left sidebar (collapsible): Assignment context panel showing:
  - Current assignment details
  - Course materials being used
  - Progress indicator
- Main chat area (ChatGPT-style):
  - Message history
  - Input box at bottom with send button
  - Typing indicator when AI is responding

**Chat Interface:**
- User messages: Right-aligned, emerald green bubble
- AI messages: Left-aligned, dark gray bubble with purple accent border
- Show "ASTAR" avatar (star icon) next to AI messages
- Show user avatar (or initials) next to user messages

**Features:**
- When entering from Board: Auto-populate with assignment context
- Show "Starting analysis of [Assignment Name]..." loading state
- Display relevant course materials as expandable cards in chat
- Markdown rendering for AI responses
- Code syntax highlighting if needed

**Input Box:**
- Placeholder: "Ask a question... (ASTAR guides you to think through it)"
- Send button in emerald green
- Character counter (subtle)
- Disable when waiting for AI response

#### 3. CONNECTIONS (Settings)
**Purpose:** Manage Canvas integration and API settings

**Layout:**
- Form-based interface with sections
- Clear visual feedback for connection status

**Sections:**

**Canvas Connection Status:**
- Large status indicator: Connected ✓ (green) or Disconnected ✗ (red)
- Show connected university name
- Last sync time
- "Test Connection" button

**Canvas Configuration:**
- **University:** 
  - Dropdown or searchable input
  - Common options: "Canvas.instructure.com (Default)", "Custom URL"
  - If custom: Show text input for Canvas API URL
  
- **API Token:**
  - Secure input field (password style with show/hide toggle)
  - "Generate New Token" link that opens Canvas instructions
  - Token validation indicator
  
- **Save Changes** button (emerald green)
- **Disconnect** button (red, with confirmation modal)

**Instructions Section:**
- Collapsible "How to get your Canvas API token" with step-by-step guide:
  1. Log into your Canvas account
  2. Go to Account → Settings
  3. Scroll to "Approved Integrations"
  4. Click "+ New Access Token"
  5. Purpose: "A★ Tutor Integration"
  6. Expires: Leave blank (or set expiration)
  7. Copy the token immediately (you won't see it again!)
  8. Paste it here

**Advanced Settings (Optional):**
- Sync frequency
- Which courses to include
- Privacy settings

## Initial Onboarding Flow

### Welcome Screen (First-time users)
**Layout:**
- Centered card on dark background
- A★ logo at top (large star with gradient)
- Welcome message: "Welcome to ASTAR"
- Subtitle: "Bring Back Critical Thinking"

**Form Fields:**
1. **University/Canvas URL:**
   - Dropdown with common options:
     - "canvas.instructure.com (Default)"
     - "Custom University"
   - If custom selected: Show text input
   
2. **Canvas API Token:**
   - Password-style input with show/hide toggle
   - Help text: "Don't have a token? [Get it here]" (link to instructions modal)
   
3. **Connect Button:**
   - Large emerald green button: "Connect to Canvas"
   - Loading spinner when clicked
   - On success: Navigate to Board with success toast

**Visual Design:**
- Dark background with subtle gradient
- Card with slight glassmorphism effect
- Emerald green accents
- Purple glow around form fields on focus

## Design System

### Color Palette
```css
/* Base Colors */
--background: #0F1419;           /* Very dark, almost black */
--surface: #1C1F26;              /* Slightly lighter for cards */
--surface-elevated: #252930;     /* Elevated elements */

/* Primary (Emerald Green) */
--primary: #10B981;              /* Emerald green */
--primary-hover: #059669;        /* Darker emerald */
--primary-light: rgba(16, 185, 129, 0.1); /* Subtle background */

/* Accent (Purple) */
--accent: #A855F7;               /* Purple */
--accent-hover: #9333EA;         /* Darker purple */
--accent-light: rgba(168, 85, 247, 0.1);

/* Text */
--text-primary: #F9FAFB;         /* Almost white */
--text-secondary: #D1D5DB;       /* Light gray */
--text-muted: #9CA3AF;           /* Muted gray */

/* Semantic Colors */
--success: #10B981;              /* Green */
--warning: #F59E0B;              /* Orange */
--error: #EF4444;                /* Red */
--info: #3B82F6;                 /* Blue */

/* Borders */
--border: rgba(255, 255, 255, 0.1);
--border-focus: var(--primary);
```

### Typography
- **Font:** Inter or SF Pro for clean, modern look
- **Headings:** Bold, --text-primary
- **Body:** Regular, --text-secondary
- **Small text:** --text-muted

### Components

**Buttons:**
- Primary (emerald green): Used for main actions
  - Background: --primary
  - Hover: --primary-hover
  - Border radius: 8px
  - Padding: 12px 24px
  - Font weight: 600
  
- Secondary (outline): Used for less important actions
  - Border: 2px solid --border
  - Text: --text-primary
  - Hover: Background --surface-elevated
  
- Danger: Red variant for destructive actions

**Cards:**
- Background: --surface
- Border: 1px solid --border
- Border radius: 12px
- Padding: 20px
- Hover: Slight lift effect (transform: translateY(-2px))
- Transition: all 0.2s ease

**Badges:**
- Small, rounded pills
- Due date: Warning color if soon, muted if far
- Points: Purple accent
- Status: Green (completed), orange (in progress), red (overdue)

**Input Fields:**
- Background: --surface-elevated
- Border: 1px solid --border
- Focus: Border --primary with subtle glow
- Padding: 12px 16px
- Border radius: 8px

### Layout

**Navigation Sidebar:**
- Width: 240px (collapsed: 60px)
- Background: --surface
- Border right: 1px solid --border
- Icons with labels
- Active state: Emerald green with subtle background
- Hover: Slight opacity change

**Top Bar:**
- Height: 64px
- Background: --surface
- Border bottom: 1px solid --border
- Logo on left
- User menu on right (optional)

**Content Area:**
- Max width: 1200px (for Board)
- Full width for ASTAR chat
- Padding: 32px
- Responsive breakpoints

## Responsive Design

**Desktop (≥1024px):**
- Full sidebar visible
- Cards in single column, full width
- Chat in split view

**Tablet (768px - 1023px):**
- Collapsible sidebar
- Cards full width
- Chat single column

**Mobile (≤767px):**
- Bottom navigation bar instead of sidebar
- Full-screen pages
- Cards stacked
- Simplified layout

## User Experience Details

### Loading States
- Skeleton screens for assignment cards
- Shimmer effect on loading
- Spinner for API calls
- Progress indicators for long operations

### Error Handling
- Toast notifications for errors (top-right)
- Inline validation for forms
- Clear error messages with actionable advice
- Retry buttons where appropriate

### Success Feedback
- Toast notifications for successful actions
- Subtle animations (checkmark, fade-in)
- Status updates in real-time

### Empty States
- Friendly illustrations or icons
- Clear message about why it's empty
- Call-to-action to resolve

### Animations
- Smooth transitions (0.2s - 0.3s)
- Fade-in for new content
- Slide-in for modals
- Hover effects on interactive elements
- No jarring or excessive animation

## Technical Requirements

### Framework
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling (with custom color palette)
- **shadcn/ui** components (optional, for consistency)

### State Management
- React Context or Zustand for global state
- Store Canvas connection info
- Store current assignment context
- Store chat history

### API Integration
- Fetch from backend API endpoints
- Handle authentication (API token in headers)
- Error handling and retries
- Loading states

### Data Flow
```
Frontend → Backend API → Canvas MCP Client → Canvas API
                ↓
          LangGraph → NVIDIA NIM → AI Response
                ↓
          Frontend (Display)
```

### Local Storage
- Save Canvas API token securely (encrypted if possible)
- Save university/URL preference
- Cache recent assignments
- Save dark mode preference (if toggleable)

## Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus indicators
- Screen reader friendly
- Color contrast WCAG AA compliant

## Performance
- Lazy load chat history
- Infinite scroll for assignments if many
- Optimize images and icons
- Code splitting by route
- Cache API responses where appropriate

## Sample API Endpoints (Mock for now)

```typescript
// GET /api/assignments
Response: Assignment[]

// GET /api/assignments/:id
Response: Assignment

// GET /api/course/:courseId/materials
Response: { syllabus, modules, pages, files }

// POST /api/chat
Body: { message: string, assignmentId?: number }
Response: { response: string, sources: string[] }

// POST /api/canvas/connect
Body: { apiToken: string, apiUrl: string }
Response: { success: boolean, courses: Course[] }

// GET /api/canvas/status
Response: { connected: boolean, lastSync: string }
```

## Additional Features to Consider

### Phase 1 (MVP)
- ✅ Canvas connection
- ✅ Assignment list
- ✅ Basic chat interface
- ✅ Dark theme

### Phase 2
- Search/filter assignments
- Sort options (by date, course, priority)
- Assignment details modal
- Progress tracking per assignment

### Phase 3
- Study plan generation
- Calendar view of assignments
- Notifications for due dates
- Multi-session chat history

## Design References
- **ChatGPT UI**: For chat interface inspiration
- **Linear**: For clean, dark UI aesthetics
- **Notion**: For card layouts and organization
- **Vercel Dashboard**: For modern design patterns

## Final Notes
- Prioritize user experience and smooth interactions
- Keep the interface clean and not overwhelming
- Make critical thinking and deep understanding the focus
- This is for anyone learning anything - not just students
- Ensure easy onboarding for all users
- Test with real Canvas data if possible
- Make it feel premium and modern

---

## 🚀 PASTE THIS INTO LOVABLE:

```
Create ASTAR - a dark-themed critical thinking platform that helps anyone learn and understand complex topics at a fundamental level.

🎨 DESIGN:
- Very dark background: #0F1419
- Cards: #1C1F26
- Primary buttons: Emerald green #10B981
- Accents: Purple #A855F7
- Text: White/light gray
- Style: ChatGPT-inspired, sleek, modern
- Font: Inter, 12px rounded corners

📱 3 PAGES:

1. BOARD (Dashboard):
   - Vertical list of assignment cards, ranked by due date
   - Each card:
     * Title (bold, large)
     * Course name with colored dot
     * Description (first 150 chars)
     * Due date badge ("Due in 2 days")
     * Points badge (purple, "50 pts")
     * Emerald green button: "Start with ASTAR"
   - Urgent items (≤2 days) have red/orange glow
   - Empty state: "🎉 All caught up!"

2. ASTAR (Workbench):
   - ChatGPT-style split interface
   - Left sidebar (collapsible): Assignment context
   - Main chat area:
     * User: Right-aligned, emerald green bubbles
     * AI: Left-aligned, dark gray with purple border
     * ASTAR star icon avatar
   - Input placeholder: "Ask a question... (ASTAR guides you to think through it)"
   - Emerald send button
   - Typing indicator

3. CONNECTIONS (Settings):
   - Connection status (green ✓ or red ✗)
   - Form fields:
     * University dropdown (Canvas.instructure.com or Custom)
     * Canvas API Token (secure input, show/hide toggle)
   - "Test Connection" button
   - "Save Changes" button (emerald)
   - Collapsible "How to get token" instructions
   - Last sync time

🔐 ONBOARDING (First-time):
- Centered card on dark background
- Large star logo with gradient
- Title: "Welcome to ASTAR"
- Subtitle: "Bring Back Critical Thinking"
- University dropdown
- API Token secure input
- Large emerald "Connect to Canvas" button
- Glassmorphism card effect

✨ INTERACTIONS:
- Smooth transitions (0.2s)
- Hover effects on all interactive elements
- Focus states with emerald glow
- Loading skeletons with shimmer
- Toast notifications (top-right)
- Keyboard navigation

📱 RESPONSIVE:
- Mobile: Bottom nav, stacked cards
- Tablet: Collapsible sidebar
- Desktop: Full sidebar (240px), max-width 1200px

Make it feel premium, modern, and focused on critical thinking. The core purpose: help anyone break down and understand complex problems at a fundamental level.
```

