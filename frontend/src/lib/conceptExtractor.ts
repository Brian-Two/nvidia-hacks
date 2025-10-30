import { ConceptNode } from '@/components/KnowledgeGraph';

interface ExtractedConcept {
  label: string;
  relatedTo: string[];
}

/**
 * Extract concepts from LLM response
 * Looks for key terms, topics mentioned, and relationships
 */
export const extractConcepts = (message: string, existingConcepts: ConceptNode[]): ExtractedConcept[] => {
  const concepts: ExtractedConcept[] = [];
  
  // Common concept patterns in educational content
  const patterns = {
    // Mathematical concepts
    equations: /\b(equation|formula|expression|function|polynomial|quadratic|linear|derivative|integral)\b/gi,
    algebra: /\b(variable|coefficient|constant|term|factor|solution|root|exponent)\b/gi,
    geometry: /\b(triangle|circle|square|angle|radius|diameter|area|perimeter|volume)\b/gi,
    calculus: /\b(limit|derivative|integral|differential|rate|slope|tangent)\b/gi,
    
    // Programming concepts
    programming: /\b(function|variable|loop|array|object|class|method|algorithm|recursion)\b/gi,
    dataStructures: /\b(array|list|stack|queue|tree|graph|hash|map|set)\b/gi,
    
    // General academic terms
    theory: /\b(theorem|axiom|proof|lemma|corollary|postulate|hypothesis)\b/gi,
    methods: /\b(method|technique|approach|strategy|procedure|process|algorithm)\b/gi,
  };

  const foundTerms = new Set<string>();
  
  // Extract all matching terms
  Object.entries(patterns).forEach(([category, pattern]) => {
    const matches = message.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized = match.toLowerCase().trim();
        if (!foundTerms.has(normalized)) {
          foundTerms.add(normalized);
        }
      });
    }
  });

  // Convert to proper case and create concepts
  foundTerms.forEach(term => {
    const properTerm = term.charAt(0).toUpperCase() + term.slice(1);
    
    // Find related concepts (concepts that appear in same message)
    const relatedTo: string[] = [];
    existingConcepts.forEach(existing => {
      if (message.toLowerCase().includes(existing.label.toLowerCase()) && 
          existing.label.toLowerCase() !== term) {
        relatedTo.push(existing.id);
      }
    });

    concepts.push({
      label: properTerm,
      relatedTo,
    });
  });

  return concepts;
};

/**
 * Generate layout positions for concepts in a tree/graph structure
 */
export const generateGraphLayout = (concepts: ConceptNode[]): ConceptNode[] => {
  if (concepts.length === 0) return [];

  const updatedConcepts = [...concepts];
  const centerX = 200;
  const centerY = 200;
  const radius = 120;
  const layers = Math.ceil(Math.sqrt(concepts.length));

  // Group by depth (how many connections they have)
  const byDepth = new Map<number, ConceptNode[]>();
  
  updatedConcepts.forEach(concept => {
    const connections = concept.connections.length;
    const depth = concept.depth || Math.min(connections, 3);
    
    if (!byDepth.has(depth)) {
      byDepth.set(depth, []);
    }
    byDepth.get(depth)!.push(concept);
  });

  // Arrange in concentric circles by depth
  byDepth.forEach((nodes, depth) => {
    const layerRadius = depth === 0 ? 0 : radius * (depth / layers);
    const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1);
    
    nodes.forEach((node, index) => {
      if (depth === 0) {
        // Center node
        node.x = centerX;
        node.y = centerY;
      } else {
        // Arrange in circle
        const angle = index * angleStep - Math.PI / 2; // Start from top
        node.x = centerX + layerRadius * Math.cos(angle);
        node.y = centerY + layerRadius * Math.sin(angle);
      }
    });
  });

  return updatedConcepts;
};

/**
 * Add new concepts to existing graph
 */
export const addConceptsToGraph = (
  existingConcepts: ConceptNode[],
  newConcepts: ExtractedConcept[],
  status: ConceptNode['status'] = 'mentioned'
): ConceptNode[] => {
  const updatedConcepts = [...existingConcepts];
  
  newConcepts.forEach(({ label, relatedTo }) => {
    // Check if concept already exists
    const existing = updatedConcepts.find(c => 
      c.label.toLowerCase() === label.toLowerCase()
    );

    if (existing) {
      // Update existing concept
      if (existing.status === 'mentioned' && status !== 'mentioned') {
        existing.status = status;
      }
      // Add new connections
      relatedTo.forEach(id => {
        if (!existing.connections.includes(id)) {
          existing.connections.push(id);
        }
      });
    } else {
      // Create new concept
      const newId = `concept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const depth = relatedTo.length > 0 ? 1 : 0;
      
      updatedConcepts.push({
        id: newId,
        label,
        status,
        x: 200, // Will be repositioned by layout function
        y: 200,
        depth,
        connections: relatedTo,
      });

      // Add reverse connections
      relatedTo.forEach(id => {
        const relatedConcept = updatedConcepts.find(c => c.id === id);
        if (relatedConcept && !relatedConcept.connections.includes(newId)) {
          relatedConcept.connections.push(newId);
        }
      });
    }
  });

  // Recalculate layout
  return generateGraphLayout(updatedConcepts);
};

/**
 * Update concept status (e.g., when mastered)
 */
export const updateConceptStatus = (
  concepts: ConceptNode[],
  conceptId: string,
  status: ConceptNode['status']
): ConceptNode[] => {
  return concepts.map(concept =>
    concept.id === conceptId
      ? { ...concept, status }
      : concept
  );
};

/**
 * Mark concept as current (being worked on)
 */
export const setCurrentConcept = (
  concepts: ConceptNode[],
  conceptLabel: string
): { concepts: ConceptNode[]; currentId: string | undefined } => {
  const concept = concepts.find(c => 
    c.label.toLowerCase() === conceptLabel.toLowerCase()
  );

  if (concept && concept.status !== 'in-progress') {
    return {
      concepts: updateConceptStatus(concepts, concept.id, 'in-progress'),
      currentId: concept.id,
    };
  }

  return { concepts, currentId: concept?.id };
};

/**
 * Save knowledge graph to localStorage
 */
export const saveKnowledgeGraph = (concepts: ConceptNode[]): void => {
  try {
    localStorage.setItem('astar_knowledge_graph', JSON.stringify(concepts));
  } catch (error) {
    console.error('Failed to save knowledge graph:', error);
  }
};

/**
 * Load knowledge graph from localStorage
 */
export const loadKnowledgeGraph = (): ConceptNode[] => {
  try {
    const saved = localStorage.getItem('astar_knowledge_graph');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load knowledge graph:', error);
    return [];
  }
};

/**
 * Clear knowledge graph (for new assignment/topic)
 */
export const clearKnowledgeGraph = (): void => {
  localStorage.removeItem('astar_knowledge_graph');
};

