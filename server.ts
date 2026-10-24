import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared GoogleGenAI client (server-side only, user-agent set to aistudio-build)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'VibeCode IDE Core API',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Single Gemini Generation Endpoint
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, model = 'gemini-3.8-flash' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are an expert AI software engineer in VibeCode IDE.',
      },
    });

    return res.json({
      text: response.text || '',
      model,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Gemini Generate Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate response from Gemini API',
    });
  }
});

// SSE Streaming for Gemini
app.post('/api/gemini/stream', async (req: Request, res: Response) => {
  const { prompt, systemInstruction, model = 'gemini-3.8-flash' } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are an expert AI software engineer in VibeCode IDE.',
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini Stream Error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`);
    res.end();
  }
});

// Multi-Model Orchestration Engine (Team Discussion & Sequential Pipeline)
app.post('/api/orchestrate', async (req: Request, res: Response) => {
  try {
    const { mode, userPrompt, contextCode, activeFile, modelsConfig } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ error: 'User prompt is required' });
    }

    const leadModel = modelsConfig?.lead || 'gemini-3.8-flash';
    const responderModels: string[] = modelsConfig?.responders || ['gemini-3.8-flash'];

    if (mode === 'pipeline') {
      // 4-Stage Sequential Pipeline: Planner -> Coder -> Reviewer -> Tester
      const pipelineSteps: any[] = [];

      // Step 1: Planner
      const planPrompt = `Task: Plan the implementation for the following user request:
"${userPrompt}"
Target File: ${activeFile || 'None'}
Context Preview:
\`\`\`
${contextCode ? contextCode.slice(0, 1500) : '// No current code'}
\`\`\`
Provide a concise 3-bullet technical specification and architectural plan.`;

      const planResp = await ai.models.generateContent({
        model: leadModel,
        contents: planPrompt,
        config: { systemInstruction: 'You are the Lead Architect / Planner. Output structured technical requirements.' },
      });
      const planText = planResp.text || 'Plan created.';
      pipelineSteps.push({
        stage: 'planner',
        model: leadModel,
        role: 'Lead Architect',
        output: planText,
      });

      // Step 2: Coder
      const codePrompt = `Implement the solution according to this specification:
${planText}

User Prompt: "${userPrompt}"
Current File: ${activeFile || 'src/main.ts'}
Existing Code:
\`\`\`
${contextCode || ''}
\`\`\`

Provide the clean, production-ready code with complete error handling.`;

      const coderModel = responderModels[0] || 'gemini-3.8-flash';
      const codeResp = await ai.models.generateContent({
        model: coderModel,
        contents: codePrompt,
        config: { systemInstruction: 'You are a Senior Systems & Full-Stack Engineer. Output robust code only.' },
      });
      const codeText = codeResp.text || '';
      pipelineSteps.push({
        stage: 'coder',
        model: coderModel,
        role: 'Senior Developer',
        output: codeText,
      });

      // Step 3: Reviewer
      const reviewPrompt = `Perform a rigorous Cyber Security, Performance, and Edge-Case code review on this implementation:
\`\`\`
${codeText.slice(0, 2000)}
\`\`\`
Check:
1. Security vulnerabilities (injection, sanitization, secrets)
2. Edge cases (null/undefined, concurrency, timeouts)
3. Zero-bloat compliance.
Give a brief verdict and 2-3 specific improvements or sign-off.`;

      const reviewerModel = responderModels[1] || 'gemini-3.8-flash';
      const reviewResp = await ai.models.generateContent({
        model: reviewerModel,
        contents: reviewPrompt,
        config: { systemInstruction: 'You are a Principal Cyber Security & Code Quality Auditor.' },
      });
      const reviewText = reviewResp.text || 'Review passed.';
      pipelineSteps.push({
        stage: 'reviewer',
        model: reviewerModel,
        role: 'Security & QA Auditor',
        output: reviewText,
      });

      // Step 4: Tester
      const testPrompt = `Write unit tests covering edge cases for this code:
\`\`\`
${codeText.slice(0, 2000)}
\`\`\`
Output concise, executable unit tests.`;

      const testResp = await ai.models.generateContent({
        model: leadModel,
        contents: testPrompt,
        config: { systemInstruction: 'You are a Senior Test Automation Engineer.' },
      });
      const testText = testResp.text || '';
      pipelineSteps.push({
        stage: 'tester',
        model: leadModel,
        role: 'Test Automation Specialist',
        output: testText,
      });

      return res.json({
        mode: 'pipeline',
        steps: pipelineSteps,
        finalCode: codeText,
        verdict: reviewText,
        tests: testText,
      });
    } else if (mode === 'team') {
      // Team Discussion Mode: Lead creates Subtasks -> Responders execute in parallel -> Lead aggregates
      const planPrompt = `You are the Team Lead orchestrating multiple AI specialists.
User Request: "${userPrompt}"
Active File: ${activeFile || 'project'}

Create a structured subtask breakdown for 2 team members:
Member A: Core Architecture & Implementation
Member B: Security, Edge Cases & Verification

Format response as JSON:
{
  "summary": "Brief summary",
  "subtasks": [
    { "id": "task-1", "assignee": "Architect", "prompt": "..." },
    { "id": "task-2", "assignee": "SecurityEngineer", "prompt": "..." }
  ]
}`;

      let planData = {
        summary: 'Team coordination plan',
        subtasks: [
          { id: 'task-1', assignee: 'Architect', prompt: `Implement: ${userPrompt}` },
          { id: 'task-2', assignee: 'SecurityEngineer', prompt: `Audit and harden: ${userPrompt}` },
        ],
      };

      try {
        const leadResp = await ai.models.generateContent({
          model: leadModel,
          contents: planPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (leadResp.text) {
          planData = JSON.parse(leadResp.text);
        }
      } catch (e) {
        console.warn('Could not parse JSON team plan, using structured fallback', e);
      }

      // Execute subtasks concurrently
      const subtaskResults = await Promise.all(
        planData.subtasks.map(async (task, idx) => {
          const modelToUse = responderModels[idx % responderModels.length] || leadModel;
          try {
            const result = await ai.models.generateContent({
              model: modelToUse,
              contents: `Subtask Assignment: ${task.prompt}\nOriginal Request: ${userPrompt}\nContext:\n${contextCode ? contextCode.slice(0, 1000) : ''}`,
            });
            return {
              id: task.id,
              assignee: task.assignee,
              model: modelToUse,
              prompt: task.prompt,
              output: result.text || '',
            };
          } catch (err: any) {
            return {
              id: task.id,
              assignee: task.assignee,
              model: modelToUse,
              prompt: task.prompt,
              output: `Execution error: ${err.message}`,
            };
          }
        })
      );

      // Synthesis step
      const synthPrompt = `Synthesize these 2 specialist contributions into a unified cohesive response with the final implementation:
${subtaskResults.map(r => `[${r.assignee} - ${r.model}]:\n${r.output}`).join('\n\n')}

Provide the clean final consensus code and summary.`;

      const synthResp = await ai.models.generateContent({
        model: leadModel,
        contents: synthPrompt,
      });

      return res.json({
        mode: 'team',
        plan: planData,
        subtaskResults,
        consensus: synthResp.text || '',
      });
    } else {
      // Single responder mode
      const resp = await ai.models.generateContent({
        model: leadModel,
        contents: `Context:\n${contextCode ? contextCode.slice(0, 2000) : ''}\n\nUser: ${userPrompt}`,
      });
      return res.json({
        mode: 'single',
        text: resp.text || '',
        model: leadModel,
      });
    }
  } catch (error: any) {
    console.error('Orchestration error:', error);
    return res.status(500).json({ error: error.message || 'Orchestration execution failed' });
  }
});

