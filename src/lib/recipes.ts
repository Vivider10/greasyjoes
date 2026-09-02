export type RecipeIngredient = { ingredient: string; quantity: number }

export const recipes: Record<string, RecipeIngredient[]> = {
  'classic-burger': [
    { ingredient: 'Chopped Lettuce', quantity: 1 },
    { ingredient: 'Chopped Bacon', quantity: 1 },
    { ingredient: 'Chopped Onion', quantity: 1 },
    { ingredient: 'Chopped Meat', quantity: 2 },
  ],
  'lumberjack-melt': [
    { ingredient: 'Chopped Bacon', quantity: 1 },
    { ingredient: 'Sliced Artisan Bread', quantity: 1 },
    { ingredient: 'Sliced Chicken', quantity: 2 },
  ],
  'ocean-griller': [
    { ingredient: 'Chopped Bacon', quantity: 1 },
    { ingredient: 'Sliced Artisan Bread', quantity: 1 },
    { ingredient: 'Shredded Cheese', quantity: 2 },
  ],
  'chicken-waffles': [
    { ingredient: 'Flour', quantity: 1 },
    { ingredient: 'Scooped Sugar', quantity: 1 },
    { ingredient: 'Sliced Chicken', quantity: 2 },
  ],
  'route-1-dog': [
    { ingredient: 'Corn Flour', quantity: 2 },
    { ingredient: 'Chopped Meat', quantity: 2 },
  ],
  'paleto-pierogies': [
    { ingredient: 'Flour', quantity: 1 },
    { ingredient: 'Shredded Cheese', quantity: 1 },
    { ingredient: 'Chopped Meat', quantity: 1 },
    { ingredient: 'Cubed Potato', quantity: 2 },
  ],
  cheesecake: [
    { ingredient: 'Whipped Cream', quantity: 1 },
    { ingredient: 'Scooped Sugar', quantity: 2 },
    { ingredient: 'Shredded Cheese', quantity: 2 },
  ],
  'apple-pie': [
    { ingredient: 'Scooped Sugar', quantity: 1 },
    { ingredient: 'Sliced Apple', quantity: 2 },
    { ingredient: 'Flour', quantity: 2 },
  ],
  'northern-brew': [{ ingredient: 'Coffee Powder', quantity: 3 }],
  'paleto-punch': [
    { ingredient: 'Poured Fruit Syrup', quantity: 1 },
    { ingredient: 'Ice Cube', quantity: 1 },
    { ingredient: 'Sliced Mango', quantity: 2 },
    { ingredient: 'Sliced Lemon', quantity: 2 },
  ],
  'ocean-breeze': [
    { ingredient: 'Ice Cube', quantity: 2 },
    { ingredient: 'Sliced Lemon', quantity: 3 },
  ],
  'coastal-float': [
    { ingredient: 'Ice Cube', quantity: 1 },
    { ingredient: 'Whipped Cream', quantity: 1 },
    { ingredient: 'Poured Cream', quantity: 2 },
  ],
  'dirty-lemonade': [
    { ingredient: 'Ice Cube', quantity: 1 },
    { ingredient: 'Poured Cream', quantity: 2 },
    { ingredient: 'Sliced Lemon', quantity: 2 },
  ],
}

export function calculateIngredients(
  orders: Array<{ items: Array<{ id: string; quantity: number }> }>,
) {
  const totals: Record<string, number> = {}

  for (const order of orders) {
    for (const item of order.items) {
      for (const ingredient of recipes[item.id] ?? []) {
        totals[ingredient.ingredient] =
          (totals[ingredient.ingredient] ?? 0) + ingredient.quantity * item.quantity
      }
    }
  }

  return Object.entries(totals).sort(([a], [b]) => a.localeCompare(b))
}
