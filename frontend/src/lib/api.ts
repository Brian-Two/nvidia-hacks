/**
 * API Client for ASTAR Backend
 * Handles all communication with the Express/LangGraph backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types
export interface Assignment {
  id: string;
  title: string;
  course: string;
  courseColor?: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  points: number;
  htmlUrl?: string;
}

export interface CanvasConnection {
  isConnected: boolean;
  message?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  assignmentContext?: any;
}

export interface ChatResponse {
  response: string;
  conversationHistory: ChatMessage[];
}

// Helper function to get Canvas credentials from localStorage
const getCanvasCredentials = () => {
  const university = localStorage.getItem('astar_university');
  const apiToken = localStorage.getItem('astar_api_token');
  const customUrl = localStorage.getItem('astar_custom_url');

  let canvasUrl = 'https://canvas.instructure.com';
  if (university === 'custom' && customUrl) {
    canvasUrl = `https://${customUrl}`;
  }

  return { canvasUrl, apiToken };
};

// API Functions

/**
 * Test Canvas connection
 */
export const testCanvasConnection = async (): Promise<CanvasConnection> => {
  const { canvasUrl, apiToken } = getCanvasCredentials();

  if (!apiToken) {
    throw new Error('No Canvas API token found');
  }

  const response = await fetch(`${API_URL}/api/canvas/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ canvasUrl, apiToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to connect to Canvas');
  }

  return response.json();
};

/**
 * Get upcoming assignments from Canvas
 */
export const getAssignments = async (): Promise<Assignment[]> => {
  const { canvasUrl, apiToken } = getCanvasCredentials();

  if (!apiToken) {
    throw new Error('No Canvas API token found');
  }

  const response = await fetch(`${API_URL}/api/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ canvasUrl, apiToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch assignments');
  }

  const data = await response.json();
  
  // Transform the backend response to match our frontend format
  return (data.assignments || []).map((assignment: any) => ({
    id: assignment.id.toString(),
    title: assignment.name,
    course: assignment.course_name || 'Unknown Course',
    courseColor: getRandomCourseColor(),
    description: stripHtml(assignment.description || 'No description provided'),
    dueDate: assignment.due_at || '',
    daysUntilDue: calculateDaysUntilDue(assignment.due_at),
    points: assignment.points_possible || 0,
    htmlUrl: assignment.html_url,
  }));
};

/**
 * Get course materials for a specific course
 */
export const getCourseMaterials = async (courseId: string): Promise<any> => {
  const { canvasUrl, apiToken } = getCanvasCredentials();

  if (!apiToken) {
    throw new Error('No Canvas API token found');
  }

  const response = await fetch(`${API_URL}/api/course-materials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ canvasUrl, apiToken, courseId }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch course materials');
  }

  return response.json();
};

/**
 * Send a chat message to the AI
 */
export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  const { canvasUrl, apiToken } = getCanvasCredentials();

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      canvasUrl,
      apiToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

/**
 * Stream chat responses (Server-Sent Events)
 */
export const streamChatMessage = async (
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  const { canvasUrl, apiToken } = getCanvasCredentials();

  try {
    const response = await fetch(`${API_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        canvasUrl,
        apiToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to stream message');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete();
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          onChunk(data);
        }
      }
    }
  } catch (error) {
    onError(error as Error);
  }
};

// Helper functions

/**
 * Strip HTML tags from text
 */
const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Calculate days until due date
 */
const calculateDaysUntilDue = (dueDate: string | null): number => {
  if (!dueDate) return 999; // Far future for assignments without due dates

  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Get a random color for course badges
 */
const getRandomCourseColor = (): string => {
  const colors = [
    '#10B981', // Emerald
    '#A855F7', // Purple
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#8B5CF6', // Violet
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Submit assignment to Canvas
 */
export const submitAssignmentToCanvas = async (
  assignmentId: string,
  courseId: string,
  content: string
): Promise<any> => {
  const { canvasUrl, apiToken } = getCanvasCredentials();

  if (!apiToken) {
    throw new Error('No Canvas API token found');
  }

  const response = await fetch(`${API_URL}/api/assignments/${assignmentId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      canvasUrl,
      apiToken,
      courseId,
      submissionData: {
        submission_type: 'online_text_entry',
        body: content
      }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit assignment');
  }

  return response.json();
};

