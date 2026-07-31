import { motion } from "motion/react";
import { Sparkles, CheckCircle, AlertTriangle, Target, TrendingUp, Award, Clock, Zap, Shield, Code2, Database, Cloud, FlaskConical, FileText, Activity, GitFork, FolderGit2, BookOpen, Trophy, Wrench } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import { SampleDataNotice } from "../../components/StateBlocks";

// TEMP DEVELOPMENT BYPASS: Using mock data instead of API calls
// Remove this and restore API calls when backend is ready

const intelligenceScore = 92;

const keyStrengths = [
  { title: "Excellent React Architecture", icon: Code2, color: "#77fc75" },
  { title: "Strong TypeScript Usage", icon: Code2, color: "#60a5fa" },
  { title: "Clean Repository Organization", icon: FolderGit2, color: "#a78bfa" },
  { title: "Consistent Development", icon: Activity, color: "#34d399" },
  { title: "Modern Tooling", icon: Zap, color: "#f59e0b" },
  { title: "Good Documentation", icon: FileText, color: "#fb923c" },
];

const riskAnalysis = [
  { title: "Low Testing Coverage", riskLevel: "High", impact: "Medium", priority: "High", color: "#ef4444" },
  { title: "Limited Cloud Experience", riskLevel: "Medium", impact: "High", priority: "High", color: "#f59e0b" },
  { title: "Small Open Source Presence", riskLevel: "Low", impact: "Medium", priority: "Medium", color: "#60a5fa" },
  { title: "Few Backend Projects", riskLevel: "Medium", impact: "High", priority: "Medium", color: "#f59e0b" },
];

const repositoryIntelligence = [
  { category: "Code Quality", score: 88, status: "Excellent", icon: Code2, color: "#77fc75" },
  { category: "Maintainability", score: 82, status: "Good", icon: Wrench, color: "#60a5fa" },
  { category: "Architecture", score: 85, status: "Excellent", icon: Shield, color: "#77fc75" },
  { category: "Documentation", score: 78, status: "Good", icon: FileText, color: "#60a5fa" },
  { category: "Security", score: 75, status: "Good", icon: Shield, color: "#f59e0b" },
  { category: "Performance", score: 80, status: "Good", icon: Zap, color: "#60a5fa" },
];

const aiRecommendations = [
  { title: "Increase Unit Testing", priority: "High", impact: "High", time: "2 weeks", icon: FlaskConical, color: "#ef4444" },
  { title: "Deploy More Projects", priority: "High", impact: "High", time: "1 month", icon: Cloud, color: "#ef4444" },
  { title: "Learn Kubernetes", priority: "Medium", impact: "High", time: "2 months", icon: Cloud, color: "#f59e0b" },
  { title: "Improve CI/CD", priority: "High", impact: "Medium", time: "3 weeks", icon: Zap, color: "#ef4444" },
  { title: "Contribute to Open Source", priority: "Medium", impact: "Medium", time: "Ongoing", icon: GitFork, color: "#f59e0b" },
  { title: "Build Scalable Backend Systems", priority: "Medium", impact: "High", time: "3 months", icon: Database, color: "#f59e0b" },
];

const engineeringEvidence = [
  { label: "Repositories", value: 18, icon: FolderGit2 },
  { label: "Commits", value: 1247, icon: GitFork },
  { label: "Verified Skills", value: 24, icon: CheckCircle },
  { label: "Technologies", value: 32, icon: Code2 },
  { label: "Certificates", value: 5, icon: Award },
  { label: "Problem Solving", value: 89, icon: Target },
  { label: "Experience Sources", value: 4, icon: BookOpen },
];

const futureProjection = [
  { timeframe: "Current", maturity: "Strong Frontend Specialist", score: 92 },
  { timeframe: "3 Months", maturity: "Full Stack Developer", score: 85 },
  { timeframe: "6 Months", maturity: "Senior Full Stack Engineer", score: 88 },
  { timeframe: "1 Year", maturity: "Principal Engineer", score: 91 },
];

