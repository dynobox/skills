---
name: dyno-run-debug
description: |
  Debug a failed `dynobox run` from its terminal output. Use this skill when
  the user pastes or references output from `npx dynobox run` (especially
  `--debug` output with failed assertions), asks why a dyno run, scenario, or
  assertion failed, or wants a failing dyno fixed. Produces a root-cause
  diagnosis and proposed fixes; never applies a change without approval, and
  verifies every dyno change with `node --check` and `npx dynobox validate`.
---

# Dyno Run Debug

This skill turns failing `dynobox run` output into a root-cause diagnosis and
a verified fix proposal. Assume `dynobox` is the public CLI invoked with
`npx dynobox`, unless the user says they are debugging the Dynobox repo itself
(then: `pnpm build && node packages/cli/dist/bin.js ...`).

Two hard rules:

1. **Never apply a fix unprompted.** Diagnose, present ranked fix options with
   concrete diffs, and wait for the user to pick one.
2. **Every changed or reconstructed dyno file must be verified** with
   `node --check <file>` and `npx dynobox validate <file>` before you present
   it as done or rerun any harness against it.

## Workflow

1. **Capture.** If the user pasted run output, work from it. Otherwise (or if
   it lacks work-dir/log paths) run `npx dynobox run <path> --debug`.
2. **Parse the output.** For each failed job collect: scenario, harness,
   model, iteration; each failed assertion's `expected` vs `observed`; the
   `observed parsed commands` / `observed shell commands` / `observed skill
   files` lists; the `work dir` and `log` paths; and which sibling matrix jobs
   passed.
3. **Compare passing vs failing jobs first.** In a matrix, the diff between a
   passing and a failing harness is usually the diagnosis. Diff their observed
   command lists against what the skill/scenario requires — a command missing
   from the failing job's list (e.g. it never ran the verification command it
   was told to run) is a stronger signal than the assertion message itself.
4. **Inspect debug artifacts** (below), reproduce the exact failing check, and
   classify the root cause.
5. **Propose.** Present the diagnosis with evidence, then ranked fix options
   as concrete edits (file, location, before/after). Do not edit yet.
6. **Verify on approval.** Apply the chosen fix, run the verification ladder
   (below), and report actual results — including failures.

## Debug Artifacts: What Survives and What Doesn't

Each job's `work dir` is a temp directory. After the run it retains only the
four debug logs — **files the agent created or modified are cleaned up**, and
the whole directory disappears on reboot/TMP cleanup. Always `ls <work-dir>`
before relying on it.

| File | Contents |
| --- | --- |
| `dynobox-transcript.log` | full harness transcript (prompts, replies, tool calls) |
| `dynobox-chat-history.jsonl` | same, as JSONL — grep/jq-friendly |
| `dynobox-tool-events.json` | normalized tool calls — the assertion engine's input |
| `dynobox-stderr.log` | harness process stderr (permission/trust warnings, etc.) |

To recover a file the agent wrote (e.g. a generated dyno that failed
validation), pull the write-tool input out of the chat history:

```bash
# each line is a message; write-tool calls appear as content[].type == "tool_use"
jq -r '.message.content[]? | select(.type == "tool_use" and .name == "Write")
       | .input.file_path' <work-dir>/dynobox-chat-history.jsonl
jq -r '.message.content[]? | select(.type == "tool_use" and .name == "Write"
       and (.input.file_path | endswith("<file>"))) | .input.content' \
  <work-dir>/dynobox-chat-history.jsonl > /tmp/recovered-<file>
```

Tool names vary by harness (`Write`/`Edit` for Claude Code; shell heredocs or
`apply_patch` for Codex — check the transcript). If the file was edited after
the initial write, take the last matching event and apply subsequent edits.
Never reconstruct into the real skill tree — keep recovered files in a scratch
directory.

## Reproduce the Exact Failing Check

The run summary truncates long output (`stderr "... error: ..."`). Do not
guess from the truncation — rerun the failing check yourself to get the full
error:

- `verify.command` / `verify.succeeds` failures: reconstruct the artifact (or
  use it in place if the workdir still has it), then run the same command,
  e.g. `npx dynobox validate <recovered-file>`.
