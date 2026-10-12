import * as mealPlanService from '../services/mealPlanService.js';

export const listMealPlans = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to, status, mealType } = req.query;

    const entries = await mealPlanService.getMealPlans(userId, { from, to, status, mealType });

    res.status(200).json({
      success: true,
      count: entries.length,
      mealPlans: entries
    });
  } catch (err) {
    next(err);
  }
};

export const getMealPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const entry = await mealPlanService.getMealPlanById(userId, id);

    res.status(200).json({
      success: true,
      mealPlan: entry
    });
  } catch (err) {
    next(err);
  }
};

export const createMealPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const entry = await mealPlanService.createMealPlanEntry(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Meal plan entry created successfully',
      mealPlan: entry
    });
  } catch (err) {
    next(err);
  }
};

export const updateMealPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const entry = await mealPlanService.updateMealPlanEntry(userId, id, req.body);

    res.status(200).json({
      success: true,
      message: 'Meal plan updated successfully',
      mealPlan: entry
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMealPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await mealPlanService.deleteMealPlanEntry(userId, id);

    res.status(200).json({
      success: true,
      message: 'Meal plan entry deleted',
      deletedId: result.deletedId
    });
  } catch (err) {
    next(err);
  }
};

export const skipMealPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const entry = await mealPlanService.transitionMealStatus(userId, id, 'SKIPPED');

    res.status(200).json({
      success: true,
      message: 'Meal marked as skipped',
      mealPlan: entry
    });
  } catch (err) {
    next(err);
  }
};

export const cancelMealPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const entry = await mealPlanService.transitionMealStatus(userId, id, 'CANCELLED');

    res.status(200).json({
      success: true,
      message: 'Meal marked as cancelled',
      mealPlan: entry
    });
  } catch (err) {
    next(err);
  }
};

export const getRequirements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    const data = await mealPlanService.calculateRequirements(userId, { from, to });

    res.status(200).json({
      success: true,
      ...data
    });
  } catch (err) {
    next(err);
  }
};

export const getCookPreview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const preview = await mealPlanService.getCookPreview(userId, id);

    res.status(200).json({
      success: true,
      preview
    });
  } catch (err) {
    next(err);
  }
};

export const cookMeal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { allowPartial, customDeductions } = req.body || {};

    const result = await mealPlanService.cookMealPlan(userId, id, {
      allowPartial: Boolean(allowPartial),
      customDeductions
    });

    res.status(200).json({
      success: true,
      message: 'Meal marked as cooked and inventory deducted successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

export const reverseConsumption = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await mealPlanService.reverseConsumption(userId, id);

    res.status(200).json({
      success: true,
      message: 'Inventory consumption reversed successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const summary = await mealPlanService.getDashboardSummary(userId);

    res.status(200).json({
      success: true,
      ...summary
    });
  } catch (err) {
    next(err);
  }
};
