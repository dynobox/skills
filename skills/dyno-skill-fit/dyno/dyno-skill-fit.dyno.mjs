import {
  anyOf,
  artifact,
  command,
  defineDyno,
  dyno,
  finalMessage,
  skill,
  tool,
} from "@dynobox/sdk";

const here = dyno.here(import.meta.url);

export default defineDyno({
  name: "[dyno-skill-fit] assesses an observable skill",
  target: "dyno-skill-fit",
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
      id: "high-fit-skill",
      name: "assess a high-fit skill",
      prompt:
        "Read .agents/skills/dyno-skill-fit/SKILL.md, then use the dyno-skill-fit skill to assess target-skill/SKILL.md for Dynobox coverage. Inspect the target skill directory, include example Dynobox assertions, and use the required report format. Do not write a dyno.",
      setup: [
        `mkdir -p .agents/skills/dyno-skill-fit && cp ${here.q("../SKILL.md")} .agents/skills/dyno-skill-fit/SKILL.md`,
        `mkdir -p .agents/skills/dyno-skill-fit/references && cp ${here.q("../references/assertion-guidance.md")} .agents/skills/dyno-skill-fit/references/assertion-guidance.md`,
      ],
      assertions: [
        skill.referenced("dyno-skill-fit"),
        command.called("curl", {
          args: [
            "-fsSL",
            "https://docs.dynobox.xyz/config-authoring.md",
          ],
        }),
        anyOf([
          tool.called("read_file", { path: "target-skill/SKILL.md" }),
          tool.called("read_file", { path: "./target-skill/SKILL.md" }),
          tool.called("shell", { includes: "target-skill/SKILL.md" }),
        ]),
        finalMessage.contains("Dynobox fitness: fixture-report"),
        finalMessage.contains("Verdict:"),
        finalMessage.contains("High"),
        finalMessage.contains("12/12"),
        finalMessage.contains("Observability"),
        finalMessage.contains("Verifiability"),
        finalMessage.contains("Sandbox feasibility"),
        finalMessage.contains("Triggerability"),
        finalMessage.contains("Negative space"),
        finalMessage.contains("Cost/flakiness"),
        finalMessage.contains("Testable behaviors"),
        finalMessage.contains("Not testable via Dynobox"),
        finalMessage.contains("Blockers & caveats"),
        finalMessage.contains("Recommendation"),
        finalMessage.contains("artifact.contains"),
        artifact.unchanged("target-skill/SKILL.md"),
        artifact.notExists("target-skill/dyno"),
        tool.notCalled("write_file"),
        tool.notCalled("edit_file"),
      ],
    },
  ],
});
