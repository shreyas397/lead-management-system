package com.example.leads.auth;

import com.example.leads.user.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final UserRepository users;
  private final PasswordEncoder encoder;

  public AuthController(UserRepository users, PasswordEncoder encoder) {
    this.users = users;
    this.encoder = encoder;
  }

  public record Registration(
      @NotBlank @Size(max = 100) String name,
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(min = 10, max = 64) String password) {}

  public record Profile(Long id, String name, String email) {}

  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "UP");
  }

  @GetMapping("/auth/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @PostMapping("/auth/register")
  @ResponseStatus(HttpStatus.CREATED)
  public Profile register(@Valid @RequestBody Registration input) {
    String email = input.email().trim().toLowerCase(Locale.ROOT);
    if (users.existsByEmail(email))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
    // BCrypt has a 72-byte input limit, which matters for non-ASCII passwords.
    if (input.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes");
    AppUser u = new AppUser();
    u.name = input.name().trim();
    u.email = email;
    u.passwordHash = encoder.encode(input.password());
    users.save(u);
    return new Profile(u.id, u.name, u.email);
  }

  @GetMapping("/auth/me")
  public Profile me(Authentication auth) {
    AppUser u = users.findByEmail(auth.getName()).orElseThrow();
    return new Profile(u.id, u.name, u.email);
  }
}
