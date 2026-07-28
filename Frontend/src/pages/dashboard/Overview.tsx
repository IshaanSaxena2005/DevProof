import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { FolderGit2, Code2, Award, Briefcase, Plus } from "lucide-react";

export default function Overview() {
  return (
    <PageContainer
      title="Overview"
      description="Welcome back. Here is a summary of your evidence-based engineering metrics."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassCard hover={true} className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Repositories
            </div>
            <div className="text-xl font-bold text-white mt-0.5">14 Active</div>
          </div>
        </GlassCard>

        <GlassCard hover={true} className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Verified Skills
            </div>
            <div className="text-xl font-bold text-white mt-0.5">8 Strong</div>
          </div>
        </GlassCard>

        <GlassCard hover={true} className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Credentials
            </div>
            <div className="text-xl font-bold text-white mt-0.5">3 Verified</div>
          </div>
        </GlassCard>

        <GlassCard hover={true} className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
              Target Readiness
            </div>
            <div className="text-xl font-bold text-white mt-0.5">74% Match</div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard hover={false} className="p-6 lg:col-span-2 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              Engineering Quality Index
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Your engineering index is calculated across architecture, tests, documentation and security.
            </p>
          </div>
          
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <span className="text-5xl font-extrabold text-white">74</span>
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/100</span>
              <div className="text-xs uppercase tracking-widest font-semibold mt-2" style={{ color: "hsl(var(--primary))" }}>
                Good Standing
              </div>
            </div>
          </div>

          <div className="text-[11px] text-center" style={{ color: "var(--text-tertiary)" }}>
            Calculated 2 hours ago from SpendWise Pro git history
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-xs font-semibold text-white/90 transition-all cursor-pointer">
                <span>Scan New Repository</span>
                <Plus className="w-4 h-4 text-primary" />
              </button>
              <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-xs font-semibold text-white/90 transition-all cursor-pointer">
                <span>View AI Gap Analysis</span>
                <Plus className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>

          <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Need help? Explore the integration docs.
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
