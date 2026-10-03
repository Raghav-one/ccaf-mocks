# Claude Architect Mock Exams

One static site with four original mock papers for Claude Certified Architect — Foundations (CCAR-F). Each paper has 60 questions in four 15-question scenario blocks, a 120-minute continuous timer, and the five domain proportions in Anthropic's [Exam Guide v1.0 (July 2026)](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf).

The two modes are:

- Immediate feedback: check each item to reveal and lock its answer and reasoning.
- End-of-test feedback: revise answers freely; correctness and reasoning appear only after submission or timeout.

Both modes support multiple-response items, flags, question navigation, browser-local persistence, auto-submission when time expires, raw-score/domain review, and retakes. Correctness uses exact-match scoring for multiple-response items. The site does **not** estimate Anthropic's scaled 100–1,000 score or claim to reproduce official questions or the Pearson interface.

The deployed page loads one generated JavaScript bundle to avoid partially loaded question papers. Rebuild it after editing `app.js` or any file in `exams/`:

```sh
node build.mjs
```

Run locally:

```sh
python3 -m http.server 4184 --directory .
```

Open `http://localhost:4184/`. No build step or runtime dependencies are required.

Validation:

```sh
node tests/content.cjs
PLAYWRIGHT_MODULE=/path/to/playwright CHROME_PATH=/path/to/chrome node tests/browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright CHROME_PATH=/path/to/chrome node tests/full-papers.cjs
```

The site is independent study material and is not affiliated with Anthropic. Exam details can change; consult the current official guide before scheduling.
