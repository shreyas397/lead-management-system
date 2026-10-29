package com.example.leads.lead;

import com.example.leads.user.UserRepository;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class LeadService {
  private final LeadRepository leads;
  private final UserRepository users;

  public LeadService(LeadRepository leads, UserRepository users) {
    this.leads = leads;
    this.users = users;
  }

  private Long owner(String email) {
    return users.findByEmail(email).orElseThrow().id;
  }

  public Lead get(String email, Long id) {
    return leads
        .findByIdAndOwnerId(id, owner(email))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lead not found"));
  }

  public Page<Lead> list(
      String email,
      String search,
      LeadStatus status,
      LocalDate from,
      LocalDate to,
      int page,
      int size) {
    if (page < 0 || size < 1 || size > 100)
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Page must be non-negative; size must be 1–100");
    if (from != null && to != null && from.isAfter(to))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "From date must be before to date");
    Long ownerId = owner(email);
    Specification<Lead> spec = (root, query, cb) -> cb.equal(root.get("ownerId"), ownerId);
    if (search != null && !search.isBlank()) {
      // Escape SQL LIKE wildcards so searches treat user input literally.
      String term =
          "%"
              + search
                  .trim()
                  .toLowerCase(Locale.ROOT)
                  .replace("!", "!!")
                  .replace("%", "!%")
                  .replace("_", "!_")
              + "%";
      spec =
          spec.and(
              (r, q, cb) ->
                  cb.or(
                      cb.like(cb.lower(r.get("name")), term, '!'),
                      cb.like(cb.lower(r.get("email")), term, '!'),
                      cb.like(cb.lower(r.get("phone")), term, '!')));
    }
    if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
    if (from != null)
      spec =
          spec.and(
              (r, q, cb) ->
                  cb.greaterThanOrEqualTo(
                      r.get("createdAt"), from.atStartOfDay(ZoneOffset.UTC).toInstant()));
    if (to != null)
      spec =
          spec.and(
              (r, q, cb) ->
                  cb.lessThan(
                      r.get("createdAt"), to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()));
    return leads.findAll(
        spec,
        PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
  }

  public Map<String, Long> stats(String email) {
    Long id = owner(email);
    Map<String, Long> result = new LinkedHashMap<>();
    result.put("TOTAL", leads.countByOwnerId(id));
    for (LeadStatus s : LeadStatus.values())
      result.put(s.name(), leads.countByOwnerIdAndStatus(id, s));
    return result;
  }

  @Transactional
  public Lead create(String email, LeadRequest input) {
    Lead lead = new Lead();
    lead.ownerId = owner(email);
    lead.createdAt = Instant.now();
    copy(input, lead);
    return leads.save(lead);
  }

  @Transactional
  public Lead update(String email, Long id, LeadRequest input) {
    Lead lead = get(email, id);
    copy(input, lead);
    return leads.save(lead);
  }

  @Transactional
  public void delete(String email, Long id) {
    leads.delete(get(email, id));
  }

  private void copy(LeadRequest input, Lead lead) {
    lead.name = input.name().trim();
    lead.email = input.email().trim();
    lead.phone = input.phone().trim();
    lead.company = input.company().trim();
    lead.service = input.service().trim();
    lead.status = input.status();
    lead.followUpDate = input.followUpDate();
    lead.notes = input.notes().trim();
  }
}