// Probe Local Models (Ollama, LM Studio)
app.post('/api/probe/local', async (req: Request, res: Response) => {
  const { provider, port } = req.body;
  const targetPort = port || (provider === 'ollama' ? 11434 : 1234);
  const targetUrl =
    provider === 'ollama'
      ? `http://127.0.0.1:${targetPort}/api/tags`
      : `http://127.0.0.1:${targetPort}/v1/models`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const fetchResp = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (fetchResp.ok) {
      const data = await fetchResp.json();
      return res.json({
        online: true,
        provider,
        port: targetPort,
        models: data.models || data.data || [],
      });
    } else {
      return res.json({
        online: false,
        provider,
        port: targetPort,
        status: fetchResp.status,
        note: 'Endpoint returned non-200 code',
      });
    }
  } catch (err: any) {
    clearTimeout(timeout);
    return res.json({
      online: false,
      provider,
      port: targetPort,
      note: 'Local service not running on this host (simulated bridge available)',
    });
  }
});

// Proxy for Custom / Third-Party Models (OpenAI, Anthropic, OpenRouter, Custom)
app.post('/api/proxy/model', async (req: Request, res: Response) => {
  const { url, headers, body } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Target URL is required' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(502).json({ error: error.message || 'Failed to proxy request' });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`[VibeCode IDE] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
