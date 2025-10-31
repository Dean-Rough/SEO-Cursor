import { z } from "zod";

const envSchema = z.object({
  MOZ_API: z.string().optional(),
  MOZ_DATA_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

const rawEnv = envSchema.parse({
  MOZ_API: process.env.MOZ_API?.trim(),
  MOZ_DATA_API_KEY: process.env.MOZ_DATA_API_KEY?.trim(),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.trim(),
});

function normaliseMozDataToken(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes(":")) {
    return Buffer.from(trimmed).toString("base64");
  }
  return trimmed;
}

export const env = {
  MOZ_API: rawEnv.MOZ_API,
  MOZ_DATA_API_KEY: rawEnv.MOZ_DATA_API_KEY,
  MOZ_DATA_API_TOKEN: normaliseMozDataToken(rawEnv.MOZ_DATA_API_KEY),
  OPENAI_API_KEY: rawEnv.OPENAI_API_KEY,
};

export const hasMozCredentials = Boolean(env.MOZ_API);
export const hasMozDataApiToken = Boolean(env.MOZ_DATA_API_TOKEN);
export const hasOpenAICredentials = Boolean(env.OPENAI_API_KEY);
