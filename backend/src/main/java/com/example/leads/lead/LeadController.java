package com.example.leads.lead;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leads")
public class LeadController {
  private final LeadService service;

  public LeadController(LeadService service) {
    this.service = service;
  }

  public record LeadPage(
      List<Lead> content, long totalElements, int totalPages, int number, int size) {}

  @GetMapping
  public LeadPage list(
      Authentication a,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(required = false) LeadStatus status,
      @RequestParam(required = false) LocalDate from,
      @RequestParam(required = false) LocalDate to,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    var result = service.list(a.getName(), search, status, from, to, page, size);
    return new LeadPage(
        result.getContent(),
        result.getTotalElements(),
        result.getTotalPages(),
        result.getNumber(),
        result.getSize());
  }

  @GetMapping("/stats")
  public Map<String, Long> stats(Authentication a) {
    return service.stats(a.getName());
  }

  @GetMapping("/{id}")
  public Lead get(Authentication a, @PathVariable Long id) {
    return service.get(a.getName(), id);
  }

  @PostMapping
  public ResponseEntity<Lead> create(Authentication a, @Valid @RequestBody LeadRequest input) {
    Lead lead = service.create(a.getName(), input);
    return ResponseEntity.created(java.net.URI.create("/api/leads/" + lead.id)).body(lead);
  }

  @PutMapping("/{id}")
  public Lead update(
      Authentication a, @PathVariable Long id, @Valid @RequestBody LeadRequest input) {
    return service.update(a.getName(), id, input);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(Authentication a, @PathVariable Long id) {
    service.delete(a.getName(), id);
  }
}
