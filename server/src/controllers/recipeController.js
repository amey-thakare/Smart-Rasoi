import {
  listRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addFavourite,
  removeFavourite,
  listFavourites,
  getRecipeMatches
} from '../services/recipeService.js';

/**
 * Controller: GET /api/recipes
 */
export const getRecipes = async (req, res, next) => {
  try {
    const recipes = await listRecipes(req.userId, req.query);
    return res.status(200).json({
      success: true,
      data: {
        recipes,
        count: recipes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/recipes/matches
 */
export const getMatches = async (req, res, next) => {
  try {
    const matches = await getRecipeMatches(req.userId);
    return res.status(200).json({
      success: true,
      data: {
        matches,
        count: matches.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/recipes/favourites
 */
export const getFavourites = async (req, res, next) => {
  try {
    const favourites = await listFavourites(req.userId);
    return res.status(200).json({
      success: true,
      data: {
        favourites,
        count: favourites.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: GET /api/recipes/:id
 */
export const getRecipe = async (req, res, next) => {
  try {
    const recipe = await getRecipeById(req.userId, req.params.id);
    return res.status(200).json({
      success: true,
      data: { recipe }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: POST /api/recipes
 */
export const createRecipeItem = async (req, res, next) => {
  try {
    const recipe = await createRecipe(req.userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: { recipe }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: PATCH /api/recipes/:id
 */
export const updateRecipeItem = async (req, res, next) => {
  try {
    const recipe = await updateRecipe(req.userId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Recipe updated successfully',
      data: { recipe }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: DELETE /api/recipes/:id
 */
export const deleteRecipeItem = async (req, res, next) => {
  try {
    await deleteRecipe(req.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: POST /api/recipes/:id/favourite
 */
export const postFavourite = async (req, res, next) => {
  try {
    const result = await addFavourite(req.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Recipe added to favourites',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: DELETE /api/recipes/:id/favourite
 */
export const deleteFavourite = async (req, res, next) => {
  try {
    const result = await removeFavourite(req.userId, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Recipe removed from favourites',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
