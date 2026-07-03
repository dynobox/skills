import { command, defineDyno, sequence, skill, verify } from "@dynobox/sdk";

export default defineDyno({
  name: "[commit-skill] no writes",
  target: "commit-skill",
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
      id: "no-push",
      name: "no push",
      prompt:
        "Read .agents/skills/commit/SKILL.md, then use the commit skill to commit the README.md change in this scratch repository. Run git status, git diff, and git log before staging. Do not push. Do not amend any commit.",
      setup: [
        "git init",
        "git config user.email dynobox@example.com",
        "git config user.name Dynobox Test",
        "git add .",
        'git commit -m "chore: initial commit"',
        'printf "\nCommit skill smoke change.\n" >> README.md',
      ],
      assertions: [
        skill.referenced("commit"),
        command.called("git", { args: ["status"] }),
        command.called("git", { args: ["diff"] }),
        command.called("git", { args: ["log"] }),
        sequence.inOrder([
          command.called("git", { args: ["add"] }),
          command.called("git", { args: ["commit"] }),
        ]),
        command.notCalled("git", { args: ["push"] }),
        command.notCalled("git", { args: ["commit", "--amend"] }),
        verify.command("git diff --exit-code HEAD -- README.md", {
          exitCode: 0,
        }),
      ],
    },
  ],
});
