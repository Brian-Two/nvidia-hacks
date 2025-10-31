import React, { useState, useEffect } from 'react';
import { Check, Lock, Sparkles, Circle, Brain, Plus } from 'lucide-react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ConceptNode {
  id: string;
  label: string;
  status: 'mastered' | 'in-progress' | 'mentioned' | 'locked';
  x: number;
  y: number;
  depth: number;
  connections: string[]; // IDs of connected nodes
}

interface KnowledgeGraphProps {
  concepts: ConceptNode[];
  currentConcept?: string;
  onConceptClick?: (conceptId: string) => void;
  className?: string;
  availableMindMaps?: Array<{ id: string; name: string }>;
  currentMindMapId?: string;
  onMindMapChange?: (mindMapId: string) => void;
  onCreateNewMindMap?: () => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  concepts,
  currentConcept,
  onConceptClick,
  className = '',
  availableMindMaps = [],
  currentMindMapId,
  onMindMapChange,
  onCreateNewMindMap,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());

  // Animate new nodes
  useEffect(() => {
    const newNodes = concepts.filter(c => !animatingNodes.has(c.id));
    if (newNodes.length > 0) {
      const newSet = new Set(animatingNodes);
      newNodes.forEach(n => newSet.add(n.id));
      setAnimatingNodes(newSet);

      // Remove animation after 1 second
      setTimeout(() => {
        setAnimatingNodes(new Set());
      }, 1000);
    }
  }, [concepts]);

  const getStatusColor = (status: ConceptNode['status']) => {
    switch (status) {
      case 'mastered':
        return 'bg-primary text-white border-primary shadow-glow';
      case 'in-progress':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500';
      case 'mentioned':
        return 'bg-muted text-muted-foreground border-border';
      case 'locked':
        return 'bg-background/50 text-muted-foreground border-border/50 opacity-50';
      default:
        return 'bg-card text-foreground border-border';
    }
  };

  const getStatusIcon = (status: ConceptNode['status']) => {
    switch (status) {
      case 'mastered':
        return <Check className="w-3 h-3" />;
      case 'in-progress':
        return <Sparkles className="w-3 h-3" />;
      case 'locked':
        return <Lock className="w-3 h-3" />;
      case 'mentioned':
        return <Circle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const renderConnections = () => {
    return concepts.flatMap(concept =>
      concept.connections.map(targetId => {
        const target = concepts.find(c => c.id === targetId);
        if (!target) return null;

        const isCurrent = concept.id === currentConcept || targetId === currentConcept;
        const isHovered = concept.id === hoveredNode || targetId === hoveredNode;

        return (
          <line
            key={`${concept.id}-${targetId}`}
            x1={concept.x}
            y1={concept.y}
            x2={target.x}
            y2={target.y}
            stroke={isCurrent || isHovered ? '#3fad93' : '#374151'}
            strokeWidth={isCurrent || isHovered ? 3 : 2}
            strokeOpacity={isCurrent || isHovered ? 0.8 : 0.3}
            className="transition-all duration-300"
          />
        );
      })
    ).filter(Boolean);
  };

  if (concepts.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Your Knowledge Map</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          As you learn, concepts will appear here and connect together, showing how your understanding grows!
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-background/50 rounded-lg border border-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-card/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Knowledge Map</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {concepts.filter(c => c.status === 'mastered').length} mastered
          </span>
        </div>
        
        {/* Mind Map Selector */}
        {availableMindMaps.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={currentMindMapId || 'current'} onValueChange={onMindMapChange}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Select mind map" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Session</SelectItem>
                {availableMindMaps.map(map => (
                  <SelectItem key={map.id} value={map.id}>
                    {map.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {onCreateNewMindMap && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={onCreateNewMindMap}
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* SVG Graph */}
      <svg id="knowledge-graph-svg" className="w-full h-full" style={{ paddingTop: availableMindMaps.length > 0 ? '90px' : '60px' }} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
        {/* Render connections first (behind nodes) */}
        <g>{renderConnections()}</g>

        {/* Render nodes */}
        <g>
          {concepts.map(concept => {
            const isCurrent = concept.id === currentConcept;
            const isHovered = concept.id === hoveredNode;
            const isAnimating = animatingNodes.has(concept.id);

            return (
              <g
                key={concept.id}
                transform={`translate(${concept.x}, ${concept.y})`}
                onMouseEnter={() => setHoveredNode(concept.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onConceptClick?.(concept.id)}
                className={`cursor-pointer transition-all duration-300 ${
                  isAnimating ? 'animate-bounce' : ''
                }`}
                style={{
                  filter: isCurrent
                    ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
                    : isHovered
                    ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))'
                    : 'none',
                }}
              >
                {/* Node circle background */}
                <circle
                  r={isCurrent ? 32 : isHovered ? 30 : 28}
                  className={`${getStatusColor(concept.status)} transition-all duration-300`}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                {/* Icon */}
                <foreignObject x={-8} y={-12} width={16} height={16}>
                  <div className="flex items-center justify-center">
                    {getStatusIcon(concept.status)}
                  </div>
                </foreignObject>

                {/* Label */}
                <text
                  y={isCurrent ? 48 : 45}
                  textAnchor="middle"
                  className="text-xs font-medium fill-current"
                  style={{ fontSize: '10px' }}
                >
                  {concept.label}
                </text>

                {/* Current indicator */}
                {isCurrent && (
                  <circle
                    r={38}
                    fill="none"
                    stroke="#3fad93"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-spin"
                    style={{ animationDuration: '8s' }}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-card/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around text-xs">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">Mastered</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            <span className="text-muted-foreground">Learning</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Mentioned</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;

