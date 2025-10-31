import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Workflow, 
  getWorkflows, 
  getMCPServers, 
  connectMCPServer,
  MCPServer,
  rateWorkflow,
  deleteWorkflow 
} from '@/lib/workflowManager';
import { 
  Workflow as WorkflowIcon, 
  ThumbsUp, 
  ThumbsDown, 
  Trash2, 
  GitBranch,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface WorkflowSelectorProps {
  onSelectWorkflow: (workflow: Workflow) => void;
  onClose: () => void;
  isOpen: boolean;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({ 
  onSelectWorkflow, 
  onClose, 
  isOpen 
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>(getWorkflows());
  const [mcpServers] = useState<MCPServer[]>(getMCPServers());
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectingServer, setConnectingServer] = useState<MCPServer | null>(null);
  const [apiToken, setApiToken] = useState('');
  const { toast } = useToast();

  const refreshWorkflows = () => {
    setWorkflows(getWorkflows());
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    // Check if all required servers are connected
    const disconnectedServers = workflow.steps
      .map(step => mcpServers.find(s => s.id === step.serverId))
      .filter(server => server && !server.connected);

    if (disconnectedServers.length > 0) {
      setSelectedWorkflow(workflow);
      setConnectingServer(disconnectedServers[0]!);
      setShowConnectionDialog(true);
    } else {
      onSelectWorkflow(workflow);
      onClose();
    }
  };

  const handleConnectServer = () => {
    if (!connectingServer) return;

    if (connectingServer.requiresAuth && !apiToken.trim()) {
      toast({
        title: 'API Token Required',
        description: `Please enter your ${connectingServer.name} API token`,
        variant: 'destructive',
      });
      return;
    }

    connectMCPServer(connectingServer.id, apiToken);
    
    toast({
      title: 'Connected!',
      description: `${connectingServer.name} has been connected successfully`,
    });

    setApiToken('');
    setShowConnectionDialog(false);

    // If workflow was selected, proceed with it
    if (selectedWorkflow) {
      onSelectWorkflow(selectedWorkflow);
      onClose();
    }
  };

  const handleRateWorkflow = (workflowId: string, rating: 'up' | 'down') => {
    rateWorkflow(workflowId, rating);
    refreshWorkflows();
    
    toast({
      title: rating === 'up' ? 'Workflow Liked' : 'Workflow Disliked',
      description: 'Your feedback helps improve ASTAR',
    });
  };

  const handleDeleteWorkflow = (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteWorkflow(workflowId);
    refreshWorkflows();
    
    toast({
      title: 'Workflow Deleted',
      description: 'The workflow has been removed',
    });
  };

  const getServerIcon = (serverId: string) => {
    const server = mcpServers.find(s => s.id === serverId);
    return server?.connected ? (
      <CheckCircle2 className="w-3 h-3 text-green-500" />
    ) : (
      <AlertCircle className="w-3 h-3 text-yellow-500" />
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WorkflowIcon className="w-5 h-5 text-primary" />
              Select Workflow
            </DialogTitle>
            <DialogDescription>
              Choose a saved workflow to streamline your task completion
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {workflows.length === 0 ? (
              <div className="text-center py-12">
                <WorkflowIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No workflows yet</p>
                <p className="text-sm text-muted-foreground">
                  Workflows will be saved automatically as you complete tasks
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
                    onClick={() => handleSelectWorkflow(workflow)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {workflow.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${workflow.rating === 'up' ? 'text-green-500' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateWorkflow(workflow.id, 'up');
                          }}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${workflow.rating === 'down' ? 'text-red-500' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateWorkflow(workflow.id, 'down');
                          }}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                          onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Workflow Steps */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {workflow.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs">
                            {getServerIcon(step.serverId)}
                            <span>{step.serverName}</span>
                          </div>
                          {idx < workflow.steps.length - 1 && (
                            <GitBranch className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Tags & Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Used {workflow.usageCount} times</span>
                      {workflow.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {workflow.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-muted rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MCP Connection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Connect {connectingServer?.name}</DialogTitle>
            <DialogDescription>
              This workflow requires {connectingServer?.name}. Please connect it to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-background/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                {connectingServer?.description}
              </p>
            </div>

            {connectingServer?.requiresAuth && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    API Token / Personal Access Token
                  </label>
                  <Input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder={`Enter your ${connectingServer?.name} token`}
                  />
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">
                    How to get your API token:
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {connectingServer?.type === 'github' && (
                      <>
                        <p>1. Go to GitHub Settings → Developer Settings</p>
                        <p>2. Click "Personal Access Tokens" → "Tokens (classic)"</p>
                        <p>3. Generate new token with repo permissions</p>
                        <a 
                          href="https://github.com/settings/tokens"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline mt-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open GitHub Token Settings
                        </a>
                      </>
                    )}
                    {connectingServer?.type === 'notion' && (
                      <>
                        <p>1. Go to Notion Settings → Integrations</p>
                        <p>2. Create new integration</p>
                        <p>3. Copy the Internal Integration Token</p>
                        <a 
                          href="https://www.notion.so/my-integrations"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline mt-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Notion Integrations
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectServer} className="bg-gradient-primary">
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkflowSelector;

