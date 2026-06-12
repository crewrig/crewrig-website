# Specs — crewrig-website

This directory bootstraps a lightweight specification lifecycle for the
crewrig.org site, mirroring the upstream CrewRig spec format (see the
`crewrig` repository, `docs/spec-format.md`).

Each spec is a Markdown file `specs/<NNNN>-<slug>.md` with YAML frontmatter
(`id`, `slug`, `status`, `complexity`, `interaction-mode`, `related-issue`,
`version`) followed by five body sections, in order: `## Intent`,
`## Requirements`, `## Scenarios`, `## Out of scope`, `## Open questions`.

A spec qualifies the WHAT before implementation. Marketing and presentation
specs live here, deliberately kept out of the upstream framework repository so
that an organization adopting CrewRig never inherits the site's marketing
specs.
