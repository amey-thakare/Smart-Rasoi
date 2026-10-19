import {
  getExpiryCategorisation,
  recordFoodWaste,
  reverseFoodWaste,
  getFoodWasteRecords,
  getFoodWasteAnalytics,
  getAtRiskInventory,
  getExpiryRecipeSuggestions,
  getDashboardWasteSummary,
  getAiWasteAdvice
} from '../services/wasteService.js';

export const getExpiry = async (req, res, next) => {
  try {
    const data = await getExpiryCategorisation(req.userId, req.query);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const recordWaste = async (req, res, next) => {
  try {
    const record = await recordFoodWaste(req.userId, req.body);
    return res.status(201).json({
      success: true,
      data: record,
      message: 'Food waste logged successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const reverseWaste = async (req, res, next) => {
  try {
    const result = await reverseFoodWaste(req.userId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Waste record reversed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getRecords = async (req, res, next) => {
  try {
    const data = await getFoodWasteRecords(req.userId, req.query);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getFoodWasteAnalytics(req.userId, req.query);
    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

export const getAtRisk = async (req, res, next) => {
  try {
    const atRisk = await getAtRiskInventory(req.userId);
    return res.status(200).json({
      success: true,
      data: atRisk
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipeSuggestions = async (req, res, next) => {
  try {
    const suggestions = await getExpiryRecipeSuggestions(req.userId);
    return res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await getDashboardWasteSummary(req.userId);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

export const getAiAdvice = async (req, res, next) => {
  try {
    const prompt = req.body.prompt || req.body.query;
    const advice = await getAiWasteAdvice(req.userId, prompt);
    return res.status(200).json({
      success: true,
      data: advice
    });
  } catch (error) {
    next(error);
  }
};
