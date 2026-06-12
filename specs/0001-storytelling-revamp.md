---
id: "0001"
slug: storytelling-revamp
status: draft
complexity: standard
interaction-mode: INTERMEDIATE
related-issue: 16
version: 1.0.0
---

# crewrig.org storytelling revamp

## Intent

crewrig.org is rebuilt as a single-page narrative that leads a first-time
visitor through a sequence of concrete enterprise situations where AI coding
agents fall short, and in each situation shows how CrewRig resolves it. The
story is carried by recurring, believable characters and realistic
illustrations, so that a visitor with no prior context understands what
CrewRig is and why it matters by the time they reach the bottom of the page.

## Requirements

1. The site SHALL present its narrative on a single page, structured in this
   order: an opening, exactly five problem-to-solution cases, a
   getting-started call to action, and a closing.
2. Each of the five cases SHALL pair one concrete enterprise pain point in
   AI-agent usage with the corresponding CrewRig resolution, presented in its
   own dedicated section.
3. The five cases SHALL collectively cover CrewRig's five pillars: layered
   context, shared cross-tool memory, skill and agent authoring and sharing,
   the harness feedback loop, and multi-CLI parity.
4. Each case SHALL be illustrated by one realistic, photographic-style
   illustration depicting that situation.
5. The illustrations SHALL feature recurring, recognizable characters and a
   unified visual direction across all five cases, so that the same people are
   followed from pain point to resolution.
6. Every illustration SHALL be produced ahead of the site build and committed
   to the repository, and the site build SHALL NOT call any image-generation
   service.
7. Each committed illustration SHALL carry a traceable provenance record
   stating at least the exact generation prompt, the generating model
   identifier, the generation date, and any parameters required to reproduce
   it.
8. The provenance records SHALL be versioned in the repository alongside the
   illustrations they describe.
9. Each case SHALL introduce a named persona with a role and an organizational
   context, and the persona set SHALL be consistent with the recurring
   characters depicted in the illustrations.
10. The site SHALL retain a getting-started path that lets a visitor begin
    adopting CrewRig without leaving the page.
11. All site copy and all committed content SHALL be in English.

## Scenarios

**Scenario:** First-time visitor follows the narrative end to end

Given a visitor arrives at crewrig.org with no prior knowledge of CrewRig
When they scroll from the top of the page to the bottom
Then they encounter five problem-to-solution cases in dedicated sections, each
with a recurring persona and a realistic illustration, and they arrive at a
getting-started call to action.

**Scenario:** Any illustration is reproducible from its provenance

Given any illustration shown on the site
When a contributor inspects the repository
Then they find a provenance record carrying the exact prompt, the model
identifier, the generation date, and the parameters sufficient to regenerate
that illustration.

**Scenario:** Untraceable image is caught before it ships

Given an illustration committed without a corresponding provenance record
When the site content is reviewed
Then the missing provenance is detectable, so that no untraceable image is
published.

**Scenario:** Build succeeds without any image service

Given a build environment with no access to any image-generation service
When the site is built
Then the build completes successfully using only the committed illustrations.

## Out of scope

- The detailed marketing copy wording for each case — authored at
  implementation time (the site's `COPY.md`), not fixed by this spec.
- The `crewrig.org/docs` documentation section and its rendering. That is a
  separate workstream, qualified upstream by CrewRig spec 0027; this spec
  covers only the marketing narrative page.
- The concrete image-generation tooling and cloud setup used to produce the
  illustrations (the generating project, authentication, and the generation
  script). This spec fixes the storage and provenance requirements, not the
  generation mechanism, which is a PLAN and implementation concern.
- Multi-language site: English only.
- A redesign of the existing color system and typography beyond what the
  narrative restructure requires.
- Analytics, A/B testing, and any content-management-system integration.

## Open questions

- [USER-PARKED] The identity of the recurring personas (names, roles,
  organizational archetypes) and the per-case copy are deferred to
  implementation. This spec fixes that there are five persona-driven cases
  covering the five pillars, not who the personas are.
- [USER-PARKED] Two of the five pillars (multi-CLI parity and the harness
  loop) read more as solution mechanisms than as felt pains; the
  implementation MAY frame each such case around the absence of that mechanism
  as the pain. Deferred to copy authoring; does not change the five-case,
  five-pillar structure fixed by Requirement 3.
