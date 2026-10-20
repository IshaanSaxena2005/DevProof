import PublicPageLayout from "../../layouts/PublicPageLayout";

export default function Growth() {
  return (
    <PublicPageLayout
      title="Growth Analytics"
      description="Historical trends in repository analysis scores, skill development, and activity over time."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
        <p className="text-white/70 mb-4">
          Growth Analytics tracks your progress over time by visualizing historical trends in repository analysis
          scores, skill development, and activity. It helps you understand how your engineering practices and capabilities
          have evolved.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Growth Metrics</h2>
        <p className="text-white/70 mb-4">
          Growth Analytics displays the following metrics over time:
        </p>

        <div className="space-y-6 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Repository Score Trends</h3>
            <p className="text-white/70">
              Shows how individual repository analysis scores have changed over time. Each repository with multiple
              analyses displays a trend line showing improvement or regression in engineering quality.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Aggregate Score Average</h3>
            <p className="text-white/70">
              The average analysis score across all repositories, plotted over time. This provides a high-level view
              of overall engineering quality trends.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Skill Count</h3>
            <p className="text-white/70">
              The number of skills with evidence, tracked over time. This shows how your skill set has expanded as
              you work on new projects and learn new technologies.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Milestones</h3>
            <p className="text-white/70">
              Key events in your development journey, such as connecting your first repository, completing your first
              analysis, or achieving your best analysis score.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Repository Trends</h2>
        <p className="text-white/70 mb-4">
          For repositories with multiple analyses, Growth Analytics shows:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>First analysis score and date</li>
          <li>Latest analysis score and date</li>
          <li>Score change (improvement or regression)</li>
          <li>Number of analyses recorded</li>
        </ul>
        <p className="text-white/70">
          Repositories are ranked by score change, highlighting which projects have improved the most over time.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Historical Data Limitations</h2>
        <p className="text-white/70 mb-4">
          Growth Analytics has the following limitations:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>Analysis History:</strong> Growth is based on repository analyses performed by DevProof. Historical
            data before your first analysis is not available.
          </li>
          <li>
            <strong>Repository Age:</strong> Older repositories may have limited historical data if they were analyzed
            recently. The growth chart reflects when analyses were run, not when the repository was created.
          </li>
          <li>
            <strong>GitHub Activity:</strong> Growth does not include detailed GitHub activity graphs (commits, PRs,
            issues) beyond what is reflected in analysis scores.
          </li>
          <li>
            <strong>Coding Platform History:</strong> Historical problem-solving data from LeetCode and GeeksforGeeks
            is limited to what their APIs provide. Some platforms do not expose full historical submission calendars.
          </li>
          <li>
            <strong>Learning Records:</strong> Growth does not track when learning records were added, only when they
            were completed according to the provided dates.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">What Growth Analytics Does Not Do</h2>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Growth Analytics does not predict future performance or potential</li>
          <li>Growth Analytics does not compare your growth to other developers</li>
          <li>Growth Analytics does not claim that trend lines correlate with employability</li>
          <li>Growth Analytics does not fabricate historical data for periods before DevProof was used</li>
          <li>Growth Analytics does not account for context such as project complexity or team size</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Improving Growth Visibility</h2>
        <p className="text-white/70 mb-4">
          To make your growth more visible:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2">
          <li>Connect repositories early to establish a baseline</li>
          <li>Re-analyze repositories after significant improvements (e.g., adding tests, documentation)</li>
          <li>Maintain consistent problem-solving activity on coding platforms</li>
          <li>Add learning records with accurate completion dates</li>
          <li>Work on diverse projects to show growth across different areas</li>
        </ul>
      </section>
    </PublicPageLayout>
  );
}
