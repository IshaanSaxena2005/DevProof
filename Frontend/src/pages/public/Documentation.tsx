import PublicPageLayout from "../../layouts/PublicPageLayout";

export default function Documentation() {
  return (
    <PublicPageLayout
      title="Documentation"
      description="Setup, usage, and technical documentation for DevProof."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Prerequisites</h3>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>A GitHub account with public repositories</li>
              <li>Node.js 18+ (for local development)</li>
              <li>PostgreSQL (for local development)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Connecting GitHub</h3>
            <p className="text-white/70 mb-4">
              DevProof uses GitHub OAuth for authentication and repository access:
            </p>
            <ol className="list-decimal list-inside text-white/70 space-y-2">
              <li>Click "Connect GitHub" on the landing page or in the dashboard</li>
              <li>Authorize DevProof to read your public repositories</li>
              <li>DevProof redirects back to the dashboard with your session established</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Syncing Repositories</h3>
            <p className="text-white/70 mb-4">
              After connecting GitHub:
            </p>
            <ol className="list-decimal list-inside text-white/70 space-y-2">
              <li>Go to the Repositories page in the dashboard</li>
              <li>Click "Sync Repositories" to fetch your public repositories</li>
              <li>Select repositories to analyze and click "Analyze"</li>
              <li>Analysis runs automatically; view results in the repository details</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Coding Platform Integration</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">LeetCode</h3>
            <p className="text-white/70 mb-4">
              To connect LeetCode:
            </p>
            <ol className="list-decimal list-inside text-white/70 space-y-2">
              <li>Go to the Problem Solving page in the dashboard</li>
              <li>Click "Connect LeetCode"</li>
              <li>Enter your LeetCode username</li>
              <li>DevProof fetches your public problem-solving data</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">GeeksforGeeks</h3>
            <p className="text-white/70 mb-4">
              To connect GeeksforGeeks:
            </p>
            <ol className="list-decimal list-inside text-white/70 space-y-2">
              <li>Go to the Problem Solving page in the dashboard</li>
              <li>Click "Connect GeeksforGeeks"</li>
              <li>Enter your GeeksforGeeks username</li>
              <li>DevProof fetches your public problem-solving data</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Adding Learning Records</h2>
        <p className="text-white/70 mb-4">
          Learning records (courses, certifications, hackathons) are added manually:
        </p>
        <ol className="list-decimal list-inside text-white/70 space-y-2 mb-6">
          <li>Go to the Learning & Achievements page in the dashboard</li>
          <li>Click "Add Record" and select the type (Course, Certification, Hackathon)</li>
          <li>Fill in the required fields (name, platform, completion date, learned skills)</li>
          <li>Optionally add a credential URL for verification</li>
          <li>Click "Save" to add the record to your profile</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Understanding Evidence</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Analysis Scores</h3>
            <p className="text-white/70">
              Repository analysis scores (0-100) reflect engineering quality across categories. Higher scores indicate
              better practices, but they are not definitive measures of code quality. Scores are based on static analysis
              and may miss context-specific issues.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Skill Confidence</h3>
            <p className="text-white/70">
              Skill confidence (0-100) indicates the strength of evidence for a skill. Higher confidence means more
              evidence sources, more recent activity, or more direct evidence (e.g., code usage vs. course curriculum).
              Low confidence does not mean inability; it means limited evidence in connected data sources.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Evidence Levels</h3>
            <p className="text-white/70">
              "Practically Evidenced" means multiple sources provide strong evidence. "Claimed" means the skill is
              inferred indirectly (e.g., from a course). Skills with no evidence are not displayed.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Architecture</h2>
        <p className="text-white/70 mb-4">
          DevProof is a full-stack application with the following architecture:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>Frontend:</strong> React + TypeScript + Vite, deployed on Vercel
          </li>
          <li>
            <strong>Backend:</strong> Express + TypeScript REST API, deployed on Render
          </li>
          <li>
            <strong>Database:</strong> PostgreSQL with Prisma ORM
          </li>
          <li>
            <strong>Authentication:</strong> GitHub OAuth via passport-github2
          </li>
          <li>
            <strong>Analysis Engine:</strong> Custom static analysis pipeline for repository evaluation
          </li>
          <li>
            <strong>AI Integration:</strong> Optional Groq AI for insights (requires API key)
          </li>
        </ul>
        <p className="text-white/70">
          See the README for a detailed system architecture diagram.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Local Development</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Setup</h3>
            <pre className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white/80 overflow-x-auto">
              <code>{`# Clone the repository
git clone https://github.com/IshaanSaxena2005/DevProof.git
cd DevProof

# Install dependencies
cd Frontend && npm install
cd ../Backend && npm install

# Set up environment variables
# Copy .env.example to .env in Backend/ and configure:
# DATABASE_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET, etc.

# Run database migrations
cd Backend
npx prisma migrate dev

# Start the backend
npm run dev

# In another terminal, start the frontend
cd Frontend
npm run dev`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Testing</h3>
            <pre className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white/80 overflow-x-auto">
              <code>{`# Frontend tests
cd Frontend
npm test

# Backend tests
cd Backend
npm test

# E2E tests
cd Frontend
npx playwright test`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">API Endpoints</h2>
        <p className="text-white/70 mb-4">
          The backend exposes REST API endpoints for:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Authentication (GitHub OAuth, session management)</li>
          <li>Repository management (sync, analyze, disconnect)</li>
          <li>Repository analysis (score, findings, history)</li>
          <li>Skills and evidence</li>
          <li>Learning records (courses, certifications, hackathons)</li>
          <li>Coding platform integration (LeetCode, GeeksforGeeks)</li>
          <li>Growth and career readiness</li>
          <li>AI insights (optional)</li>
        </ul>
        <p className="text-white/70">
          API documentation is available in the backend route definitions (Backend/src/routes/).
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Environment Variables</h2>
        <p className="text-white/70 mb-4">
          Required environment variables for the backend:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li><code>DATABASE_URL</code> - PostgreSQL connection string</li>
          <li><code>GITHUB_CLIENT_ID</code> - GitHub OAuth app client ID</li>
          <li><code>GITHUB_CLIENT_SECRET</code> - GitHub OAuth app client secret</li>
          <li><code>SESSION_SECRET</code> - Secret for session encryption</li>
          <li><code>FRONTEND_URL</code> - Frontend URL for OAuth callbacks</li>
          <li><code>GROQ_API_KEY</code> - (Optional) Groq API key for AI insights</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Troubleshooting</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">GitHub OAuth Fails</h3>
            <p className="text-white/70">
              Ensure your GitHub OAuth app is configured with the correct callback URL (e.g.,
              https://your-frontend-url/auth/github/callback). Check that the client ID and secret are correct in your
              environment variables.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Repository Analysis Fails</h3>
            <p className="text-white/70">
              Ensure the repository is public and accessible. Check backend logs for specific errors. Common issues include
              rate limiting from GitHub API or malformed repository structure.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Coding Platform Sync Fails</h3>
            <p className="text-white/70">
              Ensure the username is correct and the profile is public. Some platforms rate-limit API access; try again
              later if sync fails.
            </p>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