- `artifact.*` failures: read the recovered artifact and compare against the
  assertion's expectation.
- `command.*` / `sequence.*` failures: read `dynobox-tool-events.json` and
  compare normalized events against the assertion, not the terminal summary.
- `skill.referenced` failures: check `observed skill files` and the transcript
  for whether the harness ever read the SKILL.md.

Only rerun harnesses (`npx dynobox run`) when logs cannot answer the
question — harness runs are slow and cost API usage.

## Classify the Root Cause

Every failure lands in one of three buckets, and the fix target differs:

- **A. The dyno is wrong.** Over-strict assertion (exact ordering or wording
  that passing harnesses satisfy only by luck), wrong path, missing
  setup/fixture, asserting a command the prompt never motivates.
  → Fix the `*.dyno.mjs`.
- **B. The skill under test is wrong or incomplete.** The agent followed the
  SKILL.md faithfully and still failed the assertion — e.g. the skill's
  template produces output that fails a required check, or the skill never
  tells the agent to run the verification the dyno asserts.
  → Fix the `SKILL.md` (or its template/fixtures).
- **C. Harness behavior / nondeterminism.** The same job passes on rerun, or
  the agent stopped early, hit a permission/trust prompt (check
  `dynobox-stderr.log`), or chose an equivalent-but-different command.
  → Report it; consider making the dyno assertion behavioral rather than
  procedural (`anyOf`, artifact state instead of command sequence). Do not
  claim "no bug" from one isolated pass.

Common signatures:

- *Setup passed, tools ran, artifact unchanged, mutation command absent* — the
  agent stopped after inspection or was blocked by permissions (bucket C, or
  bucket B if the skill never clearly mandates the mutation).
- *Workflow visibly succeeded but a `sequence`/exact-match assertion failed* —
  harness batched or reordered equivalent commands (bucket A: relax to
  behavioral assertions).
- *Generated file fails `verify.command(dynobox validate ...)`* — recover the
  file, get the full validation error, then decide: invalid SDK usage the
  skill's template invites (bucket B) vs. the agent skipping a self-check the
  skill should require, e.g. "run `npx dynobox validate` on the file you
  wrote before finishing" (also bucket B, different fix).

## Preserve the Matrix Signal

The original matrix run is evidence; reruns are experiments. Record both, and
if an isolated rerun passes after a matrix failure, report nondeterminism —
the rerun does not invalidate the original failure. When narrowing a rerun:

```bash
npx dynobox run <path> --scenario "<pattern>" --debug
npx dynobox run <path> --scenario "<pattern>" --iterations 3 --debug   # flakiness probe
```

Prefer `--scenario` over `--harness`: `--harness <id>` can drop the model the
dyno config pinned for that harness and silently change the experiment.

## Verification Ladder

After the user approves a fix, verify cheapest-first. Steps 1–2 are mandatory
for any dyno file you touched or reconstructed; steps 3–4 need the user's
go-ahead (they invoke real harnesses):

1. `node --check <file>` — syntax.
2. `npx dynobox validate <file>` — schema/config validity, no harness runs.
3. `npx dynobox run <dyno-path> --scenario "<failed scenario>" --debug` — does
   the failing job now pass?
4. Full matrix rerun — does the fix hold across harnesses without regressing
   the jobs that passed?

For a SKILL.md fix, steps 1–2 apply to any dyno touched alongside it, and only
step 3–4 can actually confirm the behavior change. Report verification output
truthfully; a fix that fails step 3 goes back to diagnosis, not into a report.

## Reporting

End with a concise record the user can paste into an issue:

```markdown
## Dynobox Debug Record

- Run: <config path, matrix shape, pass/fail counts>
- Failed job: <scenario · harness/model · iteration>
- Failed assertion(s): <expected vs observed>
- Key evidence: <log lines, recovered artifacts, passing-vs-failing diff>
- Root cause: <bucket A/B/C + one-sentence cause>
- Proposed fix(es): <ranked, with file + concrete edit>
- Verification: <which ladder steps ran and their actual results>
```
