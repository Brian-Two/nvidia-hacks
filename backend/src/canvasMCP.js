// Canvas MCP Client - Direct integration with Canvas LMS API
import 'dotenv/config';

const CANVAS_API_URL = process.env.CANVAS_API_URL || 'https://canvas.instructure.com/api/v1';
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

class CanvasMCPClient {
  constructor() {
    if (!CANVAS_API_TOKEN) {
      console.warn('⚠️  CANVAS_API_TOKEN not set in .env - Canvas features will be limited');
    }
    this.baseUrl = CANVAS_API_URL;
    this.token = CANVAS_API_TOKEN;
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    if (!this.token) {
      return { error: 'Canvas API token not configured. Set CANVAS_API_TOKEN in .env' };
    }

    try {
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get all courses for the current user
  async getCourses() {
    return this.makeRequest('/courses?enrollment_state=active&include[]=total_scores');
  }

  // Get upcoming assignments across all courses
  async getUpcomingAssignments(limit = 20) {
    const courses = await this.getCourses();
    if (courses.error) {
      console.error('Failed to get courses:', courses.error);
      return courses;
    }

    if (!Array.isArray(courses)) {
      console.error('getCourses() did not return an array:', courses);
      return { error: 'Invalid response from Canvas API' };
    }

    const allAssignments = [];
    
    for (const course of courses) {
      const assignments = await this.makeRequest(
        `/courses/${course.id}/assignments?order_by=due_at&per_page=10`
      );
      
      if (!assignments.error && Array.isArray(assignments)) {
        const upcoming = assignments
          .filter(a => {
            if (!a.due_at) return false;
            const dueDate = new Date(a.due_at);
            const now = new Date();
            return dueDate > now;
          })
          .map(a => ({
            id: a.id,
            name: a.name,
            course_id: course.id,
            course_name: course.name,
            due_at: a.due_at,
            points_possible: a.points_possible,
            description: a.description,
            html_url: a.html_url,
            submission_types: a.submission_types
          }));
        
        allAssignments.push(...upcoming);
      }
    }

    // Sort by due date and limit
    return allAssignments
      .sort((a, b) => new Date(a.due_at) - new Date(b.due_at))
      .slice(0, limit);
  }

  // Get specific assignment details
  async getAssignmentDetails(courseId, assignmentId) {
    return this.makeRequest(`/courses/${courseId}/assignments/${assignmentId}`);
  }

  // Get course materials (modules, pages, files)
  async getCourseMaterials(courseId) {
    const [modules, pages, files] = await Promise.all([
      this.makeRequest(`/courses/${courseId}/modules?include[]=items`),
      this.makeRequest(`/courses/${courseId}/pages`),
      this.makeRequest(`/courses/${courseId}/files?per_page=50`)
    ]);

    return {
      modules: modules.error ? [] : modules,
      pages: pages.error ? [] : pages,
      files: files.error ? [] : files
    };
  }

  // Get course syllabus
  async getCourseSyllabus(courseId) {
    const course = await this.makeRequest(`/courses/${courseId}?include[]=syllabus_body`);
    return course.error ? course : {
      course_name: course.name,
      syllabus: course.syllabus_body
    };
  }

  // Get page content
  async getPageContent(courseId, pageUrl) {
    return this.makeRequest(`/courses/${courseId}/pages/${pageUrl}`);
  }

  // Get quiz/exam details
  async getQuizDetails(courseId, quizId) {
    return this.makeRequest(`/courses/${courseId}/quizzes/${quizId}`);
  }

  // Get all quizzes for a course
  async getCourseQuizzes(courseId) {
    return this.makeRequest(`/courses/${courseId}/quizzes`);
  }

  // Get user's submission for an assignment
  async getSubmission(courseId, assignmentId, userId = 'self') {
    return this.makeRequest(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`);
  }

  // Submit an assignment
  async submitAssignment(courseId, assignmentId, submissionData) {
    const { submission_type, body, url } = submissionData;
    
    const payload = {
      submission: {
        submission_type: submission_type || 'online_text_entry'
      }
    };

    // Add content based on submission type
    if (submission_type === 'online_text_entry' && body) {
      payload.submission.body = body;
    } else if (submission_type === 'online_url' && url) {
      payload.submission.url = url;
    }

    return this.makeRequest(
      `/courses/${courseId}/assignments/${assignmentId}/submissions`,
      'POST',
      payload
    );
  }
}

// Singleton instance
export const canvasClient = new CanvasMCPClient();

