import { useState, useEffect, useRef } from 'react';
import { Folder as FolderIcon, Plus, Trash2, Edit2, FileText, Brain, Book, RefreshCw, Link2, Type, FileUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Folder as FolderType,
  WorkSession,
  getFolders,
  createFolder,
  deleteFolder,
  renameFolder,
  getSessionsByFolder,
  deleteSession,
  getCourseMaterialsByFolder,
  createCourseMaterial,
  deleteCourseMaterial,
  CourseMaterial,
} from '@/lib/folderManager';
import { useNavigate } from 'react-router-dom';
import { getCourseMaterials, getCourseSyllabus, getCourses, getPageContent } from '@/lib/api';
import { extractTextFromFile } from '@/lib/pdfExtractor';
import { createFoldersFromCourses } from '@/lib/folderManager';
import '@/lib/folderCleanup'; // Load cleanup utility
import '@/lib/fixDuplicateIds'; // Load ID fix utility

const Folders = () => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [isFetchingMaterials, setIsFetchingMaterials] = useState(false);
  
  // Add Material Dialog State
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const [newMaterialType, setNewMaterialType] = useState<'text' | 'link' | 'file'>('text');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialContent, setNewMaterialContent] = useState('');
  const [newMaterialUrl, setNewMaterialUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // View Material Dialog State
  const [viewingMaterial, setViewingMaterial] = useState<CourseMaterial | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFolders();
    // Auto-sync Canvas courses if API token exists
    syncCanvasCourses();
  }, []);

  const syncCanvasCourses = async () => {
    const apiToken = localStorage.getItem('astar_api_token');
    if (!apiToken) {
      console.log('No Canvas API token found, skipping auto-sync');
      return;
    }

    try {
      console.log('Syncing Canvas courses...');
      const courses = await getCourses();
      console.log('Fetched courses:', courses);
      
      if (courses && courses.length > 0) {
        // Check for duplicates in the courses array itself
        const uniqueCourses = courses.filter((course, index, self) =>
          index === self.findIndex((c) => c.id === course.id)
        );
        
        if (uniqueCourses.length < courses.length) {
          console.warn(`Found ${courses.length - uniqueCourses.length} duplicate courses in Canvas API response`);
        }
        
        const beforeCount = getFolders().length;
        createFoldersFromCourses(uniqueCourses);
        loadFolders(); // Reload to show new folders
        const afterCount = getFolders().length;
        const newCount = afterCount - beforeCount;
        
        if (newCount > 0) {
          toast({
            title: 'Canvas Courses Synced',
            description: `Created ${newCount} new course folder${newCount !== 1 ? 's' : ''}`,
          });
        } else {
          console.log('All course folders already exist');
        }
      } else {
        console.log('No courses found');
      }
    } catch (error) {
      console.error('Failed to sync Canvas courses:', error);
      toast({
        title: 'Canvas Sync Failed',
        description: error instanceof Error ? error.message : 'Could not fetch courses',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (selectedFolder) {
      loadSessions(selectedFolder.id);
      loadCourseMaterials(selectedFolder.id);
    }
  }, [selectedFolder]);

  const loadFolders = () => {
    const loadedFolders = getFolders();
    setFolders(loadedFolders);
  };

  const loadSessions = (folderId: string) => {
    const folderSessions = getSessionsByFolder(folderId);
    setSessions(folderSessions);
  };

  const loadCourseMaterials = (folderId: string) => {
    const materials = getCourseMaterialsByFolder(folderId);
    setCourseMaterials(materials);
  };

  const handleFetchCourseMaterials = async () => {
    if (!selectedFolder || !selectedFolder.courseId) {
      toast({
        title: 'No Course Linked',
        description: 'This folder is not linked to a Canvas course',
        variant: 'destructive',
      });
      return;
    }

    setIsFetchingMaterials(true);
    
    try {
      const { scrapeCourseMaterials } = await import('@/lib/canvasScraper');
      
      // Clear existing materials first
      const existingMaterials = getCourseMaterialsByFolder(selectedFolder.id);
      console.log(`Clearing ${existingMaterials.length} existing materials`);
      existingMaterials.forEach(material => {
        deleteCourseMaterial(material.id);
      });

      // Comprehensive scraping with progress
      const result = await scrapeCourseMaterials(
        selectedFolder.courseId,
        selectedFolder.id,
        (status, progress, total) => {
          console.log(`[${Math.round((progress / total) * 100)}%] ${status}`);
        }
      );

      // Reload materials
      loadCourseMaterials(selectedFolder.id);

      const successCount = result.downloads.filter(d => d.success).length;
      const errorCount = result.errors.length;

      console.log('Scraping complete:');
      console.log(`- Successful: ${successCount}`);
      console.log(`- Errors: ${errorCount}`);
      console.log(`- Course structure:`, result.structure);

      toast({
        title: 'Materials Fetched',
        description: `✅ Downloaded ${successCount} materials${errorCount > 0 ? `\n⚠️ ${errorCount} errors` : ''}`,
      });

      // Show instructor info if found
      if (result.structure.instructor.name) {
        setTimeout(() => {
          toast({
            title: 'Instructor Info',
            description: `${result.structure.instructor.name}${result.structure.instructor.email ? `\n${result.structure.instructor.email}` : ''}`,
          });
        }, 1500);
      }

      // Show textbook info if found
      if (result.structure.textbooks.length > 0) {
        setTimeout(() => {
          toast({
            title: 'Textbooks Found',
            description: `${result.structure.textbooks.length} textbook${result.structure.textbooks.length !== 1 ? 's' : ''} identified`,
          });
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      toast({
        title: 'Fetch Failed',
        description: error instanceof Error ? error.message : 'Could not fetch materials',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingMaterials(false);
    }
  };

  const handleDeleteCourseMaterial = (materialId: string) => {
    deleteCourseMaterial(materialId);
    if (selectedFolder) {
      loadCourseMaterials(selectedFolder.id);
    }
    toast({
      title: 'Material Deleted',
      description: 'Course material has been removed',
    });
  };

  const resetMaterialDialog = () => {
    setNewMaterialName('');
    setNewMaterialContent('');
    setNewMaterialUrl('');
    setNewMaterialType('text');
    setIsAddMaterialDialogOpen(false);
  };

  const handleAddTextMaterial = () => {
    if (!selectedFolder) return;
    if (!newMaterialName.trim() || !newMaterialContent.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a name and content',
        variant: 'destructive',
      });
      return;
    }

    createCourseMaterial(
      newMaterialName,
      'textbook',
      selectedFolder.id,
      newMaterialContent
    );

    loadCourseMaterials(selectedFolder.id);
    resetMaterialDialog();
    
    toast({
      title: 'Material Added',
      description: `"${newMaterialName}" has been added to the folder`,
    });
  };

  const handleAddLinkMaterial = () => {
    if (!selectedFolder) return;
    if (!newMaterialName.trim() || !newMaterialUrl.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a name and URL',
        variant: 'destructive',
      });
      return;
    }

    createCourseMaterial(
      newMaterialName,
      'page',
      selectedFolder.id,
      undefined,
      newMaterialUrl
    );

    loadCourseMaterials(selectedFolder.id);
    resetMaterialDialog();
    
    toast({
      title: 'Link Added',
      description: `"${newMaterialName}" has been added to the folder`,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFolder) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine file type
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';
    
    const supportedTypes = ['pdf', 'txt', 'md', 'doc', 'docx', 'ppt', 'pptx'];
    if (!supportedTypes.includes(fileExtension)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, Word, PowerPoint, or text file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingFile(true);
    try {
      // Extract text from file
      const text = await extractTextFromFile(file);
      
      // Create the material
      createCourseMaterial(
        file.name,
        'file',
        selectedFolder.id,
        text,
        undefined,
        undefined,
        fileExtension,
        selectedFolder.courseId
      );

      loadCourseMaterials(selectedFolder.id);
      resetMaterialDialog();
      
      toast({
        title: 'File Uploaded',
        description: `"${file.name}" has been added to the folder`,
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Could not read file',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddMaterial = () => {
    switch (newMaterialType) {
      case 'text':
        handleAddTextMaterial();
        break;
      case 'link':
        handleAddLinkMaterial();
        break;
      case 'file':
        // For file type, just trigger the file picker
        // The actual upload happens in handleFileUpload
        fileInputRef.current?.click();
        break;
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'Empty Name',
        description: 'Please enter a folder name',
        variant: 'destructive',
      });
      return;
    }

    createFolder(newFolderName);
    loadFolders();
    setNewFolderName('');
    setIsCreateDialogOpen(false);

    toast({
      title: 'Folder Created',
      description: `"${newFolderName}" has been created`,
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    loadFolders();
    if (selectedFolder?.id === folderId) {
      setSelectedFolder(null);
      setSessions([]);
    }

    toast({
      title: 'Folder Deleted',
      description: 'Folder and its sessions have been removed',
    });
  };

  const handleRenameFolder = (folderId: string) => {
    if (!editingFolderName.trim()) return;

    renameFolder(folderId, editingFolderName);
    loadFolders();
    setEditingFolderId(null);

    toast({
      title: 'Folder Renamed',
      description: `Renamed to "${editingFolderName}"`,
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    if (selectedFolder) {
      loadSessions(selectedFolder.id);
    }

    toast({
      title: 'Session Deleted',
      description: 'Work session has been removed',
    });
  };

  const handleOpenSession = (sessionId: string) => {
    // Navigate to ASTAR workbench and load this session
    navigate('/astar', { state: { sessionId } });
  };

  const getSessionTypeLabel = (type?: WorkSession['sessionType']) => {
    switch (type) {
      case 'assignment': return 'Assignment';
      case 'exam': return 'Exam Prep';
      case 'exploration': return 'Exploration';
      default: return 'Study';
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <FolderIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Folders</h1>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a folder to organize your mind maps by topic or class.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Calculus I, Computer Science, Personal"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} className="bg-gradient-primary">
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders List */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Your Folders</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={syncCanvasCourses}
                  className="h-8 w-8 p-0"
                  title="Sync Canvas courses"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {folders.length === 0 ? (
                <div className="text-center py-8">
                  <FolderIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No folders yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a folder to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder, folderIndex) => (
                    <div
                      key={`${folder.id}-${folderIndex}`}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedFolder?.id === folder.id && selectedFolder?.courseId === folder.courseId
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        console.log('Selected folder:', folder.id, folder.name, folder.courseId);
                        setSelectedFolder(folder);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: folder.color }}
                          />
                          {editingFolderId === folder.id ? (
                            <Input
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onBlur={() => handleRenameFolder(folder.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameFolder(folder.id);
                                if (e.key === 'Escape') setEditingFolderId(null);
                              }}
                              className="h-6 text-sm"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{folder.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(folder.sessions || []).length} session
                                {(folder.sessions || []).length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteFolder(folder.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mind Maps in Selected Folder */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              {selectedFolder ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold">{selectedFolder.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {(sessions || []).length} session{(sessions || []).length !== 1 ? 's' : ''} • {(courseMaterials || []).length} material{(courseMaterials || []).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedFolder.courseId && (
                      <Button
                        onClick={handleFetchCourseMaterials}
                        disabled={isFetchingMaterials}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingMaterials ? 'animate-spin' : ''}`} />
                        {isFetchingMaterials ? 'Fetching...' : 'Fetch Materials'}
                      </Button>
                    )}
                  </div>

                  {sessions.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-2">No work sessions in this folder</p>
                      <p className="text-sm text-muted-foreground">
                        Sessions from ASTAR workbench will be saved here automatically
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
                          onClick={() => handleOpenSession(session.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{session.name}</h3>
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                  {getSessionTypeLabel(session.sessionType)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(session.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              {session.concepts.length > 0 && (
                                <>
                                  <Brain className="w-4 h-4" />
                                  <span>{session.concepts.length} concepts</span>
                                  <span>•</span>
                                </>
                              )}
                              {session.conversationHistory.length > 0 && (
                                <>
                                  <span>{session.conversationHistory.length} messages</span>
                                </>
                              )}
                              {session.stepMode && (
                                <>
                                  <span>•</span>
                                  <span className="text-primary">Step Mode</span>
                                </>
                              )}
                            </div>

                            {session.notes && (
                              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                <p className="line-clamp-2">{session.notes}</p>
                              </div>
                            )}

                            {session.assignmentTitle && (
                              <div className="flex items-center gap-2 text-xs">
                                <FileText className="w-3 h-3 text-primary" />
                                <span className="text-muted-foreground truncate">
                                  {session.assignmentTitle}
                                </span>
                              </div>
                            )}

                            {session.classSubject && (
                              <div className="flex items-center gap-2 text-xs">
                                <Book className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">
                                  {session.classSubject}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Course Materials Section */}
                  <>
                    <div className="flex items-center justify-between mt-8 mb-4">
                      <h3 className="font-semibold text-lg">
                        Course Materials 
                        {courseMaterials.length > 0 && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({courseMaterials.length} items)
                          </span>
                        )}
                      </h3>
                      <Button
                        onClick={() => setIsAddMaterialDialogOpen(true)}
                        size="sm"
                        className="bg-gradient-primary text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Material
                      </Button>
                    </div>
                    {courseMaterials.length === 0 ? (
                      <div className="text-center py-8 bg-background/50 rounded-lg border border-border">
                        <Book className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                        <p className="text-muted-foreground mb-2">No materials yet</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedFolder.courseId 
                            ? 'Click "Fetch Materials" to import from Canvas or "Add Material" to add your own'
                            : 'Click "Add Material" to add study materials to this folder'}
                        </p>
                      </div>
                    ) : (
                        <div className="space-y-2">
                          {courseMaterials.map((material) => (
                            <div
                              key={material.id}
                              className="p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  {material.type === 'page' && <Link2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                                  {material.type === 'file' && <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                                  {(material.type === 'textbook' || material.type === 'syllabus' || material.type === 'module') && (
                                    <Book className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{material.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {material.type}
                                      {material.fileType && ` • ${material.fileType.toUpperCase()}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setViewingMaterial(material)}
                                    title="View content"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  {material.content && material.content.length > 100 && (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium px-2">
                                      ✓ Downloaded
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteCourseMaterial(material.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                </>
              ) : (
                <div className="text-center py-20">
                  <FolderIcon className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <p className="text-lg font-semibold mb-2">Select a Folder</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a folder from the left to view its work sessions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Material Dialog */}
      <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Material to Folder</DialogTitle>
            <DialogDescription>
              Add study materials, notes, PDFs, or links to this folder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Material Type Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Material Type</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={newMaterialType === 'text' ? 'default' : 'outline'}
                  onClick={() => setNewMaterialType('text')}
                  className="w-full"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Text/Notes
                </Button>
                <Button
                  type="button"
                  variant={newMaterialType === 'link' ? 'default' : 'outline'}
                  onClick={() => setNewMaterialType('link')}
                  className="w-full"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Link
                </Button>
                <Button
                  type="button"
                  variant={newMaterialType === 'file' ? 'default' : 'outline'}
                  onClick={() => setNewMaterialType('file')}
                  className="w-full"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </div>

            {/* Material Name */}
            {newMaterialType !== 'file' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  placeholder="e.g., Chapter 5 Notes, Study Guide, etc."
                />
              </div>
            )}

            {/* Content based on type */}
            {newMaterialType === 'text' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  value={newMaterialContent}
                  onChange={(e) => setNewMaterialContent(e.target.value)}
                  placeholder="Paste your notes, study materials, or any text content..."
                  className="min-h-[200px] resize-y"
                />
              </div>
            )}

            {newMaterialType === 'link' && (
              <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <Input
                  type="url"
                  value={newMaterialUrl}
                  onChange={(e) => setNewMaterialUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            )}

            {newMaterialType === 'file' && (
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Click here to select a file</p>
                <p className="text-xs text-muted-foreground mb-3">
                  or click "Browse Files" button below
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-2"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Supports: PDF, Word, PowerPoint, Text files
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx,.ppt,.pptx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetMaterialDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMaterial} 
              className="bg-gradient-primary"
              disabled={isUploadingFile}
            >
              {isUploadingFile ? 'Uploading...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Material Dialog */}
      <Dialog open={!!viewingMaterial} onOpenChange={() => setViewingMaterial(null)}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingMaterial?.name}</DialogTitle>
            <DialogDescription className="capitalize">
              {viewingMaterial?.type}
              {viewingMaterial?.fileType && ` • ${viewingMaterial.fileType.toUpperCase()}`}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] p-4 bg-background/50 rounded-lg border border-border">
            {viewingMaterial?.url && !viewingMaterial?.content ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">External Link:</p>
                <a 
                  href={viewingMaterial.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {viewingMaterial.url}
                </a>
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {viewingMaterial?.content || 'No content available'}
              </pre>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setViewingMaterial(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Folders;

