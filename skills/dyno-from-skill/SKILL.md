---
name: dyno-from-skill
description: |
  Generate a Dynobox test (dyno) for an agent skill from its SKILL.md. Use this
  skill whenever the user asks to create, write, scaffold, or generate a dyno,
  dyno test, Dynobox test, or smoke test for a skill or a SKILL.md file, or asks
  to "test this skill" with Dynobox.
---

# Dyno From Skill

This skill turns a skill's `SKILL.md` instruction file into a runnable Dynobox
test: a `*.dyno.mjs` file colocated with the skill that prompts a harness with a
realistic task and asserts the observable behavior the skill mandates.

Full authoring reference: <https://docs.dynobox.xyz/config-authoring.md>

## Workflow

1. **Read the target `SKILL.md`.** Note the skill `name` from frontmatter and
   the directory that contains the file — that directory is the skill root
   (`<skill-root>/`).
2. **Fetch the current authoring reference.** Do not write assertions from
   memory or from the summary table below alone — the SDK evolves. Fetch the
   docs and check the assertion catalog and its syntax rules, including where
   each assertion type is allowed to appear (for example, which types are
   valid as `sequence.inOrder` steps):

   ```bash
   curl -fsSL https://docs.dynobox.xyz/config-authoring.md
   ```
3. **Extract testable behaviors.** Go through the instructions and collect:
   - commands the skill requires (`git status`, `wc -w`, `pnpm test`, ...)
   - required ordering ("inspect before staging", "verify after commit")
   - forbidden actions ("never push", "do not amend", "never modify the input")
   - files the skill produces or updates
   - what the final response must report
4. **Design 1–3 scenarios.** Start with one happy-path scenario; add a scenario
   per important guardrail only when the happy path cannot cover it. Each
   scenario needs a realistic user-style prompt and the minimum setup/fixtures
   for the task to make sense.
5. **Write the dyno file** at `<skill-root>/dyno/<skill-name>.dyno.mjs` using
   `defineDyno` from `@dynobox/sdk` (see template below).
6. **Add fixtures** in `<skill-root>/dyno/fixtures/` for any files the scenario
   needs. The adjacent `fixtures/` directory is copied into each scenario work
   directory automatically — do not copy it manually in `setup`.
7. **Validate before finishing.** Run `node --check <file>` for syntax, then
   `npx dynobox validate <path-to-dyno>` (schema check, no harnesses run).
   Fix and re-validate until it exits 0 — a dyno that fails validation is not
   done. Only run `npx dynobox run <path> --debug` if the user asks for a
   live run.

## File Layout

Keep the dyno colocated with the skill it tests:

```text
<skill-root>/
  SKILL.md
  dyno/
    <skill-name>.dyno.mjs
    fixtures/            # optional, auto-copied into each scenario workdir
```

`<skill-root>` is whatever directory contains `SKILL.md`. In a skills.sh catalog
that may be `skills/<skill-name>/`; after `npx skills add`, the same files often
live under an agent-specific path such as `.agents/skills/<skill-name>/` or
`.claude/skills/<skill-name>/`.

Use `.mjs` with `defineDyno(...)`, not YAML: only JS/TS dynos get automatic
adjacent-fixture attachment. When a dyno lives under the same skill root as its
`SKILL.md`, Dynobox can copy that instruction file into each scenario work
directory automatically — otherwise add a `setup` step that places `SKILL.md`
where the harness will read it.

## Mapping SKILL.md Instructions to Assertions

| SKILL.md instruction pattern | Assertion |
| --- | --- |
| skill should be consulted | `skill.referenced('<name>')` |
| "run X" / "use `x` to ..." | `command.called('x', {args: [...]})` |
| "do X before Y" | `sequence.inOrder([command.called(...), ...])` |
| "never X" / "do not X unless asked" | `command.notCalled(...)` or `tool.notCalled(...)` |
| "create/update file F" | `artifact.exists('F')` / `artifact.contains('F', '...')` |
| "report X in the response" | `finalMessage.contains('...')` |
| produced file must be valid | `verify.succeeds('...')` / `verify.command('...', {exitCode: 0})` |
| "fetch from API X" | declare `endpoints` + `http.called('key', {status: 200})` |

