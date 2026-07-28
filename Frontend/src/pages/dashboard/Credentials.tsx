import PageContainer from "../../components/PageContainer";
import EmptyState from "../../components/EmptyState";
import { Award } from "lucide-react";

export default function Credentials() {
  return (
    <PageContainer
      title="Credentials"
      description="Manage verified certificates, courses, and digital badges."
    >
      <EmptyState
        title="No External Credentials Added"
        description="Verify your external certifications, course milestones, or degrees directly inside your profile."
        icon={Award}
        actionText="Verify Credential"
        onAction={() => alert("Verification portal coming soon.")}
      />
    </PageContainer>
  );
}
