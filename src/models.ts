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
  return modelsData as Model[];
}

export function checkFit(totalTokens: number, models: Model[]): ModelFit[] {
  return models.map((model) => {
    const fits = totalTokens <= model.tokens;
    const ratio = totalTokens / model.tokens;
    const percentage = Math.round(ratio * 100);
    return { model, fits, ratio, percentage };
  });
}
