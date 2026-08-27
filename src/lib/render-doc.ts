/**
 * Render a vendored framework Markdown page to static HTML.
 *
 * This is the load-bearing renderer for spec 0002. It satisfies four review
 * findings (issue #22), each anchored below:
 *
 *   F4 (must) — strip the page's `crewrig-doc:` metadata block by keying on
 *     the sentinel, on the RAW markdown before render, so it never reaches the
 *     output (markdown-it, like most pipelines, passes HTML comments through).
 *     Fence-aware (bugfix, crewrig-website#32): the strip only fires OUTSIDE a
 *     fenced code block, so a fence that merely illustrates the metadata
 *     grammar (e.g. publication-contract.md's own "Example" section) survives
 *     verbatim instead of being silently emptied.
 *   F1 (must) — rewrite EVERY relative link (any extension, not just `.md`):
 *     resolve against the page's repo-root path; in-manifest -> `/docs/<slug>`,
 *     out-of-manifest -> absolute upstream blob URL at the pinned ref. Leave
 *     absolute URLs and pure `#anchors` alone.
 *   F2 (must) — honor Kramdown `{#explicit-id}` heading anchors: strip the
 *     literal `{#...}` from the heading text AND set the heading id from it, so
 *     neither the brace text leaks nor in-page `#id` links dangle.
 *   F3 (should) — route relative image targets through the same in/out
 *     classifier (-> raw upstream URL); defensive, no live images today.
 *
 * Fenced code blocks and normal heading anchors are preserved (R10/R11).
 * Output is static HTML; the docs section needs no client-side JS.
 *
 * markdown-it was chosen over Astro's native remark/rehype pipeline because
 * the link/anchor rewriting needs the page's repo-root path threaded through
 * render and direct token access — awkward to thread through Astro's
 * file-based Markdown integration. See ARCHITECTURE.md.
 */

import MarkdownIt from 'markdown-it';
import pinJson from '../../docs-pin.json';
import { getManifestPathSet, pathToSlug } from './docs-manifest';

interface DocsPin {
  repo: string;
  ref: string;
  fetched_at: string | null;
}

const pin = pinJson as DocsPin;
const MANIFEST_PATHS = getManifestPathSet();

const BLOB_BASE = `https://github.com/${pin.repo}/blob/${pin.ref}`;
const RAW_BASE = `https://raw.githubusercontent.com/${pin.repo}/${pin.ref}`;
// Repo web root, for relative targets that escape above the repo root — those
// are not versioned files (e.g. `../../../../issues/80`); they belong to a
// GitHub web route (issues/, pull/, …), so they must NOT carry a `blob/<ref>`.
const REPO_WEB_BASE = `https://github.com/${pin.repo}`;

/** Sentinel-keyed metadata block: `<!-- crewrig-doc: ... -->` (F4). */
const METADATA_BLOCK = /<!--\s*crewrig-doc:[\s\S]*?-->/g;

/** Kramdown explicit heading id on an ATX heading line (F2). */
const HEADING_ID = /\s*\{#([A-Za-z0-9_-]+)\}\s*$/;

const md = new MarkdownIt({
  html: false, // do not pass raw HTML (incl. the metadata comment) through
  linkify: false,
  typographer: false,
});

/** Per-render context, threaded through markdown-it's `env`. */
interface RenderEnv {
  pagePath: string;
  /** Explicit Kramdown heading ids, keyed by heading ordinal (F2). */
  ids: Map<number, string>;
  /** Mutable counter for matching headings to `ids` during render. */
  headingCounter: number;
}

/**
 * Slugify heading text the way the auto-anchor does, so internal links to
 * auto-slugged headings keep working (R10/R11). GitHub-ish: lowercase, drop
 * non-word chars, spaces -> hyphens.
 */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Resolve a relative target against a repo-root-relative page path, producing
 * a normalized repo-root path (POSIX). Drops any `#fragment`/`?query`.
 *
 *   resolveRepoPath('docs/adr/0005-x.md', '../../../../issues/80')
 *     -> 'issues/80'
 *   resolveRepoPath('docs/adoption-guide.md', 'org/README.md')
 *     -> 'docs/org/README.md'
 */
function resolveRepoPath(pagePath: string, target: string): {
  path: string;
  fragment: string;
  escaped: boolean;
} {
  const hashIndex = target.indexOf('#');
  const fragment = hashIndex >= 0 ? target.slice(hashIndex) : '';
  const noHash = hashIndex >= 0 ? target.slice(0, hashIndex) : target;
  const queryless = noHash.split('?')[0];

  // Start from the page's directory.
  const dirParts = pagePath.split('/').slice(0, -1);
  const parts = [...dirParts];
  let escaped = false;
  for (const seg of queryless.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      // A `..` applied at the repo root escapes the tree: the target is not a
      // versioned file but a repo web route (issues/, pull/, …).
      if (parts.length > 0) parts.pop();
      else escaped = true;
    } else parts.push(seg);
  }
  return { path: parts.join('/'), fragment, escaped };
}

