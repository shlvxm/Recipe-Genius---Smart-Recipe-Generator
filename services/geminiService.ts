
import { GoogleGenAI, Type } from "@google/genai";
import { DietaryPreference, DetectionResult, Store } from "../types";

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    detectedIngredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 1" }
        },
        required: ["name", "confidence"]
      }
    },
    recipes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          cuisine: { type: Type.STRING },
          prepTime: { type: Type.STRING },
          cookTime: { type: Type.STRING },
          isVeg: { type: Type.BOOLEAN },
          dietTags: { type: Type.ARRAY, items: { type: Type.STRING } },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          spices: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          calories: { type: Type.STRING, description: "Approximate calories per serving" }
        },
        required: ["id", "name", "cuisine", "prepTime", "cookTime", "isVeg", "dietTags", "ingredients", "spices", "instructions", "difficulty", "calories"]
      }
    }
  },
  required: ["detectedIngredients", "recipes"]
};

// Analyzes an image of food ingredients and generates recipes based on dietary preferences.
export const analyzeImageAndGenerateRecipes = async (
  imageBase64: string,
  preference: DietaryPreference
): Promise<DetectionResult> => {
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are an expert chef and nutritionist AI. 
    Your task is to analyze images of raw food ingredients and generate 3 gourmet recipes.
    
    Difficulty Assessment Logic:
    - EASY: 5 or fewer steps, basic techniques (boiling, mixing), common ingredients.
    - MEDIUM: 6-10 steps, intermediate techniques (sautéing, basic knife skills), moderate prep time.
    - HARD: 10+ steps, advanced techniques (tempering, emulsifying, precise baking), or long marination/prep.

    Constraints:
    - Identify as many specific ingredients as possible.
    - Recipes must strictly adhere to the dietary preference: ${preference}.
    - For Jain: No onions, garlic, potatoes, or any underground vegetables.
    - For Keto: High protein, high fat, extremely low carb.
    - For High-Protein: Focus on muscle building ingredients.
    - Each recipe MUST include 'difficulty' (Easy, Medium, or Hard) and 'calories' per serving.
    - Output must be valid JSON following the provided schema.
  `;

  const imagePart = {
    inlineData: {
      data: imageBase64.split(',')[1],
      mimeType: "image/jpeg"
    }
  };

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: "Detect ingredients and generate 3 matching recipes." }] },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
    }
  });

  if (!response.text) {
    throw new Error("No response from AI model");
  }

  try {
    return JSON.parse(response.text) as DetectionResult;
  } catch (e) {
    console.error("Failed to parse AI response:", response.text);
    throw new Error("Invalid response format from AI");
  }
};

// Generates recipes based on a user's search query.
export const searchRecipes = async (
  query: string,
  preference: DietaryPreference
): Promise<DetectionResult> => {
  const model = "gemini-3-pro-preview";
  const systemInstruction = `
    You are RecipeGenius AI. A user is looking for specific recipe ideas.
    Search Query: "${query}"
    Dietary Preference: ${preference}

    Generate 3 high-quality recipes that match this search. 
    If the search is vague, be creative and provide diverse options.
    If the search specifies a dish, provide 3 variations or similar alternatives.
    Ensure all recipes strictly follow the dietary constraints of: ${preference}.
    Include difficulty (Easy/Medium/Hard) and calories for each.
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: `Find/Generate 3 recipes for: ${query}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
    }
  });

  return JSON.parse(response.text || '{"detectedIngredients": [], "recipes": []}') as DetectionResult;
};

// Generates trending global recipes for the explore feed.
export const generateExploreRecipes = async (): Promise<DetectionResult> => {
  const model = "gemini-3-pro-preview";
  const systemInstruction = "Generate 3 trending global recipes for a 'Discover' feed. Carefully assign difficulty based on the complexity of the preparation process. Focus on unique cuisines. Include difficulty and calories for each.";
  
  const response = await ai.models.generateContent({
    model,
    contents: "Suggest 3 random trending recipes.",
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
    }
  });

  return JSON.parse(response.text || '{}') as DetectionResult;
};

// Finds nearby grocery stores using Google Maps grounding.
export const findNearbyStores = async (lat: number, lng: number): Promise<Store[]> => {
  const model = 'gemini-2.5-flash';
  const response = await ai.models.generateContent({
    model,
    contents: "Find 3-5 nearby grocery stores or supermarkets. Be concise and return results with clear names.",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });

  const stores: Store[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.maps) {
        stores.push({
          name: chunk.maps.title,
          uri: chunk.maps.uri
        });
      }
    });
  }

  return stores;
};
