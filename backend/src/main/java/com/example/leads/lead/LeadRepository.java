package com.example.leads.lead;

import java.util.Optional;
import org.springframework.data.jpa.repository.*;

public interface LeadRepository extends JpaRepository<Lead, Long>, JpaSpecificationExecutor<Lead> {
  Optional<Lead> findByIdAndOwnerId(Long id, Long ownerId);

  long countByOwnerId(Long ownerId);

  long countByOwnerIdAndStatus(Long ownerId, LeadStatus status);
}
