import { http, HttpResponse } from 'msw';

/**
 * MSW handlers for mocking LLM API responses in tests.
 * These handlers intercept network requests and return mock responses.
 */
export const handlers = [
  // Mock Ollama API
  http.post('http://localhost:11434/api/generate', () => {
    return HttpResponse.json({
      model: 'llama2',
      created_at: new Date().toISOString(),
      response: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Software Engineer position at TechCorp...',
      done: true,
    });
  }),

  // Mock Ollama health check
  http.get('http://localhost:11434/api/tags', () => {
    return HttpResponse.json({
      models: [
        { name: 'llama2', size: 3825819519 },
        { name: 'codellama', size: 3825819519 },
      ],
    });
  }),

  // Mock Gemini API
  http.post('https://generativelanguage.googleapis.com/v1beta/models/:model:generateContent', () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  addressee: 'Hiring Manager',
                  opening: 'Dear Hiring Manager,',
                  aboutMe: 'I am a software engineer with 5 years of experience in full-stack development...',
                  whyMe: 'My experience with React, TypeScript, and Node.js makes me a perfect fit for this role...',
                  whyCompany: 'I am excited about the opportunity to work at TechCorp because of your innovative approach to software development...',
                }),
              },
            ],
            role: 'model',
          },
          finishReason: 'STOP',
        },
      ],
    });
  }),

  // Mock PDF generation API (placeholder - actual endpoint TBD)
  http.post('https://api.example.com/generate-pdf', () => {
    return HttpResponse.arrayBuffer(
      new ArrayBuffer(1024), // Mock PDF binary data
      {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="cover-letter.pdf"',
        },
      }
    );
  }),
];
