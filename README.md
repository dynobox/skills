# Dynobox Skills

[![skills.sh](https://skills.sh/b/dynobox/skills)](https://skills.sh/dynobox/skills)
[![Dynobox](https://github.com/dynobox/skills/actions/workflows/dynobox.yml/badge.svg?branch=main)](https://github.com/dynobox/skills/actions/workflows/dynobox.yml)

Skills for building and debugging Dynobox agent tests. Each skill is a small,
installable instruction package with its own Dynobox coverage.

## Install

Install all skills from this repository:

```sh
npx skills add dynobox/skills
```

Install a single skill:

```sh
npx skills add dynobox/skills --skill dyno-from-skill
npx skills add dynobox/skills --skill dyno-run-debug
npx skills add dynobox/skills --skill dyno-skill-fit
```

List available skills without installing:

```sh
npx skills add dynobox/skills --list
```

## Skills

| Skill | Use it when | Dynobox coverage |
| --- | --- | --- |
| [`dyno-from-skill`](./skills/dyno-from-skill/SKILL.md) | You need to generate a Dynobox test from a skill's `SKILL.md`. | [`dyno-from-skill.dyno.mjs`](./skills/dyno-from-skill/dyno/dyno-from-skill.dyno.mjs) |
| [`dyno-run-debug`](./skills/dyno-run-debug/SKILL.md) | You need to diagnose failed `dynobox run` output and propose a verified fix. | [`dyno-run-debug.dyno.mjs`](./skills/dyno-run-debug/dyno/dyno-run-debug.dyno.mjs) |
| [`dyno-skill-fit`](./skills/dyno-skill-fit/SKILL.md) | You need to assess whether a skill is worth covering with Dynobox before authoring dynos. | [`dyno-skill-fit.dyno.mjs`](./skills/dyno-skill-fit/dyno/dyno-skill-fit.dyno.mjs) |

## Repository Layout

```text
skills/<skill-name>/
  SKILL.md
  dyno/
    <skill-name>.dyno.mjs
    fixtures/            # optional, copied into each scenario workdir
```

This repo keeps skills under top-level `skills/`, matching the common
`skills.sh` catalog layout. Dynobox runs against the same tree, so the published
skill instructions and their tests stay colocated.

## Test

Install dependencies and validate every real dyno config:

```sh
npm ci
npm run dyno:validate
```

Run the full agent harness matrix:

```sh
npm run dyno:run
```

Run a single harness for local debugging:

```sh
npm run dyno:run:claude
npm run dyno:run:codex
```

Run with debug logs:

```sh
npm run dyno:run:debug
```

CI runs `dynobox run skills` in GitHub Actions and publishes a workflow
summary, PR comment, and `dynobox-report` artifact. Configure these repository
secrets before enabling the workflow:

- `ANTHROPIC_API_KEY` for Claude Code.
- `OPENAI_API_KEY` for Codex.

## Version Note

This project uses `dynobox run skills`, which relies on Dynobox
directory discovery for `*.dyno.*` files and requires Dynobox 0.7.0 or newer.

Adjacent `fixtures/` content is copied into each scenario work directory
automatically. These dynos set up consumer-style `.agents/skills/<name>/`
fixtures where skill-reference assertions need that layout. Command assertions
such as `command.called("git", { args: ["status"] })` check normalized observed
shell commands instead of raw shell-string regexes.
