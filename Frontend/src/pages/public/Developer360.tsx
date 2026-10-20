import PublicPageLayout from "../../layouts/PublicPageLayout";

export default function Developer360() {
  return (
    <PublicPageLayout
      title="Developer 360"
      description="Evidence-backed developer profiles built from repository analysis, coding-platform activity, and learning records."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
        <p className="text-white/70 mb-4">
          Developer 360 aggregates evidence from multiple data sources to build a comprehensive developer profile.
          Unlike self-reported skills or resume claims, every skill in Developer 360 is backed by verifiable evidence
          from connected data sources.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Evidence Sources</h2>
        <p className="text-white/70 mb-4">
          Developer 360 combines evidence from:
        </p>

        <div className="space-y-6 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Repository Analysis</h3>
            <p className="text-white/70">
              Skills are inferred from repository languages, topics, README content, and analysis findings. For example,
              working with React in multiple repositories with CI/CD configured contributes to evidence for "React"
              and "CI/CD" skills.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Coding Platforms</h3>
            <p className="text-white/70">
              LeetCode and GeeksforGeeks integration provides evidence of problem-solving skills, algorithm knowledge,
              and consistency across different platforms. Problem-solving activity contributes to skills in algorithms,
              data structures, and specific problem categories.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Learning Records</h3>
            <p className="text-white/70">
              Courses, certifications, and hackathons provide evidence of learning and practical application. Each
              record includes learned skills, and verification URLs are used where available to validate credentials.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Skill Categories</h2>
        <p className="text-white/70 mb-4">
          Skills are organized into categories for better navigation and understanding:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>Frontend:</strong> User interface development (React, Vue, CSS, frameworks)
          </li>
          <li>
            <strong>Backend:</strong> Server-side development (Node.js, Python, APIs, databases)
          </li>
          <li>
            <strong>DevOps:</strong> Infrastructure and deployment (CI/CD, Docker, cloud platforms)
          </li>
          <li>
            <strong>Testing:</strong> Quality assurance (unit tests, integration tests, testing frameworks)
          </li>
          <li>
            <strong>Security:</strong> Application security practices (authentication, encryption, vulnerability management)
          </li>
          <li>
            <strong>Database:</strong> Data persistence (SQL, NoSQL, ORMs, optimization)
          </li>
          <li>
            <strong>Mobile:</strong> Mobile development (React Native, Flutter, native platforms)
          </li>
          <li>
            <strong>System Design:</strong> Architecture and scalability (distributed systems, microservices)
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Evidence Levels</h2>
        <p className="text-white/70 mb-4">
          Each skill has an evidence level indicating the strength of supporting evidence:
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Practically Evidenced</h3>
            <p className="text-white/70">
              Multiple repositories or records provide strong evidence of the skill. This is the highest evidence level.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Claimed</h3>
            <p className="text-white/70">
              The skill is inferred from context (e.g., a course includes the skill in its curriculum) but not directly
              demonstrated in repositories or coding-platform activity.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">No Evidence</h3>
            <p className="text-white/70">
              No supporting evidence is found in connected data sources. These skills are not displayed in the profile.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Confidence Scores</h2>
        <p className="text-white/70 mb-4">
          Each skill has a confidence score (0-100) based on the quantity and quality of evidence:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>More evidence sources contribute to higher confidence</li>
          <li>Recent evidence (e.g., recent commits, recent problem solves) is weighted more heavily</li>
          <li>Direct evidence (e.g., code usage) is weighted more heavily than indirect evidence (e.g., course curriculum)</li>
          <li>Consistency across repositories and platforms increases confidence</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">What Developer 360 Does Not Do</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Developer 360 does not allow self-reported skills without evidence</li>
          <li>Developer 360 does not claim to evaluate general "engineering ability" beyond what the evidence shows</li>
          <li>Developer 360 does not replace technical interviews or live coding assessments</li>
          <li>Developer 360 does not infer skills from resume text or job titles</li>
          <li>Developer 360 does not claim that absence of evidence equals inability</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Improving Your Profile</h2>
        <p className="text-white/70 mb-4">
          To improve your Developer 360 profile:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2">
          <li>Connect more repositories with active development</li>
          <li>Add README files and documentation to your projects</li>
          <li>Set up CI/CD pipelines for your projects</li>
          <li>Write tests for your code</li>
          <li>Connect coding platforms and maintain problem-solving activity</li>
          <li>Add verified learning records with credential URLs</li>
          <li>Contribute to diverse projects to demonstrate breadth of skills</li>
        </ul>
      </section>
    </PublicPageLayout>
  );
}
