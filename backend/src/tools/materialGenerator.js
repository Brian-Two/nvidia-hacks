import { z } from 'zod';

export const materialGeneratorSchema = z.object({
  topic: z.string(),
  level: z.enum(["beginner","intermediate","advanced"]).default("beginner"),
  format: z.enum(["flashcards","study-guide","summary-map"]).default("flashcards")
});

export async function material_generator(args) {
  const { topic, level, format } = materialGeneratorSchema.parse(args);
  // Local stub content; LLM can elaborate.
  if (format === "flashcards") {
    return {
      type: "flashcards",
      cards: [
        { q: `${topic}: define in one sentence`, a: "…" },
        { q: `Why is ${topic} important?`, a: "…" },
        { q: `${topic}: common misconception?`, a: "…" }
      ],
      self_questions: [
        `Can you explain ${topic} to a 10-year-old?`,
        `What assumption could break your understanding?`
      ]
    };
  }
  return {
    type: format,
    sections: [
      { heading: `${topic}: core ideas`, bullets: ["…","…"] },
      { heading: "Connections", bullets: ["…","…"] },
      { heading: "Applications", bullets: ["…","…"] }
    ]
  };
}

export const materialGeneratorToolDef = {
  type: "function",
  function: {
    name: "material_generator",
    description: "Produce tailored study material for a topic with self-questioning prompts.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string" },
        level: { type: "string", enum: ["beginner","intermediate","advanced"] },
        format: { type: "string", enum: ["flashcards","study-guide","summary-map"] }
      },
      required: ["topic"]
    }
  }
};

