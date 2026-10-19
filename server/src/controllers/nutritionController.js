/**
 * Smart Rasoi - Phase 9 Nutrition Controller
 */

import {
  getRecipeNutrition,
  recalculateRecipeNutrition,
  getDietaryProfile,
  updateDietaryProfile,
  logMealConsumption,
  updateMealConsumption,
  deleteMealConsumption,
  getDailyNutrition,
  getWeeklyNutrition,
  getMealHistory,
  getDashboardNutritionSummary,
  getNutritionAssistantAdvice
} from '../services/nutritionService.js';

export const getProfile = async (req, res, next) => {
  try {
    const profile = await getDietaryProfile(req.userId);
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await updateDietaryProfile(req.userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Dietary profile and nutritional targets updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipeNutritionEstimate = async (req, res, next) => {
  try {
    const { recipeId } = req.params;
    const { servings } = req.query;
    const nutrition = await getRecipeNutrition(recipeId, servings);
    return res.status(200).json({
      success: true,
      data: nutrition
    });
  } catch (error) {
    next(error);
  }
};

export const recalculateRecipeNutritionEstimate = async (req, res, next) => {
  try {
    const { recipeId } = req.params;
    const nutrition = await recalculateRecipeNutrition(recipeId);
    return res.status(200).json({
      success: true,
      message: 'Recipe nutrition recalculated and cached successfully',
      data: nutrition
    });
  } catch (error) {
    next(error);
  }
};

export const getDaily = async (req, res, next) => {
  try {
    const { date } = req.query;
    const daily = await getDailyNutrition(req.userId, date);
    return res.status(200).json({
      success: true,
      data: daily
    });
  } catch (error) {
    next(error);
  }
};

export const getWeekly = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const weekly = await getWeeklyNutrition(req.userId, from, to);
    return res.status(200).json({
      success: true,
      data: weekly
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const history = await getMealHistory(req.userId, req.query);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const logMeal = async (req, res, next) => {
  try {
    const meal = await logMealConsumption(req.userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Meal consumption recorded successfully',
      data: meal
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateMealConsumption(req.userId, id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Meal consumption record updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteMealConsumption(req.userId, id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAssistantAdvice = async (req, res, next) => {
  try {
    const userQuery = req.body.query || req.body.prompt || req.body.question;
    const advice = await getNutritionAssistantAdvice(req.userId, userQuery);
    return res.status(200).json({
      success: true,
      data: advice
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await getDashboardNutritionSummary(req.userId);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
