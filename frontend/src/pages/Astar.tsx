import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import ProgressTracker from "@/components/ProgressTracker";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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
      // Call real LLM backend with optional assignment context
      const response = await sendChatMessage({
        message: input,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        assignmentContext: assignment
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
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

      // Add the generated draft as a message
      const draftMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `# 📝 Assignment Draft\n\n${response.response}\n\n---\n\n*This draft is based on our discussion. Please review, edit, and add your own voice before submitting.*`,
      };
      
      setMessages((prev) => [...prev, draftMessage]);
      
      toast({
        title: "Draft Generated!",
        description: "Review the draft below and make any necessary edits.",
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

      // Add the study guide as a message
      const studyGuideMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `# 📚 Study Guide\n\n${response.response}\n\n---\n\n*This study guide captures the key points from our discussion.*`,
      };
      
      setMessages((prev) => [...prev, studyGuideMessage]);
      
      toast({
        title: "Study Guide Generated!",
        description: "Your personalized study guide is ready below.",
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
        
        {/* Notes Section */}
        <div className="flex-1 flex flex-col p-4">
          <h2 className="font-semibold text-lg mb-2">My Notes</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your thoughts, ideas, and notes here..."
            className="flex-1 resize-none bg-background/50 border-border focus:border-primary transition-colors"
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
                  <p className="text-sm leading-relaxed">{message.content}</p>
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
