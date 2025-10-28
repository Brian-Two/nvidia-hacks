import { z } from 'zod';

export const assignmentStarterSchema = z.object({
  title: z.string().describe("Short name for the assignment"),
  instructions: z.string().describe("Raw instructions/prompt from class"),
  deliverable_type: z.enum(["essay","report","slides","code","study-plan","other"]).default("essay")
});

export async function assignment_starter(args) {
  const { title, instructions, deliverable_type } = assignmentStarterSchema.parse(args);
  // Local stub: generate a structured plan the LLM can refine.
  return {
    title,
    deliverable_type,
    outline: [
      "Clarify requirements & rubric",
      "Brain dump key ideas from memory (no notes)",
      "Research 3 credible sources; capture quotes",
      "Draft sections with thesis + topic sentences",
      "Self-review using rubric; fix gaps",
      "Polish, citations, submit"
    ],
    microtasks: [
      { step: 1, task: "List grading criteria & constraints", time_est_min: 5 },
      { step: 2, task: "Write a 5-line thesis + 3 claims", time_est_min: 10 },
      { step: 3, task: "Find 3 sources; 2 quotes each", time_est_min: 20 }
    ],
    socratic_prompts: [
      "Why is this step necessary?",
      "What assumption am I making here?",
      "How will I test that my claim is true?",
      "What would falsify my approach?"
    ],
    checklist: ["Thesis present", "Claims supported", "Counterpoint addressed", "Rubric satisfied"]
  };
}

export const assignmentStarterToolDef = {
  type: "function",
  function: {
    name: "assignment_starter",
    description: "Create a starter plan with outline, microtasks, and Socratic prompts for an assignment.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        instructions: { type: "string" },
        deliverable_type: { type: "string", enum: ["essay","report","slides","code","study-plan","other"] }
      },
      required: ["title","instructions"]
    }
  }
};

