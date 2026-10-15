package com.leadrecovery.ai_lead_recovery.service;

import org.springframework.stereotype.Service;

@Service
public class OptraAiService {

    public String askAI(String question) {

        if (question == null || question.trim().isEmpty()) {
            return "Please enter a question.";
        }

        String q = question.toLowerCase().trim();

        // OPTRA AI project questions
        if (q.contains("what is optra ai") ||
            q.contains("what is optra")) {

            return """
                    OPTRA AI is an AI-powered Lead Recovery System.

                    It helps businesses prevent valuable customer leads from being lost by tracking enquiries, identifying high-risk leads, managing follow-ups, analysing customer behaviour, and suggesting the next best action.

                    OPTRA AI can help sales teams:
                    • Track customer enquiries
                    • Identify high-value and high-risk leads
                    • Detect inactive customers
                    • Recommend follow-up actions
                    • Generate personalized follow-up messages
                    • Track lead recovery and conversion
                    """;
        }

        // High-risk leads
        if (q.contains("high risk") ||
            q.contains("high-risk") ||
            q.contains("critical leads")) {

            return """
                    OPTRA AI identifies high-risk leads based on factors such as:

                    • Long response delay
                    • High deal value
                    • Missed follow-ups
                    • Customer inactivity
                    • Lead priority

                    These leads should be followed up as soon as possible.
                    """;
        }

        // Follow-up questions
        if (q.contains("follow up") ||
            q.contains("follow-up") ||
            q.contains("followup")) {

            return """
                    OPTRA AI recommends follow-up actions based on lead activity.

                    General escalation:
                    Day 1 → Reminder
                    Day 3 → High Priority
                    Day 5 → AI Follow-up Message
                    Day 7 → Critical Lead
                    Day 10 → Manager Alert

                    The goal is to contact the customer before the lead is lost.
                    """;
        }

        // Next action
        if (q.contains("next action") ||
            q.contains("next best action")) {

            return """
                    The next best action depends on the customer's recent activity.

                    Recommended approach:
                    1. Call the customer first.
                    2. If the call is unanswered, send a WhatsApp message.
                    3. If there is still no response, schedule another follow-up.
                    4. Escalate highly valuable inactive leads when necessary.
                    """;
        }

        // Lead recovery
        if (q.contains("lead recovery") ||
            q.contains("recover lead")) {

            return """
                    Lead recovery means bringing an inactive or lost customer lead back into the sales process.

                    OPTRA AI helps by detecting inactivity, identifying possible reasons for no response, recommending the next action, and generating personalized follow-up communication.
                    """;
        }

        // WhatsApp message
        if (q.contains("whatsapp") ||
            q.contains("message")) {

            return """
                    Suggested follow-up message:

                    Hi, I wanted to follow up regarding your enquiry. I hope you had a chance to review the details. Please let me know if you have any questions or if you would like to discuss the next steps. We would be happy to help.
                    """;
        }

        // Greeting
        if (q.equals("hi") ||
            q.equals("hello") ||
            q.equals("hey")) {

            return """
                    Hello! 👋

                    I am OPTRA AI, your Lead Recovery Assistant.

                    You can ask me about:
                    • Leads
                    • High-risk customers
                    • Follow-ups
                    • Lead recovery
                    • Next best actions
                    • Customer communication
                    • OPTRA AI
                    """;
        }

        // Default response
        return """
                I am OPTRA AI, your Lead Recovery Assistant.

                I can currently help you with:

                • OPTRA AI project information
                • High-risk leads
                • Follow-up recommendations
                • Lead recovery
                • Next best action
                • WhatsApp follow-up messages
                • Customer communication

                Please ask me one of these questions.
                """;
    }
}