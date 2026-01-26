// Utility function to populate categories in tasks and templates
export async function populateCategories(items, Category) {
  if (!Array.isArray(items)) {
    items = [items];
  }

  // Get unique category IDs
  const categoryIds = [...new Set(items.map(item => item.category).filter(id => id))];

  if (categoryIds.length === 0) {
    return items.length === 1 ? items[0] : items;
  }

  // Fetch categories
  const categories = await Category.find({ _id: { $in: categoryIds } });

  // Create a map for quick lookup
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

  // Populate items
  const populatedItems = items.map(item => {
    if (item.category && categoryMap.has(item.category)) {
      return { ...item, category: categoryMap.get(item.category) };
    }
    return item;
  });

  return populatedItems;
}

// Extend the classes with populate method
export function addPopulateMethod(ModelClass, Category) {
  ModelClass.prototype.populate = async function(field) {
    if (field === 'category') {
      return await populateCategories(this, Category);
    }
    return this;
  };

  // Also add static populate method for arrays
  ModelClass.populate = async function(items, field) {
    if (field === 'category') {
      return await populateCategories(items, Category);
    }
    return items;
  };
}
