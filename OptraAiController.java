package com.leadrecovery.ai_lead_recovery.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.leadrecovery.ai_lead_recovery.service.OptraAiService;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class OptraAiController {

    private final OptraAiService optraAiService;

    public OptraAiController(OptraAiService optraAiService) {
        this.optraAiService = optraAiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody ChatRequest request) {

        if (request.question() == null ||
                request.question().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Please enter a question.");
        }

        String answer = optraAiService.askAI(request.question());

        return ResponseEntity.ok(answer);
    }

    public record ChatRequest(String question) {
    }
}