# Coverage and release audit

Source: [Claude Certified Architect — Foundations Exam Guide, version 1.0, effective July 2026](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf).

| Domain | Guide weight | Questions per paper | Task statements represented |
| --- | ---: | ---: | --- |
| Agentic Architecture & Orchestration | 27% | 16 | 1.1–1.7 |
| Tool Design & MCP Integration | 18% | 11 | 2.1–2.5 |
| Claude Code Configuration & Workflows | 20% | 12 | 3.1–3.6 |
| Prompt Engineering & Structured Output | 20% | 12 | 4.1–4.6 |
| Context Management & Reliability | 15% | 9 | 5.1–5.6 |

Each paper contains four distinct original scenarios based on four of the six archetypes named in the guide: support resolution, code generation, multi-agent research, developer productivity, CI integration, and structured extraction. There are 240 unique question stems in total. Every paper includes single-response, two-response, and three-response items. These are original practice questions, not the guide's sample items.

The practice site reproduces observable format elements: 60 questions, 120 minutes, four scenario blocks, stated response count, the approximate domain proportions, navigation/flagging, and delayed result review. It does not reproduce official item selection, proctoring, adaptive scoring, or the scaled passing score; only a raw practice score is reported.

Validation gates: `tests/content.cjs` checks paper structure, objective coverage, answer bounds, uniqueness, and multiple-response mix. `tests/browser.cjs` checks immediate/end feedback timing, persistence, timeout submission, result filtering, mobile navigation, and overflow. `tests/full-papers.cjs` answers every item through the interface and verifies 60/60 scoring for all four papers.
