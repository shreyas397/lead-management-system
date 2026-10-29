# Leadroom — Lead Management System

A small full-stack CRM for a software or digital marketing company, built with **React, Java 17, Spring Boot, and SQL**. The code prioritizes clear layers and familiar Java over complex abstractions.

## Features

- Registration, login, logout, and protected APIs using Spring Security sessions.
- BCrypt password hashing, HttpOnly session cookies, CSRF protection, validation, and ownership checks.
- Create, view, edit, and delete leads. All nine requested fields are supported.
- Five lead statuses: New, Contacted, Qualified, Converted, and Lost.
- Six dashboard metrics, a pipeline donut chart, and conversion rate.
- Name/email/phone search, status filter, inclusive created-date range, and server pagination.
- Responsive desktop/mobile interface, details dialogs, loading, error, empty states, and delete confirmation.
- CSV export of all filtered results with spreadsheet formula protection.
- SQL migrations, Docker Compose, API integration tests, and GitHub Actions CI.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, plain JavaScript, CSS, Vite, Lucide icons |
| Backend | Java 17, Spring Boot 3.5.7, Spring MVC |
| Security | Spring Security, BCrypt, server sessions, CSRF |
| Persistence | Spring Data JPA, PostgreSQL 17, Flyway SQL migrations |
| Local shortcut / tests | H2 SQL database (file storage locally; memory in tests) |
| Deployment | Multi-stage Docker build; React served by Spring Boot |

PostgreSQL is the intended deployment database. H2 makes learning and local evaluation possible without installing a database. The H2 profile is not for public deployment.

## Project structure

```text
backend/src/main/java/com/example/leads/
  auth/       Registration, current user, CSRF endpoint
  config/     Spring Security configuration
  user/       User entity and repository
  lead/       Lead entity, DTO, repository, service, controller
  common/     Consistent API error handling
backend/src/main/resources/db/migration/   Versioned SQL schema
backend/src/test/                          API integration tests
frontend/src/
  main.jsx    React entry point
  App.jsx     Session startup and screen selection
  pages/      Authentication and workspace screens
  components/ Lead forms, details, delete dialog, shared UI
  constants.js Status and service choices
  api.js      Fetch helper and CSRF integration
  styles.css  Responsive styles
scripts/seed_demo.py                       Optional demo setup
Dockerfile                                Full application image
compose.yaml                              App + PostgreSQL locally
docs/                                     Architecture and deployment guides
```

## Quick start: easiest local option

Install **JDK 17+, Maven 3.9+, and Node.js 22 LTS**. Python 3 is optional for demo data.

In terminal 1:

```sh
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

In terminal 2:

```sh
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. Create an account, then sign in. The backend runs at **http://localhost:8080/api**. Vite forwards `/api` requests to Spring Boot, so there is no cross-origin cookie configuration to maintain.

Local data persists in `backend/data/`. Restarting the backend logs users out because sessions are in memory, but users and leads remain in SQL. Do not commit the data directory. Stop the app before deleting that directory to reset local data.

### Demo login credentials

No shared password or pre-created demo account is committed. Run from the repository root while the backend is running:

```sh
python scripts/seed_demo.py
```

- Demo email: `demo@example.com`
- Demo password: the password you enter privately when the script prompts you.
- The script creates 12 fictional leads and all five statuses using the real API.
- Run once against a fresh demo account. A repeated email returns 409; choose another with `--email`.
- Share your chosen evaluation password privately, separately from the repository. Do not use a personal password or real customer data.

## PostgreSQL + Docker

Install Docker with Compose. From the project root, copy `.env.example` to `.env` and replace the database password placeholder. On Windows, use File Explorer or `copy .env.example .env`; on macOS/Linux use `cp .env.example .env`.

```sh
docker compose up --build -d
```

Open **http://localhost:8080**. Both frontend and API are served by Spring Boot. PostgreSQL is reachable only on the Docker network; its data lives in the `postgres_data` volume.

```sh
docker compose logs -f app
docker compose down
```

`docker compose down` preserves the database. **`docker compose down -v` permanently deletes it.** Local Compose deliberately uses HTTP on localhost and `COOKIE_SECURE=false`. Production must use HTTPS and secure cookies.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | JDBC PostgreSQL URL, e.g. `jdbc:postgresql://host:5432/leads?sslmode=require` | `jdbc:postgresql://localhost:5432/leads` |
| `DATABASE_USER` | Database username | `leads` |
| `DATABASE_PASSWORD` | Database password; set in hosting secret settings | Required outside local profile |
| `PORT` | HTTP listen port | `8080` |
| `COOKIE_SECURE` | Send session cookie only over HTTPS | `true` |
| `SPRING_PROFILES_ACTIVE` | `local` enables file-based H2 and HTTP cookies | Unset for PostgreSQL |

Never commit `.env`, database files, service credentials, or deployment passwords. `.env.example` contains only a placeholder. Spring Boot does not read `.env` directly; Docker Compose reads it. For a non-Docker PostgreSQL launch, export the variables in the process environment or configure your IDE run settings.

