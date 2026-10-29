# Verification record

Checked on 28 October 2026.

## Passed

- React production build: `npm run build` (Vite 6.4.5), including a final build after splitting UI components into separate files.
- Backend build and executable JAR packaging: `mvn verify` with Java 17 and Spring Boot 3.5.7.
- Nine Spring Boot / MockMvc integration tests: **9 passed, 0 failures, 0 errors, 0 skipped**.
- Flyway V1 migration applied successfully to the test H2 database; Hibernate schema validation passed.

Test cases:

1. Anonymous requests cannot read leads.
2. CSRF is required even for registration.
3. Registration, login, current user, logout, and wrong-password behavior.
4. A real fetched CSRF token is accepted by the login filter.
5. Lead create/read/update/delete and dashboard counts.
6. Cross-user read, update, delete, list, and count isolation.
7. Name/email/phone search, literal wildcard search, status/date filters, pagination.
8. Invalid lead inputs and invalid query parameters.
9. Registration field validation and duplicate-email conflict.

Tests use real application services and repositories, not mocked business logic. A test-only Mockito configuration selects the subclass mock maker so Spring's test listener does not require restricted JVM agent attachment. Credentials used in tests are generated at runtime.

Java source was subsequently formatted without changing behavior. The delivered source excludes dependencies, generated build outputs, runtime data, and secrets.

## Not verified in this environment

- Browser interaction, visual appearance, and mobile viewport testing: the managed preview service could not launch Java (runtime unavailable in that service).
- Docker image build / Compose startup: Docker is not installed here.
- PostgreSQL runtime integration: PostgreSQL is not installed here. Tests ran against H2 in PostgreSQL compatibility mode, which is not a substitute for a real PostgreSQL deployment check.
- Public deployment, GitHub publication, and hosted demo login: external accounts are not connected.

Follow `docs/DEPLOYMENT.md` to finish the live PostgreSQL deployment and evaluation checks. Do not describe these unverified checks as passed.
