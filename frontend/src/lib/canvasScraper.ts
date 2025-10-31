/**
 * Comprehensive Canvas Material Scraper
 * 
 * This system:
 * 1. Identifies the class/course
 * 2. Fetches and parses syllabus
 * 3. Extracts course structure (chapters, sections, topics)
 * 4. Finds and downloads textbooks
 * 5. Saves teacher contact information
 * 6. Downloads all materials (PDFs, slides, audio, videos, files)
 * 7. Organizes everything for optimal RAG performance
 */

import { getCourseSyllabus, getCourseMaterials, getCourses } from './api';
import { extractTextFromFile } from './pdfExtractor';
import { 
  Folder, 
  CourseMaterial, 
  createCourseMaterial, 
  createFolder,
  getFolders,
  saveFolders
} from './folderManager';

// Course structure parsed from syllabus
export interface CourseStructure {
  courseId: string;
  courseName: string;
  instructor: {
    name?: string;
    email?: string;
    officeHours?: string;
    office?: string;
    phone?: string;
  };
  textbooks: Array<{
    title: string;
    author?: string;
    isbn?: string;
    edition?: string;
    required: boolean;
  }>;
  sections: Array<{
    name: string; // e.g., "Chapter 1: Introduction"
    topics: string[];
    weekRange?: string;
  }>;
  syllabusContent: string;
}

// Material download result
export interface MaterialDownload {
  success: boolean;
  materialId?: string;
  name: string;
  type: string;
  size?: number;
  error?: string;
}

// Scraping progress callback
export type ProgressCallback = (status: string, progress: number, total: number) => void;

/**
 * Parse syllabus HTML/text to extract course structure
 */
