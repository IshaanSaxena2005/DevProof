import PageContainer from "../../components/PageContainer";
import EmptyState from "../../components/EmptyState";
import { Sparkles } from "lucide-react";

export default function AiInsights() {
  return (
    <PageContainer
      title="AI Insights"
      description="Inspect targeted recommendations, explainable engineering gaps, and actionable code fixes."
    >
      <EmptyState
        title="AI Copilot Initializing"
        description="Connect your target repositories to unlock explainable code quality insights."
        icon={Sparkles}
        actionText="Scaffold Repositories"
        onAction={() => alert("Scaffolding repositories...")}
      />
    </PageContainer>
  );
}
