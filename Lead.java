package com.leadrecovery.ai_lead_recovery.entity;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "leads")
public class Lead {

    // =========================
    // PRIMARY KEY
    // =========================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // BASIC CUSTOMER DETAILS
    // =========================
    private String name;

    private String email;

    private String phone;

    private String enquiry;

    // =========================
    // DEAL DETAILS
    // =========================
    private Double dealValue;

    private String priority;

    private String status;

    private String source;

    // =========================
    // FOLLOW-UP DATES
    // =========================
    private LocalDate lastResponseDate;

    private LocalDate nextFollowUpDate;

    // =========================
    // AI / CUSTOMER ANALYSIS
    // =========================
    private String possibleReason;

    private String gender;

    private String sentiment;

    private String preferredContact;

    private String mainConcern;

    private String bestFollowUp;

    // =========================
    // FOLLOW-UP MANAGEMENT
    // =========================
    private String followUpStage;

    private Boolean followedUp = false;

    // =========================
    // RECYCLE BIN
    // =========================
    private Boolean deleted = false;


    // =========================
    // CONSTRUCTOR
    // =========================

    public Lead() {
    }


    // =========================
    // GETTERS AND SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }


    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }


    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }


    public String getEnquiry() {
        return enquiry;
    }

    public void setEnquiry(String enquiry) {
        this.enquiry = enquiry;
    }


    public Double getDealValue() {
        return dealValue;
    }

    public void setDealValue(Double dealValue) {
        this.dealValue = dealValue;
    }


    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }


    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }


    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }


    public LocalDate getLastResponseDate() {
        return lastResponseDate;
    }

    public void setLastResponseDate(LocalDate lastResponseDate) {
        this.lastResponseDate = lastResponseDate;
    }


    public LocalDate getNextFollowUpDate() {
        return nextFollowUpDate;
    }

    public void setNextFollowUpDate(LocalDate nextFollowUpDate) {
        this.nextFollowUpDate = nextFollowUpDate;
    }


    public String getPossibleReason() {
        return possibleReason;
    }

    public void setPossibleReason(String possibleReason) {
        this.possibleReason = possibleReason;
    }


    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }


    public String getSentiment() {
        return sentiment;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }


    public String getPreferredContact() {
        return preferredContact;
    }

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }


    public String getMainConcern() {
        return mainConcern;
    }

    public void setMainConcern(String mainConcern) {
        this.mainConcern = mainConcern;
    }


    public String getBestFollowUp() {
        return bestFollowUp;
    }

    public void setBestFollowUp(String bestFollowUp) {
        this.bestFollowUp = bestFollowUp;
    }


    public String getFollowUpStage() {
        return followUpStage;
    }

    public void setFollowUpStage(String followUpStage) {
        this.followUpStage = followUpStage;
    }


    public Boolean getFollowedUp() {
        return followedUp;
    }

    public void setFollowedUp(Boolean followedUp) {
        this.followedUp = followedUp;
    }


    public Boolean getDeleted() {
        return deleted;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }
}