import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  Panel,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Check, Lock, Sparkles, Circle, Brain } from 'lucide-react';
import dagre from 'dagre';

export interface ConceptNode {
  id: string;
  label: string;
  status: 'mastered' | 'in-progress' | 'mentioned' | 'locked';
  x: number;
  y: number;
  depth: number;
  connections: string[]; // IDs of connected nodes
}

interface KnowledgeGraphFlowProps {
  concepts: ConceptNode[];
  currentConcept?: string;
  onConceptClick?: (conceptId: string) => void;
  className?: string;
}

const getStatusColor = (status: ConceptNode['status']) => {
  switch (status) {
    case 'mastered':
      return {
        bg: '#3fad93',
        border: '#3fad93',
        text: '#ffffff',
      };
    case 'in-progress':
      return {
        bg: '#FCD34D',
        border: '#F59E0B',
        text: '#78350F',
      };
    case 'mentioned':
      return {
        bg: '#6B7280',
        border: '#4B5563',
        text: '#ffffff',
      };
    case 'locked':
      return {
        bg: '#374151',
        border: '#1F2937',
        text: '#9CA3AF',
      };
    default:
      return {
        bg: '#6B7280',
        border: '#4B5563',
        text: '#ffffff',
      };
  }
};

const getStatusIcon = (status: ConceptNode['status']) => {
  switch (status) {
    case 'mastered':
      return Check;
    case 'in-progress':
      return Sparkles;
    case 'locked':
      return Lock;
    case 'mentioned':
    default:
      return Circle;
  }
};

// Custom node component
const ConceptNodeComponent = ({ data }: any) => {
  const Icon = getStatusIcon(data.status);
  const colors = getStatusColor(data.status);
  
  return (
    <div
      className="px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200 hover:scale-105 cursor-pointer"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        minWidth: '120px',
        textAlign: 'center',
      }}
      onClick={() => data.onClick?.(data.id)}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
      </div>
      <div className="font-semibold text-sm">{data.label}</div>
    </div>
  );
};

const nodeTypes = {
  concept: ConceptNodeComponent,
};

// Dagre layout for hierarchical arrangement
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const KnowledgeGraphFlow: React.FC<KnowledgeGraphFlowProps> = ({
  concepts,
  currentConcept,
  onConceptClick,
  className = '',
}) => {
  // Convert concepts to ReactFlow nodes
  const initialNodes: Node[] = useMemo(
    () =>
      concepts.map((concept) => ({
        id: concept.id,
        type: 'concept',
        position: { x: concept.x, y: concept.y },
        data: {
          label: concept.label,
          status: concept.status,
          id: concept.id,
          onClick: onConceptClick,
        },
        style: {
          background: 'transparent',
          border: 'none',
        },
      })),
    [concepts, onConceptClick]
  );

  // Convert connections to ReactFlow edges
  const initialEdges: Edge[] = useMemo(
    () => {
      const edges: Edge[] = [];
      concepts.forEach((concept) => {
        concept.connections.forEach((targetId) => {
          edges.push({
            id: `${concept.id}-${targetId}`,
            source: concept.id,
            target: targetId,
            type: 'smoothstep',
            animated: concept.id === currentConcept || targetId === currentConcept,
            style: {
              stroke: concept.id === currentConcept || targetId === currentConcept ? '#3fad93' : '#4B5563',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: concept.id === currentConcept || targetId === currentConcept ? '#3fad93' : '#4B5563',
            },
          });
        });
      });
      return edges;
    },
    [concepts, currentConcept]
  );

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes and edges when concepts change
  useEffect(() => {
    const { nodes: newLayoutedNodes, edges: newLayoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );
    setNodes(newLayoutedNodes);
    setEdges(newLayoutedEdges);
  }, [concepts, currentConcept]);

  if (concepts.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-background/50 rounded-lg border border-border ${className}`}>
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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#374151" />
        <Controls className="bg-card border border-border rounded-lg" />
        <MiniMap
          nodeColor={(node: any) => {
            const colors = getStatusColor(node.data.status);
            return colors.bg;
          }}
          className="bg-card border border-border rounded-lg"
        />
        
        {/* Header Panel */}
        <Panel position="top-left" className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 m-2 min-w-[250px]">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Knowledge Map</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {concepts.filter(c => c.status === 'mastered').length} mastered
            </span>
          </div>
        </Panel>

        {/* Legend Panel */}
        <Panel position="bottom-right" className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 m-2">
          <div className="flex items-center gap-4 text-xs">
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
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default KnowledgeGraphFlow;

