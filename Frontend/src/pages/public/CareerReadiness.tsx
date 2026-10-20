import PublicPageLayout from "../../layouts/PublicPageLayout";

export default function CareerReadiness() {
  return (
    <PublicPageLayout
      title="Career Readiness"
      description="Evidence-based assessment of readiness for different career paths based on actual skills, repositories, and problem-solving activity."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
        <p className="text-white/70 mb-4">
          Career Readiness evaluates your readiness for specific career paths by matching your actual evidence
          (skills, repositories, problem-solving activity) against role-specific requirements. Unlike subjective
          assessments, Career Readiness is based on verifiable data from your connected sources.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-white/70 mb-4">
          For each target role, Career Readiness evaluates a set of requirements:
        </p>

        <div className="space-y-6 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Skills in Category</h3>
            <p className="text-white/70">
              Checks whether you have evidence-backed skills in specific categories required for the role (e.g.,
              Frontend, Backend, DevOps). For example, a Frontend Developer role may require evidence in Frontend,
              Testing, and CSS skills.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Named Skills</h3>
            <p className="text-white/70">
              Checks for specific named skills required for the role (e.g., React, Node.js, Python). These are
              individual technologies or frameworks that are commonly associated with the role.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Analysis Metrics</h3>
            <p className="text-white/70">
              Evaluates your repository analysis scores in specific categories (e.g., documentation, testing,
              security). For example, a Senior Engineer role may require higher testing and security scores than a
              Junior role.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Analyzed Repositories</h3>
            <p className="text-white/70">
              Checks whether you have a minimum number of analyzed repositories. More repositories demonstrate
              breadth of experience and consistent practice.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Problem Solving</h3>
            <p className="text-white/70">
              Checks whether you have solved a minimum number of problems on coding platforms. Problem-solving activity
              demonstrates algorithmic thinking and consistency.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Readiness Score</h2>
        <p className="text-white/70 mb-4">
          Each role has a readiness score (0-100) based on the percentage of requirements met:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>The score is calculated as (requirements met / total requirements) × 100</li>
          <li>Each requirement is weighted equally; there is no prioritization</li>
          <li>The score reflects evidence presence, not subjective assessment of ability</li>
          <li>A high score indicates that most requirements have evidence; it does not guarantee readiness</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Target Roles</h2>
        <p className="text-white/70 mb-4">
          Career Readiness includes the following target roles (this list may expand):
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>Frontend Developer:</strong> Focus on UI development, React/Vue, CSS, testing, and responsive
            design.
          </li>
          <li>
            <strong>Backend Developer:</strong> Focus on server-side development, APIs, databases, and security.
          </li>
          <li>
            <strong>Full-Stack Developer:</strong> Combination of frontend and backend requirements.
          </li>
          <li>
            <strong>DevOps Engineer:</strong> Focus on CI/CD, containerization, cloud platforms, and infrastructure.
          </li>
          <li>
            <strong>Senior Engineer:</strong> Higher thresholds for testing, security, documentation, and overall
            engineering practices.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">What Career Readiness Does Not Do</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Career Readiness does not guarantee job placement or interviews</li>
          <li>Career Readiness does not evaluate soft skills, communication, or teamwork</li>
          <li>Career Readiness does not account for industry experience or domain knowledge</li>
          <li>Career Readiness does not replace comprehensive candidate evaluation by employers</li>
          <li>Career Readiness does not claim that high scores correlate with job performance</li>
          <li>Career Readiness does not provide hiring predictions or salary estimates</li>
          <li>Career Readiness does not claim that meeting requirements means you are "ready" for the role</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Limitations</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Requirements are predefined and may not match every company's expectations</li>
          <li>Analysis metrics are based on static signals and may not reflect all aspects of code quality</li>
          <li>Problem-solving thresholds are arbitrary and do not account for problem difficulty</li>
          <li>Repository count thresholds do not account for repository complexity or contribution depth</li>
          <li>Readiness is a heuristic, not a comprehensive assessment of employability</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Improving Readiness Scores</h2>
        <p className="text-white/70 mb-4">
          To improve your readiness scores for target roles:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2">
          <li>Connect more repositories to meet repository count requirements</li>
          <li>Improve repository analysis scores by adding tests, documentation, and CI/CD</li>
          <li>Work on projects that demonstrate skills in required categories</li>
          <li>Maintain consistent problem-solving activity on coding platforms</li>
          <li>Add learning records that cover required skills</li>
          <li>Focus on roles that align with your actual experience and interests</li>
        </ul>
      </section>
    </PublicPageLayout>
  );
}
