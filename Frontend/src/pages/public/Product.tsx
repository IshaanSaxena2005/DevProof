import { Link } from "react-router-dom";
import PublicPageLayout from "../../layouts/PublicPageLayout";

export default function Product() {
  return (
    <PublicPageLayout
      title="Product"
      description="DevProof transforms resume claims into verifiable engineering evidence through automated analysis of GitHub repositories, coding platforms, and learning records."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">What DevProof Does</h2>
        <p className="text-white/70 mb-4">
          DevProof is a developer intelligence platform that validates engineering skills through automated analysis
          of verifiable data sources. Instead of accepting resume claims at face value, it extracts evidence from:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>GitHub repositories (code, commits, issues, PRs, CI/CD)</li>
          <li>Coding platforms (LeetCode, GeeksforGeeks)</li>
          <li>Learning records (courses, certifications, hackathons)</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Evidence-Based Developer Profiles</h2>
        <p className="text-white/70 mb-4">
          DevProof aggregates signals from connected data sources to build a comprehensive developer profile:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>Repository Intelligence:</strong> Automated analysis of code quality, documentation, testing,
            security, and engineering practices across connected repositories.
          </li>
          <li>
            <strong>Developer 360:</strong> Evidence-backed skills derived from actual code, learning records, and
            platform activity—organized by category and confidence level.
          </li>
          <li>
            <strong>Problem Solving:</strong> Coding-platform integration tracking problem-solving patterns, difficulty
            distribution, and consistency across multiple platforms.
          </li>
          <li>
            <strong>Learning & Achievements:</strong> Centralized records for courses, certifications, hackathons, and
            projects with verification where available.
          </li>
          <li>
            <strong>Growth Analytics:</strong> Historical trends in repository analysis scores, skill development,
            and activity over time.
          </li>
          <li>
            <strong>Career Readiness:</strong> Role-specific requirements matched against a developer's actual
            evidence to assess readiness for different career paths.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
        <ol className="list-decimal list-inside text-white/70 space-y-3 mb-6">
          <li>
            <strong>Connect Your GitHub Account:</strong> Authorize DevProof to access your public repositories through
            OAuth. DevProof reads repository data; it does not modify your repositories.
          </li>
          <li>
            <strong>Sync Coding Platforms:</strong> Optionally connect LeetCode or GeeksforGeeks to include
            problem-solving evidence in your profile.
          </li>
          <li>
            <strong>Automated Analysis:</strong> DevProof analyzes connected repositories for engineering signals
            (documentation, testing, security, CI/CD, code quality) and generates quality scores.
          </li>
          <li>
            <strong>Skills Extraction:</strong> Skills are inferred from repository languages, topics, README content,
            and analysis findings—not self-reported or guessed.
          </li>
          <li>
            <strong>Learning Records:</strong> Add courses, certifications, and hackathons manually. Provide verification
            URLs where available for credential validation.
          </li>
          <li>
            <strong>Comprehensive Profile:</strong> View your aggregated evidence across all sections, understand your
            strengths and gaps, and track growth over time.
          </li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">What DevProof Does Not Do</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>DevProof does not claim to evaluate general "employability" or guarantee job placement.</li>
          <li>DevProof does not fabricate evidence or validate claims without supporting data.</li>
          <li>DevProof does not access private repositories without explicit authorization.</li>
          <li>DevProof does not modify your GitHub repositories or create commits on your behalf.</li>
          <li>DevProof does not provide hiring predictions or salary estimates.</li>
          <li>DevProof does not claim to replace technical interviews or comprehensive candidate evaluation.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Demo Mode</h2>
        <p className="text-white/70 mb-4">
          DevProof offers a public demo mode that showcases the platform's capabilities using sample, illustrative
          data. The demo profile uses fictional metrics and is clearly labeled as "sample data—not real analytics."
          Nothing in the demo is fetched from real accounts, and no account or record is created, changed, or deleted.
        </p>
        <p className="text-white/70">
          <Link to="/demo" className="text-primary hover:underline">
            Try the demo →
          </Link>
        </p>
      </section>
    </PublicPageLayout>
  );
}
