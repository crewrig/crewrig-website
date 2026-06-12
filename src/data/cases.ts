/**
 * Content model for the crewrig.org storytelling page.
 *
 * The five cases are the narrative spine of the page: each pairs one concrete
 * enterprise pain point in AI-agent usage with the CrewRig resolution, carried
 * by a recurring named persona. The `illustration.prompt` is the single source
 * of truth for image generation — `scripts/generate-illustrations.mjs` reads it
 * and `src/assets/illustrations/STYLE.md` mirrors it for human review.
 *
 * Copy here is user-validated for message integrity — do not paraphrase.
 */

/** One of CrewRig's five pillars, used as the case's eyebrow label. */
export type Pillar =
  | 'Layered context'
  | 'Shared cross-tool memory'
  | 'Skill, agent, and command authoring & sharing'
  | 'Harness feedback loop'
  | 'Multi-CLI parity';

export interface Persona {
  name: string;
  role: string;
}

export interface Illustration {
  /** Bare filename under `src/assets/illustrations/` (e.g. `layered-context.png`). */
  file: string;
  /** Accessible alt text describing the rendered scene. */
  alt: string;
  /** Exact generation prompt (the case-specific brief, sans the shared STYLE preamble). */
  prompt: string;
}

export interface Case {
  /** Stable slug — drives the section `id` (`case-<id>`) and the illustration filename. */
  id: string;
  pillar: Pillar;
  title: string;
  persona: Persona;
  problem: string;
  solution: string;
  illustration: Illustration;
}

