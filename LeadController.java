package com.leadrecovery.ai_lead_recovery.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.leadrecovery.ai_lead_recovery.entity.Lead;
import com.leadrecovery.ai_lead_recovery.service.LeadService;

@RestController
@RequestMapping("/api/leads")
@CrossOrigin(origins = "http://localhost:5173")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    // =========================
    // CREATE LEAD
    // =========================
    @PostMapping
    public ResponseEntity<Lead> createLead(@RequestBody Lead lead) {

        Lead createdLead = leadService.createLead(lead);

        return ResponseEntity.ok(createdLead);
    }

    // =========================
    // GET ALL ACTIVE LEADS
    // =========================
    @GetMapping
    public ResponseEntity<List<Lead>> getAllLeads() {

        return ResponseEntity.ok(leadService.getAllLeads());
    }

    // =========================
    // GET LEAD BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<Lead> getLeadById(
            @PathVariable Long id) {

        Lead lead = leadService.getLeadById(id);

        if (lead == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(lead);
    }

    // =========================
    // UPDATE LEAD
    // =========================
    @PutMapping("/{id}")
    public ResponseEntity<Lead> updateLead(
            @PathVariable Long id,
            @RequestBody Lead lead) {

        Lead updatedLead = leadService.updateLead(id, lead);

        if (updatedLead == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedLead);
    }

    // =========================
    // DELETE → RECYCLE BIN
    // =========================
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteLead(
            @PathVariable Long id) {

        boolean deleted = leadService.deleteLead(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok("Lead moved to recycle bin");
    }

    // =========================
    // GET RECYCLE BIN
    // =========================
    @GetMapping("/recycle-bin")
    public ResponseEntity<List<Lead>> getDeletedLeads() {

        return ResponseEntity.ok(
                leadService.getDeletedLeads()
        );
    }

    // =========================
    // RECOVER LEAD
    // =========================
    @PutMapping("/{id}/recover")
    public ResponseEntity<Lead> recoverLead(
            @PathVariable Long id) {

        Lead recoveredLead = leadService.recoverLead(id);

        if (recoveredLead == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(recoveredLead);
    }

    // =========================
    // MARK AS FOLLOWED UP
    // =========================
    @PutMapping("/{id}/followed-up")
    public ResponseEntity<Lead> markAsFollowedUp(
            @PathVariable Long id) {

        Lead lead = leadService.markAsFollowedUp(id);

        if (lead == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(lead);
    }

    // =========================
    // DUPLICATE LEAD CHECK
    // =========================
    @GetMapping("/duplicate-check")
    public ResponseEntity<Boolean> duplicateCheck(
            String email,
            String phone) {

        boolean duplicate =
                leadService.isDuplicateLead(email, phone);

        return ResponseEntity.ok(duplicate);
    }
}