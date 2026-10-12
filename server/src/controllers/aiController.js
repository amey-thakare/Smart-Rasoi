import {
  handleUserChatMessage,
  buildUserKitchenContext,
  AiAssistantError
} from '../services/aiAssistantService.js';
import {
  generateAiRecipe,
  modifyAiRecipe,
  suggestIngredientSubstitutions,
  scaleRecipeServings,
  AiRecipeError
} from '../services/aiRecipeService.js';
import {
  GeminiConfigError,
  GeminiAuthError,
  GeminiRateLimitError,
  GeminiTimeoutError,
  GeminiModelError,
  GeminiProviderError
} from '../services/geminiService.js';

/**
 * Common error handler for AI endpoints
 */
const handleAiError = (error, res, next) => {
  if (error instanceof AiAssistantError || error instanceof AiRecipeError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof GeminiConfigError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof GeminiRateLimitError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof GeminiAuthError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof GeminiTimeoutError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof GeminiModelError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof GeminiProviderError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

/**
 * Handle AI Assistant chat messages
 * POST /api/ai/chat
 */
export const chat = async (req, res, next) => {
  try {
    const result = await handleUserChatMessage(req.userId, req.body);
    return res.status(200).json({
      success: true,
      reply: result.reply,
      meta: result.meta
    });
  } catch (error) {
    handleAiError(error, res, next);
  }
};

/**
 * Get AI Assistant safe context summary for current user
 * GET /api/ai/context
 */
export const getContext = async (req, res, next) => {
  try {
    const context = await buildUserKitchenContext(req.userId);
    return res.status(200).json({
      success: true,
      context
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a new structured recipe using AI
 * POST /api/ai/recipes/generate
 */
export const generateRecipe = async (req, res, next) => {
  try {
    const recipe = await generateAiRecipe(req.userId, req.body);
    return res.status(200).json({
      success: true,
      recipe
    });
  } catch (error) {
    handleAiError(error, res, next);
  }
};

/**
 * Modify an existing recipe using AI
 * POST /api/ai/recipes/:id/modify
 */
export const modifyRecipe = async (req, res, next) => {
  try {
    const result = await modifyAiRecipe(req.userId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    handleAiError(error, res, next);
  }
};

/**
 * Suggest ingredient substitutions
 * POST /api/ai/substitutions
 */
export const getSubstitutions = async (req, res, next) => {
  try {
    const result = await suggestIngredientSubstitutions(req.userId, req.body);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    handleAiError(error, res, next);
  }
};

/**
 * Scale recipe serving size with mathematical precision and culinary non-linear guidance
 * POST /api/ai/recipes/:id/scale
 */
export const scaleRecipe = async (req, res, next) => {
  try {
    const result = await scaleRecipeServings(req.userId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      scaledRecipe: result
    });
  } catch (error) {
    handleAiError(error, res, next);
  }
};
