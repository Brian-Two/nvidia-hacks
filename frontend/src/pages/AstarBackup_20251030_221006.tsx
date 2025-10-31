import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Sparkles, Brain, X, Plus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import FormattedMessage from "@/components/FormattedMessage";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import type { ConceptNode } from "@/components/KnowledgeGraph";
import { extractConcepts, addConceptsToGraph, saveKnowledgeGraph, loadKnowledgeGraph, updateConceptStatus } from "@/lib/conceptExtractor";
import { formatLLMResponse } from "@/lib/messageFormatter";
import {
  getMindMapById,
  updateMindMap,
  createMindMap,
  getOrCreateFolderForAssignment,
  setCurrentMindMapId,
  getMindMapsByFolder,
} from "@/lib/folderManager";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  formattedContent?: string;
  questions?: string[];
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
  course_id?: number;
}

const AstarNew = () => {
  const location = useLocation();
  const assignment = (location.state as { assignment?: Assignment })?.assignment;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: assignment
        ? `Hi! I'm ASTAR. I see you're working on "${assignment.title}" for ${assignment.course}. I'm here to help you think through this assignment. What would you like to explore?`
        : "Hi! I'm ASTAR. I'm here to help you understand complex topics. What would you like to learn today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Knowledge Graph state
  const [concepts, setConcepts] = useState<ConceptNode[]>([]);
  const [currentConcept, setCurrentConcept] = useState<string | undefined>();
  const [selectedConceptForAnnotation, setSelectedConceptForAnnotation] = useState<ConceptNode | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [annotationsFullScreen, setAnnotationsFullScreen] = useState(false);

  // MindMap state
  const [currentMindMapId, setCurrentMindMapIdState] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [availableMindMaps, setAvailableMindMaps] = useState<Array<{ id: string; name: string }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize folder and mindmap system
  useEffect(() => {
    const mindMapIdFromState = (location.state as { mindMapId?: string })?.mindMapId;

    if (mindMapIdFromState) {
      // Loading a specific mind map from Folders page
      const mindMap = getMindMapById(mindMapIdFromState);
      if (mindMap) {
        setConcepts(mindMap.concepts);
        setCurrentMindMapIdState(mindMap.id);
        setCurrentFolderId(mindMap.folderId);
        setCurrentMindMapId(mindMap.id);
      }
    } else if (assignment) {
      // Assignment selected - create/load mind map for it
      const folder = getOrCreateFolderForAssignment(
        assignment.course_id?.toString() || assignment.id.split("-")[0],
        assignment.course
      );
      setCurrentFolderId(folder.id);

      const folderMindMaps = getMindMapsByFolder(folder.id);
      setAvailableMindMaps(folderMindMaps.map((m) => ({ id: m.id, name: m.name })));

      const existingMindMap = folderMindMaps.find((m) => m.assignmentId === assignment.id);
      if (existingMindMap) {
        setConcepts(existingMindMap.concepts);
        setCurrentMindMapIdState(existingMindMap.id);
        setCurrentMindMapId(existingMindMap.id);
      } else {
        const savedConcepts = loadKnowledgeGraph();
        if (savedConcepts.length > 0) {
          setConcepts(savedConcepts);
        }
      }
    } else {
      // No assignment and no specific mind map - start with empty state
      setConcepts([]);
      setCurrentMindMapIdState(null);
      setCurrentFolderId(null);
    }
  }, []);

  // Auto-save concepts
  useEffect(() => {
    if (concepts.length > 0) {
      saveKnowledgeGraph(concepts);

      const conversationWithTimestamps = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(),
      }));

      if (currentMindMapId) {
        updateMindMap(currentMindMapId, concepts, conversationWithTimestamps, "");
      } else if (assignment && currentFolderId && concepts.length >= 3) {
        const newMindMap = createMindMap(
          assignment.title,
          currentFolderId,
          concepts,
          assignment.id,
          assignment.title,
          assignment.title
        );
        setCurrentMindMapIdState(newMindMap.id);
        setCurrentMindMapId(newMindMap.id);

        const folderMindMaps = getMindMapsByFolder(currentFolderId);
        setAvailableMindMaps(folderMindMaps.map((m) => ({ id: m.id, name: m.name })));
      }
    }
  }, [concepts, messages]);

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
      const response = await sendChatMessage({
        message: input,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        assignmentContext: assignment,
      });

      const formatted = formatLLMResponse(response.response);

      const extractedConcepts = extractConcepts(response.response, concepts);
      if (extractedConcepts.length > 0) {
        const updatedConcepts = addConceptsToGraph(concepts, extractedConcepts, "mentioned");
        setConcepts(updatedConcepts);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        formattedContent: formatted.content,
        questions: formatted.questions,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      toast({
        title: "Failed to Send Message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please make sure the backend is running and try again.",
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

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      try {
        setIsRecording(false);
        setIsProcessingVoice(true);

        const audioBlob = await voiceService.stopRecording();
        const text = await voiceService.speechToText(audioBlob);

        setInput(text);
        setIsProcessingVoice(false);

        toast({
          title: "Voice Captured",
          description: "Transcription complete!",
        });
      } catch (error) {
        console.error("Voice input error:", error);
        setIsProcessingVoice(false);
        toast({
          title: "Voice Input Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    } else {
      // Start recording
      try {
        await voiceService.startRecording();
        setIsRecording(true);

        toast({
          title: "Recording...",
          description: "Speak now. Click again to stop.",
        });
      } catch (error) {
        console.error("Voice input error:", error);
        toast({
          title: "Microphone Access Required",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    }
  };

  const handleConceptClick = (conceptId: string) => {
    const concept = concepts.find((c) => c.id === conceptId);
    if (concept) {
      setCurrentConcept(conceptId);
      setSelectedConceptForAnnotation(concept);
      setShowAnnotations(true);
    }
  };

  const handleSaveConceptNotes = (conceptId: string, notes: string) => {
    setConcepts((prev) =>
      prev.map((c) => (c.id === conceptId ? { ...c, notes } : c))
    );

    toast({
      title: "Notes Saved",
      description: "Your annotations have been saved successfully",
    });
  };

  const handleMindMapChange = (mindMapId: string) => {
    if (mindMapId === "current") {
      setCurrentMindMapIdState(null);
      setCurrentMindMapId(null);
      const savedConcepts = loadKnowledgeGraph();
      setConcepts(savedConcepts);
    } else {
      const mindMap = getMindMapById(mindMapId);
      if (mindMap) {
        setConcepts(mindMap.concepts);
        setCurrentMindMapIdState(mindMap.id);
        setCurrentMindMapId(mindMap.id);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Fixed Input Bar at Top */}
      <div className="flex-shrink-0 border-b border-border bg-card/95 backdrop-blur-sm shadow-lg z-50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            {/* Logo/Title */}
            <div className="flex items-center gap-2 mr-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold hidden sm:block">ASTAR</h1>
            </div>

            {/* Voice Button */}
            <Button
              onClick={handleVoiceInput}
              disabled={isProcessingVoice}
              variant={isRecording ? "default" : "outline"}
              size="icon"
              className={`flex-shrink-0 transition-all ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : ""
              }`}
            >
              {isProcessingVoice ? (
                <div className="animate-spin">⌛</div>
              ) : isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            {/* Input Field */}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or use voice input..."
              className="flex-1 resize-none min-h-[48px] max-h-[120px]"
              rows={1}
            />

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-gradient-primary text-white shadow-glow hover:shadow-lg flex-shrink-0"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4 mt-2 max-w-7xl mx-auto text-xs text-muted-foreground px-1">
            {isRecording && (
              <span className="flex items-center gap-2 text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Recording...
              </span>
            )}
            {isProcessingVoice && <span>Processing voice...</span>}
            {isTyping && <span>ASTAR is thinking...</span>}
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mind Map - Left/Center */}
        <div className="flex-1 border-r border-border relative">
          <KnowledgeGraphFlow
            concepts={concepts}
            currentConcept={currentConcept}
            onConceptClick={handleConceptClick}
            availableMindMaps={availableMindMaps}
            currentMindMapId={currentMindMapId || undefined}
            onMindMapChange={handleMindMapChange}
          />
        </div>

        {/* Chat Messages - Right */}
        <div className="w-[450px] flex flex-col bg-card/50">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-primary text-white shadow-glow"
                        : "bg-card border border-primary/20"
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
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Annotations Panel - Overlay/Slide-in */}
        {showAnnotations && (
          <div
            className={`absolute right-0 top-0 bottom-0 bg-card border-l border-border shadow-2xl transition-all duration-300 ${
              annotationsFullScreen ? "w-full" : "w-[400px]"
            }`}
            style={{ zIndex: 40 }}
          >
            <ConceptAnnotations
              concept={selectedConceptForAnnotation}
              onClose={() => setShowAnnotations(false)}
              onSave={handleSaveConceptNotes}
              isFullScreen={annotationsFullScreen}
              onToggleFullScreen={() => setAnnotationsFullScreen(!annotationsFullScreen)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AstarNew;

