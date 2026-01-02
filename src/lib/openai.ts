import OpenAI from 'openai';

// Support for different AI providers
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' | 'ollama'

// OpenAI client (only if using OpenAI)
export const openai = AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Ollama client (for local open-source models)
export const ollama = AI_PROVIDER === 'ollama'
  ? new OpenAI({
      apiKey: 'ollama', // Ollama doesn't need an API key
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    })
  : null;

// Get the active client
export const aiClient = ollama || openai;

// Model configurations
export const MODELS = {
  // OpenAI models (current as of 2024)
  VISION: 'gpt-4o', // Updated from deprecated gpt-4-vision-preview
  GPT4_TURBO: 'gpt-4-turbo',
  GPT4: 'gpt-4',
  GPT35_TURBO: 'gpt-3.5-turbo',

  // Ollama models (vision-capable)
  LLAVA: 'llava', // LLaVA - vision model
  LLAMA_VISION: 'llama3.2-vision', // Llama 3.2 with vision
  BAKLLAVA: 'bakllava', // BakLLaVA - another vision model
} as const;

// Get the appropriate vision model based on provider
export const getVisionModel = () => {
  if (AI_PROVIDER === 'ollama') {
    return process.env.OLLAMA_VISION_MODEL || MODELS.LLAVA;
  }
  return MODELS.VISION;
};

// Default parameters
export const DEFAULT_PARAMS = {
  temperature: 0.3, // Lower for more deterministic results
  max_tokens: 1000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};
