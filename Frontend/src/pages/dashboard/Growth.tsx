import { motion } from "motion/react";
import { TrendingUp, FolderGit2, Code2, Database, Cloud, FlaskConical, Brain, Award, Calendar, Target, Zap } from "lucide-react";
import PageContainer from "../../components/PageContainer";
import { SampleDataNotice } from "../../components/StateBlocks";

// TEMP DEVELOPMENT BYPASS: Using mock data instead of API calls
// Remove this and restore API calls when backend is ready

const growthStats = {
  repositoriesBuilt: 18,
  projectsCompleted: 12,
  technologiesLearned: 24,
  currentGrowthScore: 87,
};

const monthlyGrowthData = [
  { month: "Jan", score: 65 },
  { month: "Feb", score: 68 },
  { month: "Mar", score: 70 },
  { month: "Apr", score: 72 },
  { month: "May", score: 75 },
  { month: "Jun", score: 78 },
  { month: "Jul", score: 80 },
  { month: "Aug", score: 82 },
  { month: "Sep", score: 84 },
  { month: "Oct", score: 85 },
  { month: "Nov", score: 86 },
  { month: "Dec", score: 87 },
];

const skillProgress = [
  { skill: "Frontend", previousLevel: "Intermediate", currentLevel: "Expert", progress: 92, icon: Code2, color: "#77fc75" },
  { skill: "Backend", previousLevel: "Beginner", currentLevel: "Advanced", progress: 78, icon: Cloud, color: "#60a5fa" },
  { skill: "Databases", previousLevel: "Beginner", currentLevel: "Intermediate", progress: 65, icon: Database, color: "#a78bfa" },
  { skill: "DevOps", previousLevel: "Beginner", currentLevel: "Intermediate", progress: 58, icon: Cloud, color: "#f59e0b" },
  { skill: "Testing", previousLevel: "Beginner", currentLevel: "Intermediate", progress: 62, icon: FlaskConical, color: "#34d399" },
  { skill: "AI / ML", previousLevel: "Beginner", currentLevel: "Beginner", progress: 35, icon: Brain, color: "#fb923c" },
];

const repositoryGrowth = [
  { name: "SpendWise", started: "Jan 2024", completed: "Mar 2024", score: 82 },
  { name: "CloudPilot", started: "Apr 2024", completed: "Jun 2024", score: 78 },
  { name: "DevProof", started: "Jul 2024", completed: "Present", score: 87 },
  { name: "Inventory System", started: "Oct 2024", completed: "In Progress", score: 65 },
];

const achievementBadges = [
  { name: "100 Commits", icon: Zap, color: "#77fc75", earned: true },
  { name: "10 Repositories", icon: FolderGit2, color: "#60a5fa", earned: true },
  { name: "Frontend Expert", icon: Code2, color: "#a78bfa", earned: true },
  { name: "Open Source", icon: Award, color: "#f59e0b", earned: true },
  { name: "Fast Learner", icon: TrendingUp, color: "#34d399", earned: true },
];

const nextMilestones = [
  { title: "Complete CI/CD", estimated: "2 weeks", priority: "high" },
  { title: "Learn Kubernetes", estimated: "1 month", priority: "medium" },
  { title: "Improve Testing", estimated: "3 weeks", priority: "high" },
  { title: "Deploy Full Stack Project", estimated: "1 month", priority: "medium" },
];

const generateHeatmap = () => {
  const weeks = 52;
  const heatmap = [];
  
  for (let i = 0; i < weeks; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      const activity = Math.random();
      let level = 0;
      if (activity > 0.8) level = 4;
      else if (activity > 0.6) level = 3;
      else if (activity > 0.4) level = 2;
      else if (activity > 0.2) level = 1;
      week.push(level);
    }
    heatmap.push(week);
  }
  
  return heatmap;
};

const heatmap = generateHeatmap();

const getHeatmapColor = (level: number) => {
  const colors = [
    "bg-white/5",
    "bg-green-900/40",
    "bg-green-700/60",
    "bg-green-500/80",
    "bg-green-400",
  ];
  return colors[level];
};

