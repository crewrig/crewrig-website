# CrewRig Website Copy

The page is a single-page narrative: an opening, five problem-to-solution
cases, a getting-started call to action, and a closing. The five cases follow
a recurring cast at **Quaymont** (a logistics-software company, ~80 engineers)
from pain point to resolution, and collectively cover CrewRig's five pillars.

This file is the content source of record. The machine-readable model that the
site actually renders lives in `src/data/cases.ts`; if the two diverge,
`cases.ts` wins. The illustration briefs are mirrored in
`src/assets/illustrations/STYLE.md`.

---

## Hero (opening)

**Badge:** Open source · Works with Claude Code, Gemini CLI, GitHub Copilot CLI & Antigravity CLI

**Headline:** Your team's AI context, built once — not rebuilt by everyone.

**Sub-headline:** CrewRig is a shared configuration layer for AI coding agents.
Profile, conventions, skills, and memory live in one repo, deploy to every CLI,
and get sharper the more your team uses them.

**Primary CTA:** Fork on GitHub → (https://github.com/crewrig/crewrig)

**Secondary CTA:** See how it works ↓ (anchors to the first case)

---

## Case 1 — Layered context

**Title:** The AI that forgets who it's working with
**Persona:** Priya Nair — staff engineer, platform team

**Problem:** Every engineer on Priya's squad starts each AI session from zero.
The model doesn't know their stack, their review rituals, or that the team
settled on a pattern three quarters ago. Priya ends up re-explaining the same
conventions in prompt after prompt — and each teammate explains them slightly
differently, so the AI behaves slightly differently for everyone.

**Solution:** CrewRig stacks configuration into priority-ordered layers
(00–60): agent identity, seniority, organization policy, personal profile, role
expertise, and team norms. Each engineer's profile is personal; the team and
expertise layers are shared. The agent loads the full context automatically, so
it arrives already knowing how Priya's team works — and behaves consistently
for everyone who inherits the same layers.

---

## Case 2 — Shared cross-tool memory

**Title:** The context that walks out the door
**Persona:** Marcus Bell — senior backend engineer

**Problem:** Marcus has spent months teaching his agent the quirks of
Quaymont's freight-routing service — the edge cases, the workarounds, the
reasons behind odd decisions. But all of it lives in his local session history.
When he switches machines, or a teammate picks up the service, that hard-won
context is gone, and the next agent starts blind.

**Solution:** CrewRig wires agents into MemPalace, a persistent memory layer
that survives across sessions and across tools. What an agent learns in one
session — decisions, obstacles, the reasoning behind a fix — is written once and
readable later, by Marcus or by a teammate's agent, whether they're on Claude
Code, Gemini CLI, GitHub Copilot CLI, or Antigravity CLI.

---

## Case 3 — Skill, agent, and command authoring & sharing

**Title:** Written once, somehow rewritten three times
**Persona:** Lena Ostrowski — mid-level full-stack engineer

**Problem:** Lena writes a genuinely useful agent skill — a review helper tuned
to the team's conventions. A week later she finds Marcus has built almost the
same thing for Gemini CLI, because hers only worked in Claude Code. The
capability the team needed already existed; it just couldn't travel.

**Solution:** In CrewRig, skills, agents, and commands are authored once as a
single Markdown file in artifacts/. One build step
(scripts/build-components.sh) compiles that source into outputs for Claude Code,
Gemini CLI, GitHub Copilot CLI, and Antigravity CLI. Lena writes the skill one
time; her teammates install it on any supported CLI.

---

## Case 4 — Harness feedback loop

**Title:** The papercut that never gets fixed
**Persona:** Tomas Reyes — engineering lead

**Problem:** Tomas watches his squad hit the same small frictions with their AI
tooling week after week — a misleading prompt, a tool that does the wrong thing,
a workflow step that's gone stale. Everyone grumbles in standup; nobody files
it; the rough edge survives forever because reporting it costs more than working
around it.

**Solution:** CrewRig builds the feedback loop in. When an agent hits friction
during real work, it tags it via the harness-report skill into a shared store.
The harness-curator then clusters those tags by theme and opens one GitHub issue
per cluster. And because each fix ships back into the shared config, one
engineer's papercut becomes everyone's improvement — the whole team's tooling
gets sharper from each person's friction, instead of everyone routing around the
same wall alone.

---

## Case 5 — Multi-CLI parity

**Title:** Switch the tool, rebuild everything
**Persona:** Aisha Diallo — DevX / tooling engineer

**Problem:** Aisha moves between Claude Code, Gemini CLI, GitHub Copilot CLI,
and Antigravity CLI depending on the task. Without a shared layer, each tool is
its own island: her profile, her skills, her team's conventions all have to be
rebuilt per CLI. Trying a different tool means rewriting her whole setup — so
in practice, nobody does.

**Solution:** CrewRig holds one source configuration in config/ and artifacts/,
and its setup and build scripts deploy it into each CLI's own directory. The
same layered context and the same skills run on Claude Code, Gemini CLI,
GitHub Copilot CLI, and Antigravity CLI. Aisha switches tools without
rebuilding her setup — the context follows her.

---

## Quick Start (getting-started call to action)

**Section title:** Up and running in minutes.
**Sub-title:** No accounts, no SaaS, no waiting list.

### Step 1 — Clone the repo
```bash
git clone https://github.com/crewrig/crewrig.git
```
*Get a local copy of the framework.*

### Step 2 — Install prerequisites
Read the [README → Prerequisites](https://github.com/crewrig/crewrig#prerequisites)
and install the required tools:
Task · Claude Code, Gemini CLI, GitHub Copilot CLI, or Antigravity CLI · fzf · uv · yq

*OS-specific install commands are in the README.*

### Step 3 — Initialize (Claude Code)
```bash
claude /init-personal-profile
claude /init-soul
```

### Step 3 — Initialize (Gemini CLI)
```bash
gemini "/init-personal-profile"
gemini "/init-soul"
```

### Step 3 — Initialize (GitHub Copilot)
```bash
copilot -i "/init-personal-profile"
copilot -i "/init-soul"
```
*Build your personal profile and customize the agent identity. Run from the
repo root so Copilot picks up `.github/skills/`.*

### Step 3 — Initialize (Antigravity CLI)
```bash
claude /init-personal-profile
claude /init-soul
```
*Antigravity CLI reads the same `config/PROFILE.md` and `config/SOUL.md`.
Generate them once with Claude Code or Gemini CLI, then run the Antigravity
setup.*

### Step 4 — Setup (Claude Code / Gemini CLI / GitHub Copilot / Antigravity CLI)
```bash
task setup-claude-interactive
task setup-gemini-interactive
task setup-copilot-interactive
task setup-antigravity-interactive
```
*Deploys the shared config to your harness. The Antigravity CLI harness
additionally requires the `agy` binary on your PATH.*

**Bottom CTA:** View on GitHub →

---

## Footer (closing)

**Tagline:** Your team's AI, finally on the same page.

**Copyright:** © 2026 CrewRig — Open Source

**Links:**
- GitHub
- License (Apache 2.0)
- Contributing
