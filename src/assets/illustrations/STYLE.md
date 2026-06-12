# Illustration style guide

This note keeps the five case illustrations on crewrig.org visually
coherent. Every prompt sent to the image model is the **style preamble**
below, concatenated with one **case brief**. The case briefs are the
single source of truth in `src/data/cases.ts` (`illustration.prompt`);
they are mirrored here for human review and prompt-engineering iteration.
If a brief here and the one in `cases.ts` ever diverge, `cases.ts` wins —
it is what the generator and the site actually read.

## Art direction (style preamble)

> A single, coherent world: Quaymont's open-plan engineering office, shot
> in a warm photographic, cinematic style — realistic people, shallow
> depth of field, natural and practical lighting (desk lamps, evening
> window light, glass-wall reflections) rather than flat studio light.
> Across all five frames the same five recognizable individuals recur with
> stable wardrobe, build, and demeanour, so the viewer follows them from
> pain to resolution. The one stylized element is light as metaphor —
> layered panels, persistent memory drawers, fan-out streams, converging
> cards, a bridging ribbon — always rendered in the brand's violet accent
> (#7c3aed) against deep, low-key backgrounds so the illustrations sit
> naturally on the dark theme. Realism for the people and the room;
> restrained luminous abstraction for the CrewRig mechanism. Mood arc per
> case: muted, slightly weary 'problem' framing resolving into warm,
> composed 'solution' framing.

## Recurring cast

The world is **Quaymont**, a logistics-software company (~80 engineers).
The same five people recur across all frames with stable wardrobe, build,
and demeanour:

- **Priya Nair** — staff engineer, platform team. (Case 1 lead.)
- **Marcus Bell** — senior backend engineer. (Case 2 lead.)
- **Lena Ostrowski** — mid-level full-stack engineer. (Case 3 lead.)
- **Tomas Reyes** — engineering lead. (Case 4 lead.)
- **Aisha Diallo** — DevX / tooling engineer. (Case 5 lead.)

Each case foregrounds its lead persona; the others appear in soft
background focus to tie the series together.

## Case briefs

### 1 — Layered context (`layered-context.png`) — Priya Nair

Priya stands at a glass wall in a quiet open-plan office, arranging
translucent, stacked horizontal panels of light (suggesting layered
config), each panel faintly labelled. Marcus and Lena are visible at desks
in soft background focus. Evening light, warm key light on Priya, the
layered panels glowing in violet. Mood: composed, in-control, the moment a
system clicks into order.

### 2 — Shared cross-tool memory (`shared-memory.png`) — Marcus Bell

Marcus at his desk in the evening, packing up to leave, laptop
half-closed. Behind him, a warm glowing archive of memory — drawers of
light receding into depth, persisting after he's gone — instead of the
usual fade-to-black of a closed session. Lena, at a nearby desk, has the
same glow reaching toward her screen. Violet accent on the memory
structure, warm desk lamps. Mood: continuity, relief, knowledge that
stays.

### 3 — Skill, agent, and command authoring & sharing (`authoring-sharing.png`) — Lena Ostrowski

Lena at a large monitor, having just authored a single document, which
fans out into three identical glowing copies flowing toward three labelled
terminals (Claude Code, Gemini, Copilot). Marcus and Aisha lean in,
recognizing it. Bright, collaborative daytime light with violet accents on
the three output streams. Mood: the satisfaction of leverage — one effort,
three destinations.

### 4 — Harness feedback loop (`harness-loop.png`) — Tomas Reyes

Tomas at a standup board covered in small recurring sticky-note frictions;
in the resolution half, those scattered notes converge and resolve into a
few clean, labelled issue cards, shared and visible to the whole team. The
cast (Priya, Marcus, Lena) gathered loosely around. Cool morning office
light warming as the clutter resolves; violet accent on the converged
issue cards. Mood: the quiet relief of a mess finally becoming a shared
list.

### 5 — Multi-CLI parity (`multi-cli-parity.png`) — Aisha Diallo

Aisha at a multi-monitor setup, the three CLIs open side by side, the same
glowing configuration bridging across all three screens as one continuous
ribbon of light. The rest of the cast visible deeper in the office, tying
the series together. Evening, focused, three screens lit, a single violet
thread connecting them. Mood: fluency and freedom — one context, any tool.
