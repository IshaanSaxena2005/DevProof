import PageContainer from "../../components/PageContainer";
import EmptyState from "../../components/EmptyState";
import { TrendingUp } from "lucide-react";

export default function Growth() {
  return (
    <PageContainer
      title="Growth &amp; Analytics"
      description="Observe your skill progression, activity logs, and code quality indices over time."
    >
      <EmptyState
        title="Analytics Profile Indexing"
        description="We are indexing your historical Git trends. Return in a few hours to view full trajectory charts."
        icon={TrendingUp}
      />
    </PageContainer>
  );
}
