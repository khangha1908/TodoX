import { getContainer } from '../config/db.js';
import { randomUUID } from 'crypto';

const CONTAINER_ID = 'tasks';

class Task {
  constructor(data) {
    this.id = data.id || data._id;
    this.title = data.title;
    this.status = data.status || 'active';
    this.completedAt = data.completedAt || null;
    this.category = data.category || null;
    this.dueDate = data.dueDate || null;
    this.dueTime = data.dueTime || null;
    this.priority = data.priority || 'medium';
    this.description = data.description || '';
    this.attachments = data.attachments || [];
    this.user = data.user; // User ID
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Convert to plain object for Cosmos DB
  toItem() {
    return {
      id: this.id,
      title: this.title,
      status: this.status,
      completedAt: this.completedAt ? new Date(this.completedAt).toISOString() : null,
      category: this.category,
      dueDate: this.dueDate ? new Date(this.dueDate).toISOString() : null,
      dueTime: this.dueTime,
      priority: this.priority,
      description: this.description,
      attachments: this.attachments,
      userId: this.user,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Create from Cosmos DB item
  static fromItem(item) {
    return new Task({
      id: item.id,
      title: item.title,
      status: item.status,
      completedAt: item.completedAt,
      category: item.category,
      dueDate: item.dueDate,
      dueTime: item.dueTime,
      priority: item.priority,
      description: item.description,
      attachments: item.attachments,
      user: item.userId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    });
  }

  // Database operations
  static async create(taskData) {
    const container = getContainer(CONTAINER_ID);
    const task = new Task(taskData);

    // Generate id if not provided
    if (!task.id) {
      task.id = randomUUID();
    }

    const { resource } = await container.items.create(task.toItem());
    return Task.fromItem(resource);
  }

  static async findById(id, userId) {
    const container = getContainer(CONTAINER_ID);
    try {
      const { resource } = await container.item(id, userId).read();
      // Ensure the task belongs to the user
      return resource && resource.userId === userId ? Task.fromItem(resource) : null;
    } catch (error) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  static async findByUser(userId, options = {}) {
    const container = getContainer(CONTAINER_ID);
    let query = "SELECT * FROM c WHERE c.userId = @userId";
    const parameters = [{ name: "@userId", value: userId }];

    if (options.status) {
      query += " AND c.status = @status";
      parameters.push({ name: "@status", value: options.status });
    }

    if (options.category) {
      if (options.category === 'none') {
        query += " AND (NOT IS_DEFINED(c.category) OR c.category = null)";
      } else {
        query += " AND c.category = @category";
        parameters.push({ name: "@category", value: options.category });
      }
    }

    if (options.startDate) {
      query += " AND c.createdAt >= @startDate";
      parameters.push({ name: "@startDate", value: options.startDate });
    }

    if (options.dueDateStart) {
      query += " AND c.dueDate >= @dueDateStart";
      parameters.push({ name: "@dueDateStart", value: options.dueDateStart });
    }

    if (options.dueDateEnd) {
      query += " AND c.dueDate <= @dueDateEnd";
      parameters.push({ name: "@dueDateEnd", value: options.dueDateEnd });
    }

    query += " ORDER BY c.createdAt DESC";

    const querySpec = { query, parameters };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.map(item => Task.fromItem(item));
  }

  static async countByUser(userId, options = {}) {
    const container = getContainer(CONTAINER_ID);
    let query = "SELECT VALUE COUNT(1) FROM c WHERE c.userId = @userId";
    const parameters = [{ name: "@userId", value: userId }];

    if (options.status) {
      query += " AND c.status = @status";
      parameters.push({ name: "@status", value: options.status });
    }

    if (options.category) {
      if (options.category === 'none') {
        query += " AND (NOT IS_DEFINED(c.category) OR c.category = null)";
      } else {
        query += " AND c.category = @category";
        parameters.push({ name: "@category", value: options.category });
      }
    }

    if (options.startDate) {
      query += " AND c.createdAt >= @startDate";
      parameters.push({ name: "@startDate", value: options.startDate });
    }

    const querySpec = { query, parameters };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources[0] || 0;
  }

  // Mongoose-like methods for compatibility
  static find(query = {}, options = {}) {
    // Return a query-like object that supports chaining
    return new TaskQuery(query, options);
  }

  static async countDocuments(query = {}) {
    const container = getContainer(CONTAINER_ID);
    let sqlQuery = "SELECT VALUE COUNT(1) FROM c";
    const parameters = [];
    const conditions = [];

    if (query.user) {
      conditions.push("c.userId = @user");
      parameters.push({ name: "@user", value: query.user });
    }

    if (query.status) {
      conditions.push("c.status = @status");
      parameters.push({ name: "@status", value: query.status });
    }

    if (query.category !== undefined) {
      if (query.category === null || query.category === 'none') {
        conditions.push("(NOT IS_DEFINED(c.category) OR c.category = null)");
      } else {
        conditions.push("c.category = @category");
        parameters.push({ name: "@category", value: query.category });
      }
    }

    if (query.createdAt && query.createdAt.$gte) {
      conditions.push("c.createdAt >= @createdAt");
      parameters.push({ name: "@createdAt", value: query.createdAt.$gte.toISOString() });
    }

    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    }

    const querySpec = { query: sqlQuery, parameters };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources[0] || 0;
  }

  static async findOne(query = {}) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const task = await this.findOne(query);
    if (!task) return null;

    Object.assign(task, updateData);
    task.updatedAt = new Date().toISOString();

    await task.save();

    if (options.new !== false) {
      return task;
    }
    return task; // For simplicity, return updated task
  }

  static async findOneAndDelete(query) {
    const task = await this.findOne(query);
    if (!task) return null;

    await task.delete();
    return task;
  }

  // 🔥 FIX: Delete many tasks - Xóa song song từng task một
  static async deleteMany(query) {
    const container = getContainer(CONTAINER_ID);

    // Tìm tất cả tasks cần xóa
    const tasks = await this.find(query);

    if (tasks.length === 0) {
      return { deletedCount: 0 };
    }

    // 🔥 FIX: Xóa song song từng task một vì partition key khác nhau
    const deletePromises = tasks.map(async (task) => {
      try {
        await container.item(task.id, task.user).delete();
        return { success: true, id: task.id };
      } catch (error) {
        return { success: false, id: task.id, error: error.message };
      }
    });

    const results = await Promise.all(deletePromises);

    const deletedCount = results.filter(r => r.success).length;
    const errors = results.filter(r => !r.success);

    return {
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // 🔥 FIX: Update many tasks - Cập nhật song song từng task một
  static async updateMany(query, updateData) {
    const container = getContainer(CONTAINER_ID);

    const tasks = await this.find(query);

    if (tasks.length === 0) {
      return { modifiedCount: 0 };
    }

    // 🔥 FIX: Cập nhật song song từng task một
    const updatePromises = tasks.map(async (task) => {
      try {
        Object.assign(task, updateData);
        task.updatedAt = new Date().toISOString();

        await container.item(task.id, task.user).replace(task.toItem());
        return { success: true, id: task.id };
      } catch (error) {
        return { success: false, id: task.id, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);

    const modifiedCount = results.filter(r => r.success).length;
    const errors = results.filter(r => !r.success);

    return {
      modifiedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Instance methods
  async save() {
    const container = getContainer(CONTAINER_ID);
    this.updatedAt = new Date().toISOString();

    const { resource } = await container.item(this.id, this.user).replace(this.toItem());
    return Task.fromItem(resource);
  }

  async delete() {
    const container = getContainer(CONTAINER_ID);
    await container.item(this.id, this.user).delete();
  }

  // Populate method (simplified)
  populate(field) {
    // For now, return this - populate will be handled in controllers
    return this;
  }
}

// TaskQuery class for Mongoose-like query chaining
class TaskQuery {
  constructor(query = {}, options = {}) {
    this.query = query;
    this.options = options;
  }

  sort(sortObj) {
    this.options.sort = sortObj;
    return this;
  }

  async exec() {
    const container = getContainer(CONTAINER_ID);
    let sqlQuery = "SELECT * FROM c";
    const parameters = [];
    const conditions = [];

    if (this.query.user) {
      conditions.push("c.userId = @user");
      parameters.push({ name: "@user", value: this.query.user });
    }

    if (this.query._id) {
      if (this.query._id.$in) {
        // Handle array of IDs
        const ids = this.query._id.$in;
        const placeholders = ids.map((_, i) => "@id" + i);
        conditions.push(`c.id IN (${placeholders.join(",")})`);
        ids.forEach((id, i) => parameters.push({ name: "@id" + i, value: id }));
      } else {
        // Handle single ID
        conditions.push("c.id = @_id");
        parameters.push({ name: "@_id", value: this.query._id });
      }
    }

    if (this.query.status) {
      conditions.push("c.status = @status");
      parameters.push({ name: "@status", value: this.query.status });
    }

    if (this.query.category !== undefined) {
      if (this.query.category === null || this.query.category === 'none') {
        conditions.push("(NOT IS_DEFINED(c.category) OR c.category = null)");
      } else {
        conditions.push("c.category = @category");
        parameters.push({ name: "@category", value: this.query.category });
      }
    }

    if (this.query.createdAt && this.query.createdAt.$gte) {
      conditions.push("c.createdAt >= @createdAt");
      parameters.push({ name: "@createdAt", value: this.query.createdAt.$gte.toISOString() });
    }

    if (this.query.dueDate) {
      if (this.query.dueDate.$gte && this.query.dueDate.$lte) {
        conditions.push("c.dueDate >= @dueDateStart AND c.dueDate <= @dueDateEnd");
        parameters.push({ name: "@dueDateStart", value: this.query.dueDate.$gte.toISOString() });
        parameters.push({ name: "@dueDateEnd", value: this.query.dueDate.$lte.toISOString() });
      } else if (this.query.dueDate.$gte) {
        conditions.push("c.dueDate >= @dueDateStart");
        parameters.push({ name: "@dueDateStart", value: this.query.dueDate.$gte.toISOString() });
      } else if (this.query.dueDate.$lte) {
        conditions.push("c.dueDate <= @dueDateEnd");
        parameters.push({ name: "@dueDateEnd", value: this.query.dueDate.$lte.toISOString() });
      }
    }

    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    }

    // Add sorting
    if (this.options.sort) {
      const sortFields = [];
      for (const [field, order] of Object.entries(this.options.sort)) {
        sortFields.push(`c.${field} ${order === -1 ? 'DESC' : 'ASC'}`);
      }
      sqlQuery += ` ORDER BY ${sortFields.join(', ')}`;
    } else {
      sqlQuery += " ORDER BY c.createdAt DESC";
    }

    const querySpec = { query: sqlQuery, parameters };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.map(item => Task.fromItem(item));
  }

  // Implement thenable protocol
  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }
}

export default Task;