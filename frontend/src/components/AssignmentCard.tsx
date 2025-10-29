import { Clock, Award } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface AssignmentCardProps {
  id: string;
  title: string;
  course: string;
  courseColor: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  points: number;
}

const AssignmentCard = ({
  id,
  title,
  course,
  courseColor,
  description,
  dueDate,
  daysUntilDue,
  points,
}: AssignmentCardProps) => {
  const navigate = useNavigate();
  const isUrgent = daysUntilDue <= 2;

  return (
    <div
      className={`bg-card border border-border rounded-xl p-6 transition-all hover:border-primary/30 ${
        isUrgent ? "shadow-urgent" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: courseColor }}
            />
            <span className="text-sm text-muted-foreground font-medium">
              {course}
            </span>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center gap-3 mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            isUrgent
              ? "bg-warning/10 text-warning border border-warning/20"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Due in {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Award className="w-3.5 h-3.5" />
          {points} pts
        </span>
      </div>

      <Button
        onClick={() => navigate(`/astar?assignment=${id}`)}
        className="w-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:shadow-lg hover:scale-[1.02] transition-all"
      >
        Start with ASTAR
      </Button>
    </div>
  );
};

export default AssignmentCard;
