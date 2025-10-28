// Minimal LangGraph: agent -> (optional) tools -> agent loop, then stop.
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { client, modelName } from "./llm.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { assignment_starter, assignmentStarterToolDef } from "./tools/assignmentStarter.js";
import { material_generator, materialGeneratorToolDef } from "./tools/materialGenerator.js";
import {
  list_upcoming_assignments,
  listUpcomingToolDef,
  get_course_materials,
  getCourseMaterialsToolDef,
  get_assignment_details,
  getAssignmentDetailsToolDef,
  get_page_content,
  getPageContentToolDef
} from "./tools/canvasTools.js";

const State = Annotation.Root({
  messages: Annotation({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
});

async function callLLM(messages) {
  // messages is array of {role, content, ...}
  const tools = [
    assignmentStarterToolDef,
    materialGeneratorToolDef,
    listUpcomingToolDef,
    getCourseMaterialsToolDef,
    getAssignmentDetailsToolDef,
    getPageContentToolDef
  ];
  const resp = await client.chat.completions.create({
    model: modelName,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    tools,
    tool_choice: "auto",
    temperature: 0.2
  });
  return resp.choices[0];
}

const agent = async (state) => {
  const last = await callLLM(state.messages);
  const msg = last.message;
  // Attach tool_calls (if any) to the assistant message we push into history
  return { messages: [msg] };
};

const tools = async (state) => {
  const last = state.messages[state.messages.length - 1];
  const calls = last?.tool_calls || [];
  const toolResults = [];

  for (const tc of calls) {
    const { name, arguments: argsJson, id } = tc.function;
    const args = JSON.parse(argsJson || "{}");
    let result;
    
    // Original tools
    if (name === "assignment_starter") result = await assignment_starter(args);
    else if (name === "material_generator") result = await material_generator(args);
    
    // Canvas tools
    else if (name === "list_upcoming_assignments") result = await list_upcoming_assignments(args);
    else if (name === "get_course_materials") result = await get_course_materials(args);
    else if (name === "get_assignment_details") result = await get_assignment_details(args);
    else if (name === "get_page_content") result = await get_page_content(args);
    
    else result = { error: `Unknown tool ${name}` };

    toolResults.push({
      role: "tool",
      tool_call_id: id,
      name,
      content: JSON.stringify(result)
    });
  }

  return { messages: toolResults };
};

export function buildGraph() {
  const g = new StateGraph(State)
    .addNode("agent", agent)
    .addNode("tools", tools)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", async (state) => {
      const last = state.messages[state.messages.length - 1];
      return last?.tool_calls?.length ? "tools" : END;
    })
    .addEdge("tools", "agent");
  return g.compile();
}

