// OpenAI client pointed at NVIDIA Integrate (OpenAI-compatible).
import 'dotenv/config';
import OpenAI from 'openai';

const baseURL = 'https://integrate.api.nvidia.com/v1';
const apiKey = process.env.NV_API_KEY;
if (!apiKey) throw new Error('Set NV_API_KEY in .env');

export const client = new OpenAI({ apiKey, baseURL });

export const modelName = process.env.NV_MODEL || 'nvidia/llama-3.3-nemotron-super-49b-v1.5';

