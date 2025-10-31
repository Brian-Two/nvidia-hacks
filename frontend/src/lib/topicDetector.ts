import { sendChatMessage } from './api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Analyzes a conversation to detect the main topic/subject
 * Returns a concise topic name suitable for folder organization
 */
export async function detectTopicFromConversation(
  messages: Message[],
  minMessages: number = 3
): Promise<string | null> {
  // Only attempt detection after a few messages
  if (messages.length < minMessages) {
    return null;
  }

  // Build a summary of the conversation for the LLM
  const conversationSummary = messages
    .slice(0, 10) // Only use first 10 messages for efficiency
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  try {
    const response = await sendChatMessage({
      message: `Based on this conversation, identify the MAIN ACADEMIC SUBJECT or TOPIC being discussed. 
      
Respond with ONLY a concise subject name (2-5 words max), suitable for folder organization.

Examples of good responses:
- "Calculus I"
- "Organic Chemistry"
- "American History"
- "Data Structures"
- "Physics - Mechanics"
- "Literary Analysis"
- "Computer Networks"

Conversation:
${conversationSummary}

Subject/Topic:`,
      conversationHistory: [],
    });

    // Extract just the topic name, trim whitespace and quotes
    const topic = response.response
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^Subject\/Topic:\s*/i, '') // Remove prefix if present
      .trim();

    // Validate the response is reasonable (not too long)
    if (topic && topic.length > 0 && topic.length < 60) {
      return topic;
    }

    return null;
  } catch (error) {
    console.error('Error detecting topic:', error);
    return null;
  }
}

/**
 * Determines if a topic is similar to an existing folder name
 * Uses simple string matching for now, could be enhanced with semantic similarity
 */
export function findSimilarFolder(
  topic: string,
  existingFolders: Array<{ id: string; name: string }>
): { id: string; name: string } | null {
  const normalizedTopic = topic.toLowerCase().trim();

  // Look for exact or very similar matches
  for (const folder of existingFolders) {
    const normalizedFolderName = folder.name.toLowerCase().trim();

    // Exact match
    if (normalizedFolderName === normalizedTopic) {
      return folder;
    }

    // One contains the other (e.g., "Calculus" matches "Calculus I")
    if (
      normalizedFolderName.includes(normalizedTopic) ||
      normalizedTopic.includes(normalizedFolderName)
    ) {
      return folder;
    }

    // Check for key word overlap (at least 2 significant words in common)
    const topicWords = normalizedTopic.split(/\s+/).filter(w => w.length > 3);
    const folderWords = normalizedFolderName.split(/\s+/).filter(w => w.length > 3);
    
    if (topicWords.length >= 2) {
      const matchingWords = topicWords.filter(word => 
        folderWords.some(fw => fw.includes(word) || word.includes(fw))
      );

      if (matchingWords.length >= 2) {
        return folder;
      }
    }
  }

  return null;
}

/**
 * Gets a suitable folder for the current conversation
 * Either finds an existing similar folder or creates a new one
 */
export async function getOrCreateFolderForConversation(
  messages: Message[],
  existingFolders: Array<{ id: string; name: string }>,
  createFolderFn: (name: string) => { id: string; name: string; color: string }
): Promise<{ id: string; name: string; isNew: boolean } | null> {
  // Detect the topic
  const topic = await detectTopicFromConversation(messages);
  
  if (!topic) {
    return null; // Not enough context yet
  }

  // Look for similar existing folder
  const similarFolder = findSimilarFolder(topic, existingFolders);
  
  if (similarFolder) {
    return {
      ...similarFolder,
      isNew: false,
    };
  }

  // Create new folder with the detected topic
  const newFolder = createFolderFn(topic);
  
  return {
    id: newFolder.id,
    name: newFolder.name,
    isNew: true,
  };
}

