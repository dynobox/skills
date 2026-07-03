# Dynobox Examples

[![Dynobox](https://github.com/dynobox/skills/actions/workflows/dynobox.yml/badge.svg?branch=main)](https://github.com/dynobox/skills/actions/workflows/dynobox.yml)

This is a standalone project for trying Dynobox the way a real AI-assisted codebase would use it. It mirrors the dynobox repo pattern:

- project skills live in `.agents/skills/<skill-name>/SKILL.md`
- each skill owns its Dynobox tests in `.agents/skills/<skill-name>/dyno`
- `dynobox run .agents/skills` discovers and runs the skill dynos recursively
- Claude project permissions live in `.claude`

## Included Example

The included `commit` skill is copied from the dynobox repo with its internal `dyno/` folder and fixtures. The scenario creates a scratch git repository from an automatically copied README fixture, makes a README change, asks the agent to use the commit skill, and evaluates that the agent follows a safe commit workflow.

The evaluation checks that the agent:

- inspects status, diff, and recent commits
- references the `commit` skill instructions
- stages relevant changes
- creates a commit
- does not push
- does not amend

## Run It

The latest Dynobox CI runs are available in the [Dynobox workflow](https://github.com/dynobox/skills/actions/workflows/dynobox.yml), including the generated summary, PR comment, and `dynobox-report` artifact.

```sh
npm ci
npm run test:agents
```

To run only one harness for local debugging:

```sh
npm run test:agents:claude
npm run test:agents:codex
```

For debugging:

```sh
npm run test:agents:debug
```

CI runs the same Dynobox command in GitHub Actions once. The dyno file defines
the Claude Code and Codex harness matrix, and the workflow publishes one check,
one summary, one PR comment, and one build artifact. Configure these repository
secrets before enabling the workflow:

- `ANTHROPIC_API_KEY` for Claude Code.
- `OPENAI_API_KEY` for Codex.

## Version Note

This project intentionally uses `dynobox run .agents/skills`. That command relies on Dynobox directory discovery for `*.dyno.*` files and requires Dynobox 0.7.0 or newer.

The commit dyno uses Dynobox 0.7 SDK conveniences: adjacent `fixtures/` content
is copied into each scenario work directory automatically, and skill dynos under
`.agents/skills/<name>/` automatically receive that skill's `SKILL.md`. Command
assertions such as `command.called("git", { args: ["status"] })` check normalized
observed shell commands instead of raw shell-string regexes.

Single-harness npm scripts use Dynobox's `--harness` flag for local debugging.
The full `npm run test:agents` command and CI remain the source of truth for the
dyno-defined harness matrix.
