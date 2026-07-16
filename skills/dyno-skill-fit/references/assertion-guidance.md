# Dynobox Assertion Guidance

Fetch the current authoring documentation before finalizing an assessment:

```bash
curl -fsSL https://docs.dynobox.xyz/config-authoring.md
```

Dynobox and `@dynobox/sdk` change; use `npx dynobox validate` as the compilation
authority for the user's installed version.

## Prefer Observable Behavior

Use the most semantic assertion for the behavior being assessed:

| Behavior | Preferred assertion family |
| --- | --- |
| Agent used or avoided a harness tool | `tool.called` / `tool.notCalled` |
| Agent ran or avoided a normal CLI command | `command.called` / `command.notCalled` |
| Output file state | `artifact.exists`, `artifact.contains`, `artifact.notExists`, `artifact.unchanged` |
| Post-run output validity | `verify.succeeds` / `verify.command` |
| Required order | `sequence.inOrder` |
| Declared proxy-visible HTTP | `http.called` / `http.notCalled` |
| Skill file was observed | `skill.referenced` |
| User-visible text only | `finalMessage.contains` / `transcript.contains` |

Prefer artifact, command, and verification checks over final-message phrasing.
If text is the only observable surface, say so and suggest the smallest stable
match.

## Current Authoring Constraints

- Use `skill.referenced('<name>')`, not `skill.invoked(...)`. It proves a named
  skill file was referenced, not that the harness semantically followed it.
- `tool.called` and `tool.notCalled` support these kinds: `shell`, `read_file`,
  `write_file`, `edit_file`, `search_files`, `web_fetch`, `web_search`, `mcp`,
  `task`, and `unknown`.
- A `shell` tool matcher accepts exactly one of `equals`, `includes`,
  `startsWith`, or `matches`. File-oriented tool assertions use `{path: ...}`.
  Do not combine path and shell-command matchers.
- `command.*` checks normalized shell-command segments. Prefer it for ordinary
  CLI behavior; use `tool.*` raw shell matching for complex shell syntax that
  normalization cannot represent.
- `sequence.inOrder([...])` accepts `tool.called(...)` and
  `command.called(...)` steps, including a mix of both.
- `command.notCalled` and `tool.notCalled` are behavioral checks, not security
  guarantees. Shell normalization deliberately does not expand every wrapper,
  substitution, heredoc, or background command.
- HTTP capture sees only child-process traffic that honors the proxy and CA
  environment Dynobox supplies. Harness-native web tools may bypass it.
- Artifact paths must be relative to, and remain inside, the scenario work
  directory.

## Example Assertion Suggestions

```js
import {
  artifact,
  command,
  sequence,
  skill,
  tool,
  verify,
} from "@dynobox/sdk";

skill.referenced("commit");
tool.called("read_file", { path: "package.json" });
tool.notCalled("edit_file", { path: "generated/client.ts" });
command.called("git", { args: ["status"] });
command.notCalled("git", { args: ["push"] });
sequence.inOrder([
  command.called("git", { args: ["add"] }),
  command.called("git", { args: ["commit"] }),
]);
artifact.exists("report.md");
artifact.contains("report.md", "Summary");
artifact.unchanged("package-lock.json");
verify.command("npm test", { exitCode: 0 });
```

Do not assert exact command ordering or exact final-message prose unless the
skill explicitly makes it part of success. Use `anyOf(...)` when equivalent
harness behavior is acceptable.
