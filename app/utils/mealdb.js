const BASE = 'https://www.themealdb.com/api/json/v1/1';

const cache = new Map();
const TTL   = 10 * 60 * 1000; // 10 minutes

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL) { cache.delete(key); return null; }
  return entry.value;
}
function cacheSet(key, value) { cache.set(key, { value, ts: Date.now() }); }

async function filterByIngredient(ingredient) {
  const key = 'fi:' + ingredient.toLowerCase();
  const hit = cacheGet(key);
  if (hit) return hit;
  try {
    const res   = await fetch(`${BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
    const data  = await res.json();
    const meals = data.meals || [];
    if (meals.length > 0) cacheSet(key, meals); // skip caching empty — may be a rate-limited response
    return meals;
  } catch {
    return [];
  }
}

async function lookupMeal(id) {
  const key = 'lm:' + id;
  const hit = cacheGet(key);
  if (hit) return hit;
  try {
    const res  = await fetch(`${BASE}/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals ? data.meals[0] : null;
    if (meal) cacheSet(key, meal);
    return meal;
  } catch {
    return null;
  }
}

function extractIngredients(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ing  = (meal[`strIngredient${i}`] || '').trim();
    const meas = (meal[`strMeasure${i}`]   || '').trim();
    if (ing) list.push(meas ? `${meas} ${ing}` : ing);
  }
  return list;
}

function parseSteps(instructions) {
  return (instructions || '')
    .split(/\r\n|\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Returns user items (non-expired) that match any ingredient in the given MealDB meal
function getMatchedItemsForMeal(meal, userItems) {
  const mealIngredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] || '').trim().toLowerCase();
    if (ing) mealIngredients.push(ing);
  }
  const matched = [];
  const seen    = new Set();
  for (const item of userItems) {
    if (item.status === 'expired') continue;
    const name = item.name.toLowerCase().trim();
    for (const ing of mealIngredients) {
      if ((name.includes(ing) || ing.includes(name)) && !seen.has(item.name)) {
        seen.add(item.name);
        matched.push({ name: item.name, status: item.status });
        break;
      }
    }
  }
  return matched;
}

function buildRecipeObject(full, matchedItems, likedIds) {
  const hasExpiring = matchedItems.some(i => i.status === 'expiring');
  const score = matchedItems.reduce((s, i) => s + (i.status === 'expiring' ? 2 : 1), 0);
  return {
    _id:         full.idMeal,
    name:        full.strMeal,
    description: [full.strCategory, full.strArea].filter(Boolean).join(' · '),
    thumbnail:   full.strMealThumb,
    ingredients: extractIngredients(full),
    steps:       parseSteps(full.strInstructions),
    matchedItems,
    hasExpiring,
    score,
    liked:       likedIds ? likedIds.has(full.idMeal) : true
  };
}

// Query MealDB for each active user item, find meals matching 2+ items, return sorted results
async function getSuggestedRecipes(userItems, likedIds) {
  const activeItems = userItems.filter(i => i.status !== 'expired');
  if (activeItems.length === 0) return [];

  // One API call per item
  const results = await Promise.all(
    activeItems.map(item =>
      filterByIngredient(item.name).then(meals => ({ item, meals }))
    )
  );

  // Map mealId → { meal stub, matchedItems[] }
  const mealMap = new Map();
  for (const { item, meals } of results) {
    for (const meal of meals) {
      if (!mealMap.has(meal.idMeal)) {
        mealMap.set(meal.idMeal, { meal, matchedItems: [] });
      }
      mealMap.get(meal.idMeal).matchedItems.push({ name: item.name, status: item.status });
    }
  }

  // Keep only meals with 2+ matched items
  const candidates = [...mealMap.values()].filter(v => v.matchedItems.length >= 2);
  if (candidates.length === 0) return [];

  // Fetch full details in parallel
  const detailed = await Promise.all(
    candidates.map(async ({ meal, matchedItems }) => {
      const full = await lookupMeal(meal.idMeal);
      if (!full) return null;
      return buildRecipeObject(full, matchedItems, likedIds);
    })
  );

  return detailed.filter(Boolean).sort((a, b) => b.score - a.score);
}

module.exports = { lookupMeal, extractIngredients, parseSteps, getMatchedItemsForMeal, getSuggestedRecipes };
