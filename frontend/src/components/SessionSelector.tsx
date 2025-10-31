import { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Brain, ChevronDown, Clock, MessageSquare, Plus, Sparkles } from 'lucide-react';
import { WorkSession, getFolders, getSessionsByFolder } from '@/lib/folderManager';

interface SessionSelectorProps {
  currentSessionId: string | null;
  currentFolderId: string | null;
  onSelectSession: (session: WorkSession) => void;
  onNewSession: () => void;
}

export default function SessionSelector({
  currentSessionId,
  currentFolderId,
  onSelectSession,
  onNewSession,
}: SessionSelectorProps) {
  const [open, setOpen] = useState(false);
  const folders = getFolders();
  
  // Get current session name if one is selected
  const currentSession = currentSessionId 
    ? getFolders()
        .flatMap(f => getSessionsByFolder(f.id))
        .find(s => s.id === currentSessionId)
    : null;

  // Get sessions organized by folder
  const sessionsByFolder = folders.map(folder => ({
    folder,
    sessions: getSessionsByFolder(folder.id),
  })).filter(item => item.sessions.length > 0);

  const getSessionTypeIcon = (type?: WorkSession['sessionType']) => {
    switch (type) {
      case 'assignment': return '📝';
      case 'exam': return '📚';
      case 'exploration': return '🔍';
      default: return '✏️';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Brain className="w-4 h-4" />
          <span className="max-w-[120px] truncate">
            {currentSession ? currentSession.name : 'New Session'}
          </span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel>Work Sessions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => {
          onNewSession();
          setOpen(false);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Start New Session
        </DropdownMenuItem>
        
        {sessionsByFolder.length > 0 && <DropdownMenuSeparator />}
        
        {sessionsByFolder.map(({ folder, sessions }) => (
          <DropdownMenuGroup key={folder.id}>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
              <div 
                className="w-2 h-2 rounded-full inline-block mr-2" 
                style={{ backgroundColor: folder.color }}
              />
              {folder.name}
            </DropdownMenuLabel>
            {sessions
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 5) // Show max 5 recent sessions per folder
              .map((session) => (
                <DropdownMenuItem
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    setOpen(false);
                  }}
                  className={currentSessionId === session.id ? 'bg-primary/10' : ''}
                >
                  <div className="flex items-start w-full gap-2">
                    <span className="mt-0.5">{getSessionTypeIcon(session.sessionType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">
                        {session.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {session.concepts.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {session.concepts.length}
                          </span>
                        )}
                        {session.conversationHistory.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {session.conversationHistory.length}
                          </span>
                        )}
                        {session.stepMode && (
                          <span className="flex items-center gap-1 text-primary">
                            <Sparkles className="w-3 h-3" />
                            Steps
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
          </DropdownMenuGroup>
        ))}
        
        {sessionsByFolder.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No saved sessions yet.<br />
            Start working to create one!
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
