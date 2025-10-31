import { ConceptNode } from '@/components/KnowledgeGraph';
import { ProblemStep } from '@/components/StepSolver';

export interface WorkSession {
  id: string;
  name: string; // Topic/Assignment/Exam Subject
  folderId: string;
  
  // Mind Map Data
  concepts: ConceptNode[];
  
  // Chat Data
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  
  // Step Mode Data
  stepMode: boolean;
  problemSteps: ProblemStep[];
  currentStepIndex: number;
  
  // Context & Notes
  notes: string;
  contextItems: Array<{
    id: string;
    type: 'pdf' | 'text' | 'link';
    name: string;
    content: string;
    addedAt?: Date;
  }>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  assignmentId?: string;
  assignmentTitle?: string;
  classSubject?: string; // e.g., "Computer Science", "Calculus"
  sessionType?: 'assignment' | 'exam' | 'general-study' | 'exploration';
}

// Legacy type alias for backwards compatibility
export type MindMap = WorkSession;

export interface Document {
  id: string;
  name: string;
  type: 'study_guide' | 'assignment_draft' | 'step_solver';
  content: string;
  folderId: string;
  assignmentId?: string;
  assignmentTitle?: string;
  createdAt: Date;
  stepSolverData?: ProblemStep[]; // For step solver sessions
}

export interface CourseMaterial {
  id: string;
  name: string;
  type: 'syllabus' | 'file' | 'page' | 'module' | 'textbook';
  content?: string;
  url?: string;
  folderId: string;
  courseId?: string; // Canvas course ID to ensure proper filtering
  canvasId?: string;
  createdAt: Date;
  fileType?: string; // pdf, doc, etc.
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  courseId?: string;
  courseName?: string;
  createdAt: Date;
  sessions: string[]; // Array of session IDs (formerly mindMaps)
  documents: string[]; // Array of document IDs
  courseMaterials: string[]; // Array of course material IDs
}

const FOLDERS_KEY = 'astar_folders';
const SESSIONS_KEY = 'astar_sessions'; // Renamed from mindmaps
const CURRENT_SESSION_KEY = 'astar_current_session'; // Renamed from mindmap
const DOCUMENTS_KEY = 'astar_documents';
const COURSE_MATERIALS_KEY = 'astar_course_materials';

// Folder Management
export const getFolders = (): Folder[] => {
  try {
    const saved = localStorage.getItem(FOLDERS_KEY);
    const folders = saved ? JSON.parse(saved) : [];
    
    // Migrate old folders with mindMaps to sessions
    const migratedFolders = folders.map((folder: any) => {
      if (folder.mindMaps && !folder.sessions) {
        return {
          ...folder,
          sessions: folder.mindMaps,
          mindMaps: undefined
        };
      }
      // Ensure sessions array exists
      if (!folder.sessions) {
        folder.sessions = [];
      }
      // Ensure other arrays exist
      if (!folder.documents) folder.documents = [];
      if (!folder.courseMaterials) folder.courseMaterials = [];
      return folder;
    });
    
    // Save migrated folders back
    if (migratedFolders.some((f: any, i: number) => 
      JSON.stringify(f) !== JSON.stringify(folders[i])
    )) {
      saveFolders(migratedFolders);
    }
    
    return migratedFolders;
  } catch (error) {
    console.error('Failed to load folders:', error);
    return [];
  }
};

export const saveFolders = (folders: Folder[]): void => {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (error) {
    console.error('Failed to save folders:', error);
  }
};

export const createFolder = (name: string, courseId?: string, courseName?: string): Folder => {
  // Generate truly unique ID using timestamp + random string
  const uniqueId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const newFolder: Folder = {
    id: uniqueId,
    name,
    color: getRandomColor(),
    courseId,
    courseName,
    createdAt: new Date(),
    sessions: [], // Renamed from mindMaps
    documents: [],
    courseMaterials: [],
  };

  const folders = getFolders();
  
  // Double-check no folder with this ID already exists
  const existingIndex = folders.findIndex(f => f.id === uniqueId);
  if (existingIndex !== -1) {
    console.error('Duplicate folder ID detected, regenerating...');
    return createFolder(name, courseId, courseName);
  }
  
  folders.push(newFolder);
  saveFolders(folders);

  return newFolder;
};

