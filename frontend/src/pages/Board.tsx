import { Sparkles } from "lucide-react";
import AssignmentCard from "@/components/AssignmentCard";

const Board = () => {
  // Mock data - in real app, this would come from Canvas API
  const assignments = [
    {
      id: "1",
      title: "Quantum Mechanics Problem Set",
      course: "Physics 301",
      courseColor: "#10B981",
      description: "Solve problems related to wave functions, the Schrödinger equation, and quantum tunneling. Show all work and explain your reasoning for each solution.",
      dueDate: "2025-11-01",
      daysUntilDue: 2,
      points: 50,
    },
    {
      id: "2",
      title: "Machine Learning Project Proposal",
      course: "CS 480",
      courseColor: "#A855F7",
      description: "Submit a detailed proposal for your semester project including problem statement, dataset description, methodology, and expected outcomes.",
      dueDate: "2025-11-03",
      daysUntilDue: 4,
      points: 100,
    },
    {
      id: "3",
      title: "Analyze Shakespeare's Hamlet",
      course: "English 202",
      courseColor: "#F59E0B",
      description: "Write a 5-page analysis exploring the themes of madness and revenge in Hamlet. Include at least 5 scholarly sources.",
      dueDate: "2025-11-05",
      daysUntilDue: 6,
      points: 75,
    },
  ];

  const sortedAssignments = [...assignments].sort(
    (a, b) => a.daysUntilDue - b.daysUntilDue
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Your Board</h1>
        </div>
        <p className="text-muted-foreground">
          {sortedAssignments.length} assignment{sortedAssignments.length !== 1 ? "s" : ""} to tackle
        </p>
      </div>

      {/* Assignments List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {sortedAssignments.length > 0 ? (
          <div className="space-y-4">
            {sortedAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} {...assignment} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">🎉 All caught up!</h2>
            <p className="text-muted-foreground">No assignments due soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
