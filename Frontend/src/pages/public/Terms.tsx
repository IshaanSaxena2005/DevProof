import PublicPageLayout from "../../layouts/PublicPageLayout";

export default function Terms() {
  return (
    <PublicPageLayout
      title="Terms of Service"
      description="Terms and conditions for using DevProof."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
        <p className="text-white/70 mb-4">
          These Terms of Service govern your use of DevProof. By accessing or using DevProof, you agree to be bound by
          these terms.
        </p>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> This is a draft and requires legal review by the project owner.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
        <p className="text-white/70">
          By creating an account or using DevProof, you acknowledge that you have read, understood, and agree to be
          bound by these Terms of Service and the Privacy Policy. If you do not agree to these terms, you may not use
          DevProof.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Account Responsibilities</h2>
        <p className="text-white/70 mb-4">
          When you create an account, you agree to:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Provide accurate and complete information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify DevProof immediately of unauthorized access</li>
          <li>Be responsible for all activity under your account</li>
          <li>Comply with these terms and all applicable laws</li>
        </ul>
        <p className="text-white/70">
          DevProof reserves the right to suspend or terminate accounts that violate these terms.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Appropriate Use</h2>
        <p className="text-white/70 mb-4">
          You agree to use DevProof only for lawful purposes and in accordance with these terms. You may not:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Use DevProof to violate any applicable law or regulation</li>
          <li>Access or use another user's account without authorization</li>
          <li>Attempt to circumvent security measures or reverse-engineer the platform</li>
          <li>Use automated tools to scrape or harvest data from DevProof</li>
          <li>Interfere with or disrupt the operation of DevProof</li>
          <li>Use DevProof to harass, abuse, or harm others</li>
          <li>Submit false or misleading information (e.g., fake learning records)</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Third-Party Integrations</h2>
        <p className="text-white/70 mb-4">
          DevProof integrates with third-party services (GitHub, LeetCode, GeeksforGeeks, Groq AI). By using these
          integrations, you agree to the respective terms of service of those services:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>
            <strong>GitHub:</strong> See{" "}
            <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              GitHub Terms of Service
            </a>.
          </li>
          <li>
            <strong>LeetCode:</strong> See LeetCode's terms of service.
          </li>
          <li>
            <strong>GeeksforGeeks:</strong> See GeeksforGeeks's terms of service.
          </li>
          <li>
            <strong>Groq AI:</strong> See{" "}
            <a href="https://groq.com/terms-of-service/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Groq Terms of Service
            </a>.
          </li>
        </ul>
        <p className="text-white/70">
          DevProof is not responsible for the terms, policies, or practices of third-party services.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">AI Limitations</h2>
        <p className="text-white/70 mb-4">
          DevProof may use AI services (e.g., Groq AI) to generate insights. You acknowledge that:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>AI-generated insights may be inaccurate or incomplete</li>
          <li>AI insights are not professional advice and should not be relied upon for critical decisions</li>
          <li>DevProof is not responsible for errors or omissions in AI-generated content</li>
          <li>AI insights are provided "as is" without warranties of any kind</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
        <p className="text-white/70 mb-4">
          DevProof owns all intellectual property in the platform, including:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Source code, design, and branding</li>
          <li>Analysis algorithms and scoring methods</li>
          <li>Documentation and content</li>
        </ul>
        <p className="text-white/70 mb-4">
          You retain ownership of:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Your GitHub repositories and code</li>
          <li>Your learning records and profile data</li>
        </ul>
        <p className="text-white/70">
          By using DevProof, you grant DevProof a license to access, analyze, and display your data for the purposes
          described in the Privacy Policy.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Availability and Modifications</h2>
        <p className="text-white/70 mb-4">
          DevProof is provided "as is" and may be unavailable or interrupted at any time. DevProof reserves the right
          to:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Modify, suspend, or discontinue the platform at any time</li>
          <li>Change features, pricing, or policies with or without notice</li>
          <li>Limit access to certain features or users</li>
        </ul>
        <p className="text-white/70">
          DevProof is not liable for any loss or damage resulting from unavailability or changes to the platform.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
        <p className="text-white/70 mb-4">
          To the maximum extent permitted by law, DevProof shall not be liable for:
        </p>
        <ul className="list-disc list-inside text-white/70 space-y-2 mb-6">
          <li>Any indirect, incidental, special, or consequential damages</li>
          <li>Loss of data, revenue, or business opportunities</li>
          <li>Decisions made based on analysis scores, insights, or recommendations</li>
          <li>Employment outcomes or job placements</li>
        </ul>
        <p className="text-white/70">
          DevProof's total liability shall not exceed the amount you paid (if any) to use the platform.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">No Warranties</h2>
        <p className="text-white/70">
          DevProof is provided "as is" without warranties of any kind, express or implied, including but not limited to
          warranties of accuracy, reliability, fitness for a particular purpose, or non-infringement. DevProof does not
          guarantee that analysis scores, insights, or recommendations are accurate or appropriate for your situation.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Indemnification</h2>
        <p className="text-white/70">
          You agree to indemnify and hold DevProof harmless from any claims, damages, or expenses arising from your
          use of the platform or violation of these terms.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Governing Law</h2>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Specify the governing law and jurisdiction for disputes (e.g., "These
          terms are governed by the laws of [Jurisdiction]").
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
        <p className="text-white/70">
          DevProof may update these terms at any time. Continued use of the platform after changes constitutes acceptance
          of the updated terms.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
        <p className="text-white/70 mb-4">
          For questions about these Terms of Service, contact:
        </p>
        <p className="text-white/70">
          <strong>Owner Review Required:</strong> Add contact email or form for legal inquiries.
        </p>
      </section>
    </PublicPageLayout>
  );
}