export const deleteFolder = (folderId: string): void => {
  const folders = getFolders().filter(f => f.id !== folderId);
  saveFolders(folders);

  // Also delete all sessions in this folder
  const sessions = getSessions();
  const updatedSessions = sessions.filter(s => s.folderId !== folderId);
  saveSessions(updatedSessions);
};

export const renameFolder = (folderId: string, newName: string): void => {
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  if (folder) {
    folder.name = newName;
    saveFolders(folders);
  }
};

export const getFolderById = (folderId: string): Folder | undefined => {
  return getFolders().find(f => f.id === folderId);
};

// Work Session Management
export const getSessions = (): WorkSession[] => {
  try {
    const saved = localStorage.getItem(SESSIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
};

export const saveSessions = (sessions: WorkSession[]): void => {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions:', error);
  }
};

// Legacy support
export const getMindMaps = getSessions;
export const saveMindMaps = saveSessions;

export const createSession = (
  name: string,
  folderId: string,
  options: {
    concepts?: ConceptNode[];
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
    assignmentId?: string;
    assignmentTitle?: string;
    classSubject?: string;
    sessionType?: WorkSession['sessionType'];
  } = {}
): WorkSession => {
  const newSession: WorkSession = {
    id: `session-${Date.now()}`,
    name,
    folderId,
    concepts: options.concepts || [],
    conversationHistory: options.conversationHistory || [],
    stepMode: false,
    problemSteps: [],
    currentStepIndex: 0,
    notes: '',
    contextItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    assignmentId: options.assignmentId,
    assignmentTitle: options.assignmentTitle,
    classSubject: options.classSubject,
    sessionType: options.sessionType || 'general-study',
  };

  const sessions = getSessions();
  sessions.push(newSession);
  saveSessions(sessions);

  // Add to folder's session list
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  if (folder) {
    folder.sessions.push(newSession.id);
    saveFolders(folders);
  }

  return newSession;
};

// Legacy support
export const createMindMap = (
  name: string,
  folderId: string,
  concepts: ConceptNode[] = [],
  assignmentId?: string,
  assignmentTitle?: string,
  topic?: string
): WorkSession => {
  return createSession(name, folderId, {
    concepts,
    assignmentId,
    assignmentTitle,
  });
};

export const updateSession = (
  sessionId: string,
  updates: Partial<Omit<WorkSession, 'id' | 'createdAt' | 'folderId'>>
): void => {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    Object.assign(session, updates);
    session.updatedAt = new Date();
    saveSessions(sessions);
  }
};

// Legacy support
export const updateMindMap = (
  mindMapId: string, 
  concepts: ConceptNode[], 
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>,
  notes?: string
): void => {
  updateSession(mindMapId, {
    concepts,
    conversationHistory,
    notes,
  });
};

export const deleteSession = (sessionId: string): void => {
  const sessions = getSessions().filter(s => s.id !== sessionId);
  saveSessions(sessions);

  // Remove from folder
  const folders = getFolders();
  folders.forEach(folder => {
    folder.sessions = folder.sessions.filter(id => id !== sessionId);
  });
  saveFolders(folders);
};

export const getSessionById = (sessionId: string): WorkSession | undefined => {
  return getSessions().find(s => s.id === sessionId);
};

export const getSessionsByFolder = (folderId: string): WorkSession[] => {
  return getSessions().filter(s => s.folderId === folderId);
};

// Current Session (active in workbench)
export const getCurrentSessionId = (): string | null => {
  return localStorage.getItem(CURRENT_SESSION_KEY);
};

