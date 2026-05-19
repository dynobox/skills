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
npm install --save-dev dynobox
npm run test:agents
```

For debugging:

```sh
npm run test:agents:debug
```

To try the same skill test with Codex instead of Claude Code:

```sh
npm run test:agents:codex
```

## Version Note

This project intentionally uses `dynobox run .agents/skills`. That command relies on Dynobox directory discovery for `*.dyno.*` files. If the published npm version you have installed still expects an explicit config file, use the local unreleased Dynobox build or install the next release before running this example.
