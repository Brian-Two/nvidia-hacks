import { useState, useEffect } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import AssignmentCard from "@/components/AssignmentCard";
import { getAssignments, Assignment } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Board = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAssignments();
      setAssignments(data);
      
      if (data.length === 0) {
        toast({
          title: "No Assignments Found",
          description: "You don't have any upcoming assignments in Canvas",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(errorMessage);
      console.error('Error fetching assignments:', err);
      
      toast({
        title: "Failed to Load Assignments",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sortedAssignments = [...assignments].sort(
    (a, b) => a.daysUntilDue - b.daysUntilDue
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold">Your Board</h1>
        </div>
        {!isLoading && !error && (
          <p className="text-muted-foreground">
            {sortedAssignments.length} assignment{sortedAssignments.length !== 1 ? "s" : ""} to tackle
          </p>
        )}
      </div>

      {/* Assignments List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Assignments</h2>
            <p className="text-muted-foreground">Fetching your assignments from Canvas...</p>
          </div>
        ) : error ? (
          // Error State
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Failed to Load</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={fetchAssignments}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        ) : sortedAssignments.length > 0 ? (
          // Assignments List
          <div className="space-y-4">
            {sortedAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} {...assignment} />
            ))}
          </div>
        ) : (
          // Empty State
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
