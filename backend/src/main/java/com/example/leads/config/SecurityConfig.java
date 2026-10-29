package com.example.leads.config;

import com.example.leads.user.UserRepository;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  UserDetailsService users(UserRepository users) {
    return email ->
        users
            .findByEmail(email.toLowerCase(java.util.Locale.ROOT).trim())
            .map(u -> User.withUsername(u.email).password(u.passwordHash).roles("SALES").build())
            .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http) throws Exception {
    // Keep CSRF enabled. React fetches a token before every state-changing request.
    return http.authorizeHttpRequests(
            a ->
                a.requestMatchers(
                        "/",
                        "/index.html",
                        "/assets/**",
                        "/favicon.svg",
                        "/api/auth/csrf",
                        "/api/auth/register",
                        "/api/health",
                        "/error")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .formLogin(
            f ->
                f.loginProcessingUrl("/api/auth/login")
                    .usernameParameter("email")
                    .successHandler(
                        (req, res, auth) -> {
                          res.setStatus(204);
                        })
                    .failureHandler(
                        (req, res, e) -> {
                          res.setStatus(401);
                          res.setContentType("application/json");
                          res.getWriter().write("{\"message\":\"Invalid email or password\"}");
                        })
                    .permitAll())
        .logout(
            l ->
                l.logoutUrl("/api/auth/logout")
                    .invalidateHttpSession(true)
                    .deleteCookies("JSESSIONID")
                    .logoutSuccessHandler((req, res, auth) -> res.setStatus(204)))
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                        (req, res, err) -> {
                          res.setStatus(401);
                          res.setContentType("application/json");
                          res.getWriter().write("{\"message\":\"Please sign in\"}");
                        })
                    .accessDeniedHandler(
                        (req, res, err) -> {
                          res.setStatus(403);
                          res.setContentType("application/json");
                          res.getWriter()
                              .write("{\"message\":\"Request denied. Refresh and try again.\"}");
                        }))
        .headers(
            h ->
                h.contentSecurityPolicy(
                    c ->
                        c.policyDirectives(
                            "default-src 'self'; script-src 'self'; style-src 'self'"
                                + " 'unsafe-inline'; img-src 'self' data:; connect-src 'self';"
                                + " frame-ancestors 'none'; base-uri 'self'; form-action 'self'")))
        .build();
  }
}
