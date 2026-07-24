import {
  anyOf,
  artifact,
  command,
  defineDyno,
  dyno,
  finalMessage,
  skill,
  tool,
  verify,
} from "@dynobox/sdk";

const here = dyno.here(import.meta.url);

export default defineDyno({
  name: "[dyno-run-debug] diagnoses failed run",
  target: "dyno-run-debug",
  setup: [
    `mkdir -p .agents/skills/dyno-run-debug && cp ${here.q("../SKILL.md")} .agents/skills/dyno-run-debug/SKILL.md`,
    `mkdir -p tmp && cp ${here.q("./fixtures/tmp/approved-fix.fixture.mjs")} tmp/approved-fix.dyno.mjs && cp ${here.q("./fixtures/tmp/failing.fixture.yaml")} tmp/failing.dyno.yaml`,
  ],
  harnesses: [
    {
      id: "claude-code",
      model: "sonnet",
      permissionMode: "dangerous",
    },
    {
      id: "codex",
      model: "gpt-5.4-mini",
      permissionMode: "dangerous",
    },
    {
      id: "opencode",
      model: "openai/gpt-5.4-mini",
      permissionMode: "dangerous",
    },
  ],
  scenarios: [
    {
      id: "diagnose-only",
      name: "diagnose failed validation",
      prompt: `Read .agents/skills/dyno-run-debug/SKILL.md, then use the dyno-run-debug skill to diagnose this failed Dynobox run. Do not edit any files yet; propose fixes only.

The user pasted this debug output:

\`\`\`text
$ npx dynobox run tmp/regression.dyno.yaml --debug

Scenario: yaml regression fixture
Matrix: 2 jobs, 1 passed, 1 failed

PASS yaml-regression - claude-code/sonnet - iteration 1
  observed parsed commands:
    - dynobox validate tmp/regression.dyno.yaml

FAIL yaml-regression - codex/gpt-5.4-mini - iteration 1
  failed assertion: verify.command
  expected: dynobox validate tmp/failing.dyno.yaml exits 0
  observed: exitCode 1, stderr includes "Too small: expected array to have >=1 items"
  observed parsed commands:
    - dynobox validate tmp/failing.dyno.yaml
  observed shell commands:
    - npx dynobox validate tmp/failing.dyno.yaml
  observed skill files:
    - .agents/skills/dyno-run-debug/SKILL.md
  work dir: debug-workdir
  log: debug-workdir/dynobox-transcript.log
\`\`\`

The debug work dir and the temp dyno still exist in this scratch workspace at debug-workdir/ and tmp/failing.dyno.yaml. Diagnose the root cause, reproduce the exact failing validation check if needed, and end with the Dynobox Debug Record format from the skill. Include a Verification line stating which ladder steps were not run yet.`,
      assertions: [
        skill.referenced("dyno-run-debug"),
        anyOf([
          tool.called("read_file", {
            path: "debug-workdir/dynobox-tool-events.json",
          }),
          command.called("cat", {
            originalMatches: /debug-workdir\/dynobox-tool-events\.json/,
          }),
          command.called("jq", {
            originalMatches: /debug-workdir\/dynobox-tool-events\.json/,
          }),
          command.called("sed", {
            originalMatches: /debug-workdir\/dynobox-tool-events\.json/,
          }),
        ]),
        anyOf([
          command.called("npx", {
            args: ["dynobox", "validate"],
            argsMatching: [/\/?tmp\/failing\.dyno\.yaml$/],
          }),
          command.called("dynobox", {
            args: ["validate"],
            argsMatching: [/\/?tmp\/failing\.dyno\.yaml$/],
          }),
        ]),
        command.notCalled("npx", { argsInOrder: ["dynobox", "run"] }),
        command.notCalled("dynobox", { args: ["run"] }),
        tool.notCalled("edit_file"),
        tool.notCalled("write_file"),
        finalMessage.contains("Dynobox Debug Record"),
        finalMessage.contains("Root cause"),
        finalMessage.contains("Proposed fix"),
        finalMessage.contains("Verification"),
      ],
    },
    {
      id: "approved-fix",
      name: "apply approved fix",
      prompt: `Read .agents/skills/dyno-run-debug/SKILL.md, then use the dyno-run-debug skill to apply the approved fix.

The diagnosis is complete and the user explicitly approves this concrete fix: update tmp/approved-fix.dyno.mjs by replacing the empty scenarios array with exactly one minimal scenario named "approved fix smoke". The scenario should prompt "Say ok." and assert that the final message contains "ok".

After editing, run node --check tmp/approved-fix.dyno.mjs and npx dynobox validate tmp/approved-fix.dyno.mjs. Do not run dynobox run. Report the actual verification results.`,
      assertions: [
        skill.referenced("dyno-run-debug"),
        artifact.contains("tmp/approved-fix.dyno.mjs", "approved fix smoke"),
        artifact.contains("tmp/approved-fix.dyno.mjs", "finalMessage.contains"),
        command.called("node", {
          args: ["--check"],
          argsMatching: [/\/?tmp\/approved-fix\.dyno\.mjs$/],
        }),
        anyOf([
          command.called("npx", {
            args: ["dynobox", "validate"],
            argsMatching: [/\/?tmp\/approved-fix\.dyno\.mjs$/],
          }),
          command.called("dynobox", {
            args: ["validate"],
            argsMatching: [/\/?tmp\/approved-fix\.dyno\.mjs$/],
          }),
        ]),
        command.notCalled("npx", { argsInOrder: ["dynobox", "run"] }),
        command.notCalled("dynobox", { args: ["run"] }),
        verify.succeeds("node --check tmp/approved-fix.dyno.mjs"),
        verify.command("dynobox validate tmp/approved-fix.dyno.mjs", {
          exitCode: 0,
        }),
      ],
    },
  ],
});
