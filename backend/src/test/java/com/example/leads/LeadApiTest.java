package com.example.leads;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH",
      "spring.datasource.username=sa",
      "spring.datasource.password=",
      "server.servlet.session.cookie.secure=false"
    })
@AutoConfigureMockMvc
class LeadApiTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  private static final String TEST_PASSWORD =
      UUID.randomUUID().toString(); // Generated test credential; never a seeded account.

  private MockHttpSession registerAndLogin() throws Exception {
    String email = UUID.randomUUID() + "@example.com";
    mvc.perform(
            post("/api/auth/register")
                .with(csrf())
                .contentType("application/json")
                .content(
                    json.writeValueAsString(
                        Map.of("name", "Test User", "email", email, "password", TEST_PASSWORD))))
        .andExpect(status().isCreated());
    return (MockHttpSession)
        mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .param("email", email)
                    .param("password", TEST_PASSWORD))
            .andExpect(status().isNoContent())
            .andReturn()
            .getRequest()
            .getSession(false);
  }

  private String lead(String name) throws Exception {
    return json.writeValueAsString(
        Map.of(
            "name",
            name,
            "email",
            "client@example.com",
            "phone",
            "+91 9876543210",
            "company",
            "Acme",
            "service",
            "SEO",
            "status",
            "NEW",
            "followUpDate",
            "2027-01-15",
            "notes",
            "First conversation"));
  }

  private long create(MockHttpSession session, String name) throws Exception {
    String body =
        mvc.perform(
                post("/api/leads")
                    .session(session)
                    .with(csrf())
                    .contentType("application/json")
                    .content(lead(name)))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andReturn()
            .getResponse()
            .getContentAsString();
    return json.readTree(body).get("id").asLong();
  }

  @Test
  void anonymousCannotReadLeads() throws Exception {
    mvc.perform(get("/api/leads")).andExpect(status().isUnauthorized());
  }

  @Test
  void csrfIsRequiredEvenForRegistration() throws Exception {
    mvc.perform(post("/api/auth/register").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void loginAndLogoutLifecycle() throws Exception {
    var session = registerAndLogin();
    mvc.perform(get("/api/auth/me").session(session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Test User"))
        .andExpect(jsonPath("$.passwordHash").doesNotExist());
    mvc.perform(post("/api/auth/logout").session(session).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/auth/login")
                .with(csrf())
                .param("email", "nobody@example.com")
                .param("password", "wrong"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void realCsrfTokenWorksOnLogin() throws Exception {
    var result = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
    var token = json.readTree(result.getResponse().getContentAsString());
    mvc.perform(
            post("/api/auth/login")
                .session((MockHttpSession) result.getRequest().getSession(false))
                .header(token.get("headerName").asText(), token.get("token").asText())
                .param("email", "absent@example.com")
                .param("password", "wrong"))
        .andExpect(status().isUnauthorized()); // 401, not 403: CSRF check passed.
  }

  @Test
  void crudAndCounts() throws Exception {
    var s = registerAndLogin();
    long id = create(s, "Alice");
    mvc.perform(get("/api/leads/" + id).session(s))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.createdAt").exists());
    mvc.perform(
            put("/api/leads/" + id)
                .session(s)
                .with(csrf())
                .contentType("application/json")
                .content(lead("Alice Updated").replace("NEW", "CONVERTED")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CONVERTED"));
    mvc.perform(get("/api/leads/stats").session(s))
        .andExpect(jsonPath("$.TOTAL").value(1))
        .andExpect(jsonPath("$.CONVERTED").value(1))
        .andExpect(jsonPath("$.NEW").value(0));
    mvc.perform(delete("/api/leads/" + id).session(s).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/leads/" + id).session(s)).andExpect(status().isNotFound());
  }

  @Test
  void usersCannotAccessEachOthersLeads() throws Exception {
    var a = registerAndLogin();
    var b = registerAndLogin();
    long id = create(a, "Private");
    mvc.perform(get("/api/leads/" + id).session(b)).andExpect(status().isNotFound());
    mvc.perform(
            put("/api/leads/" + id)
                .session(b)
                .with(csrf())
                .contentType("application/json")
                .content(lead("Stolen")))
        .andExpect(status().isNotFound());
    mvc.perform(delete("/api/leads/" + id).session(b).with(csrf()))
        .andExpect(status().isNotFound());
    mvc.perform(get("/api/leads").session(b)).andExpect(jsonPath("$.totalElements").value(0));
    mvc.perform(get("/api/leads/stats").session(b)).andExpect(jsonPath("$.TOTAL").value(0));
  }

  @Test
  void searchStatusDatesAndPagination() throws Exception {
    var s = registerAndLogin();
    create(s, "Alice");
    create(s, "Bob");
    create(s, "100% Growth");
    mvc.perform(get("/api/leads?search=alice").session(s))
        .andExpect(jsonPath("$.totalElements").value(1));
    mvc.perform(get("/api/leads").param("search", "%").session(s))
        .andExpect(jsonPath("$.totalElements").value(1));
    mvc.perform(get("/api/leads?search=9876543210").session(s))
        .andExpect(jsonPath("$.totalElements").value(3));
    mvc.perform(get("/api/leads?search=client@example.com").session(s))
        .andExpect(jsonPath("$.totalElements").value(3));
    mvc.perform(get("/api/leads?status=LOST").session(s))
        .andExpect(jsonPath("$.totalElements").value(0));
    mvc.perform(get("/api/leads?size=2&page=1").session(s))
        .andExpect(jsonPath("$.content.length()").value(1))
        .andExpect(jsonPath("$.totalPages").value(2));
    mvc.perform(get("/api/leads?to=2000-01-01").session(s))
        .andExpect(jsonPath("$.totalElements").value(0));
    String today = java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString();
    mvc.perform(get("/api/leads").param("from", today).param("to", today).session(s))
        .andExpect(jsonPath("$.totalElements").value(3));
  }

  @Test
  void invalidInputRejected() throws Exception {
    var s = registerAndLogin();
    mvc.perform(
            post("/api/leads")
                .session(s)
                .with(csrf())
                .contentType("application/json")
                .content(lead("")))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.name").exists());
    for (String query :
        List.of(
            "size=101",
            "page=-1",
            "status=INVALID",
            "from=2027-01-10&to=2027-01-01",
            "from=invalid"))
      mvc.perform(get("/api/leads?" + query).session(s)).andExpect(status().isBadRequest());
  }

  @Test
  void registrationValidationAndDuplicateEmail() throws Exception {
    String email = UUID.randomUUID() + "@example.com";
    String body =
        json.writeValueAsString(Map.of("name", "Test", "email", email, "password", TEST_PASSWORD));
    mvc.perform(
            post("/api/auth/register").with(csrf()).contentType("application/json").content(body))
        .andExpect(status().isCreated());
    mvc.perform(
            post("/api/auth/register").with(csrf()).contentType("application/json").content(body))
        .andExpect(status().isConflict());
    mvc.perform(
            post("/api/auth/register")
                .with(csrf())
                .contentType("application/json")
                .content("{\"name\":\"\",\"email\":\"bad\",\"password\":\"123\"}"))
        .andExpect(status().isBadRequest());
  }
}
