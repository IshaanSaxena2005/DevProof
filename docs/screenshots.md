# Product Screenshot Checklist

The README's [Product Screenshots](../README.md#product-screenshots) section embeds these images once they exist. The `screenshots/` directory does not currently contain any images — this file is the single source of truth for the planned capture set.

## Capture Guidelines

- **Viewport:** Chromium window at **1440 × 900** (desktop) and **390px** (mobile for screenshot 15)
- **Theme:** Dark theme
- **Data:** At least one connected data source where the shot is about data
- **Format:** PNG, saved under `screenshots/` using exactly the filenames below
- **Naming:** Follow the convention `screenshots/XX-description.png` where XX is two-digit sequence

## Planned Screenshots

| # | Filename | Description | What Must Be Visible |
|---|----------|-------------|---------------------|
| 1 | `screenshots/01-landing-page.png` | Landing page hero | Spline WebGL background, navigation, primary CTA button |
| 2 | `screenshots/02-login-register.png` | Authentication | Login form with "Create one" option to register |
| 3 | `screenshots/03-demo-overview.png` | Demo mode overview | `/demo/overview` with sample-data badge and demo notice |
| 4 | `screenshots/04-dashboard-overview.png` | Dashboard overview | Signed-in Overview with live repository data |
| 5 | `screenshots/05-repositories.png` | Repository list | Connected repositories with sync controls |
| 6 | `screenshots/06-repository-analysis.png` | Repository analysis | Repository detail: six metric categories + severity-ranked findings |
| 7 | `screenshots/07-developer-360.png` | Developer 360 | Aggregated view of repositories, skills, credentials |
| 8 | `screenshots/08-skills-intelligence.png` | Skills intelligence | Skills with evidence ladder (claimed / learned / proven) |
| 9 | `screenshots/09-problem-solving.png` | Problem-solving analytics | Activity heatmap, difficulty donut, platform cards |
| 10 | `screenshots/10-learning-achievements.png` | Learning & achievements | Certifications, hackathons, resume panel |
| 11 | `screenshots/11-growth-analytics.png` | Growth analytics | Growth history charts over time |
| 12 | `screenshots/12-career-readiness.png` | Career readiness | Readiness score with per-requirement evidence |
| 13 | `screenshots/13-ai-insights.png` | AI insights | Groq-backed insights (or honest empty state) |
| 14 | `screenshots/14-settings.png` | Settings | Account management and connected-platform controls |
| 15 | `screenshots/15-mobile-responsive.png` | Mobile responsive | Dashboard at 390px viewport, no horizontal overflow |

## Integration with README

The README's Product Screenshots section is prepared with commented-out subsections for each planned screenshot. When you add screenshots:

1. Place the PNG file in the `screenshots/` directory using the exact filename from the checklist
2. Uncomment the corresponding subsection in README.md (remove the `<!--` and `-->` markers)
3. Verify the image displays correctly

**Important:** Do not uncomment a screenshot subsection until the actual image file exists in the repository. The documentation validator checks that every non-commented image reference points to an existing file.

## Status

- **Total planned:** 15 screenshots
- **Captured:** 0
- **README status:** Subsections prepared with commented-out image references; ready to uncomment when files are added
