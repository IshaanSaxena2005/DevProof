import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { Settings as SettingsIcon, Shield, Bell } from "lucide-react";

export default function Settings() {
  return (
    <PageContainer
      title="Settings"
      description="Configure your personal profile settings, repository accesses, and integrations."
    >
      <div className="flex flex-col gap-6">
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">General Preferences</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/80">Account Connected</span>
              <span className="text-xs text-white/50">github.com/john-doe</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/80">Default Branch Analysis</span>
              <span className="text-xs text-white/50">main / master</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Privacy &amp; Permissions</h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            DevProof enforces least-privilege repository checkouts and does not store raw codebase scripts. You can revoke access at any time.
          </p>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
