# CrewRig Website Copy

## Section 1 — Hero

**Badge / tagline:** Open source · Works with Claude Code & Gemini CLI

**Headline:** Your AI knows you. It has no idea who your team is.

**Sub-headline:** CrewRig is the shared layer your AI tools have been missing — versioned prompts, skills, and personas your whole team inherits. Stop reinventing context every standup.

**Primary CTA:** Fork on GitHub →

**Secondary CTA:** Quick Start ↓

---

## Section 2 — Problem

**Section title:** The AI productivity gap is a team problem.

### Card 1
- **Icon:** 🧩 Scattered puzzle pieces
- **Title:** Everyone configures alone
- **Description:** Each developer wires up their own prompts, their own system instructions, their own personas. The same setup work happens N times — and N times, slightly differently.

### Card 2
- **Icon:** 🚪 Door closing behind a silhouette
- **Title:** Context walks out the door
- **Description:** Personas, prompts, and hard-won workflows live in someone's dotfiles. When that engineer leaves, so does the institutional knowledge their AI was carrying.

### Card 3
- **Icon:** 🤖 Robot reading a blank page
- **Title:** Your AI is a stranger to your codebase
- **Description:** The model has never seen your conventions, your modules, or the trade-offs your team already settled three quarters ago. Every prompt re-litigates the basics.

---

## Section 3 — Insight

**Section title:** Power without coordination is noise.

**Body:** Individual AI tooling is zero-sum. Ten developers each iterating on their own prompts produces ten versions of the same wheel — and zero compounding gains. The teams pulling ahead aren't the ones with smarter models. They're the ones with a shared layer underneath. Like a git history for prompts: everyone contributes, everyone inherits.

---

## Section 4 — Solution

**Section title:** Three layers. One coherent stack.

### Pillar 1 — Personal layer
**Title:** Your terminal stays yours
**Description:** Personal settings, your own SOUL persona, the keybindings you can't live without — all of it sits in a private layer the team never touches. Uniformity is not the goal; leverage is.

### Pillar 2 — Community zone
**Title:** Shared context, versioned like code
**Description:** Skills, agent definitions, and team conventions live in a `community-config/` directory the whole crew inherits. Reviewed in PRs, tracked in git, distributed to every harness on the team.

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
6. **∞** — The shared layer compounds while you sleep.

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
- **Description:** Write the config once; ship it to Claude Code and Gemini CLI today, with more harnesses landing. Switching tools no longer means rewriting your prompt library.

### Card 5
- **Title:** Secrets stay where they belong
- **Description:** Credentials, tokens, and private data never enter the shared layer or travel to the model. Least-privilege defaults, vault-friendly, GDPR-aware out of the box.

---

## Section 7 — Quick Start

**Section title:** Up and running in 3 commands.
**Sub-title:** No accounts, no SaaS, no waiting list.

### Step 1 — Fork the repo
```bash
gh repo fork crewrig/crewrig --clone
```
*Get your team's own copy of the framework.*

### Step 2 — Install for your harness
```bash
bash scripts/install-claude-plugin.sh
# or: bash scripts/setup-gemini-interactive.sh
```
*Compile the shared config into your AI tool.*

### Step 3 — Push to your team
```bash
git push origin main
```
*That's it. Your team's AI context is now versioned, shared, and improving.*

---

## Section 8 — Footer

**Tagline:** Your team's AI, finally on the same page.

**Copyright:** © 2025 CrewRig — Open Source

**Links:**
- GitHub
- License (MIT)
- Contributing