Prefer the most semantic assertion available: `command.called` for CLI
behavior, `artifact.*` or `verify.*` for final file state, `finalMessage` for
the user-visible answer. Always include `skill.referenced('<name>')` — it is
the routing check that proves the harness actually consulted the skill file.

## Template

```js
import { command, defineDyno, sequence, skill, tool } from "@dynobox/sdk";

export default defineDyno({
  name: "[<skill-name>] <behavior under test>",
  target: "<skill-name>",
  harnesses: [
    { id: "claude-code", model: "sonnet", permissionMode: "dangerous" },
    { id: "codex", model: "gpt-5.4-mini", permissionMode: "dangerous" },
  ],
  scenarios: [
    {
      id: "<stable-slug>",
      name: "<short scenario name>",
      prompt:
        "Read <skill-root>/SKILL.md, then use the <skill-name> skill to <realistic user task>.",
      setup: [
        // shell commands that build the scratch workspace, e.g. git init
      ],
      assertions: [
        skill.referenced("<skill-name>"),
        // behaviors extracted from SKILL.md go here
      ],
    },
  ],
});
```

Notes on the template:

- `target` groups related dyno files in reports; use the skill `name` from
  frontmatter.
- `permissionMode: "dangerous"` is for trusted local/CI evals; it maps to
  `--permission-mode bypassPermissions` (Claude Code) and full-access sandbox
  (Codex).
- Scenario `id` values may only contain letters, numbers, dots, underscores,
  and hyphens.

## Writing Prompts

- Write the prompt like a real user request; tell it to read the skill file
  first ("Read <path-to>/SKILL.md, then ...") using the path the harness will
  actually see in the scenario work directory so `skill.referenced` is
  meaningful across harnesses.
- Spell out guardrails the scenario tests ("Do not push. Do not amend.") only
  when they mirror what a cautious user would actually say; do not leak
  assertion internals into the prompt.
- Keep long sample inputs in `fixtures/`, not pasted into the prompt.

## Fixtures for Harness Permissions

If the scenario needs the agent to run shell commands or edit files without
approval prompts, add harness config to `fixtures/`:

```text
fixtures/.claude/settings.json   # {"permissions": {"allow": ["Bash(git *)", "Edit", "Write", ...]}}
fixtures/.claude/CLAUDE.md       # point the agent at the skill install path
fixtures/.codex/default.rules    # prefix_rule allow entries for codex
```

Copy the pattern from this repo's existing skill dyno fixtures, such as
`skills/dyno-from-skill/dyno/fixtures/` in this repo.

## Pitfalls

- A scenario with no assertions only proves the harness exited — assert the
  behaviors that define success.
- Do not over-assert: exact command order (`sequence.inOrder`) only when order
  is the point; exact final-message wording is brittle across harnesses.
- `command.notCalled` is a behavioral check, not a security boundary; commands
  hidden in `eval`, substitution, or backgrounding `&` are not observed.
- Artifact paths must be relative and stay inside the work directory.
- Each scenario runs in a fresh temp directory: everything the agent needs must
  come from `fixtures/`, `setup`, or the automatic `SKILL.md` copy.
- Keep assertions harness-agnostic when running a matrix — harnesses may batch
  commands or use different tools for equivalent behavior (use a top-level
  `anyOf` to accept `read_file` vs `cat`, for example).
- Not every assertion composes with every other — e.g. `sequence.inOrder`
  steps accept only `tool.called`/`command.called`, not `anyOf` or other
  assertion types. When composing assertions, confirm the shape against the
  fetched authoring docs, and let `npx dynobox validate` be the final judge.
