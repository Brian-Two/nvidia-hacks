import { ConceptNode } from '@/components/KnowledgeGraph';
import { ProblemStep } from '@/components/StepSolver';

export interface MindMap {
  id: string;
  name: string;
  folderId: string;
  concepts: ConceptNode[];
  createdAt: Date;
  updatedAt: Date;
  assignmentId?: string;
  assignmentTitle?: string;
}

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
  mindMaps: string[]; // Array of mindmap IDs
  documents: string[]; // Array of document IDs
  courseMaterials: string[]; // Array of course material IDs
}

const FOLDERS_KEY = 'astar_folders';
const MINDMAPS_KEY = 'astar_mindmaps';
const CURRENT_MINDMAP_KEY = 'astar_current_mindmap';
const DOCUMENTS_KEY = 'astar_documents';
const COURSE_MATERIALS_KEY = 'astar_course_materials';

// Folder Management
export const getFolders = (): Folder[] => {
  try {
    const saved = localStorage.getItem(FOLDERS_KEY);
    return saved ? JSON.parse(saved) : [];
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
  const newFolder: Folder = {
    id: `folder-${Date.now()}`,
    name,
    color: getRandomColor(),
    courseId,
    courseName,
    createdAt: new Date(),
    mindMaps: [],
    documents: [],
    courseMaterials: [],
  };

  const folders = getFolders();
  folders.push(newFolder);
  saveFolders(folders);

  return newFolder;
};

export const deleteFolder = (folderId: string): void => {
  const folders = getFolders().filter(f => f.id !== folderId);
  saveFolders(folders);

  // Also delete all mindmaps in this folder
  const mindMaps = getMindMaps();
  const updatedMindMaps = mindMaps.filter(m => m.folderId !== folderId);
  saveMindMaps(updatedMindMaps);
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

// MindMap Management
export const getMindMaps = (): MindMap[] => {
  try {
    const saved = localStorage.getItem(MINDMAPS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load mindmaps:', error);
    return [];
  }
};

export const saveMindMaps = (mindMaps: MindMap[]): void => {
  try {
    localStorage.setItem(MINDMAPS_KEY, JSON.stringify(mindMaps));
  } catch (error) {
    console.error('Failed to save mindmaps:', error);
  }
};

export const createMindMap = (
  name: string,
  folderId: string,
  concepts: ConceptNode[] = [],
  assignmentId?: string,
  assignmentTitle?: string
): MindMap => {
  const newMindMap: MindMap = {
    id: `mindmap-${Date.now()}`,
    name,
    folderId,
    concepts,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignmentId,
    assignmentTitle,
  };

  const mindMaps = getMindMaps();
  mindMaps.push(newMindMap);
  saveMindMaps(mindMaps);

  // Add to folder's mindmap list
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  if (folder) {
    folder.mindMaps.push(newMindMap.id);
    saveFolders(folders);
  }

  return newMindMap;
};

export const updateMindMap = (mindMapId: string, concepts: ConceptNode[]): void => {
  const mindMaps = getMindMaps();
  const mindMap = mindMaps.find(m => m.id === mindMapId);
  if (mindMap) {
    mindMap.concepts = concepts;
    mindMap.updatedAt = new Date();
    saveMindMaps(mindMaps);
  }
};

export const deleteMindMap = (mindMapId: string): void => {
  const mindMaps = getMindMaps().filter(m => m.id !== mindMapId);
  saveMindMaps(mindMaps);

  // Remove from folder
  const folders = getFolders();
  folders.forEach(folder => {
    folder.mindMaps = folder.mindMaps.filter(id => id !== mindMapId);
  });
  saveFolders(folders);
};

export const getMindMapById = (mindMapId: string): MindMap | undefined => {
  return getMindMaps().find(m => m.id === mindMapId);
};

export const getMindMapsByFolder = (folderId: string): MindMap[] => {
  return getMindMaps().filter(m => m.folderId === folderId);
};

// Current MindMap (active in workbench)
export const getCurrentMindMapId = (): string | null => {
  return localStorage.getItem(CURRENT_MINDMAP_KEY);
};

export const setCurrentMindMapId = (mindMapId: string | null): void => {
  if (mindMapId) {
    localStorage.setItem(CURRENT_MINDMAP_KEY, mindMapId);
  } else {
    localStorage.removeItem(CURRENT_MINDMAP_KEY);
  }
};

// Auto-create folders from Canvas courses
export const createFoldersFromCourses = (courses: Array<{ id: number; name: string; course_code?: string }>): void => {
  const existingFolders = getFolders();
  const newFolders: Folder[] = [];

  courses.forEach(course => {
    // Check if folder already exists for this course
    const exists = existingFolders.some(f => f.courseId === course.id.toString());
    if (!exists) {
      const folder = createFolder(
        course.course_code || course.name,
        course.id.toString(),
        course.name
      );
      newFolders.push(folder);
    }
  });

  return;
};

// Get or create folder for an assignment
export const getOrCreateFolderForAssignment = (courseId: string, courseName: string): Folder => {
  const folders = getFolders();
  let folder = folders.find(f => f.courseId === courseId);
  
  if (!folder) {
    folder = createFolder(courseName, courseId, courseName);
  }
  
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
  fileType?: string
): CourseMaterial => {
  const newMaterial: CourseMaterial = {
    id: `material-${Date.now()}`,
    name,
    type,
    content,
    url,
    folderId,
    canvasId,
    createdAt: new Date(),
    fileType,
  };

  const materials = getCourseMaterials();
  materials.push(newMaterial);
  saveCourseMaterials(materials);

  // Add to folder's course materials list
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  if (folder) {
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

