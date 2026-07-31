import { motion } from "motion/react";
import { Briefcase, CheckCircle, AlertTriangle, TrendingUp, Award, Target, Clock, Zap, Shield, Code2, Database, Cloud, FlaskConical, FileText, GitFork, FolderGit2, Trophy, Users, Building2, GraduationCap, Brain } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import { SampleDataNotice } from "../../components/StateBlocks";

// TEMP DEVELOPMENT BYPASS: Using mock data instead of API calls
// Remove this and restore API calls when backend is ready

const careerReadinessScore = 88;

const readinessBreakdown = [
  { category: "Technical Skills", score: 92, explanation: "Strong frontend expertise with React and TypeScript", icon: Code2, color: "#77fc75" },
  { category: "Projects", score: 85, explanation: "Multiple completed projects with good quality", icon: FolderGit2, color: "#60a5fa" },
  { category: "Problem Solving", score: 89, explanation: "Consistent problem-solving performance", icon: Target, color: "#a78bfa" },
  { category: "Version Control", score: 88, explanation: "Proficient Git workflow and collaboration", icon: GitFork, color: "#34d399" },
  { category: "Documentation", score: 78, explanation: "Good documentation practices", icon: FileText, color: "#f59e0b" },
  { category: "Communication", score: 82, explanation: "Clear technical communication", icon: Users, color: "#fb923c" },
];

const hiringReadiness = [
  { role: "Internship Ready", readiness: 95, status: "Ready", icon: GraduationCap, color: "#77fc75" },
  { role: "Frontend Ready", readiness: 92, status: "Ready", icon: Code2, color: "#77fc75" },
  { role: "Backend Ready", readiness: 68, status: "In Progress", icon: Database, color: "#f59e0b" },
  { role: "Full Stack Ready", readiness: 78, status: "In Progress", icon: Cloud, color: "#f59e0b" },
  { role: "SDE-1 Ready", readiness: 72, status: "In Progress", icon: Building2, color: "#f59e0b" },
  { role: "AI/ML Ready", readiness: 35, status: "Not Ready", icon: Brain, color: "#ef4444" },
];

const skillGapAnalysis = [
  { skill: "Testing", priority: "High", difficulty: "Medium", time: "3 weeks", icon: FlaskConical, color: "#ef4444" },
  { skill: "Cloud", priority: "High", difficulty: "High", time: "2 months", icon: Cloud, color: "#ef4444" },
  { skill: "CI/CD", priority: "High", difficulty: "Medium", time: "4 weeks", icon: Zap, color: "#ef4444" },
  { skill: "System Design", priority: "Medium", difficulty: "High", time: "3 months", icon: Shield, color: "#f59e0b" },
  { skill: "Scalability", priority: "Medium", difficulty: "High", time: "2 months", icon: TrendingUp, color: "#f59e0b" },
];

const evidenceSummary = [
  { label: "Repositories", value: 18, icon: FolderGit2 },
  { label: "Projects", value: 12, icon: Target },
  { label: "Verified Skills", value: 24, icon: CheckCircle },
  { label: "Technologies", value: 32, icon: Code2 },
  { label: "Certificates", value: 5, icon: Award },
  { label: "Problem Solving", value: 89, icon: Target },
];

const careerRoadmap = [
  { stage: "Current", title: "Frontend Developer", score: 88, current: true },
  { stage: "Intern Ready", title: "Software Engineering Intern", score: 95, current: false },
  { stage: "Junior Engineer", title: "Junior Software Engineer", score: 85, current: false },
  { stage: "Software Engineer", title: "Software Engineer (SDE-1)", score: 78, current: false },
  { stage: "Senior Engineer", title: "Senior Software Engineer", score: 72, current: false },
];

