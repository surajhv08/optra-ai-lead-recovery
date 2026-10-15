package com.leadrecovery.ai_lead_recovery.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.leadrecovery.ai_lead_recovery.entity.Lead;
import com.leadrecovery.ai_lead_recovery.repository.LeadRepository;

@Service
public class LeadService {

    private final LeadRepository leadRepository;

    public LeadService(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    // =========================
    // CREATE LEAD
    // =========================
    public Lead createLead(Lead lead) {

        if (lead.getStatus() == null || lead.getStatus().trim().isEmpty()) {
            lead.setStatus("NEW");
        }

        if (lead.getPriority() == null || lead.getPriority().trim().isEmpty()) {
            lead.setPriority("LOW");
        }

        updateFollowUpStage(lead);

        return leadRepository.save(lead);
    }

    // =========================
    // GET ALL ACTIVE LEADS
    // =========================
    public List<Lead> getAllLeads() {

        return leadRepository.findAll()
                .stream()
                .filter(lead -> !Boolean.TRUE.equals(lead.getDeleted()))
                .collect(Collectors.toList());
    }

    // =========================
    // GET LEAD BY ID
    // =========================
    public Lead getLeadById(Long id) {

        return leadRepository.findById(id)
                .filter(lead -> !Boolean.TRUE.equals(lead.getDeleted()))
                .orElse(null);
    }

    // =========================
    // UPDATE LEAD
    // =========================
    public Lead updateLead(Long id, Lead lead) {

        Lead existingLead = leadRepository.findById(id).orElse(null);

        if (existingLead == null) {
            return null;
        }

        existingLead.setName(lead.getName());
        existingLead.setEmail(lead.getEmail());
        existingLead.setPhone(lead.getPhone());
        existingLead.setEnquiry(lead.getEnquiry());
        existingLead.setDealValue(lead.getDealValue());
        existingLead.setStatus(lead.getStatus());
        existingLead.setPriority(lead.getPriority());
        existingLead.setLastResponseDate(lead.getLastResponseDate());
        existingLead.setNextFollowUpDate(lead.getNextFollowUpDate());
        existingLead.setPossibleReason(lead.getPossibleReason());

        // Source
        existingLead.setSource(lead.getSource());

        // Follow-up information
        existingLead.setFollowedUp(lead.getFollowedUp());

        updateFollowUpStage(existingLead);

        return leadRepository.save(existingLead);
    }

    // =========================
    // DELETE → RECYCLE BIN
    // =========================
    public boolean deleteLead(Long id) {

        Lead lead = leadRepository.findById(id).orElse(null);

        if (lead == null) {
            return false;
        }

        // Soft delete
        lead.setDeleted(true);

        leadRepository.save(lead);

        return true;
    }

    // =========================
    // GET RECYCLE BIN
    // =========================
    public List<Lead> getDeletedLeads() {

        return leadRepository.findAll()
                .stream()
                .filter(lead -> Boolean.TRUE.equals(lead.getDeleted()))
                .collect(Collectors.toList());
    }

    // =========================
    // RECOVER LEAD
    // =========================
    public Lead recoverLead(Long id) {

        Lead lead = leadRepository.findById(id).orElse(null);

        if (lead == null) {
            return null;
        }

        lead.setDeleted(false);

        updateFollowUpStage(lead);

        return leadRepository.save(lead);
    }

    // =========================
    // MARK AS FOLLOWED UP
    // =========================
    public Lead markAsFollowedUp(Long id) {

        Lead lead = leadRepository.findById(id).orElse(null);

        if (lead == null) {
            return null;
        }

        lead.setFollowedUp(true);
        lead.setStatus("FOLLOW_UP_DONE");
        lead.setPriority("MEDIUM");
        lead.setNextFollowUpDate(LocalDate.now().plusDays(3));

        updateFollowUpStage(lead);

        return leadRepository.save(lead);
    }

    // =========================
    // FOLLOW-UP ESCALATION
    // =========================
    public void updateFollowUpStage(Lead lead) {

        if (lead.getLastResponseDate() == null) {
            lead.setFollowUpStage("DAY_1_REMINDER");
            return;
        }

        long days = ChronoUnit.DAYS.between(
                lead.getLastResponseDate(),
                LocalDate.now()
        );

        if (days >= 10) {

            lead.setFollowUpStage("DAY_10_MANAGER_ALERT");
            lead.setPriority("HIGH");

        } else if (days >= 7) {

            lead.setFollowUpStage("DAY_7_CRITICAL");
            lead.setPriority("HIGH");

        } else if (days >= 5) {

            lead.setFollowUpStage("DAY_5_AI_MESSAGE");
            lead.setPriority("HIGH");

        } else if (days >= 3) {

            lead.setFollowUpStage("DAY_3_HIGH_PRIORITY");
            lead.setPriority("HIGH");

        } else {

            lead.setFollowUpStage("DAY_1_REMINDER");
        }
    }

    // =========================
    // DUPLICATE LEAD CHECK
    // =========================
    public boolean isDuplicateLead(String email, String phone) {

        if (email != null && !email.trim().isEmpty()) {

            if (leadRepository.existsByEmail(email.trim())) {
                return true;
            }
        }

        if (phone != null && !phone.trim().isEmpty()) {

            if (leadRepository.existsByPhone(phone.trim())) {
                return true;
            }
        }

        return false;
    }
}