export default function AiInsights() {
  return (
    <PageContainer
      title="DevProof Intelligence"
      description="AI-powered engineering analysis with actionable insights and recommendations."
    >
      <SampleDataNotice what="DevProof Intelligence uses sample data for development." />

      {/* DevProof Intelligence Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-8 mb-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <div className="text-7xl font-bold text-white mb-2">
              {intelligenceScore} <span className="text-4xl text-white/40">/ 100</span>
            </div>
          </div>
        </motion.div>
        <h2 className="text-xl font-semibold text-white mb-2">Engineering Intelligence Report</h2>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm text-green-400 font-medium">High Confidence</span>
        </div>
      </motion.div>

      {/* Executive Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel p-6 mb-6 border-l-4 border-l-primary"
      >
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-white">Executive Summary</h2>
        </div>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Based on repository evidence, engineering practices, skills, project quality and developer activity,
          this profile demonstrates strong software engineering capabilities with consistent growth. The developer
          shows excellent frontend expertise with React and TypeScript, clean code organization, and modern
          development practices. Continued investment in backend systems, testing, cloud infrastructure and
          open-source collaboration will significantly increase overall engineering maturity.
        </p>
      </motion.div>

      {/* Key Strengths */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Key Strengths</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {keyStrengths.map((strength, index) => (
            <motion.div
              key={strength.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="glass-inset p-4 flex items-center gap-3"
            >
              <div className="p-2 rounded-lg" style={{ background: `${strength.color}20` }}>
                <strength.icon className="w-5 h-5" style={{ color: strength.color }} />
              </div>
              <span className="text-white font-medium text-sm">{strength.title}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Risk Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Risk Analysis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {riskAnalysis.map((risk, index) => (
            <motion.div
              key={risk.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="glass-inset p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-medium text-sm">{risk.title}</h3>
                <AlertTriangle className="w-4 h-4" style={{ color: risk.color }} />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-full`} style={{ background: `${risk.color}20`, color: risk.color }}>
                  {risk.riskLevel} Risk
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                  Impact: {risk.impact}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full`} style={{ background: `${risk.color}20`, color: risk.color }}>
                  {risk.priority} Priority
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Repository Intelligence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Repository Intelligence</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {repositoryIntelligence.map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
              className="glass-inset p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${item.color}20` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{item.category}</h3>
                  <span className="text-xs" style={{ color: item.color }}>{item.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-white">{item.score}</span>
                <span className="text-xs text-white/40">/ 100</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.8, delay: 0.6 + index * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">AI Recommendations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {aiRecommendations.map((rec, index) => (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              className="glass-inset p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${rec.color}20` }}>
                  <rec.icon className="w-5 h-5" style={{ color: rec.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium text-sm mb-2">{rec.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full`} style={{ background: `${rec.color}20`, color: rec.color }}>
                      {rec.priority}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                      Impact: {rec.impact}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rec.time}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Engineering Evidence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Engineering Evidence</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {engineeringEvidence.map((evidence, index) => (
            <motion.div
              key={evidence.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
              className="glass-inset p-4 text-center"
            >
              <evidence.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{evidence.value}</p>
              <p className="text-xs text-white/40 mt-1">{evidence.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Future Projection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Future Projection</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {futureProjection.map((projection, index) => (
            <div key={projection.timeframe} className="flex-1 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                className="glass-inset p-4"
              >
                <p className="text-xs text-white/40 mb-2">{projection.timeframe}</p>
                <p className="text-sm font-semibold text-white mb-2">{projection.maturity}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-primary">{projection.score}</span>
                  <span className="text-xs text-white/40">/ 100</span>
                </div>
              </motion.div>
              {index < futureProjection.length - 1 && (
                <div className="hidden md:flex items-center justify-center py-2">
                  <TrendingUp className="w-5 h-5 text-primary rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* DevProof Final Verdict */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="glass-panel p-8 border-l-4 border-l-primary"
      >
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-white">Overall Engineering Assessment</h2>
        </div>
        <p className="text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          This developer demonstrates strong practical engineering skills with excellent frontend expertise and a rapidly
          improving technical profile. The 92-point intelligence score reflects solid capabilities across code quality,
          architecture, and development practices. Continued investment in backend systems, testing, cloud infrastructure
          and open-source collaboration will significantly increase overall engineering maturity. The trajectory shows
          consistent growth with the potential to reach principal engineer level within 12 months.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="glass-chip px-4 py-2 text-sm text-green-400">
            Strong Frontend Specialist
          </span>
          <span className="glass-chip px-4 py-2 text-sm text-blue-400">
            Consistent Growth Trajectory
          </span>
          <span className="glass-chip px-4 py-2 text-sm text-yellow-400">
            Focus on Backend & Testing
          </span>
          <span className="glass-chip px-4 py-2 text-sm text-purple-400">
            High Potential for Senior Roles
          </span>
        </div>
      </motion.div>
    </PageContainer>
  );
}
