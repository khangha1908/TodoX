import { getContainer } from "../config/db.js";

const containerId = "categories";

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
    this.description = data.description;
    this.userId = data.userId || data.user;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromItem(item) {
    return new Category(item);
  }

  // ======================
  // CREATE
  // ======================
  static async create(data) {
    if (!data.name || !data.user) {
      throw new Error("Name and user are required");
    }

    const container = getContainer(containerId);

    // check trùng tên
    const exists = await this.findByNameAndUser(data.name.trim(), data.user);
    if (exists) {
      throw new Error("Category with this name already exists for this user");
    }

    const now = new Date().toISOString();

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: data.name.trim(),
      color: data.color || "#6366f1",
      description: data.description || "",
      userId: data.userId || data.user,
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await container.items.create(item);
    return Category.fromItem(resource);
  }

  // ======================
  // READ
  // ======================
  static async findById(id, userId) {
    const container = getContainer(containerId);
    try {
      const { resource } = await container.item(id, userId).read();
      return resource ? Category.fromItem(resource) : null;
    } catch {
      return null;
    }
  }

  static async findByUser(userId) {
    const container = getContainer(containerId);
    const querySpec = {
      query: `
        SELECT * FROM c
        WHERE c.userId = @user
        ORDER BY c.createdAt DESC
      `,
      parameters: [
        { name: "@user", value: userId },
      ],
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.map(Category.fromItem);
  }

  static async findByNameAndUser(name, userId) {
    const container = getContainer(containerId);
    const querySpec = {
      query: `
        SELECT * FROM c
        WHERE c.name = @name
          AND c.userId = @user
      `,
      parameters: [
        { name: "@name", value: name },
        { name: "@user", value: userId },
      ],
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.length ? Category.fromItem(resources[0]) : null;
  }

  static async find(query = {}) {
    const container = getContainer(containerId);

    let sqlQuery = "SELECT * FROM c";
    const parameters = [];
    const conditions = [];

    if (query._id && query._id.$in) {
      // Handle { _id: { $in: [...] } } query
      const ids = query._id.$in;
      if (ids.length > 0) {
        const idConditions = ids.map((id, index) => `c.id = @id${index}`);
        conditions.push(`(${idConditions.join(' OR ')})`);
        ids.forEach((id, index) => {
          parameters.push({ name: `@id${index}`, value: id });
        });
      }
    }

    if (query.user) {
      conditions.push("c.userId = @user");
      parameters.push({ name: "@user", value: query.user });
    }

    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    }

    const querySpec = { query: sqlQuery, parameters };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.map(Category.fromItem);
  }

  // ======================
  // UPDATE
  // ======================
  static async updateById(id, updateData, userId) {
    const container = getContainer(containerId);
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    if (
      updateData.name &&
      updateData.name !== existing.name
    ) {
      const dup = await this.findByNameAndUser(updateData.name, existing.userId);
      if (dup) {
        throw new Error("Category with this name already exists for this user");
      }
    }

    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await container
      .item(id, userId)
      .replace(updated);

    return Category.fromItem(resource);
  }

  // ======================
  // DELETE
  // ======================
  static async deleteById(id, userId) {
    const container = getContainer(containerId);
    await container.item(id, userId).delete();
  }
}

export default Category;
