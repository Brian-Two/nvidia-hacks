import { useState } from "react";
import { CheckCircle, XCircle, Eye, EyeOff, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface McpServer {
  id: string;
  type: string;
  name: string;
  apiKey: string;
  isConnected: boolean;
}

const MCP_SERVER_TYPES = [
  { value: "google-drive", label: "Google Drive", placeholder: "OAuth token or API key" },
  { value: "github", label: "GitHub", placeholder: "Personal access token" },
  { value: "notion", label: "Notion", placeholder: "Integration token" },
  { value: "slack", label: "Slack", placeholder: "Bot token" },
  { value: "custom", label: "Custom MCP Server", placeholder: "API key or token" },
];

const Connections = () => {
  const [university, setUniversity] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleTestConnection = () => {
    if (!university || !apiToken) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Simulate connection test
    setTimeout(() => {
      setIsConnected(true);
      toast({
        title: "Connection Successful",
        description: "Your Canvas account is now connected",
      });
    }, 1000);
  };

  const handleSave = () => {
    if (isConnected) {
      toast({
        title: "Settings Saved",
        description: "Your connection settings have been updated",
      });
    } else {
      toast({
        title: "Test Connection First",
        description: "Please test your connection before saving",
        variant: "destructive",
      });
    }
  };

  const handleAddMcpServer = () => {
    const newServer: McpServer = {
      id: Date.now().toString(),
      type: "",
      name: "",
      apiKey: "",
      isConnected: false,
    };
    setMcpServers([...mcpServers, newServer]);
  };

  const handleRemoveMcpServer = (id: string) => {
    setMcpServers(mcpServers.filter(server => server.id !== id));
    toast({
      title: "Server Removed",
      description: "MCP server connection has been removed",
    });
  };

  const handleUpdateMcpServer = (id: string, field: keyof McpServer, value: string) => {
    setMcpServers(mcpServers.map(server => 
      server.id === id ? { ...server, [field]: value } : server
    ));
  };

  const handleTestMcpConnection = (id: string) => {
    const server = mcpServers.find(s => s.id === id);
    if (!server?.type || !server?.apiKey) {
      toast({
        title: "Missing Information",
        description: "Please select a server type and enter credentials",
        variant: "destructive",
      });
      return;
    }

    setTimeout(() => {
      setMcpServers(mcpServers.map(s => 
        s.id === id ? { ...s, isConnected: true } : s
      ));
      toast({
        title: "Connection Successful",
        description: `${server.type} is now connected`,
      });
    }, 1000);
  };

  const toggleShowToken = (id: string) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-3xl font-bold mb-2">Connections</h1>
        <p className="text-muted-foreground">
          Connect your Canvas account and MCP servers to enhance ASTAR
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Canvas Connection */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Canvas LMS</h2>
          {/* Connection Status */}
          <div className="flex items-center gap-3 pb-6 border-b border-border">
            {isConnected ? (
              <>
                <CheckCircle className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Last synced: Just now
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-destructive" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Not Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Configure your Canvas connection below
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Select value={university} onValueChange={setUniversity}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canvas">Canvas.instructure.com</SelectItem>
                  <SelectItem value="custom">Custom Domain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiToken">Canvas API Token</Label>
              <div className="relative">
                <Input
                  id="apiToken"
                  type={showToken ? "text" : "password"}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter your API token"
                  className="bg-background pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full px-4 py-3 flex items-center justify-between bg-muted hover:bg-muted/70 transition-colors"
              >
                <span className="text-sm font-medium">
                  How to get your API token
                </span>
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showInstructions && (
                <div className="px-4 py-3 space-y-2 text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Log in to your Canvas account</li>
                    <li>Go to Account → Settings</li>
                    <li>Scroll to "Approved Integrations"</li>
                    <li>Click "+ New Access Token"</li>
                    <li>Give it a purpose (e.g., "ASTAR")</li>
                    <li>Copy the token and paste it above</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleTestConnection}
                variant="outline"
                className="flex-1"
              >
                Test Connection
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-primary text-white shadow-glow hover:shadow-lg hover:scale-105 transition-all"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* MCP Servers Section */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">MCP Servers</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Connect external services to enhance ASTAR's capabilities
              </p>
            </div>
            <Button
              onClick={handleAddMcpServer}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Server
            </Button>
          </div>

          {mcpServers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No MCP servers connected yet.</p>
              <p className="text-sm mt-1">Click "Add Server" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mcpServers.map((server) => (
                <div
                  key={server.id}
                  className="border border-border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {server.isConnected ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {server.type ? MCP_SERVER_TYPES.find(t => t.value === server.type)?.label : "New Server"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {server.isConnected ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMcpServer(server.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Server Type</Label>
                      <Select
                        value={server.type}
                        onValueChange={(value) => handleUpdateMcpServer(server.id, "type", value)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select server type" />
                        </SelectTrigger>
                        <SelectContent>
                          {MCP_SERVER_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {server.type && (
                      <>
                        <div className="space-y-2">
                          <Label>Connection Name (Optional)</Label>
                          <Input
                            value={server.name}
                            onChange={(e) => handleUpdateMcpServer(server.id, "name", e.target.value)}
                            placeholder={`My ${MCP_SERVER_TYPES.find(t => t.value === server.type)?.label}`}
                            className="bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>API Key / Token</Label>
                          <div className="relative">
                            <Input
                              type={showTokens[server.id] ? "text" : "password"}
                              value={server.apiKey}
                              onChange={(e) => handleUpdateMcpServer(server.id, "apiKey", e.target.value)}
                              placeholder={MCP_SERVER_TYPES.find(t => t.value === server.type)?.placeholder}
                              className="bg-background pr-10"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2"
                              onClick={() => toggleShowToken(server.id)}
                            >
                              {showTokens[server.id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleTestMcpConnection(server.id)}
                          variant="outline"
                          className="w-full"
                          disabled={!server.type || !server.apiKey}
                        >
                          Test Connection
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;
