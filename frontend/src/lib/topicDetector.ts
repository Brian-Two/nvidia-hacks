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
 * Uses enhanced string matching with course name normalization
 */
export function findSimilarFolder(
  topic: string,
  existingFolders: Array<{ id: string; name: string }>
): { id: string; name: string } | null {
  // Normalize topic: remove term prefixes and course codes
  const normalizedTopic = topic.toLowerCase().trim()
    .replace(/^20\d{2} (Fall|Spring|Summer|Winter) /, '') // Remove term prefix
    .replace(/\s*\([^)]*\)/, ''); // Remove course codes like (CSCI-475-01)

  // Look for exact or very similar matches
  for (const folder of existingFolders) {
    const normalizedFolderName = folder.name.toLowerCase().trim()
      .replace(/^20\d{2} (Fall|Spring|Summer|Winter) /, '')
      .replace(/\s*\([^)]*\)/, '');

    // Exact match after normalization
    if (normalizedFolderName === normalizedTopic) {
      console.log(`✅ Found exact match: "${folder.name}" for topic "${topic}"`);
      return folder;
    }

    // One contains the other (e.g., "Machine Learning" matches "Intro to Machine Learning")
    if (
      normalizedFolderName.includes(normalizedTopic) ||
      normalizedTopic.includes(normalizedFolderName)
    ) {
      console.log(`✅ Found containing match: "${folder.name}" for topic "${topic}"`);
      return folder;
    }

    // Check for key word overlap (at least 2 significant words in common)
    const topicWords = normalizedTopic.split(/\s+/).filter(w => w.length > 3);
    const folderWords = normalizedFolderName.split(/\s+/).filter(w => w.length > 3);
    
    // For multi-word topics/folders
    if (topicWords.length >= 2 && folderWords.length >= 2) {
      const matchingWords = topicWords.filter(word => 
        folderWords.some(fw => fw.includes(word) || word.includes(fw))
      );

      if (matchingWords.length >= 2) {
        console.log(`✅ Found word match: "${folder.name}" for topic "${topic}" (${matchingWords.length} words matched)`);
        return folder;
      }
    }
    
    // For single-word topics/folders, check for exact word match
    if (topicWords.length === 1 && folderWords.length === 1) {
      if (topicWords[0] === folderWords[0]) {
        console.log(`✅ Found single-word match: "${folder.name}" for topic "${topic}"`);
        return folder;
      }
    }
    
    // Check for common course abbreviations/variations
    const courseAliases: { [key: string]: string[] } = {
      'machine learning': ['ml', 'ai', 'artificial intelligence'],
      'computer science': ['cs', 'comp sci', 'computing'],
      'mathematics': ['math', 'calculus', 'algebra'],
      'physics': ['phys', 'mechanics'],
      'chemistry': ['chem', 'organic chemistry'],
      'biology': ['bio', 'life science'],
      'data structures': ['dsa', 'algorithms'],
      'operating systems': ['os', 'systems'],
    };
    
    for (const [full, aliases] of Object.entries(courseAliases)) {
      if (normalizedTopic.includes(full) && aliases.some(alias => normalizedFolderName.includes(alias))) {
        console.log(`✅ Found alias match: "${folder.name}" for topic "${topic}"`);
        return folder;
      }
      if (normalizedFolderName.includes(full) && aliases.some(alias => normalizedTopic.includes(alias))) {
        console.log(`✅ Found alias match: "${folder.name}" for topic "${topic}"`);
        return folder;
      }
    }
  }

  console.log(`❌ No matching folder found for topic "${topic}"`);
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

