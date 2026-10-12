import * as shoppingListService from '../services/shoppingListService.js';
import * as ingredientPriceService from '../services/ingredientPriceService.js';

export const getShoppingLists = async (req, res, next) => {
  try {
    const lists = await shoppingListService.getShoppingLists(req.user.id, req.query);
    res.json({
      success: true,
      data: { lists }
    });
  } catch (error) {
    next(error);
  }
};

export const createShoppingList = async (req, res, next) => {
  try {
    const list = await shoppingListService.createShoppingList(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: { list }
    });
  } catch (error) {
    next(error);
  }
};

export const getShoppingListById = async (req, res, next) => {
  try {
    const list = await shoppingListService.getShoppingListById(req.user.id, req.params.id);
    res.json({
      success: true,
      data: { list }
    });
  } catch (error) {
    next(error);
  }
};

export const updateShoppingList = async (req, res, next) => {
  try {
    const list = await shoppingListService.updateShoppingList(req.user.id, req.params.id, req.body);
    res.json({
      success: true,
      data: { list }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShoppingList = async (req, res, next) => {
  try {
    const result = await shoppingListService.deleteShoppingList(req.user.id, req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const item = await shoppingListService.addItem(req.user.id, req.params.id, req.body);
    res.status(201).json({
      success: true,
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const item = await shoppingListService.updateItem(req.user.id, req.params.id, req.params.itemId, req.body);
    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    const result = await shoppingListService.deleteItem(req.user.id, req.params.id, req.params.itemId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const purchaseItem = async (req, res, next) => {
  try {
    const item = await shoppingListService.purchaseItem(req.user.id, req.params.id, req.params.itemId, req.body);
    res.json({
      success: true,
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const addItemToInventory = async (req, res, next) => {
  try {
    const result = await shoppingListService.addItemToInventory(req.user.id, req.params.id, req.params.itemId, req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const generateFromMealPlan = async (req, res, next) => {
  try {
    const result = await shoppingListService.generateFromMealPlan(req.user.id, {
      ...req.body,
      targetListId: req.params.id || req.body.targetListId
    });
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getOptimisation = async (req, res, next) => {
  try {
    const result = await shoppingListService.getCostOptimisation(req.user.id, req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getAiAdvice = async (req, res, next) => {
  try {
    const result = await shoppingListService.getAiShoppingAdvice(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const recordIngredientPrice = async (req, res, next) => {
  try {
    const record = await ingredientPriceService.recordPrice(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: { record }
    });
  } catch (error) {
    next(error);
  }
};

export const getIngredientPrices = async (req, res, next) => {
  try {
    const prices = await ingredientPriceService.getPrices(req.user.id, req.query);
    res.json({
      success: true,
      data: { prices }
    });
  } catch (error) {
    next(error);
  }
};

export const getIngredientPriceTrends = async (req, res, next) => {
  try {
    const trends = await ingredientPriceService.getPriceTrends(req.user.id);
    res.json({
      success: true,
      data: { trends }
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgetSettings = async (req, res, next) => {
  try {
    const settings = await shoppingListService.getBudgetSettings(req.user.id);
    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudgetSettings = async (req, res, next) => {
  try {
    const settings = await shoppingListService.updateBudgetSettings(req.user.id, req.body);
    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await shoppingListService.getDashboardShoppingSummary(req.user.id);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
