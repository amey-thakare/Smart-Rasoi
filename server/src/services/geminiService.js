import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

export class GeminiConfigError extends Error {
  constructor(message = 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in server/.env.') {
    super(message);
    this.name = 'GeminiConfigError';
    this.statusCode = 503;
  }
}

export class GeminiAuthError extends Error {
  constructor(message = 'Gemini API authentication failed. Please verify server GEMINI_API_KEY configuration.') {
    super(message);
    this.name = 'GeminiAuthError';
    this.statusCode = 502;
  }
}

export class GeminiRateLimitError extends Error {
  constructor(message = 'Gemini API quota or rate limit exceeded. Please wait a moment and try again.') {
    super(message);
    this.name = 'GeminiRateLimitError';
    this.statusCode = 429;
  }
}

export class GeminiTimeoutError extends Error {
  constructor(message = 'Gemini request timed out. Please try again.') {
    super(message);
    this.name = 'GeminiTimeoutError';
    this.statusCode = 504;
  }
}

export class GeminiProviderError extends Error {
  constructor(message = 'The AI service encountered a temporary error. Please try again.', statusCode = 502) {
    super(message);
    this.name = 'GeminiProviderError';
    this.statusCode = statusCode;
  }
}

export class GeminiModelError extends Error {
  constructor(message = 'The configured Gemini AI model is unavailable or unsupported. Please check GEMINI_MODEL in server/.env.') {
    super(message);
    this.name = 'GeminiModelError';
    this.statusCode = 502;
  }
}

// Ordered list of candidate models to fallback to in case of model deprecation (404) or demand spikes (503)
const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash'];

// Module-level mock client hook for automated testing and isolated CI runs
let mockGeminiClient = null;

export const setMockGeminiClient = (mockFn) => {
  mockGeminiClient = mockFn;
};

export const resetMockGeminiClient = () => {
  mockGeminiClient = null;
};

/**
 * Creates and returns the GoogleGenAI SDK client instance
 */
const getClient = () => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey.includes('replace_with_your')) {
    throw new GeminiConfigError();
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Executes a conversational or completion request to the Gemini API with timeout & error handling
 *
 * @param {Object} options
 * @param {Array|string} options.contents - The structured contents array or text prompt
 * @param {string} options.systemInstruction - The trusted server-side system instruction
 * @param {string} [options.model] - The Gemini model to use (defaults to env.GEMINI_MODEL)
 * @param {number} [options.timeoutMs] - Request timeout in milliseconds
 * @param {number} [options.maxOutputTokens] - Token output bound
 * @param {number} [options.temperature] - Temperature setting
 * @returns {Promise<string>} The assistant's text response
 */
export const generateGeminiContent = async ({
  contents,
  systemInstruction,
  model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  timeoutMs = env.GEMINI_TIMEOUT_MS || 45000,
  maxOutputTokens = 1500,
  temperature = 0.7
}) => {
  // 1. If mock hook is active (e.g. in tests), delegate to mock
  if (mockGeminiClient) {
    return await mockGeminiClient({
      contents,
      systemInstruction,
      model,
      timeoutMs,
      maxOutputTokens,
      temperature
    });
  }

  // 2. Validate API Key
  const client = getClient();

  // 3. Prepare config
  const config = {
    temperature,
    maxOutputTokens
  };

  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  // 4. Wrap with timeout
  const apiCallPromise = client.models.generateContent({
    model,
    contents,
    config
  });

  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new GeminiTimeoutError());
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    clearTimeout(timerId);

    if (!response || !response.text) {
      throw new GeminiProviderError('AI service returned an empty or invalid response.');
    }

    return response.text;
  } catch (error) {
    clearTimeout(timerId);

    // If already our categorized error, rethrow
    if (
      error instanceof GeminiConfigError ||
      error instanceof GeminiTimeoutError ||
      error instanceof GeminiAuthError ||
      error instanceof GeminiRateLimitError ||
      error instanceof GeminiModelError ||
      error instanceof GeminiProviderError
    ) {
      throw error;
    }

    // Inspect error properties safely without leaking secrets
    const errMsg = String(error?.message || '').toLowerCase();
    const errStatus = error?.status || error?.statusCode;

    // Log safe diagnostic information on server (never log API keys or secrets)
    console.error(`[Gemini API Error] Status: ${errStatus || 'Unknown'}, Code: ${error?.code || 'N/A'}, Message: ${String(error?.message || '').slice(0, 300)}`);

    // 1. Authentication & Permission
    if (
      errStatus === 401 ||
      errStatus === 403 ||
      errMsg.includes('api_key_invalid') ||
      errMsg.includes('api key not valid') ||
      errMsg.includes('unauthenticated') ||
      errMsg.includes('permission_denied')
    ) {
      throw new GeminiAuthError();
    }

    // 2. Timeouts
    if (
      errMsg.includes('timeout') ||
      errMsg.includes('aborted') ||
      errMsg.includes('etimedout')
    ) {
      throw new GeminiTimeoutError();
    }

    // 3. Quota / Rate Limits (429), Deprecated / Not Found (404), or High Demand (503)
    const isModelUnavailable = (
      errStatus === 404 ||
      errMsg.includes('not found') ||
      errMsg.includes('no longer available') ||
      errMsg.includes('is not available') ||
      (errMsg.includes('model') && (errMsg.includes('unsupported') || errMsg.includes('not found')))
    );

    const isHighDemand = (
      errStatus === 503 ||
      errMsg.includes('high demand') ||
      errMsg.includes('temporarily') ||
      errMsg.includes('unavailable')
    );

    const isRateLimited = (
      errStatus === 429 ||
      errMsg.includes('429') ||
      errMsg.includes('resource_exhausted') ||
      errMsg.includes('quota')
    );

    if (isModelUnavailable || isHighDemand || isRateLimited) {
      const candidates = FALLBACK_MODELS.filter((m) => m !== model);
      for (const fallbackModel of candidates) {
        console.warn(`[Gemini Fallback] Model "${model}" failed (${errStatus || 'error'}), attempting automatic fallback to "${fallbackModel}"...`);
        try {
          const fallbackRes = await client.models.generateContent({
            model: fallbackModel,
            contents,
            config
          });
          if (fallbackRes && fallbackRes.text) {
            console.info(`[Gemini Fallback] Successfully served request using fallback model "${fallbackModel}".`);
            return fallbackRes.text;
          }
        } catch (fallbackErr) {
          console.warn(`[Gemini Fallback Failed] Model "${fallbackModel}": ${String(fallbackErr?.message || '').slice(0, 200)}`);
        }
      }

      if (isRateLimited) {
        throw new GeminiRateLimitError();
      }
      if (isModelUnavailable) {
        throw new GeminiModelError();
      }
      if (isHighDemand) {
        throw new GeminiProviderError('The AI service is currently experiencing high demand. Please try again in a few moments.', 503);
      }
    }

    // Generic safe provider error
    throw new GeminiProviderError();
  }
};
