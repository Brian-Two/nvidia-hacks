// Canvas Tools for A★ Tutor
import { canvasClient } from '../canvasMCP.js';

// Tool 1: List Upcoming Assignments and Exams
export const listUpcomingToolDef = {
  type: "function",
  function: {
    name: "list_upcoming_assignments",
    description: "Lists all upcoming assignments, quizzes, and exams from Canvas. Shows due dates, course names, and point values. Use this when a student wants to see what's coming up or needs help planning their study schedule.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of items to return (default 20)"
        }
      }
    }
  }
};

export async function list_upcoming_assignments({ limit = 20 }) {
  const assignments = await canvasClient.getUpcomingAssignments(limit);
  
  if (assignments.error) {
    return {
      status: "error",
      message: assignments.error
    };
  }

  if (assignments.length === 0) {
    return {
      status: "success",
      message: "No upcoming assignments found. You're all caught up! 🎉",
      assignments: []
    };
  }

  return {
    status: "success",
    message: `Found ${assignments.length} upcoming assignment(s)`,
    assignments: assignments.map(a => ({
      id: a.id,
      name: a.name,
      course: a.course_name,
      course_id: a.course_id,
      due_date: a.due_at,
      points: a.points_possible,
      url: a.html_url
    }))
  };
}

// Tool 2: Get Course Materials for RAG
export const getCourseMaterialsToolDef = {
  type: "function",
  function: {
    name: "get_course_materials",
    description: "Retrieves course materials (syllabus, modules, pages, files) from Canvas for a specific course. Use this to gather context about what the student has learned and what resources are available to help them with assignments or exam prep.",
    parameters: {
      type: "object",
      properties: {
        course_id: {
          type: "number",
          description: "The Canvas course ID to fetch materials from"
        },
        include_syllabus: {
          type: "boolean",
          description: "Whether to include the course syllabus (default true)"
        }
      },
      required: ["course_id"]
    }
  }
};

export async function get_course_materials({ course_id, include_syllabus = true }) {
  const materials = await canvasClient.getCourseMaterials(course_id);
  
  if (materials.modules.error) {
    return {
      status: "error",
      message: materials.modules.error
    };
  }

  const result = {
    status: "success",
    course_id,
    modules: materials.modules.map(m => ({
      id: m.id,
      name: m.name,
      items: m.items?.map(item => ({
        title: item.title,
        type: item.type,
        url: item.html_url
      })) || []
    })),
    pages: materials.pages.map(p => ({
      url: p.url,
      title: p.title,
      body: p.body?.substring(0, 500) // Preview only
    })),
    files_count: materials.files.length
  };

  if (include_syllabus) {
    const syllabus = await canvasClient.getCourseSyllabus(course_id);
    if (!syllabus.error) {
      result.syllabus = syllabus.syllabus;
      result.course_name = syllabus.course_name;
    }
  }

  return result;
}

// Tool 3: Get Assignment Details with Context
export const getAssignmentDetailsToolDef = {
  type: "function",
  function: {
    name: "get_assignment_details",
    description: "Gets detailed information about a specific assignment or exam, including description, requirements, rubric, and submission status. Use this when a student selects an assignment they need help with.",
    parameters: {
      type: "object",
      properties: {
        course_id: {
          type: "number",
          description: "The Canvas course ID"
        },
        assignment_id: {
          type: "number",
          description: "The Canvas assignment ID"
        },
        include_submission: {
          type: "boolean",
          description: "Whether to include the student's current submission status (default true)"
        }
      },
      required: ["course_id", "assignment_id"]
    }
  }
};

export async function get_assignment_details({ course_id, assignment_id, include_submission = true }) {
  const assignment = await canvasClient.getAssignmentDetails(course_id, assignment_id);
  
  if (assignment.error) {
    return {
      status: "error",
      message: assignment.error
    };
  }

  const result = {
    status: "success",
    assignment: {
      id: assignment.id,
      name: assignment.name,
      description: assignment.description,
      due_at: assignment.due_at,
      points_possible: assignment.points_possible,
      submission_types: assignment.submission_types,
      allowed_attempts: assignment.allowed_attempts,
      rubric: assignment.rubric,
      grading_type: assignment.grading_type
    }
  };

  if (include_submission) {
    const submission = await canvasClient.getSubmission(course_id, assignment_id);
    if (!submission.error) {
      result.submission = {
        submitted_at: submission.submitted_at,
        score: submission.score,
        grade: submission.grade,
        attempt: submission.attempt,
        workflow_state: submission.workflow_state
      };
    }
  }

  return result;
}

// Tool 4: Get Page Content for Deep Dive
export const getPageContentToolDef = {
  type: "function",
  function: {
    name: "get_page_content",
    description: "Retrieves the full content of a specific Canvas page. Use this to access detailed lecture notes, readings, or study materials that can help answer the student's questions.",
    parameters: {
      type: "object",
      properties: {
        course_id: {
          type: "number",
          description: "The Canvas course ID"
        },
        page_url: {
          type: "string",
          description: "The page URL slug (e.g., 'introduction-to-thermodynamics')"
        }
      },
      required: ["course_id", "page_url"]
    }
  }
};

export async function get_page_content({ course_id, page_url }) {
  const page = await canvasClient.getPageContent(course_id, page_url);
  
  if (page.error) {
    return {
      status: "error",
      message: page.error
    };
  }

  return {
    status: "success",
    page: {
      title: page.title,
      body: page.body,
      url: page.url,
      created_at: page.created_at,
      updated_at: page.updated_at
    }
  };
}

