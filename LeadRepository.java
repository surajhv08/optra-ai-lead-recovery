package com.leadrecovery.ai_lead_recovery.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.leadrecovery.ai_lead_recovery.entity.Lead;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    // =========================
    // DUPLICATE LEAD CHECK
    // =========================

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);


    // =========================
    // ACTIVE LEADS
    // =========================

    List<Lead> findByDeletedFalse();


    // =========================
    // RECYCLE BIN
    // =========================

    List<Lead> findByDeletedTrue();
}