import PageContainer from "../../components/PageContainer";
import GlassCard from "../../components/GlassCard";
import { User, Activity, ShieldAlert } from "lucide-react";

export default function Developer360() {
  return (
    <PageContainer
      title="Developer 360"
      description="Inspect your multidimensional developer profile compiled from repository history and credentials."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dimensions widget */}
        <GlassCard hover={false} className="p-6 lg:col-span-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
            Developer Dimensions
          </h3>
          <div className="space-y-4">
            {[
              { name: "Frontend Engineering", score: 88, desc: "Strong HTML/CSS/JS, React patterns detected" },
              { name: "Backend Architecture", score: 72, desc: "Go/Node services, API designs verified" },
              { name: "Database Design", score: 65, desc: "PostgreSQL usage detected in recent projects" },
              { name: "System Integration & Security", score: 55, desc: "Basic OAuth, env security applied" },
            ].map((dim) => (
              <div key={dim.name} className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01]">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-white">{dim.name}</span>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{dim.desc}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary">{dim.score}%</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${dim.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Profiles/General indicators */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <GlassCard hover={false} className="p-6">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Primary Role</h4>
                <div className="text-base font-bold text-white mt-0.5">Full Stack Engineer</div>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Analysis suggests a primary focus on frontend frameworks with growing backend capabilities.
            </p>
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Recent Activity</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <Activity className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Committed 12 times to SpendWise Pro</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Testing gap identified in Go API scaffold</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
}
