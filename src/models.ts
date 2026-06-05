import modelsData from '../models.json';

export interface Model {
  id: string;
  label: string;
  tokens: number;
}

export interface ModelFit {
  model: Model;
  fits: boolean;
  ratio: number;
  percentage: number;
}

export function loadModels(): Model[] {
  if (!Array.isArray(modelsData)) {
    throw new Error('models.json must be an array');
  }
  for (const entry of modelsData) {
    if (typeof entry.id !== 'string' || typeof entry.label !== 'string' || typeof entry.tokens !== 'number' || entry.tokens <= 0) {
      throw new Error(`Invalid model entry in models.json: ${JSON.stringify(entry)}`);
    }
  }
  return modelsData as Model[];
}

export function checkFit(totalTokens: number, models: Model[]): ModelFit[] {
  if (totalTokens < 0) {
    throw new Error('totalTokens must be >= 0');
  }
  return models.map((model) => {
    const fits = totalTokens <= model.tokens;
    const ratio = totalTokens / model.tokens;
    const percentage = Math.round(ratio * 100);
    return { model, fits, ratio, percentage };
  });
}
