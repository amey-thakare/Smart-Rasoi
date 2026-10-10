package com.smartrasoi.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class GeminiServiceTest {

    @InjectMocks
    private GeminiService geminiService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGenerateContent_MissingApiKey() {
        ReflectionTestUtils.setField(geminiService, "apiKey", null);
        
        String result = geminiService.generateContent("Test prompt");
        
        assertEquals("Gemini API key is not configured. AI features are currently unavailable.", result);
    }
}