export default function Growth() {
  return (
    <PageContainer
      title="Growth & Analytics"
      description="Track your engineering journey, skill progression, and development consistency over time."
    >
      <SampleDataNotice what="Growth analytics use sample data for development." />

      {/* Growth Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatCard
          icon={<FolderGit2 className="w-5 h-5" />}
          label="Repositories Built"
          value={growthStats.repositoriesBuilt}
          color="text-green-400"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Projects Completed"
          value={growthStats.projectsCompleted}
          color="text-blue-400"
        />
        <StatCard
          icon={<Code2 className="w-5 h-5" />}
          label="Technologies Learned"
          value={growthStats.technologiesLearned}
          color="text-purple-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Current Growth Score"
          value={growthStats.currentGrowthScore}
          color="text-orange-400"
        />
      </motion.div>

      {/* Monthly Growth Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Monthly Growth Timeline</h2>
        <div className="h-48 relative">
          <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((line) => (
              <line
                key={line}
                x1="0"
                y1={200 - (line * 2)}
                x2="600"
                y2={200 - (line * 2)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            ))}
            {/* Area fill */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              d={`M0,${200 - (monthlyGrowthData[0].score * 2)} ${monthlyGrowthData.map((d, i) => `L${i * 54.5},${200 - (d.score * 2)}`).join(" ")} L540,200 L0,200`}
              fill="rgba(119, 252, 117, 0.1)"
            />
            {/* Line */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              d={`M0,${200 - (monthlyGrowthData[0].score * 2)} ${monthlyGrowthData.map((d, i) => `L${i * 54.5},${200 - (d.score * 2)}`).join(" ")}`}
              fill="none"
              stroke="#77fc75"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Points */}
            {monthlyGrowthData.map((d, i) => (
              <circle
                key={i}
                cx={i * 54.5}
                cy={200 - (d.score * 2)}
                r="4"
                fill="#77fc75"
                className="hover:scale-150 transition-transform cursor-pointer"
              />
            ))}
          </svg>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            {monthlyGrowthData.map((d) => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Skill Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Skill Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillProgress.map((skill, index) => (
            <motion.div
              key={skill.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="glass-inset p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${skill.color}20` }}>
                  <skill.icon className="w-5 h-5" style={{ color: skill.color }} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{skill.skill}</h3>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {skill.previousLevel} →
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: skill.color }}>
                  {skill.currentLevel}
                </span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {skill.progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: skill.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Repository Growth */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Repository Growth</h2>
        <div className="space-y-3">
          {repositoryGrowth.map((repo, index) => (
            <motion.div
              key={repo.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="glass-inset p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <h3 className="text-white font-medium">{repo.name}</h3>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {repo.started} → {repo.completed}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-white font-semibold">{repo.score}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Score
                  </p>
                </div>
                <div
                  className={`text-center px-3 py-1 rounded-lg ${
                    repo.score >= 80
                      ? "bg-green-500/20 text-green-400"
                      : repo.score >= 60
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  <p className="font-semibold text-sm">{repo.score >= 80 ? "Excellent" : repo.score >= 60 ? "Good" : "Needs Work"}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Achievement Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Achievement Badges</h2>
        <div className="flex flex-wrap gap-3">
          {achievementBadges.map((badge, index) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className={`glass-chip px-4 py-2.5 flex items-center gap-2 ${
                badge.earned ? "" : "opacity-50"
              }`}
              style={{ borderColor: badge.earned ? `${badge.color}40` : undefined }}
            >
              <badge.icon className="w-4 h-4" style={{ color: badge.color }} />
              <span className="text-sm font-medium text-white">{badge.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Development Consistency Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Development Consistency (1 Year)</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <div className="flex flex-col gap-1 pr-2">
              <span className="text-xs text-white/40 h-3"></span>
              {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((day) => (
                <span key={day} className="text-xs text-white/40 h-3 flex items-center">
                  {day}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {heatmap.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((level, dayIndex) => (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: 0.6 + weekIndex * 0.01 + dayIndex * 0.005,
                      }}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`}
                      title={`Activity level: ${level}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Milestones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-panel p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Next Milestones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nextMilestones.map((milestone, index) => (
            <motion.div
              key={milestone.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              className="glass-inset p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <h3 className="text-white font-medium text-sm">{milestone.title}</h3>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Est: {milestone.estimated}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  milestone.priority === "high"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {milestone.priority}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* DevProof Growth Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="glass-panel p-6 border-l-4 border-l-green-400"
      >
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-green-400" />
          <h2 className="text-lg font-semibold text-white">
            DevProof Growth Summary
          </h2>
        </div>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Your engineering profile shows consistent year-over-year improvement with strong frontend growth.
          The 87-point growth score reflects solid progress across repositories and technologies. Increasing
          testing and cloud expertise will accelerate overall engineering maturity. Focus on completing
          CI/CD implementation and improving test coverage to reach the next growth tier.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="glass-chip px-3 py-1.5 text-xs text-green-400">
            Strong Frontend Growth
          </span>
          <span className="glass-chip px-3 py-1.5 text-xs text-blue-400">
            Consistent Progress
          </span>
          <span className="glass-chip px-3 py-1.5 text-xs text-yellow-400">
            Focus on Testing
          </span>
        </div>
      </motion.div>
    </PageContainer>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-panel p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
    </motion.div>
  );
}
