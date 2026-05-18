# CrewRig Website Copy

## Section 1 — Hero

**Badge / tagline:** Open source · Works with Claude Code & Gemini CLI

**Headline:** AI configuration that scales with your team — not just with you.

**Sub-headline:** Stop re-explaining your context to your AI. Build it once, share it with your whole team.

**Primary CTA:** Fork on GitHub →

**Secondary CTA:** Quick Start ↓

---

## Section 2 — Problem

**Section title:** The AI productivity gap is a team problem.

### Card 1
- **Icon:** 🧩 Scattered puzzle pieces
- **Title:** Everyone configures alone
- **Description:** Each developer wires up their own system prompts and personas. The same setup work happens N times — and N times, slightly differently.

### Card 2
- **Icon:** 🚪 Door closing behind a silhouette
- **Title:** Context walks out the door
- **Description:** Personas, system prompts, and hard-won workflows live in someone's dotfiles. When that engineer leaves, so does the institutional knowledge their AI was carrying.

### Card 3
- **Icon:** 🤖 Robot reading a blank page
- **Title:** Your AI is a stranger to your codebase
- **Description:** The model has never seen your conventions, your modules, or the trade-offs your team already settled three quarters ago. Every session re-litigates the basics.

---

## Section 3 — Insight

**Section title:** Power without coordination is noise.

**Body:** Individual AI tooling is zero-sum. Ten developers each iterating on their own system prompts produces ten versions of the same wheel — and zero compounding gains. The teams pulling ahead aren't the ones with smarter models. They're the ones with a shared layer underneath. Like a git history for system prompts: everyone contributes, everyone inherits.

---

## Section 4 — Solution

**Section title:** Three layers. One coherent stack.

### Pillar 1 — System prompt layers
**Title:** Layered system prompts
**Description:** Personal profile, team norms, expertise, and seniority — structured into a coherent context your AI loads automatically. Configurable per person, shared across your team.

### Pillar 2 — Community zone
**Title:** Shared skills and agents
**Description:** A collaborative sandbox where your team builds and shares reusable skills, custom commands, and agent personas — written once, installed anywhere.

### Pillar 3 — Harness loop
**Title:** The framework learns from use
**Description:** When an agent hits friction, it tags it. A curator clusters the signals, files issues, and ships fixes back into the shared config. Every workflow papercut becomes a permanent improvement.

---

## Section 5 — How it works

**Section title:** Six steps. Then it compounds.

1. **Fork** — Clone the CrewRig template into your team's GitHub org.
2. **Profile** — Drop in your team's stack, conventions, and review rituals.
3. **Deploy** — One script compiles the config into Claude Code, Gemini CLI, and every supported harness.
4. **Share** — Push to main. Every developer's next session inherits the update.
5. **Improve** — Agents report friction; the curator turns signals into fixes.
6. **∞** — Every friction your team tags becomes a ticket. Automatically.

---

## Section 6 — Features

**Section title:** Built for teams that ship.

### Card 1
- **Title:** Layered context, no conflicts
- **Description:** Personal, community, and project rules merge in a predictable order. Nobody's personal preferences ever leak into the team config — and the team config never overrides someone's local setup.

### Card 2
- **Title:** Reusable skills, on tap
- **Description:** A growing library of community-authored agent skills your team can import and customize. The capability you needed last week is probably already written.

### Card 3
- **Title:** Friction becomes fuel
- **Description:** A built-in feedback loop captures the rough edges agents encounter in real work, curates them, and ships fixes back to the shared layer. Your config gets sharper every sprint.

### Card 4
- **Title:** Tool-agnostic by design
- **Description:** Write the config once; ship it to Claude Code and Gemini CLI today, with more harnesses landing. Switching tools no longer means rewriting your system prompt library.

### Card 5
- **Title:** Secrets stay where they belong
- **Description:** Credentials, tokens, and private data never enter the shared layer or travel to the model. Least-privilege defaults, vault-friendly, GDPR-aware out of the box.

---

## Section 7 — Quick Start

**Section title:** Up and running in minutes.
**Sub-title:** No accounts, no SaaS, no waiting list.

### Step 1 — Clone the repo
```bash
git clone https://github.com/crewrig/crewrig.git
```
*Get a local copy of the framework.*

### Step 2 — Install prerequisites
Read the [README → Prerequisites](https://github.com/crewrig/crewrig#prerequisites) and install the required tools:
Task · Gemini CLI or Claude Code · fzf · uv · yq

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
*Build your personal profile and customize the agent identity.*

### Step 4 — Setup (Claude Code)
```bash
task setup-claude-interactive
```

### Step 4 — Setup (Gemini CLI)
```bash
task setup-gemini-interactive
```
*Deploys the shared config to your harness.*

**Bottom CTA:** View on GitHub →

---

## Section 8 — Footer

**Tagline:** Your team's AI, finally on the same page.

**Copyright:** © 2026 CrewRig — Open Source

**Links:**
- GitHub
- License (Apache 2.0)
- Contributing
