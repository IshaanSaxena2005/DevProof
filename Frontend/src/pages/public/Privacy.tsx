import PublicPageLayout from "../../layouts/PublicPageLayout";

export default function Privacy() {
  return (
    <PublicPageLayout
      title="Privacy Policy"
      description="How DevProof collects, uses, and protects your data."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
        <p className="text-white/70 mb-4">
          This Privacy Policy describes how DevProof collects, uses, and protects your data. By using DevProof, you
          agree to the practices described in this policy.
        </p>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> This policy is a draft and requires review by the project owner to
          ensure compliance with applicable laws and regulations.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Data We Collect</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">GitHub Data</h3>
            <p className="text-white/70 mb-4">
              When you connect your GitHub account, DevProof collects:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Public repository metadata (name, description, languages, topics, stars, forks)</li>
              <li>Public repository content (README files, source code, configuration files)</li>
              <li>GitHub username and public profile information</li>
              <li>Commit history and contribution activity</li>
            </ul>
            <p className="text-white/70 mt-4">
              DevProof does not access private repositories without explicit authorization.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Coding Platform Data</h3>
            <p className="text-white/70 mb-4">
              When you connect LeetCode or GeeksforGeeks, DevProof collects:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Public problem-solving statistics (total solved, difficulty breakdown, recent activity)</li>
              <li>Username and public profile information</li>
            </ul>
            <p className="text-white/70 mt-4">
              DevProof does not access private problem history or solutions.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">User-Provided Data</h3>
            <p className="text-white/70 mb-4">
              When you add learning records, DevProof collects:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Course, certification, and hackathon details (name, platform, completion date)</li>
              <li>Learned skills (text descriptions)</li>
              <li>Credential URLs (optional, for verification)</li>
              <li>Resume contact information (if provided)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Authentication Data</h3>
            <p className="text-white/70 mb-4">
              DevProof uses GitHub OAuth for authentication and collects:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>GitHub user ID and access token</li>
              <li>Session cookies for maintaining login state</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Data</h2>
        <p className="text-white/70 mb-4">
          DevProof uses your data for the following purposes:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Analyzing repositories to generate quality scores and findings</li>
          <li>Building evidence-backed developer profiles and skills</li>
          <li>Displaying growth analytics and career readiness assessments</li>
          <li>Authenticating users and maintaining sessions</li>
          <li>Improving the platform and analysis algorithms</li>
        </ul>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Confirm whether data is used for any other purposes (e.g., analytics,
          marketing, research).
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Data Storage</h2>
        <p className="text-white/70 mb-4">
          Data is stored as follows:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Repository analysis results are stored in a PostgreSQL database</li>
          <li>GitHub access tokens are stored securely (verify encryption method with owner)</li>
          <li>Session cookies are stored in browser with HttpOnly and Secure flags</li>
          <li>Learning records and user profile data are stored in the database</li>
        </ul>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Confirm retention policies, backup practices, and data deletion
          procedures.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Data Sharing</h2>
        <p className="text-white/70 mb-4">
          DevProof does not sell or rent your data to third parties. Data may be shared with:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>GitHub API (to fetch repository data per your authorization)</li>
          <li>LeetCode and GeeksforGeeks APIs (to fetch problem-solving data per your authorization)</li>
          <li>Groq AI (optional, if AI insights are enabled; confirm data usage with owner)</li>
        </ul>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Confirm whether any third-party services (e.g., analytics, hosting)
          have access to user data.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">AI Processing</h2>
        <p className="text-white/70 mb-4">
          If AI insights are enabled, DevProof may send anonymized data to Groq AI for generating insights. Data sent
          includes:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Aggregated repository analysis scores</li>
          <li>Anonymous summary of skills and activity</li>
        </ul>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Confirm what data is sent to AI services, whether it is used for
          training, and review Groq's privacy policy.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
        <p className="text-white/70 mb-4">
          You have the following rights regarding your data:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>Access:</strong> You can view all data associated with your account in the dashboard.
          </li>
          <li>
            <strong>Delete:</strong> You can disconnect repositories and delete learning records from the dashboard.
          </li>
          <li>
            <strong>Export:</strong> (Pending) Ability to export your data (confirm with owner).
          </li>
          <li>
            <strong>Account Deletion:</strong> (Pending) Ability to delete your account and all associated data
            (confirm with owner).
          </li>
        </ul>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Confirm the process for account deletion and data export.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Security</h2>
        <p className="text-white/70 mb-4">
          DevProof implements the following security measures:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>GitHub OAuth for secure authentication</li>
          <li>HTTPS for all data transmission</li>
          <li>Environment variables for sensitive configuration</li>
          <li>HttpOnly and Secure cookies for sessions</li>
          <li>Input validation and sanitization</li>
        </ul>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Confirm additional security measures (e.g., encryption at rest,
          logging, monitoring).
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
        <p className="text-white/70 mb-4">
          DevProof integrates with the following third-party services:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>GitHub:</strong> OAuth authentication and repository data. See{" "}
            <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              GitHub Privacy Policy
            </a>.
          </li>
          <li>
            <strong>LeetCode:</strong> Problem-solving data. See LeetCode's privacy policy.
          </li>
          <li>
            <strong>GeeksforGeeks:</strong> Problem-solving data. See GeeksforGeeks's privacy policy.
          </li>
          <li>
            <strong>Groq AI:</strong> Optional AI insights. See{" "}
            <a href="https://groq.com/privacy-policy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Groq Privacy Policy
            </a>.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
        <p className="text-white/70 mb-4">
          For questions about this Privacy Policy or your data, contact:
        </p>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Add contact email or form for privacy inquiries.
        </p>
      </section>
    </PublicPageLayout>
  );
}
