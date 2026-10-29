package com.example.leads.lead;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record LeadRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank
        @Pattern(
            regexp = "[+0-9() .-]{7,30}",
            message = "Enter a valid phone number (7–30 characters)")
        String phone,
    @NotBlank @Size(max = 150) String company,
    @NotBlank @Size(max = 100) String service,
    @NotNull LeadStatus status,
    LocalDate followUpDate,
    @NotNull @Size(max = 4000) String notes) {}