export const setCurrentSessionId = (sessionId: string | null): void => {
  if (sessionId) {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  } else {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
};

// Legacy support
export const deleteMindMap = deleteSession;
export const getMindMapById = getSessionById;
export const getMindMapsByFolder = getSessionsByFolder;
export const getCurrentMindMapId = getCurrentSessionId;
export const setCurrentMindMapId = setCurrentSessionId;

// Auto-create folders from Canvas courses
export const createFoldersFromCourses = (courses: Array<{ id: number; name: string; course_code?: string }>): void => {
  const existingFolders = getFolders();
  let newFoldersCreated = 0;

  courses.forEach(course => {
    // Skip if course doesn't have proper ID or name
    if (!course.id || !course.name) {
      console.warn('Skipping course with missing id or name:', course);
      return;
    }
    
    const courseIdStr = course.id.toString();
    
    // Check if folder already exists for this course ID
    const exists = existingFolders.some(f => f.courseId === courseIdStr);
    
    if (!exists) {
      // Clean up course name (remove term prefix like "2025 Fall")
      const courseName = course.name.replace(/^20\d{2} (Fall|Spring|Summer|Winter) /, '');
      
      console.log(`Creating folder for course ${courseIdStr}: ${courseName}`);
      
      createFolder(
        courseName,
        courseIdStr,
        course.name
      );
      
      newFoldersCreated++;
    } else {
      console.log(`Folder already exists for course ${courseIdStr}`);
    }
  });

  console.log(`Created ${newFoldersCreated} new course folders`);
};

// Get or create folder for an assignment
export const getOrCreateFolderForAssignment = (courseId: string, courseName: string): Folder => {
  const folders = getFolders();
  
  // First, try to find by exact courseId match
  let folder = folders.find(f => f.courseId === courseId);
  
  if (folder) {
    return folder;
  }
  
  // If no courseId match, try to find by similar course name
  // This handles cases where Canvas folders exist but don't have courseId yet
  const normalizedCourseName = courseName.toLowerCase().trim()
    .replace(/^20\d{2} (Fall|Spring|Summer|Winter) /, '') // Remove term prefix
    .replace(/\s*\([^)]*\)/, ''); // Remove course codes like (CSCI-475-01)
  
  // Look for folders with similar names
  folder = folders.find(f => {
    const normalizedFolderName = f.name.toLowerCase().trim()
      .replace(/^20\d{2} (Fall|Spring|Summer|Winter) /, '')
      .replace(/\s*\([^)]*\)/, '');
    
    // Check if names match or one contains the other
    if (normalizedFolderName === normalizedCourseName) {
      return true;
    }
    
    // Check if the key course name is contained (e.g., "Machine Learning" in "Intro to Machine Learning")
    const courseWords = normalizedCourseName.split(/\s+/).filter(w => w.length > 3);
    const folderWords = normalizedFolderName.split(/\s+/).filter(w => w.length > 3);
    
    // If at least 2 significant words match, consider it the same course
    if (courseWords.length >= 2 && folderWords.length >= 2) {
      const matchCount = courseWords.filter(cw => 
        folderWords.some(fw => fw.includes(cw) || cw.includes(fw))
      ).length;
      
      return matchCount >= 2;
    }
    
    // For single-word courses, check for exact match
    if (courseWords.length === 1 && folderWords.length === 1) {
      return courseWords[0] === folderWords[0];
    }
    
    return false;
  });
  
  if (folder) {
    // Update the folder with courseId if it was missing
    if (!folder.courseId && courseId) {
      const updatedFolders = folders.map(f => 
        f.id === folder.id ? { ...f, courseId, courseName } : f
      );
      saveFolders(updatedFolders);
      folder.courseId = courseId;
      folder.courseName = courseName;
    }
    return folder;
  }
  
  // Only create new folder if no match found
  folder = createFolder(courseName, courseId, courseName);
  return folder;
};

