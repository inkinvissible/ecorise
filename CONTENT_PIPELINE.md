# Ecorise content publishing pipeline

## Architecture

Sanity remains the source of truth, but public pages do not query Sanity from the browser.

```text
Sanity publish / unpublish / delete
        ↓
Sanity Function: rebuild-ecorise
        ↓ repository_dispatch
GitHub Actions: Publish static site
        ↓
Build fetches published Content Lake data
        ↓
_site/bitacora.html
_site/bitacora/<slug>/index.html
_site/sitemap.xml
        ↓
GitHub Pages
```

A daily scheduled GitHub Action is kept as a fallback in case an event trigger is missed.

## Local development

Build the same public output used in production:

```bash
npm install
npm run build
python -m http.server 8000 --directory _site
```

Then open:

```text
http://localhost:8000/bitacora.html
```

`npm run build` only lists indexable articles in the Bitácora. Published documents with `seo.noIndex: true` are still generated as static pages, but are omitted from the listing and sitemap.

For editorial QA, include those pages in the local Bitácora too:

```bash
npm run build:preview
python -m http.server 8000 --directory _site
```

This removes the need to configure localhost CORS in Sanity because the browser never fetches Content Lake.

## URL model

Articles are generated as clean static routes:

```text
/bitacora/<slug>/
```

The old `articulo.html?slug=...` route remains only as a `noindex` compatibility redirect.

## SEO behavior

For every published article the build generates:

- HTML body at build time
- unique `<title>` and description
- self-referencing canonical
- Open Graph metadata
- Article JSON-LD
- FAQPage JSON-LD when FAQs exist
- clean URL under `/bitacora/<slug>/`

If `seo.noIndex` is true, the page is still generated for QA/direct access but receives `noindex,follow` and is excluded from `sitemap.xml`.

## GitHub Pages one-time setup

After this branch is merged, set the repository Pages source to **GitHub Actions**:

1. GitHub repository → Settings → Pages.
2. Under Build and deployment, choose **GitHub Actions** as Source.
3. Keep the existing custom domain `ecorise.com.ar` configured. The build artifact contains the existing `CNAME` file.

The workflow `.github/workflows/publish-content.yml` deploys `_site` on:

- every push to `main`
- `repository_dispatch` with event `sanity-content-changed`
- manual dispatch
- daily fallback schedule

## Sanity → GitHub trigger one-time setup

The bridge lives in `sanity-pipeline/` and uses a Sanity Function so the GitHub token stays server-side.

### 1. Create a GitHub fine-grained token

Create a token scoped only to `inkinvissible/ecorise` with repository **Contents: Read and write** permission. This is required by GitHub's repository-dispatch endpoint.

Do not commit or paste this token into source files.

### 2. Install pipeline dependencies

```bash
cd sanity-pipeline
npm install
```

### 3. Initialize the Sanity Blueprint stack once

```bash
npx sanity@latest blueprints init . --type ts --stack-name production --project-id 8nstak41
```

### 4. Store the GitHub token as a Sanity Function secret

```bash
npx sanity@latest functions env add rebuild-ecorise GITHUB_DISPATCH_TOKEN
```

The CLI will request the value interactively.

### 5. Plan and deploy

```bash
npx sanity@latest blueprints plan
npx sanity@latest blueprints deploy
```

The function reacts only to published `article` and `category` lifecycle events. Draft edits do not rebuild the public site.

## Validation

Deterministic CI tests do not depend on live CMS state:

```bash
npm run test:content
```

This builds from `tests/fixtures/sanity-build.json` and verifies clean routes, canonicals, `noindex`, sitemap inclusion/exclusion and absence of browser-side Sanity fetching.

The production publish workflow uses live Sanity data and validates the generated artifact again before deployment.
