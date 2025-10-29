import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Menu, X, Download, Upload, FileText, Plus, Trash2, Link2, FileUp, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage, submitAssignmentToCanvas } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import ProgressTracker from "@/components/ProgressTracker";
import { generateStudyGuidePDF, generateAssignmentDraftPDF } from "@/lib/pdfGenerator";
import { formatLLMResponse } from "@/lib/messageFormatter";
import FormattedMessage from "@/components/FormattedMessage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  questions?: string[];
  formattedContent?: string;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseColor: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  points: number;
}

interface ContextItem {
  id: string;
  type: 'pdf' | 'text' | 'link';
  name: string;
  content: string;
  addedAt: Date;
}

const Astar = () => {
  const location = useLocation();
  const assignment = (location.state as { assignment?: Assignment })?.assignment;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: assignment 
        ? `Hi! I'm ASTAR. I see you're working on "${assignment.title}" for ${assignment.course}. I'm here to help you think through this assignment at a fundamental level. What aspect would you like to explore first?`
        : "Hi! I'm ASTAR. I'm here to help you think through complex problems at a fundamental level. What would you like to understand today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!!assignment); // Open if assignment exists
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [generatedStudyGuide, setGeneratedStudyGuide] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContextType, setNewContextType] = useState<'pdf' | 'text' | 'link'>('text');
  const [newContextText, setNewContextText] = useState('');
  const [newContextUrl, setNewContextUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Progress tracking
  const messageCount = Math.floor((messages.length - 1) / 2); // User messages only
  const targetMessages = 10; // Target number of exchanges for completion
  const progress = Math.min((messageCount / targetMessages) * 100, 100);
  const isComplete = progress >= 100;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Build additional context from context items
      let additionalContext = '';
      if (contextItems.length > 0) {
        additionalContext = '\n\nAdditional Context:\n' + contextItems.map(item => {
          if (item.type === 'link') {
            return `[Link: ${item.name}] ${item.content}`;
          } else if (item.type === 'pdf') {
            return `[Document: ${item.name}]\n${item.content.substring(0, 5000)}`; // Limit to 5000 chars
          } else {
            return `[Note: ${item.name}]\n${item.content}`;
          }
        }).join('\n\n');
      }

      // Call real LLM backend with optional assignment context and additional context
      const response = await sendChatMessage({
        message: input + additionalContext,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        assignmentContext: assignment
      });

      // Format the LLM response (strip <think> tags, extract questions)
      const formatted = formatLLMResponse(response.response);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response, // Keep original for history
        formattedContent: formatted.content,
        questions: formatted.questions,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      toast({
        title: "Failed to Send Message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your message. Please make sure the backend is running and try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddTextContext = () => {
    if (!newContextText.trim()) {
      toast({
        title: "Empty Context",
        description: "Please enter some text",
        variant: "destructive",
      });
      return;
    }

    const newItem: ContextItem = {
      id: Date.now().toString(),
      type: 'text',
      name: `Text Note ${contextItems.filter(i => i.type === 'text').length + 1}`,
      content: newContextText,
      addedAt: new Date(),
    };

    setContextItems([...contextItems, newItem]);
    setNewContextText('');
    setShowAddContext(false);
    
    toast({
      title: "Context Added",
      description: "Text context has been added successfully",
    });
  };

  const handleAddLinkContext = () => {
    if (!newContextUrl.trim()) {
      toast({
        title: "Empty URL",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    const newItem: ContextItem = {
      id: Date.now().toString(),
      type: 'link',
      name: newContextUrl.split('/').pop() || 'Link',
      content: newContextUrl,
      addedAt: new Date(),
    };

    setContextItems([...contextItems, newItem]);
    setNewContextUrl('');
    setShowAddContext(false);
    
    toast({
      title: "Link Added",
      description: "Link has been added to context",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('text')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or text file",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await file.text();
      
      const newItem: ContextItem = {
        id: Date.now().toString(),
        type: 'pdf',
        name: file.name,
        content: text,
        addedAt: new Date(),
      };

      setContextItems([...contextItems, newItem]);
      setShowAddContext(false);
      
      toast({
        title: "File Uploaded",
        description: `${file.name} has been added to context`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not read file",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveContext = (id: string) => {
    setContextItems(contextItems.filter(item => item.id !== id));
    toast({
      title: "Context Removed",
      description: "Item removed from context",
    });
  };

  const handleGenerateDraft = async () => {
    if (!assignment) return;
    
    setIsGenerating(true);
    try {
      const response = await sendChatMessage({
        message: `Based on our entire conversation about "${assignment.title}", please generate a complete, polished draft for this assignment. Include all the concepts we discussed and structure it properly for submission.`,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        assignmentContext: assignment
      });

      // Save the generated content
      setGeneratedDraft(response.response);

      // Add the generated draft as a message
      const draftMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `# 📝 Assignment Draft\n\n${response.response}\n\n---\n\n*This draft is based on our discussion. Please review, edit, and add your own voice before submitting.*`,
      };
      
      setMessages((prev) => [...prev, draftMessage]);
      
      toast({
        title: "Draft Generated!",
        description: "You can now submit to Canvas or download as PDF.",
      });
    } catch (error) {
      toast({
        title: "Failed to Generate Draft",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStudyGuide = async () => {
    setIsGenerating(true);
    try {
      const response = await sendChatMessage({
        message: `Based on our entire conversation, please create a comprehensive study guide that summarizes all the key concepts, insights, and important points we discussed. Format it clearly with headings and bullet points.`,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        assignmentContext: assignment
      });

      // Save the generated content
      setGeneratedStudyGuide(response.response);

      // Add the study guide as a message
      const studyGuideMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `# 📚 Study Guide\n\n${response.response}\n\n---\n\n*This study guide captures the key points from our discussion.*`,
      };
      
      setMessages((prev) => [...prev, studyGuideMessage]);
      
      toast({
        title: "Study Guide Generated!",
        description: "Download as PDF below.",
      });
    } catch (error) {
      toast({
        title: "Failed to Generate Study Guide",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDraftPDF = () => {
    if (!generatedDraft || !assignment) return;

    generateAssignmentDraftPDF({
      title: assignment.title,
      content: generatedDraft,
      subject: assignment.course,
    });

    toast({
      title: "PDF Downloaded!",
      description: "Check your downloads folder.",
    });
  };

  const handleDownloadStudyGuidePDF = () => {
    if (!generatedStudyGuide) return;

    generateStudyGuidePDF({
      title: assignment ? `${assignment.title} - Study Guide` : 'Study Guide',
      content: generatedStudyGuide,
      subject: assignment?.course,
    });

    toast({
      title: "PDF Downloaded!",
      description: "Check your downloads folder.",
    });
  };

  const handleSubmitToCanvas = async () => {
    if (!generatedDraft || !assignment) return;

    setIsSubmitting(true);
    try {
      // Extract course ID from assignment (assuming it's stored)
      // For now, we'll need to add courseId to the assignment interface
      const courseId = (assignment as any).course_id || assignment.id.split('-')[0];

      await submitAssignmentToCanvas(
        assignment.id,
        courseId,
        generatedDraft
      );

      toast({
        title: "Submitted to Canvas!",
        description: `Your assignment "${assignment.title}" has been submitted successfully.`,
      });

      // Clear the draft after submission
      setGeneratedDraft(null);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit to Canvas",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Progress Tracker */}
      <ProgressTracker
        progress={progress}
        messageCount={messageCount}
        isComplete={isComplete}
        hasAssignment={!!assignment}
        onGenerateDraft={handleGenerateDraft}
        onGenerateStudyGuide={handleGenerateStudyGuide}
        isGenerating={isGenerating}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
      {/* Collapsible Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } border-r border-border bg-card transition-all duration-200 overflow-hidden flex flex-col`}
      >
        {assignment ? (
          // Show assignment context if assignment exists
          <>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-lg mb-2">Assignment Context</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Title:</span>
                  <p className="font-medium">{assignment.title}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Course:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: assignment.courseColor }}
                    />
                    <p className="font-medium">{assignment.course}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Due:</span>
                  <p className="font-medium">
                    In {assignment.daysUntilDue} {assignment.daysUntilDue === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Points:</span>
                  <p className="font-medium">{assignment.points} pts</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {assignment.description}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Show empty state if no assignment
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg mb-2">Assignment Context</h2>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No assignment selected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Start with ASTAR" on an assignment to get personalized help
              </p>
            </div>
          </div>
        )}
        
        {/* Context Section */}
        <div className="flex-1 flex flex-col p-4 border-t border-border overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Context</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddContext(!showAddContext)}
              className="h-7 w-7 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Add Context Form */}
          {showAddContext && (
            <div className="mb-3 p-3 bg-background/50 rounded-lg border border-border space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={newContextType === 'text' ? 'default' : 'outline'}
                  onClick={() => setNewContextType('text')}
                  className="flex-1"
                >
                  <Type className="w-3 h-3 mr-1" />
                  Text
                </Button>
                <Button
                  size="sm"
                  variant={newContextType === 'link' ? 'default' : 'outline'}
                  onClick={() => setNewContextType('link')}
                  className="flex-1"
                >
                  <Link2 className="w-3 h-3 mr-1" />
                  Link
                </Button>
                <Button
                  size="sm"
                  variant={newContextType === 'pdf' ? 'default' : 'outline'}
                  onClick={() => {
                    setNewContextType('pdf');
                    fileInputRef.current?.click();
                  }}
                  className="flex-1"
                >
                  <FileUp className="w-3 h-3 mr-1" />
                  File
                </Button>
              </div>

              {newContextType === 'text' && (
                <div className="space-y-2">
                  <Textarea
                    value={newContextText}
                    onChange={(e) => setNewContextText(e.target.value)}
                    placeholder="Paste text, notes, or instructions..."
                    className="min-h-[100px] text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTextContext}
                    className="w-full"
                  >
                    Add Text
                  </Button>
                </div>
              )}

              {newContextType === 'link' && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={newContextUrl}
                    onChange={(e) => setNewContextUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-md focus:border-primary"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddLinkContext}
                    className="w-full"
                  >
                    Add Link
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Context Items List */}
          <div className="space-y-2">
            {contextItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No context added yet. Click + to add PDFs, links, or text that ASTAR can reference.
              </p>
            ) : (
              contextItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-background/50 border border-border rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {item.type === 'pdf' && <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                      {item.type === 'link' && <Link2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                      {item.type === 'text' && <Type className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.type === 'link' ? item.content : `${item.content.substring(0, 50)}...`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveContext(item.id)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="p-4 border-t border-border">
          <h2 className="font-semibold text-sm mb-2">Quick Notes</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot down quick thoughts..."
            className="min-h-[80px] text-xs resize-none bg-background/50 border-border focus:border-primary transition-colors"
          />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-muted"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">ASTAR Workbench</h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow mr-3 flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-gradient-primary text-white shadow-glow"
                      : "bg-card border border-primary/20 text-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  ) : (
                    <FormattedMessage
                      content={message.formattedContent || message.content}
                      questions={message.questions || []}
                      hasQuestions={(message.questions?.length || 0) > 0}
                    />
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow mr-3 flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-card border border-primary/20 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons for Generated Content */}
            {generatedDraft && assignment && (
              <div className="flex flex-col gap-3 p-4 bg-card/50 border border-primary/30 rounded-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  Assignment Draft Ready
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitToCanvas}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-primary text-white shadow-glow"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Submit to Canvas'}
                  </Button>
                  <Button
                    onClick={handleDownloadDraftPDF}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}

            {generatedStudyGuide && (
              <div className="flex flex-col gap-3 p-4 bg-card/50 border border-primary/30 rounded-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  Study Guide Ready
                </div>
                <Button
                  onClick={handleDownloadStudyGuidePDF}
                  className="w-full bg-gradient-primary text-white shadow-glow"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Study Guide PDF
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question... (ASTAR guides you to think through it)"
              className="resize-none min-h-[60px] bg-background border-border focus:border-primary transition-colors"
              rows={2}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-gradient-primary text-white shadow-glow hover:shadow-lg hover:scale-105 transition-all self-end"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Astar;