/** True for targets that must be left untouched: absolute URLs / pure anchors. */
function isExternalOrAnchor(href: string): boolean {
  return (
    href.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(href) || // scheme:  http:, mailto:, etc.
    href.startsWith('//')
  );
}

/** Rewrite one relative link href against the page path (F1). */
function rewriteLink(href: string, pagePath: string): string {
  if (isExternalOrAnchor(href)) return href;
  const { path, fragment, escaped } = resolveRepoPath(pagePath, href);
  if (!escaped && MANIFEST_PATHS.has(path)) {
    return `/docs/${pathToSlug(path)}${fragment}`;
  }
  // Escaped the repo tree -> a GitHub web route (issues/, pull/, …), not a file.
  if (escaped) {
    return `${REPO_WEB_BASE}/${path}${fragment}`;
  }
  // Out of manifest, in-tree file -> absolute upstream blob URL at the ref.
  return `${BLOB_BASE}/${path}${fragment}`;
}

/** Rewrite one relative image src against the page path (F3). */
function rewriteImage(src: string, pagePath: string): string {
  if (isExternalOrAnchor(src)) return src;
  const { path } = resolveRepoPath(pagePath, src);
  // Images are not in the manifest; route to the raw upstream blob at the ref.
  return `${RAW_BASE}/${path}`;
}

/**
 * Pre-process the raw markdown:
 *   - strip the metadata block (F4)
 *   - extract Kramdown `{#id}` from headings, recording id per heading line
 *     and removing the literal brace text (F2)
 */
function preprocess(raw: string): { source: string; ids: Map<number, string> } {
  const lines = raw.split('\n');
  const ids = new Map<number, string>();
  let headingCount = 0;
  let inFence = false;

  const out = lines.map((line) => {
    const fenceMatch = /^(\s*)(```|~~~)/.test(line);
    if (fenceMatch) inFence = !inFence;
    if (inFence || fenceMatch) return line;

    // F4 — strip the metadata block, but only OUTSIDE a fenced code block: a
    // fence illustrating the grammar (e.g. publication-contract.md's own
    // "Example" section) must survive verbatim, not be silently emptied.
    line = line.replace(METADATA_BLOCK, '');

    if (/^#{1,6}\s/.test(line)) {
      const m = line.match(HEADING_ID);
      if (m) {
        ids.set(headingCount, m[1]);
        line = line.replace(HEADING_ID, '');
      }
      headingCount += 1;
    }
    return line;
  });

  return { source: out.join('\n'), ids };
}

// --- markdown-it renderer rules, registered ONCE at module scope. ---
// Per-page state (page path, heading ids) is threaded through `env`, never via
// closures, so renders cannot chain or leak across pages.

const renderToken: NonNullable<MarkdownIt.Renderer.RenderRule> = (
  tokens,
  idx,
  options,
  _env,
  self,
) => self.renderToken(tokens, idx, options);

// F1 — rewrite relative links.
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const e = env as RenderEnv;
  const hrefIdx = token.attrIndex('href');
  if (hrefIdx >= 0) {
    token.attrs![hrefIdx][1] = rewriteLink(token.attrs![hrefIdx][1], e.pagePath);
  }
  return renderToken(tokens, idx, options, env, self);
};

// F3 — rewrite relative images.
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const e = env as RenderEnv;
  const srcIdx = token.attrIndex('src');
  if (srcIdx >= 0) {
    token.attrs![srcIdx][1] = rewriteImage(token.attrs![srcIdx][1], e.pagePath);
  }
  return renderToken(tokens, idx, options, env, self);
};

// F2 + normal anchors — set a stable id on every heading; honor explicit
// Kramdown ids where present, else auto-slug from the heading text.
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const e = env as RenderEnv;
  const inline = tokens[idx + 1];
  const text = inline && inline.type === 'inline' ? inline.content : '';
  const explicit = e.ids.get(e.headingCounter);
  const id = explicit ?? slugifyHeading(text);
  e.headingCounter += 1;
  if (id) token.attrSet('id', id);
  return renderToken(tokens, idx, options, env, self);
};

export interface RenderedDoc {
  html: string;
}

/**
 * Render a vendored Markdown string to HTML for the page at `pagePath`
 * (repo-root-relative, e.g. `docs/adr/0010-...md`). `pagePath` drives all
 * relative-link/image resolution.
 */
export function renderDoc(raw: string, pagePath: string): RenderedDoc {
  const { source, ids } = preprocess(raw);
  const env: RenderEnv = { pagePath, ids, headingCounter: 0 };
  const html = md.render(source, env);
  return { html };
}
