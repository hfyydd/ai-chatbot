import { openai, createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { models } from '@/lib/ai/models';
import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string) => {
  const model = models.find((model) => model.apiIdentifier === apiIdentifier);
  if (!model) {
    throw new Error(`Model ${apiIdentifier} not found`);
  }


  if (!model.apiKey || !model.baseUrl) {
    return wrapLanguageModel({
      model: openai(apiIdentifier),
      middleware: customMiddleware,
    });
  }

  const provider = createOpenAI({
    apiKey: model.apiKey,
    baseURL: model.baseUrl,
  });

  return wrapLanguageModel({
    model: provider(model.apiIdentifier),
    middleware: customMiddleware,
  });

};


