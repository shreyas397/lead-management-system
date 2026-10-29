# Explain and demonstrate your project

## A short introduction

“I built a lead management system for a software and digital marketing team. React handles the interface. Spring Boot exposes REST endpoints and enforces validation and authentication. PostgreSQL stores users and leads. Each user can access only their own leads.”

## Suggested 7-minute demo

1. Register and sign in. Explain BCrypt hashes and HttpOnly session cookies.
2. Add a lead and point out required fields and automatic creation time.
3. Edit the lead to Qualified; show the metric and donut chart changing.
4. Open details and show notes and follow-up date.
5. Search by phone or email, apply status/date filters, and reset.
6. Seed enough leads to demonstrate pagination. Export filtered leads as CSV.
7. Sign in using another account and show an empty, separate workspace.
8. Delete a lead using confirmation, then sign out.
9. Show the controller/service/repository structure, SQL migration, and passing tests.

## Questions you should be ready for

**Why Spring Boot instead of plain servlets?**
Spring Boot configures an embedded servlet server and common infrastructure. Spring MVC handles routing and JSON conversion; I can focus on business rules while still using Java and the servlet platform.

**Where is authentication checked?**
Spring Security's filter chain runs before controllers. `/api/leads` requires authentication. The service then adds the current user's owner ID to every query.

**Why not store a JWT in localStorage?**
A same-origin application can use a server session. The session ID stays in an HttpOnly cookie and logout invalidates it on the server. CSRF protection is required because browsers attach cookies automatically.

**What is CSRF?**
An attacker might try to make a browser submit an unwanted write using its session cookie. This app requires an additional token on POST/PUT/DELETE, obtained through the real same-origin app.

**Why use a DTO?**
`LeadRequest` contains only allowed editable fields. A client cannot assign its own ID, owner ID, or creation timestamp. Validation annotations reject invalid data.

**What stops SQL injection?**
JPA builds parameterized queries. Search input is not concatenated into SQL. LIKE wildcard characters are also escaped to make search behave literally.

**Why is phone a string?**
Phone numbers are identifiers, not quantities. Strings preserve country prefixes, formatting, and leading zeros.

**What is a transaction?**
A transaction groups a business operation so it either commits or rolls back. Service write methods have `@Transactional`.

**Why Flyway?**
It versions database changes. Each deployment applies unapplied migrations in order. Hibernate validates the schema and does not silently rebuild tables.

**How is pagination implemented?**
The frontend sends zero-based page and size parameters. The service builds a Pageable and database-side filters; the response contains the current page and total counts.

**Why is another user's lead a 404?**
The app does not reveal whether that private lead exists. Both read and write operations match lead ID and owner ID together.

**What would you improve next?**
Add account recovery and verification, edge rate limiting, team roles, activity history, scheduled follow-up reminders, a shared session store for multiple instances, and optimistic locking for simultaneous edits.

## Files to read in order

1. `backend/src/main/resources/db/migration/V1__initial_schema.sql`
2. `backend/src/main/java/com/example/leads/lead/LeadRequest.java`
3. `backend/src/main/java/com/example/leads/lead/LeadController.java`
4. `backend/src/main/java/com/example/leads/lead/LeadService.java`
5. `backend/src/main/java/com/example/leads/config/SecurityConfig.java`
6. `frontend/src/api.js`
7. `frontend/src/App.jsx` and `frontend/src/pages/Workspace.jsx`
8. `backend/src/test/java/com/example/leads/LeadApiTest.java`

Run the app yourself and change a small feature before evaluation. Be transparent about AI assistance and explain the decisions you understand; do not memorize claims you cannot demonstrate.