export default function CareerReadiness() {
  return (
    <PageContainer
      title="Career Readiness"
      description="Track role suitability profiles, target readiness matching, and gap analysis results."
    >
      <SampleDataNotice what="Career Readiness uses sample data for development." />

      {/* Career Readiness Score */}
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
            <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
            <div className="text-7xl font-bold text-white mb-2">
              {careerReadinessScore} <span className="text-4xl text-white/40">/ 100</span>
            </div>
          </div>
        </motion.div>
        <h2 className="text-xl font-semibold text-white mb-2">Ready for Software Engineering Roles</h2>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm text-green-400 font-medium">High Confidence</span>
        </div>
      </motion.div>

      {/* Readiness Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Readiness Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {readinessBreakdown.map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              className="glass-inset p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${item.color}20` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium text-sm">{item.category}</h3>
                  <p className="text-xs" style={{ color: item.color }}>{item.score}%</p>
                </div>
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                {item.explanation}
              </p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hiring Readiness */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Hiring Readiness</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hiringReadiness.map((item, index) => (
            <motion.div
              key={item.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="glass-inset p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${item.color}20` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium text-sm">{item.role}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full`} style={{ background: `${item.color}20`, color: item.color }}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-white">{item.readiness}%</span>
                <span className="text-xs text-white/40">Ready</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.readiness}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Skill Gap Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Skill Gap Analysis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {skillGapAnalysis.map((item, index) => (
            <motion.div
              key={item.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="glass-inset p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${item.color}20` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium text-sm mb-2">{item.skill}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full`} style={{ background: `${item.color}20`, color: item.color }}>
                      {item.priority}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                      {item.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Evidence Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Evidence Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {evidenceSummary.map((evidence, index) => (
            <motion.div
              key={evidence.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
              className="glass-inset p-4 text-center"
            >
              <evidence.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{evidence.value}</p>
              <p className="text-xs text-white/40 mt-1">{evidence.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recruiter View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Recruiter View</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-inset p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Top Strengths
            </h3>
            <ul className="space-y-2">
              <li className="text-sm text-white/70">• Strong React & TypeScript expertise</li>
              <li className="text-sm text-white/70">• Clean code architecture</li>
              <li className="text-sm text-white/70">• Consistent project delivery</li>
              <li className="text-sm text-white/70">• Good problem-solving skills</li>
            </ul>
          </div>
          <div className="glass-inset p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Top Risks
            </h3>
            <ul className="space-y-2">
              <li className="text-sm text-white/70">• Limited backend experience</li>
              <li className="text-sm text-white/70">• Low testing coverage</li>
              <li className="text-sm text-white/70">• Minimal cloud infrastructure</li>
              <li className="text-sm text-white/70">• Small open source presence</li>
            </ul>
          </div>
        </div>
        <div className="glass-inset p-4 mt-4 border-l-4 border-l-primary">
          <h3 className="text-white font-medium mb-2">Overall Impression</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Strong frontend developer with excellent technical foundation. Ready for junior to mid-level frontend roles.
            Backend and cloud skills need development for full-stack positions. High potential for growth.
          </p>
        </div>
      </motion.div>

      {/* Career Roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Career Roadmap</h2>
        <div className="flex flex-col gap-3">
          {careerRoadmap.map((stage, index) => (
            <div key={stage.stage} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full ${stage.current ? 'bg-primary shadow-[0_0_12px_rgba(119,252,117,0.8)]' : 'bg-white/20'}`} />
                {index < careerRoadmap.length - 1 && (
                  <div className="w-0.5 h-12 bg-white/10 mt-2" />
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                className={`flex-1 glass-inset p-4 ${stage.current ? 'border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium text-sm">{stage.title}</h3>
                  {stage.current && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{stage.score}%</span>
                  <span className="text-xs text-white/40">Ready</span>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Final DevProof Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="glass-panel p-8 border-l-4 border-l-primary"
      >
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-white">Final DevProof Recommendation</h2>
        </div>
        <p className="text-lg leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
          This developer demonstrates strong readiness for software engineering roles, particularly in frontend development.
          The 88-point career readiness score reflects solid technical skills, consistent project delivery, and good problem-solving
          capabilities. The profile shows excellent potential for growth with clear pathways to full-stack and senior roles.
          Focus on backend systems, testing, and cloud infrastructure to maximize career opportunities.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="glass-chip px-4 py-2 text-sm text-green-400">
            Ready for Frontend Roles
          </span>
          <span className="glass-chip px-4 py-2 text-sm text-blue-400">
            Strong Growth Potential
          </span>
          <span className="glass-chip px-4 py-2 text-sm text-yellow-400">
            Focus on Backend Skills
          </span>
          <span className="glass-chip px-4 py-2 text-sm text-purple-400">
            High Hiring Readiness
          </span>
        </div>
      </motion.div>
    </PageContainer>
  );
}
