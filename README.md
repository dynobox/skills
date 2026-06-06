# Dynobox Examples

This is a standalone project for trying Dynobox the way a real AI-assisted codebase would use it. It mirrors the dynobox repo pattern:

- project skills live in `.agents/skills/<skill-name>/SKILL.md`
- each skill owns its Dynobox tests in `.agents/skills/<skill-name>/dyno`
- `dynobox run .agents/skills` discovers and runs the skill dynos recursively
- Claude project permissions live in `.claude`

## Included Example

The included `commit` skill is copied from the dynobox repo with its internal `dyno/` folder and fixtures. The scenario creates a scratch git repository, makes a README change, asks the agent to use the commit skill, and evaluates that the agent follows a safe commit workflow.

The evaluation checks that the agent:

- inspects status, diff, and recent commits
- invokes the `commit` skill
- stages relevant changes
- creates a commit
- does not push
- does not amend

## Run It

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

This project intentionally uses `dynobox run .agents/skills`. That command relies on Dynobox directory discovery for `*.dyno.*` files and requires Dynobox 0.4.0 or newer.

Single-harness npm scripts use Dynobox's `--harness` flag for local debugging.
In Dynobox 0.4.0, that flag selects a harness by ID but does not preserve the
configured model metadata from the dyno file, so the full `npm run test:agents`
command and CI are the source of truth for the dyno-defined harness matrix.
