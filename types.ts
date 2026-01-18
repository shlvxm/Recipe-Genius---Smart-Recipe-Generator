
export enum DietaryPreference {
  NONE = 'None',
  VEG = 'Veg',
  NON_VEG = 'Non-Veg',
  JAIN = 'Jain',
  KETO = 'Keto',
  HIGH_PROTEIN = 'High-Protein',
  LOW_OIL = 'Low-Oil'
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export interface Ingredient {
  name: string;
  confidence: number;
}

export interface Store {
  name: string;
  uri: string;
  address?: string;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  prepTime: string;
  cookTime: string;
  isVeg: boolean;
  dietTags: string[];
  ingredients: string[];
  spices: string[];
  instructions: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: string;
}

export interface DetectionResult {
  detectedIngredients: Ingredient[];
  recipes: Recipe[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
  recipeName?: string;
}
