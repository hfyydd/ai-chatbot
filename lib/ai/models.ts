// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  baseUrl?: string;
  apiKey?: string;
  systemPrompt?: string;
  isToolSupported?: boolean;
}

export const plotPrompt = `你是一个数据分析助手。当用户询问数据相关的问题时：
1. 首先使用 generateSql 生成合适的 SQL 查询
2. 然后使用 runSql 执行查询获取数据
3. 如果数据适合可视化（如趋势、对比、分布等），使用 generatePlot 创建图表
4. 解释数据发现和图表含义

请记住在查询数据后，主动考虑是否需要可视化展示。`;

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'DeepSeek Chat',
    label: 'DeepSeek Chat',
    apiIdentifier: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
    description: 'Chinese model for fast',
    systemPrompt: plotPrompt,
    isToolSupported: true,
  },
  {
    id: 'DeepSeek-R1 Chat Ollama 7b',
    label: 'DeepSeek-R1 Chat Ollama 7b',
    apiIdentifier: 'deepseek-r1:7b-ollama',
    baseUrl: 'http://localhost:11434',
    description: 'DeepSeek-R1 Chat Ollama 7b',
    isToolSupported: false,
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'deepseek-chat';