// Document Management
export const getDocuments = (): Document[] => {
  try {
    const saved = localStorage.getItem(DOCUMENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load documents:', error);
    return [];
  }
};

export const saveDocuments = (documents: Document[]): void => {
  try {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error('Failed to save documents:', error);
  }
};

export const createDocument = (
  name: string,
  type: Document['type'],
  content: string,
  folderId: string,
  assignmentId?: string,
  assignmentTitle?: string,
  stepSolverData?: ProblemStep[]
): Document => {
  const newDocument: Document = {
    id: `doc-${Date.now()}`,
    name,
    type,
    content,
    folderId,
    assignmentId,
    assignmentTitle,
    createdAt: new Date(),
    stepSolverData,
  };

  const documents = getDocuments();
  documents.push(newDocument);
  saveDocuments(documents);

  // Add to folder's document list
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  if (folder) {
    folder.documents.push(newDocument.id);
    saveFolders(folders);
  }

  return newDocument;
};

export const getDocumentsByFolder = (folderId: string): Document[] => {
  return getDocuments().filter(d => d.folderId === folderId);
};

export const deleteDocument = (documentId: string): void => {
  const documents = getDocuments().filter(d => d.id !== documentId);
  saveDocuments(documents);

  // Remove from folder
  const folders = getFolders();
  folders.forEach(folder => {
    folder.documents = folder.documents.filter(id => id !== documentId);
  });
  saveFolders(folders);
};

// Course Material Management
export const getCourseMaterials = (): CourseMaterial[] => {
  try {
    const saved = localStorage.getItem(COURSE_MATERIALS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load course materials:', error);
    return [];
  }
};

export const saveCourseMaterials = (materials: CourseMaterial[]): void => {
  try {
    localStorage.setItem(COURSE_MATERIALS_KEY, JSON.stringify(materials));
  } catch (error) {
    console.error('Failed to save course materials:', error);
  }
};

export const createCourseMaterial = (
  name: string,
  type: CourseMaterial['type'],
  folderId: string,
  content?: string,
  url?: string,
  canvasId?: string,
  fileType?: string,
  courseId?: string
): CourseMaterial => {
  // Generate unique ID with timestamp and random string
  const uniqueId = `material-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const newMaterial: CourseMaterial = {
    id: uniqueId,
    name,
    type,
    content,
    url,
    folderId,
    canvasId,
    createdAt: new Date(),
    fileType,
    courseId, // Add courseId to ensure proper filtering
  };

  const materials = getCourseMaterials();
  
  // Check if this material already exists (by canvasId and folderId)
  const existingMaterial = materials.find(m => 
    m.canvasId === canvasId && m.folderId === folderId && canvasId
  );
  
  if (existingMaterial) {
    console.log(`Material already exists: ${name} (canvasId: ${canvasId})`);
    return existingMaterial;
  }
  
  materials.push(newMaterial);
  saveCourseMaterials(materials);

  // Add to folder's course materials list
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  if (folder && !folder.courseMaterials.includes(newMaterial.id)) {
    folder.courseMaterials.push(newMaterial.id);
    saveFolders(folders);
  }

  return newMaterial;
};

export const getCourseMaterialsByFolder = (folderId: string): CourseMaterial[] => {
  return getCourseMaterials().filter(m => m.folderId === folderId);
};

export const deleteCourseMaterial = (materialId: string): void => {
  const materials = getCourseMaterials().filter(m => m.id !== materialId);
  saveCourseMaterials(materials);

  // Remove from folder
  const folders = getFolders();
  folders.forEach(folder => {
    folder.courseMaterials = folder.courseMaterials.filter(id => id !== materialId);
  });
  saveFolders(folders);
};

// Utility function for random colors
const getRandomColor = (): string => {
  const colors = [
    '#2FED7B', // ASTAR Green
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

