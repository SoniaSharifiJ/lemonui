# Install or update

The folder `lemonui-design-system/` is a standard Agent Skill: `SKILL.md`, plus `references/`, `assets/` and `scripts/`. If you're replacing an older version you customised, back it up first.

## Claude Code

Personal (all projects):

```bash
mkdir -p ~/.claude/skills
cp -r lemonui-design-system ~/.claude/skills/
```

On Windows the folder is `%USERPROFILE%\.claude\skills\lemonui-design-system\`. For a single project, use `<project>/.claude/skills/lemonui-design-system/` and commit it, so the whole team gets it. Start a new session. The skill triggers on Lemon or Persian RTL UI requests, or explicitly with `/lemonui-design-system`.

## Claude.ai / Claude desktop

Upload `lemonui-design-system.skill` (or the zipped folder) under Settings → Capabilities → Skills, if your plan allows custom skills.

## Codex

Copy the folder to `$CODEX_HOME/skills/` (usually `~/.codex/skills/`) and start a new chat. Invoke it with `$lemonui-design-system`.

## Requirements

- **Pages:** any modern browser. Fonts are bundled, so no network is needed.
- **Scripts:** Node 18+ for `contrast.mjs` and `inline.mjs`. Node 22+ and an installed Chrome, Edge or Chromium for `verify.mjs`; set `CHROME_PATH` if it isn't found. No npm install.

## What's inside

```
SKILL.md                         workflow + when to read what
references/
  lemon-reference.md             documented Lemon baseline (source facts)
  token-workflow.md              brand → roles → contrast → record
  components-and-interactions.md sizing table + interaction contracts
  erp-list-pattern.md            list/grid screen decisions (legacy redesigns)
  rtl-numbers.md                 digits, bidi isolation, dates, mirroring
  validation.md                  checks to run and how to report them
assets/
  fonts/ fonts.css               Vazirmatn 400/600/700 (SIL OFL 1.1)
  tokens.template.css            neutral light tokens (copy into the project)
  tokens.dark.css                optional dark mapping
  components.css                 lm- component layer
  lemon.js                       menu, select, tabs, navigation, theme, toast, digits
  shell.html                     starter RTL ERP list screen (sample data)
scripts/
  contrast.mjs  verify.mjs  inline.mjs
evals/                           test prompts for checking the skill itself
```

The package contains no user brand, screenshots, private data or credentials. It doesn't publish anything or install dependencies.

## Testing the skill

`evals/` holds test cases in the `claude plugin eval` layout. From the skill folder run `claude plugin eval . --allow-tools Write,Edit,Bash`. These are real, billed model runs. You can also ask Claude, through the skill-creator skill, to run them with and without the skill and compare.

## Reicon MCP dependency

Product icons require a connected Reicon MCP server. The metadata declares `reicon` but does not configure the client. See `references/reicon-icons.md`. Legacy icons in the starter and generated select controls are illustrative, not verified Reicon output, and need replacement through that server before product use.
