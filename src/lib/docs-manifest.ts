/**
 * Typed loader for the vendored documentation manifest.
 *
 * Reads `vendor/docs/index.json` (the framework's `docs/index.json`, vendored
 * at the pinned ref by `scripts/sync-docs.mjs`) and exposes it in the exact
 * order the framework declares: sections in manifest array order, pages in
 * `nav_order` order. Empty sections are already omitted upstream (the
 * generator only emits sections with at least one published page), so the nav
 * builder trusts the manifest verbatim — no client-side filtering (spec 0002
 * R3/R4).
 */

import manifestJson from '../../vendor/docs/index.json';

export interface DocsManifestPage {
  /** Human-readable navigation title. */
  title: string;
  /** Repository-root-relative POSIX path, e.g. `docs/adr/0010-...md`. */
  path: string;
  /** Position within the section's reading order (ascending). */
  nav_order: number;
}

export interface DocsManifestSection {
  /** Section enum value, e.g. `reference`. */
  section: string;
  /** Human-readable section title, e.g. `Reference`. */
  title: string;
  pages: DocsManifestPage[];
}

export interface DocsManifest {
  version: number;
  sections: DocsManifestSection[];
}

/** A page enriched with its derived route slug. */
export interface DocsPage extends DocsManifestPage {
  /** Route slug under `/docs`, e.g. `adr/0010-spec-plan-review-lifecycle`. */
  slug: string;
}

const manifest = manifestJson as DocsManifest;

/**
 * Derive the route slug from a manifest path: strip the leading `docs/` and
 * the trailing `.md`. Stable across rebuilds and independent of nav order.
 *
 *   docs/adr/0010-spec-plan-review-lifecycle.md
 *     -> adr/0010-spec-plan-review-lifecycle
 */
export function pathToSlug(path: string): string {
  return path.replace(/^docs\//, '').replace(/\.md$/, '');
}

/** The full manifest, sections in declared order. */
export function getManifest(): DocsManifest {
  return manifest;
}

/** Sections with their pages, each page enriched with its slug. */
export function getSections(): (Omit<DocsManifestSection, 'pages'> & {
  pages: DocsPage[];
})[] {
  return manifest.sections.map((section) => ({
    ...section,
    pages: section.pages.map((page) => ({
      ...page,
      slug: pathToSlug(page.path),
    })),
  }));
}

/** Flat list of every published page, in section then nav_order order. */
export function getAllPages(): DocsPage[] {
  return manifest.sections.flatMap((section) =>
    section.pages.map((page) => ({ ...page, slug: pathToSlug(page.path) })),
  );
}

/** The set of manifest `path` keys — used by the link rewriter (in/out). */
export function getManifestPathSet(): Set<string> {
  return new Set(getAllPages().map((p) => p.path));
}
