# Ecorise SEO baseline

Baseline captured from Google Search Console before deploying the B2B redesign. Search Console data settled through **2026-09-11**.

## What the current site is actually ranking for

The visible organic query mix is strongly branded. `ecorise` is the dominant query, with variants such as `eco rise` and `ecorice` also present. Internal pages often show strong average positions because they are being surfaced for the branded query, so page-level average position must not be interpreted as proof of strong non-branded rankings.

## 180-day reference

Approximate visible Search Console totals for 2026-03-15 through 2026-09-11:

- 94 clicks
- 1,317 impressions
- Argentina: 91 clicks / 686 impressions
- Desktop: 63 clicks / 949 impressions / 6.64% CTR / 14.26 average position
- Mobile: 31 clicks / 362 impressions / 8.56% CTR / 5.41 average position

### Main pages

| URL | Clicks | Impressions | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| `/` | 86 | 1,090 | 7.89% | 11.91 |
| `/energia-solar.html` | 6 | 221 | 2.71% | 4.57 |
| `/sustentabilidad.html` | 1 | 186 | 0.54% | 5.33 |
| `/consultoria-tecnica.html` | 0 | 162 | 0% | 3.04 |
| `/mantenimiento.html` | 0 | 130 | 0% | 2.78 |

These URLs are intentionally retained in the redesign and their canonical identities are protected by CI.

## Non-branded opportunities observed

Queries with useful early signal include:

- `consultoría de energías renovables en argentina`: 49 impressions, avg. position 19.4
- `consultoría de energía verde en argentina`: 36 impressions, avg. position 22.3
- `consultoria energias renovables`: 8 impressions, avg. position 16.5
- `empresas de energía solar en córdoba argentina`: 3 impressions, avg. position 10
- `energía solar`: 4 impressions, avg. position 4.75
- `energia solar en cordoba`: 2 impressions, avg. position 21.5

Volume is currently low, so these are directional signals rather than statistically strong keyword targets.

## Changes driven by this baseline

- Keep existing indexed service URLs instead of introducing a URL migration.
- Make the home explicitly relevant to consultoría energética + energía solar in Córdoba/Argentina.
- Make `/consultoria-tecnica.html` explicitly target consultoría energética and energías renovables for companies.
- Make `/energia-solar.html` explicitly target energía solar para empresas in Córdoba.
- Preserve `/mantenimiento.html` and `/sustentabilidad.html` while making their intent clearer.
- Add self-referencing canonicals, descriptive titles, one H1 per page and service/organization structured data where appropriate.
- Introduce sitemap + robots discovery for the expanded site surface.
- Preserve the existing measurement stack and add measurable lead-intent events.

## Post-deploy evaluation

Do not judge this redesign by total average position alone. Track separately:

1. branded vs non-branded clicks and impressions;
2. growth of non-branded queries in positions 4–20;
3. CTR of the five protected legacy URLs;
4. impressions and clicks gained by the new sector pages;
5. lead-intent events (Calendly, WhatsApp, email and energy assessment) by landing page/channel;
6. mobile vs desktop performance.

A sensible first review window is **28 settled days after deployment**, with an earlier technical/indexation check after Google has recrawled the changed URLs.

> Search Console query reports may omit low-volume queries due to privacy thresholds, so query totals are not expected to equal site totals exactly.
