import { describe, it } from "node:test";
import assert from "node:assert";
import { sampleData, sampleSubmissionCalendar } from "../src/demo/sampleData.mts";

describe("Demo Data Isolation", () => {
  it("demo URLs should use reserved documentation domain", () => {
    // All URLs should use example.com (RFC 2606 reserved for documentation)
    const reservedDomain = "example.com";

    for (const repo of sampleData.repositoriesResponse.repositories) {
      assert.ok(repo.url.includes(reservedDomain), `Repository URL should use reserved domain: ${repo.url}`);
    }

    const codingProfile = sampleData.codingProfilesResponse.profiles[0];
    assert.ok(codingProfile.profileUrl.includes(reservedDomain), `Coding profile URL should use reserved domain`);

    for (const cert of sampleData.certificationsResponse.certifications) {
      assert.ok(!cert.credentialUrl, "Certifications should not have verification URLs (no real credentials)");
    }

    for (const hackathon of sampleData.hackathonsResponse.hackathons) {
      assert.ok(hackathon.projectUrl.includes(reservedDomain), `Hackathon project URL should use reserved domain`);
    }
  });

  it("demo identifiers should be obviously fictional", () => {
    // IDs should have demo prefix to distinguish from real data
    for (const repo of sampleData.repositoriesResponse.repositories) {
      assert.ok(repo.id.startsWith("demo-repo-"), `Repository ID should have demo prefix: ${repo.id}`);
    }

    for (const skill of sampleData.skillsResponse.skills) {
      assert.ok(skill.id.startsWith("demo-skill-"), `Skill ID should have demo prefix: ${skill.id}`);
    }

    for (const cert of sampleData.certificationsResponse.certifications) {
      assert.ok(cert.id.startsWith("demo-certification-"), `Certification ID should have demo prefix: ${cert.id}`);
    }

    for (const hackathon of sampleData.hackathonsResponse.hackathons) {
      assert.ok(hackathon.id.startsWith("demo-hackathon-"), `Hackathon ID should have demo prefix: ${hackathon.id}`);
    }
  });

  it("demo GitHub handle should be obviously fake", () => {
    const handle = sampleData.identity.githubUsername;
    assert.ok(handle.includes("demo"), `GitHub handle should indicate demo: ${handle}`);
  });

  it("demo email should use reserved domain", () => {
    const email = sampleData.identity.email;
    assert.ok(email.includes("example.com"), `Email should use reserved domain: ${email}`);
  });

  it("demo phone number should use fictional range", () => {
    // The demo uses 555-01xx range reserved for fictional use
    const resume = sampleData.resume;
    if (resume.contact?.phone) {
      assert.ok(resume.contact.phone.startsWith("+1 555 010"), `Phone should use fictional range: ${resume.contact.phone}`);
    }
  });

  it("demo activity calendar should be deterministic (no randomness)", () => {
    // The calendar is built from fixed arrays, not Math.random()
    const anchor = new Date("2024-01-01T00:00:00.000Z");
    const calendar1 = sampleSubmissionCalendar(anchor);
    const calendar2 = sampleSubmissionCalendar(anchor);

    // Same anchor should produce identical results
    assert.deepStrictEqual(calendar1, calendar2, "Same anchor should produce identical calendar");
  });
});
