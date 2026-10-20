import PublicPageLayout from "../../layouts/PublicPageLayout";

export default function RepositoryIntelligence() {
  return (
    <PublicPageLayout
      title="Repository Intelligence"
      description="Automated analysis of GitHub repositories to evaluate code quality, documentation, testing, security, and engineering practices."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
        <p className="text-white/70 mb-4">
          Repository Intelligence analyzes connected GitHub repositories to extract engineering signals and
          generate evidence-backed quality scores. Each repository is evaluated across multiple categories,
          providing a comprehensive view of engineering practices without manual code review.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Connecting Repositories</h2>
        <p className="text-white/70 mb-4">
          DevProof connects to your GitHub account through OAuth and reads your public repositories. Connection
          requires:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>A GitHub account with public repositories</li>
          <li>Authorization for DevProof to read repository metadata and content</li>
          <li>DevProof does not modify repositories; it only reads data for analysis</li>
        </ul>
        <p className="text-white/70">
          Once connected, repositories can be synced individually or in bulk. Analysis runs automatically for each
          synced repository.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Analysis Categories</h2>
        <p className="text-white/70 mb-4">
          Each repository is analyzed across the following categories:
        </p>

        <div className="space-y-6 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Documentation</h3>
            <p className="text-white/70">
              Evaluates the presence and quality of project documentation. Signals include README files, license files,
              inline code comments, and structured documentation patterns. Good documentation improves maintainability
              and onboarding for new contributors.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Testing</h3>
            <p className="text-white/70">
              Measures test coverage and testing practices. Signals include test file presence, test file count,
              test directory structure, and common testing frameworks. Automated testing is a key indicator of code
              quality and reliability.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Security</h3>
            <p className="text-white/70">
              Identifies potential security issues. Signals include secret-detection warnings (e.g., exposed API keys,
              tokens), dependencies with known vulnerabilities, and security configuration files. Security awareness
              is critical for production applications.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Code Quality</h3>
            <p className="text-white/70">
              Assesses code maintainability and engineering practices. Signals include code complexity indicators,
              TODO comment density, consistent formatting, and adherence to common conventions. Clean code is easier
              to maintain and debug.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Maintainability</h3>
            <p className="text-white/70">
              Evaluates long-term maintainability factors. Signals include CI/CD pipeline presence, dependency
              management (lockfiles), and release automation. Projects with good maintainability are easier to update
              and scale over time.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Dependency Health</h3>
            <p className="text-white/70">
              Assesses dependency management practices. Signals include lockfile presence, package manager usage,
              and dependency age. Well-managed dependencies reduce security risks and improve stability.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Analysis Results</h2>
        <p className="text-white/70 mb-4">
          For each repository, DevProof provides:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>Overall Score:</strong> A composite score (0-100) summarizing engineering quality across all
            categories.
          </li>
          <li>
            <strong>Category Scores:</strong> Individual scores for each analysis category (documentation, testing,
            security, etc.).
          </li>
          <li>
            <strong>Findings:</strong> Specific observations and recommendations for improvement (e.g., "No README
            found," "No test files detected," "Potential secret exposure").
          </li>
          <li>
            <strong>Historical Trend:</strong> Analysis history over time, showing improvement or regression in
            engineering practices.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Current Limitations</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Analysis is automated and cannot replace manual code review by experienced engineers.</li>
          <li>Static analysis has limitations and may miss context-specific issues.</li>
          <li>Analysis focuses on public repositories; private repositories are not analyzed.</li>
          <li>Security scanning is basic and does not replace dedicated security tools.</li>
          <li>Analysis results are based on visible signals and may not reflect all aspects of code quality.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Privacy and Data Usage</h2>
        <p className="text-white/70 mb-4">
          Repository data is used only for analysis and to generate your developer profile. DevProof does not:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2">
          <li>Share your repository code with third parties</li>
          <li>Use your code for training AI models without explicit consent</li>
          <li>Modify or delete your repositories</li>
          <li>Access private repositories without explicit authorization</li>
        </ul>
      </section>
    </PublicPageLayout>
  );
}
