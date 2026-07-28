import PageContainer from "../../components/PageContainer";
import EmptyState from "../../components/EmptyState";
import { Target } from "lucide-react";

export default function ProblemSolving() {
  return (
    <PageContainer
      title="Problem Solving"
      description="Track platform coding achievements, hackathons, and challenge history."
    >
      <EmptyState
        title="No Problem Solving Activity Integrated"
        description="Connect platforms like LeetCode, HackerRank, or Devpost to import problem-solving history."
        icon={Target}
        actionText="Connect Platforms"
        onAction={() => alert("Redirecting to integrations...")}
      />
    </PageContainer>
  );
}
