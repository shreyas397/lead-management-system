package com.example.leads.lead;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "leads")
public class Lead {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "owner_id", nullable = false)
  public Long ownerId;

  @Column(nullable = false, length = 100)
  public String name;

  @Column(nullable = false, length = 254)
  public String email;

  @Column(nullable = false, length = 30)
  public String phone;

  @Column(nullable = false, length = 150)
  public String company;

  @Column(nullable = false, length = 100)
  public String service;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  public LeadStatus status;

  @Column(name = "follow_up_date")
  public LocalDate followUpDate;

  @Column(nullable = false, length = 4000)
  public String notes;

  @Column(name = "created_at", nullable = false, updatable = false)
  public Instant createdAt;
}
