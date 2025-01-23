import { openai, createOpenAI } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { models } from '@/lib/ai/models';
import { customMiddleware } from './custom-middleware';
import { ollama } from 'ollama-ai-provider';

export const customModel = (apiIdentifier: string) => {
  const model = models.find((model) => model.apiIdentifier === apiIdentifier);
  if (!model) {
    throw new Error(`Model ${apiIdentifier} not found`);
  }

  if(apiIdentifier.includes('ollama')){
    const model_name = apiIdentifier.replace('-ollama', '');

    console.log("ollama model", model_name);
    const ollamaModel = ollama('deepseek-r1:7b');
    console.log("ollama model", ollamaModel);

    //return ollamaModel;

    return wrapLanguageModel({
      model: ollamaModel,
      middleware: customMiddleware,
    });
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


