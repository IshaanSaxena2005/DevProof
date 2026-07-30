import { motion } from "motion/react";
import { TrendingUp, Flame, Trophy, Target, AlertCircle, CheckCircle2, Brain } from "lucide-react";
import { SampleDataNotice } from "../../components/StateBlocks";

const mockStats = {
  problemsSolved: 325,
  acceptanceRate: 82,
  currentStreak: 45,
  contestRating: 1725,
};

const difficultyBreakdown = [
  { level: "Easy", solved: 145, total: 180, color: "bg-green-500" },
  { level: "Medium", solved: 142, total: 200, color: "bg-yellow-500" },
  { level: "Hard", solved: 38, total: 100, color: "bg-red-500" },
];

const topicMastery = [
  { topic: "Arrays", mastery: 92, level: "Expert" },
  { topic: "Strings", mastery: 88, level: "Expert" },
  { topic: "Hashing", mastery: 85, level: "Advanced" },
  { topic: "Linked Lists", mastery: 78, level: "Advanced" },
  { topic: "Trees", mastery: 75, level: "Advanced" },
  { topic: "Graphs", mastery: 68, level: "Intermediate" },
  { topic: "Dynamic Programming", mastery: 45, level: "Beginner" },
  { topic: "Greedy", mastery: 72, level: "Intermediate" },
  { topic: "Backtracking", mastery: 58, level: "Intermediate" },
  { topic: "Binary Search", mastery: 80, level: "Advanced" },
  { topic: "Stacks", mastery: 85, level: "Advanced" },
  { topic: "Queues", mastery: 82, level: "Advanced" },
];

const contestPerformance = [
  { name: "Weekly Contest 345", rank: 1245, solved: 3, ratingChange: +12 },
  { name: "Biweekly Contest 89", rank: 892, solved: 4, ratingChange: +18 },
  { name: "Weekly Contest 344", rank: 1567, solved: 2, ratingChange: -5 },
  { name: "Biweekly Contest 88", rank: 1023, solved: 3, ratingChange: +8 },
];

const strengths = [
  "Fast implementation",
  "Strong array concepts",
  "Good graph intuition",
  "Consistent practice",
];

const areasToImprove = [
  "Dynamic Programming",
  "Advanced Graphs",
  "Segment Trees",
  "Bit Manipulation",
];

const generateHeatmap = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const weeks = 26;
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
  
  return { months, heatmap };
};

const { months, heatmap } = generateHeatmap();

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

export default function ProblemSolving() {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
          Problem Solving
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Track coding achievements, contest performance, and skill mastery
        </p>
      </div>

      <SampleDataNotice what="No coding-profile endpoint exists yet, and the LeetCode/GeeksforGeeks integrations are unbuilt. The activity heatmap is randomly generated on each load." />

      {/* Problem Solving Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Problems Solved"
          value={mockStats.problemsSolved}
          color="text-green-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Acceptance Rate"
          value={`${mockStats.acceptanceRate}%`}
          color="text-blue-400"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value={`${mockStats.currentStreak} Days`}
          color="text-orange-400"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Contest Rating"
          value={mockStats.contestRating}
          color="text-purple-400"
        />
      </motion.div>

      {/* Difficulty Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Difficulty Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficultyBreakdown.map((item) => (
            <div key={item.level} className="glass-inset p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">{item.level}</span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {item.solved}/{item.total}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.solved / item.total) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={`h-full ${item.color}`}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                {Math.round((item.solved / item.total) * 100)}% solved
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Topic Mastery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Topic Mastery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topicMastery.map((item, index) => (
            <motion.div
              key={item.topic}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="glass-inset p-3"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-sm font-medium">{item.topic}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.mastery >= 80
                      ? "bg-green-500/20 text-green-400"
                      : item.mastery >= 60
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {item.level}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.mastery}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.05 }}
                  className={`h-full ${
                    item.mastery >= 80
                      ? "bg-green-500"
                      : item.mastery >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                {item.mastery}% mastery
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Contest Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-panel p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Contest Performance</h2>
        <div className="space-y-3">
          {contestPerformance.map((contest, index) => (
            <motion.div
              key={contest.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="glass-inset p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="text-white font-medium">{contest.name}</p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  Rank #{contest.rank}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-white font-semibold">{contest.solved}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Solved
                  </p>
                </div>
                <div
                  className={`text-center px-3 py-1 rounded-lg ${
                    contest.ratingChange > 0
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  <p className="font-semibold">
                    {contest.ratingChange > 0 ? "+" : ""}
                    {contest.ratingChange}
                  </p>
                  <p className="text-xs">Rating</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Daily Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-panel p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Daily Activity (6 Months)</h2>
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
                        delay: 0.5 + weekIndex * 0.02 + dayIndex * 0.01,
                      }}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`}
                      title={`Activity level: ${level}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            {months.map((month) => (
              <span key={month} className="text-xs text-white/40">
                {month}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Strengths and Areas to Improve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-panel p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Strengths
          </h2>
          <div className="space-y-2">
            {strengths.map((strength, index) => (
              <motion.div
                key={strength}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="glass-inset p-3 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white text-sm">{strength}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="glass-panel p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Areas to Improve
          </h2>
          <div className="space-y-2">
            {areasToImprove.map((area, index) => (
              <motion.div
                key={area}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                className="glass-inset p-3 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-white text-sm">{area}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* DevProof Intelligence Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="glass-panel p-6 border-l-4 border-l-green-400"
      >
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-green-400" />
          <h2 className="text-lg font-semibold text-white">
            DevProof Intelligence Summary
          </h2>
        </div>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          This developer demonstrates consistent problem-solving ability with strong
          performance in core data structures. The 82% acceptance rate and 45-day
          streak show dedication and consistency. Mastery in Arrays, Strings, and Hashing
          is exceptional (88%+), while Dynamic Programming remains the primary growth
          area (45% mastery). Improving advanced algorithms will significantly strengthen
          interview readiness.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="glass-chip px-3 py-1.5 text-xs text-green-400">
            Strong Fundamentals
          </span>
          <span className="glass-chip px-3 py-1.5 text-xs text-blue-400">
            Consistent Practice
          </span>
          <span className="glass-chip px-3 py-1.5 text-xs text-yellow-400">
            Focus on DP
          </span>
        </div>
      </motion.div>
    </div>
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
  value: string | number;
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
