import {
  anyOf,
  artifact,
  command,
  defineDyno,
  dyno,
  http,
  skill,
  verify,
} from "@dynobox/sdk";

const here = dyno.here(import.meta.url);

export default defineDyno({
  name: "[dyno-from-skill] generates test dyno",
  target: "dyno-from-skill",
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
  ],
  scenarios: [
    {
      id: "wordcount-dyno",
      name: "create dyno from skill",
      prompt:
        "Read .agents/skills/dyno-from-skill/SKILL.md, then use the dyno-from-skill skill to create a Dynobox test for the skill at .agents/skills/wordcount/SKILL.md. Author the dyno file in the wordcount skill's directory following the conventions in the dyno-from-skill instructions. Do not install project dependencies and do not run the generated dyno; before finishing, check it with node --check and validate it with npx dynobox validate.",
      setup: [
        `mkdir -p .agents/skills/dyno-from-skill && cp ${here.q("../SKILL.md")} .agents/skills/dyno-from-skill/SKILL.md`,
      ],
      endpoints: {
        authoringDocs: http.endpoint({
          method: "GET",
          url: "https://docs.dynobox.xyz/config-authoring.md",
        }),
      },
      assertions: [
        skill.referenced("dyno-from-skill"),
        skill.referenced("wordcount"),
        http.called("authoringDocs", { status: 200 }),
        artifact.exists(".agents/skills/wordcount/dyno/wordcount.dyno.mjs"),
        artifact.contains(
          ".agents/skills/wordcount/dyno/wordcount.dyno.mjs",
          "defineDyno",
        ),
        artifact.contains(
          ".agents/skills/wordcount/dyno/wordcount.dyno.mjs",
          "@dynobox/sdk",
        ),
        artifact.contains(
          ".agents/skills/wordcount/dyno/wordcount.dyno.mjs",
          "skill.referenced",
        ),
        artifact.contains(
          ".agents/skills/wordcount/dyno/wordcount.dyno.mjs",
          "WORDCOUNT.md",
        ),
        command.notCalled("dynobox", { args: ["run"] }),
        anyOf([
          command.called("npx", { args: ["dynobox", "validate"] }),
          command.called("dynobox", { args: ["validate"] }),
        ]),
        verify.succeeds(
          "node --check .agents/skills/wordcount/dyno/wordcount.dyno.mjs",
        ),
        verify.command(
          "dynobox validate .agents/skills/wordcount/dyno/wordcount.dyno.mjs",
          { exitCode: 0 },
        ),
      ],
    },
  ],
});