export interface Hero {
  badge: string;
  headline: string;
  subHeadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export const hero: Hero = {
  badge:
    'Open source · Works with Claude Code, Gemini CLI & GitHub Copilot CLI',
  headline:
    "Your team's AI context, built once — not rebuilt by everyone.",
  subHeadline:
    'CrewRig is a shared configuration layer for AI coding agents. Profile, conventions, skills, and memory live in one repo, deploy to every CLI, and get sharper the more your team uses them.',
  primaryCta: {
    label: 'Fork on GitHub',
    href: 'https://github.com/crewrig/crewrig',
  },
  secondaryCta: {
    label: 'See how it works',
    href: '#case-layered-context',
  },
};

/** Footer tagline. */
export const tagline = "Your team's AI, finally on the same page.";

export const cases: Case[] = [
  {
    id: 'layered-context',
    pillar: 'Layered context',
    title: "The AI that forgets who it's working with",
    persona: { name: 'Priya Nair', role: 'staff engineer, platform team' },
    problem:
      "Every engineer on Priya's squad starts each AI session from zero. The model doesn't know their stack, their review rituals, or that the team settled on a pattern three quarters ago. Priya ends up re-explaining the same conventions in prompt after prompt — and each teammate explains them slightly differently, so the AI behaves slightly differently for everyone.",
    solution:
      "CrewRig stacks configuration into priority-ordered layers (00–60): agent identity, seniority, organization policy, personal profile, role expertise, and team norms. Each engineer's profile is personal; the team and expertise layers are shared. The agent loads the full context automatically, so it arrives already knowing how Priya's team works — and behaves consistently for everyone who inherits the same layers.",
    illustration: {
      file: 'layered-context.png',
      alt: 'Priya Nair arranges translucent stacked panels of violet light along a glass office wall while teammates work in soft background focus.',
      prompt:
        'Priya stands at a glass wall in a quiet open-plan office, arranging translucent, stacked horizontal panels of light (suggesting layered config), each panel faintly labelled. Marcus and Lena are visible at desks in soft background focus. Evening light, warm key light on Priya, the layered panels glowing in violet. Mood: composed, in-control, the moment a system clicks into order.',
    },
  },
  {
    id: 'shared-memory',
    pillar: 'Shared cross-tool memory',
    title: 'The context that walks out the door',
    persona: { name: 'Marcus Bell', role: 'senior backend engineer' },
    problem:
      "Marcus has spent months teaching his agent the quirks of Quaymont's freight-routing service — the edge cases, the workarounds, the reasons behind odd decisions. But all of it lives in his local session history. When he switches machines, or a teammate picks up the service, that hard-won context is gone, and the next agent starts blind.",
    solution:
      "CrewRig wires agents into MemPalace, a persistent memory layer that survives across sessions and across tools. What an agent learns in one session — decisions, obstacles, the reasoning behind a fix — is written once and readable later, by Marcus or by a teammate's agent, whether they're on Claude Code, Gemini CLI, or Copilot.",
    illustration: {
      file: 'shared-memory.png',
      alt: "Marcus packs up to leave in the evening while a warm glowing archive of memory drawers persists behind him, its violet light reaching toward Lena's screen nearby.",
      prompt:
        "Marcus at his desk in the evening, packing up to leave, laptop half-closed. Behind him, a warm glowing archive of memory — drawers of light receding into depth, persisting after he's gone — instead of the usual fade-to-black of a closed session. Lena, at a nearby desk, has the same glow reaching toward her screen. Violet accent on the memory structure, warm desk lamps. Mood: continuity, relief, knowledge that stays.",
    },
  },
  {
    id: 'authoring-sharing',
    pillar: 'Skill, agent, and command authoring & sharing',
    title: 'Written once, somehow rewritten three times',
    persona: { name: 'Lena Ostrowski', role: 'mid-level full-stack engineer' },
    problem:
      "Lena writes a genuinely useful agent skill — a review helper tuned to the team's conventions. A week later she finds Marcus has built almost the same thing for Gemini CLI, because hers only worked in Claude Code. The capability the team needed already existed; it just couldn't travel.",
    solution:
      'In CrewRig, skills, agents, and commands are authored once as a single Markdown file in artifacts/. One build step (scripts/build-components.sh) compiles that source into outputs for Claude Code, Gemini CLI, and GitHub Copilot CLI. Lena writes the skill one time; her teammates install it on any supported CLI.',
    illustration: {
      file: 'authoring-sharing.png',
      alt: 'Lena watches a single authored document fan out into three identical glowing copies flowing toward terminals labelled Claude Code, Gemini, and Copilot, as Marcus and Aisha lean in.',
      prompt:
        'Lena at a large monitor, having just authored a single document, which fans out into three identical glowing copies flowing toward three labelled terminals (Claude Code, Gemini, Copilot). Marcus and Aisha lean in, recognizing it. Bright, collaborative daytime light with violet accents on the three output streams. Mood: the satisfaction of leverage — one effort, three destinations.',
    },
  },
  {
    id: 'harness-loop',
    pillar: 'Harness feedback loop',
    title: 'The papercut that never gets fixed',
    persona: { name: 'Tomas Reyes', role: 'engineering lead' },
    problem:
      "Tomas watches his squad hit the same small frictions with their AI tooling week after week — a misleading prompt, a tool that does the wrong thing, a workflow step that's gone stale. Everyone grumbles in standup; nobody files it; the rough edge survives forever because reporting it costs more than working around it.",
    solution:
      "CrewRig builds the feedback loop in. When an agent hits friction during real work, it tags it via the harness-report skill into a shared store. The harness-curator then clusters those tags by theme and opens one GitHub issue per cluster. And because each fix ships back into the shared config, one engineer's papercut becomes everyone's improvement — the whole team's tooling gets sharper from each person's friction, instead of everyone routing around the same wall alone.",
    illustration: {
      file: 'harness-loop.png',
      alt: 'Tomas at a standup board where scattered sticky-note frictions converge and resolve into a few clean labelled issue cards, with Priya, Marcus, and Lena gathered around.',
      prompt:
        'Tomas at a standup board covered in small recurring sticky-note frictions; in the resolution half, those scattered notes converge and resolve into a few clean, labelled issue cards, shared and visible to the whole team. The cast (Priya, Marcus, Lena) gathered loosely around. Cool morning office light warming as the clutter resolves; violet accent on the converged issue cards. Mood: the quiet relief of a mess finally becoming a shared list.',
    },
  },
  {
    id: 'multi-cli-parity',
    pillar: 'Multi-CLI parity',
    title: 'Switch the tool, rebuild everything',
    persona: { name: 'Aisha Diallo', role: 'DevX / tooling engineer' },
    problem:
      'Aisha moves between Claude Code, Gemini CLI, and Copilot depending on the task. Without a shared layer, each tool is its own island: her profile, her skills, her team\'s conventions all have to be rebuilt per CLI. Trying a different tool means rewriting her whole setup — so in practice, nobody does.',
    solution:
      'CrewRig holds one source configuration in config/ and artifacts/, and its setup and build scripts deploy it into each CLI\'s own directory. The same layered context and the same skills run on Claude Code, Gemini CLI, and GitHub Copilot CLI. Aisha switches tools without rebuilding her setup — the context follows her.',
    illustration: {
      file: 'multi-cli-parity.png',
      alt: 'Aisha at a multi-monitor setup with three CLIs open side by side, a single continuous ribbon of violet light bridging the same configuration across all three screens.',
      prompt:
        'Aisha at a multi-monitor setup, the three CLIs open side by side, the same glowing configuration bridging across all three screens as one continuous ribbon of light. The rest of the cast visible deeper in the office, tying the series together. Evening, focused, three screens lit, a single violet thread connecting them. Mood: fluency and freedom — one context, any tool.',
    },
  },
];
