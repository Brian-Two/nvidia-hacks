import { useState, useEffect } from 'react';
import { Folder as FolderIcon, Plus, Trash2, Edit2, FileText, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  MindMap,
  getFolders,
  createFolder,
  deleteFolder,
  renameFolder,
  getMindMapsByFolder,
  deleteMindMap,
} from '@/lib/folderManager';
import { useNavigate } from 'react-router-dom';

const Folders = () => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      loadMindMaps(selectedFolder.id);
    }
  }, [selectedFolder]);

  const loadFolders = () => {
    const loadedFolders = getFolders();
    setFolders(loadedFolders);
  };

  const loadMindMaps = (folderId: string) => {
    const maps = getMindMapsByFolder(folderId);
    setMindMaps(maps);
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
      setMindMaps([]);
    }

    toast({
      title: 'Folder Deleted',
      description: 'Folder and its mindmaps have been removed',
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

  const handleDeleteMindMap = (mindMapId: string) => {
    deleteMindMap(mindMapId);
    if (selectedFolder) {
      loadMindMaps(selectedFolder.id);
    }

    toast({
      title: 'Mind Map Deleted',
      description: 'Mind map has been removed',
    });
  };

  const handleOpenMindMap = (mindMapId: string) => {
    // Navigate to ASTAR workbench and load this mindmap
    navigate('/astar', { state: { mindMapId } });
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
        <p className="text-muted-foreground">
          Organize your mind maps by class or topic
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders List */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="font-semibold text-lg mb-4">Your Folders</h2>

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
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedFolder?.id === folder.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedFolder(folder)}
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
                                {folder.mindMaps.length} mind map
                                {folder.mindMaps.length !== 1 ? 's' : ''}
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
                        {mindMaps.length} mind map{mindMaps.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {mindMaps.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-2">No mind maps in this folder</p>
                      <p className="text-sm text-muted-foreground">
                        Mind maps from ASTAR sessions will be saved here automatically
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mindMaps.map((mindMap) => (
                        <div
                          key={mindMap.id}
                          className="p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer"
                          onClick={() => handleOpenMindMap(mindMap.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{mindMap.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {new Date(mindMap.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMindMap(mindMap.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Brain className="w-4 h-4" />
                            <span>{mindMap.concepts.length} concepts</span>
                          </div>

                          {mindMap.assignmentTitle && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <FileText className="w-3 h-3 text-primary" />
                              <span className="text-muted-foreground truncate">
                                {mindMap.assignmentTitle}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <FolderIcon className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <p className="text-lg font-semibold mb-2">Select a Folder</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a folder from the left to view its mind maps
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Folders;

