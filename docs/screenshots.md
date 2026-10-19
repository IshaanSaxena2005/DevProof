# Product screenshot checklist

The README's [Product Screenshots](../README.md#product-screenshots) section
embeds these images once they exist. None are on disk yet, so the README links
none of them — this file is the single source of truth for the planned set.

Capture against a running stack (see the README's Local Development section)
with a Chromium window at **1440 × 900**, dark theme, at least one connected
data source where the shot is about data. Save under `screenshots/` using
exactly these filenames:

| # | Filename | Must be visible in the shot |
|---|---|---|
| 1 | `screenshots/01-landing-page.png` | Hero with the Spline background, navigation, primary CTA |
| 2 | `screenshots/02-login-register.png` | Login form with the register form reachable via "Create one" |
| 3 | `screenshots/03-demo-overview.png` | `/demo/overview` with the sample-data badge and demo notice |
| 4 | `screenshots/04-dashboard-overview.png` | Signed-in Overview with live repository data |
| 5 | `screenshots/05-repositories.png` | Connected repositories list with sync controls |
| 6 | `screenshots/06-repository-analysis.png` | Repository detail: six metric categories + severity-ranked findings |
| 7 | `screenshots/07-developer-360.png` | Developer 360 aggregation of repositories, skills, credentials |
| 8 | `screenshots/08-skills-intelligence.png` | Skills with evidence ladder (claimed / learned / proven) |
| 9 | `screenshots/09-problem-solving.png` | Activity heatmap, difficulty donut, platform cards |
| 10 | `screenshots/10-learning-achievements.png` | Certifications, hackathons, resume panel |
| 11 | `screenshots/11-growth-analytics.png` | Growth history charts |
| 12 | `screenshots/12-career-readiness.png` | Readiness score with per-requirement evidence |
| 13 | `screenshots/13-ai-insights.png` | Groq-backed insights (or the honest empty state) |
| 14 | `screenshots/14-settings.png` | Account management and connected-platform controls |
| 15 | `screenshots/15-mobile-responsive.png` | Dashboard at 390 px viewport, no horizontal overflow |

When a file is added, its row above is ticked and the README's Product
Screenshots section gains a matching `![caption](screenshots/…)` entry —
the README never links an image that does not exist.
