---
id: "0002"
slug: docs-section-rendering
status: draft
complexity: standard
interaction-mode: INTERMEDIATE
related-issue: 20
version: 1.0.0
---

# Render published docs at crewrig.org/docs

## Intent

crewrig.org gains a documentation section at `crewrig.org/docs` that presents
CrewRig's published core documentation — the same body of docs that lives in
the framework repository — organized into its eight-section taxonomy with
working navigation, pinned to a specific framework version so the published
docs are stable and updated deliberately. A persistent site navigation gives a
visitor a clear path from the marketing page into the documentation.

## Requirements

1. The site SHALL serve a documentation section at the `/docs` path on
   crewrig.org.
2. The documentation section SHALL present the framework's published core
   documentation pages — the subset the framework marks as published — and
   SHALL NOT present pages the framework marks unpublished.
3. The documentation SHALL be organized into the framework's eight-section
   taxonomy (Introduction, Concepts, Adoption, Authoring, Lifecycle, Harness
   engineering, Reference, Architecture & ADRs), with pages ordered within
   each section by the framework's declared navigation order.
4. A section that currently has no published pages SHALL NOT appear in the
   documentation navigation.
5. Each published documentation page SHALL be reachable at its own stable URL
   under `/docs` and SHALL render as readable HTML; the framework's per-page
   metadata block SHALL NOT appear in the rendered output.
6. The documentation navigation SHALL let a visitor move between sections and
   pages without leaving the documentation section.
7. The published documentation shown SHALL be pinned to a specific, recorded
   framework version; advancing to a newer framework version SHALL be a
   deliberate, explicit change rather than an automatic consequence of
   upstream edits.
8. The site SHALL present a persistent navigation header — on both the
   marketing page and the documentation section — carrying a Docs entry point
   and a link to the project's source.
9. The marketing page SHALL link to the documentation section through that
   header.
10. The site SHALL render the framework's documentation faithfully and SHALL
    NOT alter the substance of its prose.
11. The documentation section SHALL be readable without client-side
    JavaScript, consistent with the site's static delivery.

## Scenarios

**Scenario:** A visitor reads the docs end to end

Given a visitor opens `crewrig.org/docs`
When the page loads
Then they see the documentation navigation listing only the sections that have
published pages, with pages in the framework's declared order, and selecting a
page renders it as readable HTML with no metadata block visible.

**Scenario:** The marketing page leads into the docs

Given a visitor on the crewrig.org marketing page
When they activate the Docs entry point in the persistent header
Then they arrive at the documentation section.

**Scenario:** Pinned docs stay stable across upstream edits

Given the framework's documentation changes on its upstream main branch
When crewrig.org is rebuilt without a deliberate version bump
Then the documentation shown on crewrig.org/docs is unchanged.

**Scenario:** An unpublished upstream page never appears

Given a documentation page the framework marks as unpublished
When the documentation section is generated
Then that page is absent from the navigation and has no URL under `/docs`.

**Scenario:** An empty section is hidden

Given a section in the taxonomy with no published pages
When the documentation navigation is built
Then that section does not appear in the navigation.

## Out of scope

- Authoring or editing the documentation content — it lives in the framework
  repository; this site only renders it.
- The mechanism of acquiring the docs (build-time fetch by URL, a submodule,
  or vendoring). The agreed direction — consume the published subset by URL
  from a pinned framework reference — is recorded here for the PLAN stage; the
  concrete mechanism is a PLAN/implementation decision.
- Full-text search, a versioned multi-version switcher, internationalization,
  and analytics on the documentation.
- Redesigning the marketing narrative (spec 0001) beyond adding the persistent
  header.
- The per-section prose content itself (authored upstream as child specs of
  the framework documentation).

## Open questions

- [USER-PARKED] The precise visual treatment of the documentation layout
  (sidebar versus top navigation for sections, typography scale, code-block
  styling) is deferred to implementation. This spec fixes that navigation
  exists and is usable, not its exact styling.
