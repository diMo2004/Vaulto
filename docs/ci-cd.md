# Vaulto CI/CD Walkthrough

Vaulto deploys from GitHub Actions to the current production architecture:

- Frontend: Vercel
- Backend: Railway
- PaddleOCR service: Railway
- Recommendation service: Railway
- MongoDB: MongoDB Atlas
- PostgreSQL and Qdrant: Railway

## What Runs on Main

The `.github/workflows/deploy.yml` workflow runs on every push to `main` and can also be started manually from the GitHub Actions tab.

| Job | What it does | Deploy target |
| --- | --- | --- |
| `ci-frontend` | Installs frontend dependencies and builds the React app | None |
| `ci-spring-backend` | Runs Maven tests with a MongoDB service container | None |
| `ci-docker-builds` | Builds the PaddleOCR and Recommendation Dockerfiles | None |
| `deploy-railway` | Deploys backend, PaddleOCR, and Recommendation services | Railway |
| `deploy-vercel` | Deploys the React frontend to production | Vercel |

## After Creating the `production` Environment

Use this checklist after creating the GitHub Environment named `production` under **Settings -> Environments**.

### 1. Add GitHub Actions Secrets

Go to **Settings -> Secrets and variables -> Actions** and add these repository secrets:

| Secret | Used by | Notes |
| --- | --- | --- |
| `RAILWAY_TOKEN` | Railway deploy jobs | Preferred. Create a Railway project token scoped to the Vaulto production environment. |
| `RAILWAY_API_TOKEN` | Railway deploy jobs | Optional fallback. Use only if it belongs to an account/workspace with access to the Vaulto project. |
| `RAILWAY_PROJECT_ID` | Railway deploy jobs | Required. Copy from the Railway project settings or project URL. |
| `VERCEL_TOKEN` | Vercel deploy job | Create at `https://vercel.com/account/tokens`. |
| `VERCEL_ORG_ID` | Vercel deploy job | Copy from `vaulto/.vercel/project.json` after linking the project. |
| `VERCEL_PROJECT_ID` | Vercel deploy job | Copy from `vaulto/.vercel/project.json` after linking the project. |

Optionally add this repository variable:

| Variable | Default | Notes |
| --- | --- | --- |
| `RAILWAY_ENVIRONMENT` | `production` | Must match the Railway environment name used for live services. |

### 2. Confirm Railway Service Names

The deploy workflow expects these Railway service names:

- `backend`
- `paddleocr-service`
- `recommendation-service`

In Railway, open the Vaulto project and make sure those service names match exactly. If Railway uses different names, update the `railway up ... --service` values in `.github/workflows/deploy.yml`.

### 3. Confirm Railway Runtime Variables

Set the production runtime variables in Railway before the first deploy. At minimum, confirm:

- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_SUCCESS_REDIRECT`
- `GOOGLE_FAILURE_REDIRECT`
- `COOKIE_DOMAIN`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

For cross-origin auth, `GOOGLE_SUCCESS_REDIRECT` should point to the Vercel frontend, for example:

```text
https://vaulto-woad.vercel.app/dashboard
```

### 4. Confirm Vercel Environment Variables

In Vercel, open the Vaulto frontend project and set:

```text
REACT_APP_API_BASE=https://backend-production-26905.up.railway.app
```

Apply it to the Production environment. If you also use Preview deployments, add it there too.

### 5. Update Google OAuth Settings

In Google Cloud Console, update the OAuth client used by the backend.

Authorized JavaScript origins:

```text
https://vaulto-woad.vercel.app
```

Authorized redirect URIs:

```text
https://backend-production-26905.up.railway.app/login/oauth2/code/google
```

Set Railway `GOOGLE_REDIRECT_URI` to that exact same HTTPS value. This avoids Spring resolving the OAuth callback to `http://...` behind Railway's proxy.

### 6. Run the First Deployment

Start with a manual run:

1. Open **Actions** in GitHub.
2. Select the `Deploy` workflow.
3. Click **Run workflow**.
4. Choose the `main` branch.
5. Watch all CI jobs pass before deployment starts.

Use the top-level **Actions** tab for this step. The **Deployments** page under repository management only shows deployment history and does not expose the manual workflow trigger.

If the `production` environment requires approval, approve the deployment when GitHub pauses at that gate.

### 7. Verify the Deployment

After the workflow finishes, verify these flows:

- Open `https://vaulto-woad.vercel.app`.
- Sign in with Google.
- Confirm the redirect returns to the Vercel frontend.
- Confirm authenticated backend calls include cookies.
- Upload or scan a coupon to exercise the backend and OCR path.
- Check recommendation endpoints or any UI that depends on the recommendation service.

Also inspect Railway logs for all backend services after the first deployment:

- `backend`
- `paddleocr-service`
- `recommendation-service`
- PostgreSQL
- Qdrant

### 8. Watch for Common Failures

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| GitHub deploy cannot authenticate to Railway | Missing, invalid, or wrong-scope Railway token | Recreate the Railway project token for the production environment and save it as `RAILWAY_TOKEN`. |
| Railway deploy says `Invalid RAILWAY_TOKEN` | The token is not valid for that project, environment, or service | Replace `RAILWAY_TOKEN` with a project token from the Vaulto Railway project, or use `RAILWAY_API_TOKEN`. |
| Railway deploy says `Unauthorized` for `RAILWAY_API_TOKEN` | The account/workspace token does not have access to this project | Delete the bad `RAILWAY_API_TOKEN` secret or replace it with a token from the account/workspace that owns the Vaulto Railway project. |
| Railway deploy says no linked project was found | Missing `RAILWAY_PROJECT_ID` | Add `RAILWAY_PROJECT_ID` as a GitHub Actions secret. |
| Railway deploy says `Not signed in` | Railway CLI auth regression or invalid token | The workflow pins Railway CLI `5.2.0`; if it still fails, recreate the Railway token. |
| Vercel deploy fails with project lookup errors | Wrong `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID` | Recopy both IDs from `vaulto/.vercel/project.json`. |
| Google login redirects to localhost | Railway forwarded headers or OAuth redirect configuration is wrong | Confirm `server.forward-headers-strategy=framework` and the Google redirect URI. |
| Google shows `redirect_uri_mismatch` with an `http://backend...railway.app` URL | Spring inferred the callback scheme as HTTP behind Railway | Set Railway `GOOGLE_REDIRECT_URI=https://backend-production-26905.up.railway.app/login/oauth2/code/google` and register the same URI in Google Cloud Console. |
| Login succeeds but cookies are missing | Cross-site cookie settings or domain mismatch | Confirm `SameSite=None`, `Secure=true`, frontend URL, backend URL, and CORS origins. |
| Backend tests fail in CI | Spring context cannot start | Check CI env placeholders and MongoDB service container logs. |

## Current Test Gap

The frontend build is currently the CI gate. The existing Create React App test files still contain default "learn react" checks and should be replaced with meaningful component tests before frontend tests become required in CI.
