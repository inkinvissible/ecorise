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
_site/productos/index.html
_site/productos/<slug>/index.html
_site/soluciones/index.html
_site/soluciones/<slug>/index.html
_site/casos/index.html
_site/casos/<slug>/index.html
_site/sitemap.xml
        ↓
GitHub Pages / preview deployment
```

A daily scheduled GitHub Action is kept as a fallback in case an event trigger is missed.

## Local development

Build the same public output used in production:

```bash
npm install
npm run build
python -m http.server 8000 --directory _site
```

Then open, for example:

```text
http://localhost:8000/bitacora.html
http://localhost:8000/productos/
http://localhost:8000/soluciones/
http://localhost:8000/casos/
```

Published documents are materialized into static HTML during the build. Documents with `seo.noIndex: true` remain visible on the site, receive `noindex,follow`, and are excluded from `sitemap.xml`.

For editorial QA, `npm run build:preview` may additionally surface `noIndex` content inside stronger promotional landing sections that normally only promote indexable content:

```bash
npm run build:preview
python -m http.server 8000 --directory _site
```

This removes the need to configure localhost CORS in Sanity because the browser never fetches Content Lake.

## URL model

Published content is generated as clean static routes:

```text
/bitacora/<slug>/
/productos/<slug>/
/soluciones/<slug>/
/casos/<slug>/
```

The old `articulo.html?slug=...` route remains only as a `noindex` compatibility redirect.

## SEO behavior

The build generates static HTML, unique metadata, self-referencing canonicals, Open Graph metadata and structured data appropriate to each content type.

- `article` → `Article` JSON-LD and FAQ when available.
- `product` → `Product` JSON-LD.
- `solution` → `Service` JSON-LD.
- `caseStudy` → static case-study page with its own metadata and canonical.

If `seo.noIndex` is true, the page is still generated and publicly reachable, but receives `noindex,follow` and is excluded from `sitemap.xml`.

Draft or unpublished content is the mechanism for content that must not be publicly visible.

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

## Preview deployments

A separate preview host such as Cloudflare Pages can build this branch with:

```text
Build command: npm run build
Build output directory: _site
```

For the current client preview, the preview project should point to `feat/posicionamiento-b2b-premium`, leaving the production GitHub Pages deployment on `main` untouched.

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

The function rebuilds when published content changes for `article`, `articleCategory`, `caseStudy`, `solution`, `product`, `productCategory` or `brand`. Draft edits do not rebuild the public site.

## Validation

Deterministic CI tests do not depend on live CMS state:

```bash
npm run test:content
```

This builds from `tests/fixtures/sanity-build.json` and verifies clean routes, canonicals, `noindex`, sitemap inclusion/exclusion and absence of browser-side Sanity fetching across articles, products, solutions and cases.

The production publish workflow uses live Sanity data and validates the generated artifact again before deployment.