## API documentation

All paths are prefixed with `/api`. All lead endpoints and `/auth/me` require a login session. Use cookies, not a bearer token.

| Method | Path | Purpose / success status |
|---|---|---|
| GET | `/health` | Application liveness, 200 (not a database readiness check) |
| GET | `/auth/csrf` | CSRF token and header name, 200 |
| POST | `/auth/register` | JSON `{name,email,password}`, 201; does not sign in |
| POST | `/auth/login` | Form URL encoded `email` and `password`, 204 |
| GET | `/auth/me` | Current user profile, 200 |
| POST | `/auth/logout` | Invalidate session, 204 |
| GET | `/leads` | Paginated leads, 200 |
| GET | `/leads/stats` | Total and all five status counts, 200 |
| GET | `/leads/{id}` | Read one owned lead, 200 |
| POST | `/leads` | Create lead, 201 plus Location header |
| PUT | `/leads/{id}` | Replace editable fields, 200 |
| DELETE | `/leads/{id}` | Delete owned lead, 204 |

Before every POST, PUT, or DELETE, fetch `/auth/csrf` with the same cookie session and send its `token` using the returned `headerName`. Login is handled by Spring Security's filter, not a custom controller. Fetch a fresh token after login/logout; `frontend/src/api.js` does this automatically for all writes.

Example lead JSON:

```json
{
  "name": "Priya Rao",
  "email": "priya@example.com",
  "phone": "+91 90000 12345",
  "company": "Example Studio",
  "service": "Web Development",
  "status": "NEW",
  "followUpDate": "2027-01-15",
  "notes": "Send a proposal after the discovery call."
}
```

Name, email, phone, company, service, and status are required. Notes may be an empty string, and `followUpDate` may be null. `id`, `ownerId`, and `createdAt` are server-controlled and are not accepted in the input DTO. Status values are uppercase enum names.

List parameters:

| Parameter | Example | Rule |
|---|---|---|
| `search` | `priya` | Case-insensitive name/email/phone substring; SQL wildcards treated literally |
| `status` | `QUALIFIED` | One of the five uppercase statuses |
| `from` | `2027-01-01` | Inclusive created date in UTC |
| `to` | `2027-01-31` | Inclusive created date in UTC |
| `page` | `0` | Zero-based, non-negative |
| `size` | `10` | 1–100; UI uses 10 |

The list returns `{content,totalElements,totalPages,number,size}` sorted newest first. Date filters apply to **created date**, not follow-up date. Dashboard counts summarize all of the signed-in user's leads and do not change with table filters.

Errors return a JSON `message`; validation errors also include `errors` keyed by field. Status codes: 400 invalid input, 401 unauthenticated/bad login, 403 CSRF denial, 404 lead missing or owned by another user, 409 duplicate/conflict, 500 unexpected server error without stack traces in the response.

## Database

Flyway applies `V1__initial_schema.sql` on first startup. Hibernate validates the schema rather than changing it automatically. `app_users` stores normalized unique email addresses and BCrypt hashes. `leads.owner_id` is a foreign key to `app_users.id`. Indexes support owner/date, owner/status, and follow-up lookup. See [database and architecture](docs/ARCHITECTURE.md).

## Tests and builds

```sh
cd backend
mvn verify
```

Integration tests use real Spring Security and an isolated H2 database, covering CSRF, registration, login/logout, CRUD, validation, ownership isolation, counts, search, date ranges, and pagination.

```sh
cd frontend
npm ci
npm run build
```

The Docker build runs frontend compilation and backend tests, then packages the React build inside the executable JAR. GitHub Actions runs both checks after pushes and pull requests. See `docs/VERIFICATION.md` for checks actually performed on this delivery.

## Deployment and submission

Use a Java/container host with PostgreSQL. The root Dockerfile deploys the complete app under one origin; the frontend URL is `https://YOUR_HOST/`, and backend URL is `https://YOUR_HOST/api`. See [deployment guide](docs/DEPLOYMENT.md) for exact configuration and submission checklist.

**Delivery status:** source code and deployment configuration are supplied. A public GitHub repository, live deployed URL, and hosted demo account have not been created in this environment. Do not submit localhost URLs as live URLs. Record real URLs only after hosting succeeds.

## Evaluation preparation

Read [the evaluation walkthrough](docs/EVALUATION.md). Understand the controller → service → repository flow, user ownership checks, CSRF/session behavior, and SQL schema. This project was created with AI development assistance; review and adapt it, run it yourself, and be able to explain it honestly.

## Scope and production limits

This is a small production-style evaluation application, not a fully operated commercial CRM. Each account has its own leads; admin teams and role administration are not implemented. Follow-up dates are recorded, but there is no background reminder service. Activity history, email verification, password reset, and optimistic concurrency are not included. Sessions are in memory and require one app instance (or sticky sessions); a shared session store is needed before horizontal scaling. Before public operation, configure edge rate limits for login/registration, monitoring, backups, dependency updates, and managed HTTPS. CSV export pages through data and is not a snapshot if other tabs edit leads during export.
