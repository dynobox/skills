---
name: dyno-skill-fit
description: |
  Assess whether an existing agent skill is a good candidate for Dynobox test
  coverage before writing dynos. Use when the user explicitly asks whether a
  skill is testable with Dynobox, requests a fitness or coverage assessment,
  asks whether dynos can be written for a skills.sh link or SKILL.md path/repo,
  or wants to prioritize skills for Dynobox tests. Produce per-dimension scores,
  a High/Partial/Low fit tier, and example assertions for testable behaviors.
  Do not use for requests to create or write a dyno; use dyno-from-skill instead.
---

# Dynobox Skill Fitness

Dynobox runs an agent harness in a fresh temporary work directory and asserts
externally observable behavior: tool calls, normalized shell commands, files in
the work directory, transcript/final-message text, proxy-visible HTTP requests,
and skill-file references.

Assess one question: how much of this skill's success criteria projects onto
those observable surfaces? This is a triage assessment, not an invitation to
redesign the skill or author dynos yet.

Read [the assertion guidance](references/assertion-guidance.md) before
suggesting assertion syntax. The live Dynobox authoring documentation is the
source of truth when it differs from that reference.

## Workflow

1. **Acquire the skill content** using the rules below.
2. **Extract testable claims.** List each imperative or constraint: do X, never
   Y, produce file Z, run command W, or follow steps in an order.
3. **Score all six dimensions** from 0 to 2 using the rubric.
4. **Apply the tier rules.** The total is useful, but Observability and Sandbox
   feasibility are gates.
5. **Write the report** in the required shape. Separate mechanical behaviors
   from judgment-heavy ones and offer 1-3 assertions for each testable behavior.
6. **Hand off.** For High or Partial fit, recommend the installed
   `dyno-from-skill` skill if the user wants actual dynos. Give it the testable
   behaviors table as the authoring specification.

## Acquire The Skill

- **skills.sh link** (`https://skills.sh/<owner>/<repo>/<skill-name>`): fetch
  the page for the inline `SKILL.md`, install command, and source repository.
  skills.sh does not show bundled `scripts/`, `references/`, or `assets/`.
  Fetch resources from the source repository when the instructions rely on
  them; otherwise say the assessment covers `SKILL.md` only.
- **Local path**: read `SKILL.md` and list the skill directory to include
  relevant scripts, references, and assets.
- **Pasted text**: assess it as-is and say that bundled resources were not
  inspected.
- **Repository with multiple skills**: list its skills and ask which to assess,
  unless the user asked for a portfolio triage. For a portfolio triage, assess
  all requested skills and rank them first.

## Scoring Rubric

Score each dimension 0 (poor), 1 (mixed), or 2 (good).

### 1. Observability

Does correct use leave evidence Dynobox can see?

- **2**: success manifests as files, shell commands, or a determinable tool
  sequence, such as an output PDF being created.
- **1**: some steps are observable, but key value is reasoning or chat-only
  advice, such as a code review.
- **0**: success is a quality judgment with no behavioral trace, such as style,
  taste, tone, or "make it beautiful."

### 2. Verifiability

Can success be expressed as deterministic, repeatable assertions?

- **2**: stable artifact, tool, command, or verification assertions capture the
  requirement.
- **1**: only loose transcript/final-message matching works, or valid output
  has many forms and requires weak checks.
- **0**: only human or LLM judgment can grade the outcome; text matching would
  only test phrasing.

### 3. Sandbox Feasibility

Can a realistic scenario run in a fresh local temporary directory?

- **2**: fixtures or setup can create everything needed, such as text files,
  git repos, or npm projects.
- **1**: network installs, missing tools, or partially captured HTTP are needed.
- **0**: authenticated services, MCP connectors, GUIs, live databases, real
  credentials, or effects outside the sandbox are required.

### 4. Triggerability

Can a self-contained prompt reliably cause the harness to consult the skill?

- **2**: its description has clear task/file triggers; a prompt and fixture are
  sufficient.
- **1**: triggers are broad or contextual, or a simple task may skip the skill.
- **0**: it depends on ambient project state, user history, or other context a
  scenario cannot reproduce.

### 5. Negative Space

Does the skill define forbidden behavior?

- **2**: explicit prohibitions map to command/tool avoidance or artifact-state
  assertions, such as never pushing or never editing generated files.
- **1**: prohibitions are implied and require interpretation.
- **0**: no forbidden behavior is defined. This is not disqualifying; it only
  removes a cheap, high-value assertion class.

### 6. Cost And Flakiness

Will scenarios be fast and stable enough to run repeatedly?

- **2**: critical behavior appears in a short harness run with small fixtures.
- **1**: workflow length or output variance will produce occasional mixed runs.
- **0**: the workflow is slow, branchy, environment-heavy, or chronically
  flaky.

## Tier Rules

The total is out of 12.

- An **Observability** or **Sandbox feasibility** score of 0 means **Low fit**,
  regardless of total.
- Otherwise, **9-12 is High**, **5-8 is Partial**, and **0-4 is Low**.

For Partial fit, the per-behavior breakdown is the product. Identify the
testable procedural core and the untestable judgment around it precisely.

## Judgment Calls

- Assess the skill as written. You may mention a single testability improvement
  under caveats, but do not redesign it.
- Creative domains are not automatically Low fit. Test their mechanical residue
  (for example, required CSS variables or forbidden fonts), not aesthetics.
- Distinguish hard from expensive: large fixtures make a behavior Partial fit
  with a cost warning, not necessarily Low fit.
- For external CLIs, check whether their needed commands run unauthenticated in
  a temporary directory before awarding Sandbox feasibility a 2.

## Output Format

Keep the report scannable. Use this shape exactly enough that a dyno author can
turn the testable-behaviors section into a scenario plan:

```markdown
# Dynobox fitness: <skill-name>
Source: <skills.sh URL / path>   Assessed: <SKILL.md only | SKILL.md + resources>

Verdict: <High | Partial | Low> fit  (<total>/12)

| Dimension | Score | Why (one line) |
| --- | --- | --- |
| Observability | 0-2 | ... |
| Verifiability | 0-2 | ... |
| Sandbox feasibility | 0-2 | ... |
| Triggerability | 0-2 | ... |
| Negative space | 0-2 | ... |
| Cost/flakiness | 0-2 | ... |

## Testable behaviors
For each: behavior, one-sentence fixture + prompt scenario, and 1-3 example assertions.

## Not testable via Dynobox
For each: behavior and the one-line blocking reason.

## Blockers & caveats
Environment prerequisites, resources not inspected, and SDK/version notes.

## Recommendation
Whether to invest in dynos, which behaviors first, and a `dyno-from-skill` handoff when appropriate.
```

For multiple skills, start with a ranked table of skill, tier, total, and
one-line rationale. Low-fit entries may be abbreviated to verdict and reason.
