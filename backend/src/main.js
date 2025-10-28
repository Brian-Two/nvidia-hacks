#!/usr/bin/env node
import 'dotenv/config';
import { buildGraph } from './graph.js';

// tiny argv parse: --mode, --msg
const args = process.argv.slice(2).join(' ');
const modeMatch = args.match(/--mode=([a-z-]+)/i);
const msgMatch  = args.match(/--msg=(.*)$/i);

const mode = modeMatch ? modeMatch[1] : "question";
const userMsg = msgMatch ? msgMatch[1] : "Help me test A★ Tutor.";

const modeHint = {
  "start": "Mode: Start/Create. If relevant, consider calling assignment_starter.",
  "study": "Mode: Study/Learn. Use Socratic questions, active recall, spaced retrieval.",
  "question": "Mode: Question/Dialogue. Ask me what I currently believe first.",
  "material": "Mode: Material/Resource. Consider calling material_generator.",
  "canvas": "Mode: Canvas/Assignments. First call list_upcoming_assignments to show the student what's coming up, then ask which assignment or exam they'd like help with."
}[mode] || "Mode: Question/Dialogue.";

const app = buildGraph();

const result = await app.invoke({
  messages: [
    { role: "user", content: `${modeHint}\n\nUser: ${userMsg}` }
  ]
});

// find final assistant message
const final = [...result.messages].reverse().find(m => m.role === "assistant") || result.messages[result.messages.length - 1];
console.log("\n--- A★ Tutor ---\n");
console.log(final?.content || JSON.stringify(final, null, 2));
console.log("\n----------------\n");

