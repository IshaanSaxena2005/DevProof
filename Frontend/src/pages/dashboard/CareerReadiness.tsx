import PageContainer from "../../components/PageContainer";
import EmptyState from "../../components/EmptyState";
import { Briefcase } from "lucide-react";

export default function CareerReadiness() {
  return (
    <PageContainer
      title="Career Readiness"
      description="Track role suitability profiles, target readiness matching, and gap analysis results."
    >
      <EmptyState
        title="No Target Role Selected"
        description="Select your target professional roles to generate evidence-based engineering roadmaps."
        icon={Briefcase}
        actionText="Select Target Role"
        onAction={() => alert("Role selection catalog coming soon.")}
      />
    </PageContainer>
  );
}