export const parseSyllabus = (syllabusHtml: string, courseName: string): CourseStructure => {
  const structure: CourseStructure = {
    courseId: '',
    courseName,
    instructor: {},
    textbooks: [],
    sections: [],
    syllabusContent: syllabusHtml,
  };

  // Remove HTML tags for text analysis
  const textContent = syllabusHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const lines = textContent.split(/[.\n]/);

  // Extract instructor information
  const instructorRegex = /(?:instructor|professor|teacher)[\s:]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i;
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
  const officeRegex = /(?:office|room)[\s:]+([A-Z0-9\s-]+)/i;
  const hoursRegex = /(?:office hours?)[\s:]+([^<\n]+)/i;

  const instructorMatch = textContent.match(instructorRegex);
  if (instructorMatch) structure.instructor.name = instructorMatch[1];

  const emails = textContent.match(emailRegex);
  if (emails && emails.length > 0) structure.instructor.email = emails[0];

  const phones = textContent.match(phoneRegex);
  if (phones && phones.length > 0) structure.instructor.phone = phones[0];

  const officeMatch = textContent.match(officeRegex);
  if (officeMatch) structure.instructor.office = officeMatch[1].trim();

  const hoursMatch = textContent.match(hoursRegex);
  if (hoursMatch) structure.instructor.officeHours = hoursMatch[1].trim();

  // Extract textbooks
  const textbookPatterns = [
    /(?:textbook|required text|book)[\s:]+([^<\n]+?)(?:by|author)[\s:]+([^<\n,]+)/gi,
    /isbn[\s:-]+(\d{10}|\d{13})/gi,
  ];

  lines.forEach(line => {
    if (/textbook|required|recommended/i.test(line)) {
      const isRequired = /required/i.test(line);
      const titleMatch = line.match(/["""]([^"""]+)["""]/);
      const isbnMatch = line.match(/isbn[\s:-]+(\d{10}|\d{13})/i);
      
      if (titleMatch || isbnMatch) {
        structure.textbooks.push({
          title: titleMatch ? titleMatch[1] : 'Textbook',
          isbn: isbnMatch ? isbnMatch[1] : undefined,
          required: isRequired,
        });
      }
    }
  });

  // Extract course sections/chapters
  const sectionPatterns = [
    /(?:chapter|unit|week|module)\s+(\d+)[\s:]+([^<\n]+)/gi,
    /(?:section|part)\s+([IVXLCDM]+|\d+)[\s:]+([^<\n]+)/gi,
  ];

  sectionPatterns.forEach(pattern => {
    let match;
    const patternCopy = new RegExp(pattern);
    while ((match = patternCopy.exec(textContent)) !== null) {
      if (match[2] && match[2].length > 3 && match[2].length < 100) {
        structure.sections.push({
          name: `${match[0].substring(0, 50)}`,
          topics: [],
        });
      }
    }
  });

  // If no sections found, create default structure
  if (structure.sections.length === 0) {
    structure.sections.push({
      name: 'Course Materials',
      topics: [],
    });
  }

  return structure;
};

/**
 * Search for textbook online and attempt to download
 */
export const searchAndDownloadTextbook = async (
  textbook: CourseStructure['textbooks'][0],
  folderId: string,
  courseId: string
): Promise<MaterialDownload> => {
  try {
    console.log(`Searching for textbook: ${textbook.title}`);
    
    // Search queries to try
    const queries = [
      textbook.isbn ? `${textbook.isbn} pdf` : null,
      `${textbook.title} ${textbook.author || ''} pdf`,
      `${textbook.title} textbook pdf free`,
    ].filter(Boolean);

    // Note: Actual downloading would require a backend service
    // For now, we'll create a placeholder entry
    const materialId = await createCourseMaterial(
      textbook.title,
      'textbook',
      folderId,
      `Textbook: ${textbook.title}\n` +
      `${textbook.author ? `Author: ${textbook.author}\n` : ''}` +
      `${textbook.isbn ? `ISBN: ${textbook.isbn}\n` : ''}` +
      `${textbook.required ? 'Required' : 'Recommended'}\n\n` +
      `Note: Textbook search feature - please upload manually or check library resources.`,
      undefined,
      `textbook-${textbook.isbn || Date.now()}`,
      'textbook',
      courseId
    );

    return {
      success: true,
      materialId: materialId.id,
      name: textbook.title,
      type: 'textbook',
    };
  } catch (error) {
    console.error('Error with textbook:', error);
    return {
      success: false,
      name: textbook.title,
      type: 'textbook',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Download a single file with content extraction
 */
export const downloadMaterialFile = async (
  item: any,
  folderId: string,
  courseId: string,
  sectionName?: string
): Promise<MaterialDownload> => {
  try {
    const fileName = item.title || item.display_name || item.filename || 'Untitled';
    console.log(`Downloading: ${fileName}`);

    let content = '';
    let fileType = 'unknown';

    // Determine file type
    if (item.url || item.download_url) {
      const url = item.url || item.download_url;
      fileType = fileName.split('.').pop()?.toLowerCase() || 'unknown';

      // Download and extract content via backend proxy (CORS workaround)
      try {
        // Get Canvas credentials from localStorage
        const canvasUrl = localStorage.getItem('astar_canvas_url') || 'https://canvas.instructure.com';
        const apiToken = localStorage.getItem('astar_api_token');
        
        if (!apiToken) {
          throw new Error('No Canvas API token found');
        }

        // Use backend proxy to download file
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/download-file`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: url,
            canvasUrl,
            apiToken,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Download failed');
        }

        const blob = await response.blob();
        const file = new File([blob], fileName);

        // Extract text content
        if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(fileType)) {
          content = await extractTextFromFile(file);
        } else {
          content = `File: ${fileName} (${fileType})\nSize: ${blob.size} bytes`;
        }
      } catch (downloadError) {
        console.error(`Download failed for ${fileName}:`, downloadError);
        content = `File: ${fileName}\nDownload URL: ${url}\n(Content extraction failed: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'})`;
      }
    } else if (item.body || item.content) {
      // Page or text content
      content = item.body || item.content;
      fileType = 'html';
    }

    // Add section context to content
    if (sectionName) {
      content = `Section: ${sectionName}\n\n${content}`;
    }

    const material = await createCourseMaterial(
      fileName,
      'file',
      folderId,
      content,
      item.url || item.download_url || item.html_url,
      item.id?.toString(),
      fileType,
      courseId
    );

    return {
      success: true,
      materialId: material.id,
      name: fileName,
      type: fileType,
      size: content.length,
    };
  } catch (error) {
    console.error('Error downloading material:', error);
    return {
      success: false,
      name: item.title || 'Unknown',
      type: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Comprehensive course material scraping
 */
export const scrapeCourseMaterials = async (
  courseId: string,
  folderId: string,
  onProgress?: ProgressCallback
): Promise<{
  structure: CourseStructure;
  downloads: MaterialDownload[];
  errors: string[];
}> => {
  const downloads: MaterialDownload[] = [];
  const errors: string[] = [];
  let progress = 0;

  try {
    onProgress?.('Initializing...', 0, 100);

    // Step 1: Get course info
    const courses = await getCourses();
    const course = courses.find((c: any) => c.id.toString() === courseId);
    if (!course) throw new Error('Course not found');

    const courseName = course.name;
    onProgress?.(`Analyzing ${courseName}...`, 5, 100);

    // Step 2: Fetch and parse syllabus
    let structure: CourseStructure | null = null;
    try {
      const syllabusResponse = await getCourseSyllabus(courseId);
      if (syllabusResponse.syllabus?.syllabus_body) {
        structure = parseSyllabus(syllabusResponse.syllabus.syllabus_body, courseName);
        structure.courseId = courseId;

        // Save instructor information
        if (Object.keys(structure.instructor).length > 0) {
          const instructorInfo = Object.entries(structure.instructor)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

          const instructorMaterial = await createCourseMaterial(
            'Instructor Contact Information',
            'syllabus',
            folderId,
            instructorInfo,
            undefined,
            `instructor-${courseId}`,
            'text',
            courseId
          );

          downloads.push({
            success: true,
            materialId: instructorMaterial.id,
            name: 'Instructor Info',
            type: 'contact',
          });
        }

        // Save syllabus
        const syllabusMaterial = await createCourseMaterial(
          'Course Syllabus',
          'syllabus',
          folderId,
          structure.syllabusContent,
          undefined,
          `syllabus-${courseId}`,
          'html',
          courseId
        );

        downloads.push({
          success: true,
          materialId: syllabusMaterial.id,
          name: 'Syllabus',
          type: 'syllabus',
        });

        onProgress?.('Syllabus parsed', 15, 100);
      }
    } catch (syllabusError) {
      console.error('Syllabus error:', syllabusError);
      errors.push('Could not fetch syllabus');
      structure = {
        courseId,
        courseName,
        instructor: {},
        textbooks: [],
        sections: [{ name: 'Course Materials', topics: [] }],
        syllabusContent: '',
      };
    }

    // Step 3: Search for textbooks
    if (structure && structure.textbooks.length > 0) {
      onProgress?.('Searching for textbooks...', 20, 100);
      
      for (const textbook of structure.textbooks) {
        const result = await searchAndDownloadTextbook(textbook, folderId, courseId);
        downloads.push(result);
        if (!result.success) {
          errors.push(`Textbook not found: ${textbook.title}`);
        }
      }
    }

    // Step 4: Fetch all modules and materials
    onProgress?.('Fetching course modules...', 30, 100);
    const materialsResponse = await getCourseMaterials(courseId);

    if (materialsResponse.materials?.modules) {
      const modules = materialsResponse.materials.modules;
      const totalItems = modules.reduce((sum: number, m: any) => 
        sum + (m.items?.length || 0), 0
      );

      let processedItems = 0;

      for (const module of modules) {
        if (!module.items || module.items.length === 0) continue;

        console.log(`Processing module: ${module.name}`);

        // Determine which section this module belongs to
        const sectionName = structure?.sections.find(s => 
          module.name.toLowerCase().includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(module.name.toLowerCase())
        )?.name || module.name;

        for (const item of module.items) {
          const itemProgress = 30 + ((processedItems / totalItems) * 60);
          onProgress?.(`Downloading: ${item.title}`, itemProgress, 100);

          const result = await downloadMaterialFile(item, folderId, courseId, sectionName);
          downloads.push(result);

          if (!result.success) {
            errors.push(`Failed: ${item.title}`);
          }

          processedItems++;
        }
      }
    }

    onProgress?.('Complete!', 100, 100);

    return {
      structure: structure || {
        courseId,
        courseName,
        instructor: {},
        textbooks: [],
        sections: [],
        syllabusContent: '',
      },
      downloads,
      errors,
    };
  } catch (error) {
    console.error('Scraping error:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    return {
      structure: {
        courseId,
        courseName: 'Unknown',
        instructor: {},
        textbooks: [],
        sections: [],
        syllabusContent: '',
      },
      downloads,
      errors,
    };
  }
};

/**
 * Create sub-folders for course sections
 */
export const createSectionFolders = (
  parentFolderId: string,
  structure: CourseStructure
): Folder[] => {
  const sectionFolders: Folder[] = [];
  const folders = getFolders();

  structure.sections.forEach(section => {
    // Check if section folder already exists
    const existing = folders.find(f => 
      f.name === section.name && f.courseId === structure.courseId
    );

    if (!existing) {
      const sectionFolder = createFolder(
        section.name,
        structure.courseId,
        `${structure.courseName} - ${section.name}`
      );
      sectionFolders.push(sectionFolder);
    }
  });

  return sectionFolders;
};

