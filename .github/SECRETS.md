# GitHub Actions — Required Secrets

All secrets are configured at **Settings → Secrets and variables → Actions** in
the GitHub repository. Never commit secret values to the repository.

---

## Supabase

| Secret | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key — safe to expose in client bundles |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server-side only, never expose to clients |

Where to find: Supabase Dashboard → Project Settings → API

---

## Vercel (Web app deployment)

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Personal access token from vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Team or personal account ID (from `vercel whoami` or `.vercel/project.json`) |
| `VERCEL_PROJECT_ID_WEB` | Project ID for the web app (`championkids-web`) |
| `VERCEL_PROJECT_ID_ADMIN` | Project ID for the admin dashboard (if separate Vercel project) |

Where to find: run `vercel link` inside the web app directory, then inspect
`.vercel/project.json` for `orgId` and `projectId`.

---

## Railway / Render (API deployment)

Use one of the following depending on your hosting provider:

| Secret | Description |
|---|---|
| `RAILWAY_TOKEN` | Railway API token — Settings → Tokens in the Railway dashboard |
| `RENDER_DEPLOY_HOOK_URL` | Full deploy hook URL from Render → Service → Settings → Deploy Hook |

The `api.yml` workflow is pre-configured for **Render** (deploy hook). To switch
to Railway, comment out the Render step and uncomment the Railway block.

---

## Expo / EAS (Mobile builds)

| Secret | Description |
|---|---|
| `EXPO_TOKEN` | EAS personal access token from expo.dev/accounts/[user]/settings/access-tokens |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for TestFlight submission — generate at appleid.apple.com |

Note: `eas submit` for Android uses the service account JSON configured inside
`eas.json` (stored in the repo) rather than a GitHub secret. Ensure `eas.json`
references the correct Google Play service account.

---

## Stripe

| Secret | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Live secret key from Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard → Webhooks → [endpoint] → Signing secret |

Use `sk_test_*` keys in staging/preview environments.

---

## Monitoring

| Secret | Description |
|---|---|
| `SENTRY_DSN` | Data Source Name from Sentry → Project Settings → Client Keys |
| `CODECOV_TOKEN` | Upload token from codecov.io (optional — coverage upload is skipped if absent) |

---

## Rotation & audit

- Rotate `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` immediately if
  either is ever logged, printed to CI output, or exposed in a PR.
- Review active tokens quarterly via the Expo, Vercel, and Railway dashboards.
- `EXPO_TOKEN` and `VERCEL_TOKEN` should be scoped to the minimum required
  permissions (deploy-only, not admin).
