import { describe, it } from "node:test";
import assert from "node:assert";
import { sampleData } from "../src/demo/sampleData.mts";

describe("Demo Data Determinism", () => {
  it("repository metrics should not be perfect 100s", () => {
    const repos = sampleData.repositoriesResponse().repositories;
    for (const repo of repos) {
      const latest = repo.analyses?.[0];
      if (latest) {
        assert.notStrictEqual(latest.overallScore, 100, `Repository ${repo.name} should not have perfect score`);
        for (const metric of latest.metrics ?? []) {
          assert.notStrictEqual(metric.score, 100, `Metric ${metric.category} in ${repo.name} should not be perfect`);
        }
      }
    }
  });

  it("skill confidence should respect realistic ceilings", () => {
    const skills = sampleData.skillsResponse().skills;
    for (const skill of skills) {
      assert.ok(skill.confidence <= 88, `Skill ${skill.name} confidence ${skill.confidence} exceeds ceiling`);
    }
  });

  it("problem-solving totals should match across breakdowns", () => {
    const ps = sampleData.codingProfilesResponse().profiles;
    const leetcode = ps.find((p) => p.platform === "leetcode");
    assert.ok(leetcode, "LeetCode profile should exist");

    const byDifficulty = leetcode?.rawStats?.difficultySolved;
    const byTopic = leetcode?.rawStats?.topicSolved;
    const byLanguage = leetcode?.rawStats?.languageSolved;

    if (byDifficulty && byTopic && byLanguage) {
      const difficultyTotal = byDifficulty.easy + byDifficulty.medium + byDifficulty.hard;
      const topicTotal = byTopic.reduce((sum, t) => sum + t.solved, 0);
      const languageTotal = byLanguage.reduce((sum, l) => sum + l.solved, 0);

      assert.strictEqual(difficultyTotal, topicTotal, "Difficulty and topic totals must match");
      assert.strictEqual(difficultyTotal, languageTotal, "Difficulty and language totals must match");
    }
  });

  it("cross-page repository count should be consistent", () => {
    const repos = sampleData.repositoriesResponse().repositories;
    const d360 = sampleData.developer360Response();
    const overview = sampleData.overviewResponse();

    assert.strictEqual(repos.length, d360.repositoriesCount, "Repositories count in D360 must match repository list");
    assert.strictEqual(repos.length, overview.repositoryCount, "Repositories count in Overview must match repository list");
  });

  it("languages in repository list must match repository details", () => {
    const repos = sampleData.repositoriesResponse().repositories;
    for (const repo of repos) {
      const detail = sampleData.repositoryResponse(repo.id);
      assert.strictEqual(detail.repository.language, repo.language, `Language mismatch for ${repo.name}`);
    }
  });

  it("growth history should reference existing repositories", () => {
    const growth = sampleData.growthHistoryResponse();
    const repos = sampleData.repositoriesResponse().repositories;
    const repoNames = new Set(repos.map((r) => r.name));

    for (const entry of growth.history ?? []) {
      assert.ok(repoNames.has(entry.repository), `Growth entry references unknown repository: ${entry.repository}`);
    }
  });

  it("career readiness scores should be based on actual requirements", () => {
    const readiness = sampleData.careerReadinessResponse();
    for (const role of readiness.roles ?? []) {
      assert.ok(role.score >= 0 && role.score <= 100, `Role score ${role.score} must be 0-100`);
      assert.ok(role.requirementsMet <= role.requirementsTotal, "Met requirements cannot exceed total");
    }
  });

  it("AI insights should match aggregated metrics", () => {
    const insights = sampleData.aiInsightsResponse();
    const repos = sampleData.repositoriesResponse().repositories;

    if (insights.hasEvidence && insights.insights) {
      const summary = insights.insights.summary;
      const analyzed = repos.filter((r) => r.analyses?.some((a) => a.status === "COMPLETED"));
      assert.ok(summary.includes(analyzed.length.toString()), "Insights summary should reference analyzed count");
    }
  });
});
