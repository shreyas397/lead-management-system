# Deployment and submission

## Current status

No live deployment or GitHub repository has been created. This project includes a deployable Dockerfile and PostgreSQL migrations. The available native website hosting runtime does not run Java, so it is not suitable for this requested backend. A connected Java/container host and repository account are needed to complete online publication.

## One-container app with managed PostgreSQL

1. Create an empty GitHub repository in your account. Extract this project, open its root directory, and run:

```sh
git init
git add .
git status
```

Inspect staged files. Do not stage `.env`, database files, or real credentials. Then:

```sh
git commit -m "Build React and Spring Boot lead management system"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

2. Choose a container host that accepts a Dockerfile and supports a persistent managed PostgreSQL service. Create PostgreSQL first. Keep credentials in the host's secret configuration.
3. Create a Docker web service from the repository using the root Dockerfile and root build context.
4. Set these environment values:

```text
DATABASE_URL=jdbc:postgresql://DATABASE_HOST:5432/DATABASE_NAME?sslmode=require
DATABASE_USER=YOUR_DATABASE_USER
DATABASE_PASSWORD=YOUR_DATABASE_PASSWORD
COOKIE_SECURE=true
PORT=8080
```

These are placeholders, not working credentials. Use the provider's actual host, port, database name, and TLS requirements. Many providers give `postgresql://...` URLs; Spring requires the `jdbc:postgresql://...` format with username/password supplied separately. Do not enable the `local` profile online.

5. Configure the service's HTTP port to match `PORT`. Use managed HTTPS, one application instance, and a liveness path of `/api/health`. The health endpoint confirms the process is alive, not database readiness.
6. Deploy. The Docker build compiles React, runs backend tests, copies React into Spring's static resources, and starts the executable JAR as a non-root user. Flyway creates the SQL schema automatically.
7. Open the HTTPS frontend URL. Register, sign in, create a lead, refresh, sign out, sign back in, and confirm the lead remains.
8. Restart the application and verify persistence. You will need to log in again because sessions are held in memory.
9. Create a separate evaluator account with fictional data:

```sh
python scripts/seed_demo.py --url https://YOUR_DEPLOYED_HOST
```

Enter a unique password privately. Send that password to the evaluator outside GitHub. Never upload the password to the repository or README.
10. Add provider-level login/registration rate limits and a database backup policy before exposing the service broadly.

## URLs to submit

| Item | Fill after deployment |
|---|---|
| GitHub repository | Actual repository URL |
| Frontend | `https://YOUR_DEPLOYED_HOST/` |
| Backend base URL | `https://YOUR_DEPLOYED_HOST/api` |
| Health endpoint | `https://YOUR_DEPLOYED_HOST/api/health` |
| Demo username | `demo@example.com` if the seed script succeeded |
| Demo password | Share privately; chosen during seeding |
| README | Repository `README.md` |

## Before submission

- [ ] Backend tests pass and frontend production build succeeds.
- [ ] Docker build succeeds with real PostgreSQL.
- [ ] HTTPS site can be visited by the evaluator.
- [ ] Registration, login, logout, CRUD, filtering, pagination, chart, and export work.
- [ ] Two accounts cannot read or change each other's leads.
- [ ] Data survives application restart.
- [ ] Phone-sized and desktop layouts are checked.
- [ ] No real secrets or `.env` are committed.
- [ ] Real URLs and private demo credentials are shared.

## Troubleshooting

- **401:** no active session; sign in again.
- **403:** token missing/expired; reload the page. Never disable CSRF to fix this.
- **Login succeeds but subsequent requests fail locally:** secure cookies cannot be sent over local HTTP. Use `local` profile or local Compose.
- **Database connection fails:** check JDBC URL, network access, TLS requirements, and secret values.
- **Schema validation fails:** inspect Flyway logs; do not switch Hibernate to `create` on a database containing data.
- **Frontend cannot reach backend during development:** start Spring on port 8080 and Vite on 5173.
- **Refresh loses login after redeploy:** expected with in-memory sessions; data stays in PostgreSQL.
