import { getContainer } from "../config/db.js";

const containerId = "tasktemplates";

class TaskTemplate {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.title = data.title;
    this.status = data.status;
    this.category = data.category;
    this.dueDate = data.dueDate;
    this.priority = data.priority;
    this.description = data.description;
    this.userId = data.userId || data.user;
    this.partitionKey = data.userId || data.user; // Store the actual partition key value
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Create template
  static async create(data) {
    const container = getContainer(containerId);

    const templateData = {
      id: data.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name?.trim() || "",
      title: data.title?.trim() || "",
      status: data.status || "active",
      category: data.category || null,
      dueDate: data.dueDate || null,
      priority: data.priority || "medium",
      description: data.description ? data.description.trim() : "",
      userId: data.userId || data.user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('➕ Đang tạo template:', templateData.name, 'ID:', templateData.id);
    
    const { resource } = await container.items.create(templateData);
    
    console.log('✅ Tạo template thành công');
    
    return new TaskTemplate(resource);
  }

  // Find by ID
  static async findById(id, userId) {
    const container = getContainer(containerId);

    console.log('🔍 Tìm template theo ID:', id, 'User:', userId);

    try {
      // Use query to find the item, in case partition key is wrong
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id AND (c.userId = @userId OR c.user = @userId)",
        parameters: [
          { name: "@id", value: id },
          { name: "@userId", value: userId }
        ]
      };

      const { resources } = await container.items.query(querySpec).fetchAll();

      if (resources.length === 0) {
        console.log('❌ Không tìm thấy template');
        return null;
      }

      const resource = resources[0];
      const template = new TaskTemplate(resource);

      // Double-check ownership for security
      if (template.userId !== userId) {
        console.log('❌ Template không thuộc về user này');
        return null;
      }

      console.log('✅ Đã tìm thấy template:', template.name);
      return template;
    } catch (error) {
      console.error('❌ Lỗi khi tìm template:', error);
      throw error;
    }
  }

  // Find by user
  static async findByUser(userId) {
    const container = getContainer(containerId);
    
    console.log('📋 Đang tìm templates cho user:', userId);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId OR c.user = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: userId }],
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    
    // 🔥 FIX: Loại bỏ duplicate templates
    const uniqueTemplates = [];
    const seenIds = new Set();
    
    for (const item of resources) {
      if (item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueTemplates.push(new TaskTemplate(item));
      } else if (item.id) {
        console.log('⚠️ Phát hiện template trùng lặp:', item.id, item.name);
      }
    }
    
    console.log(`📊 Tìm thấy ${resources.length} templates, ${uniqueTemplates.length} không trùng`);
    
    return uniqueTemplates;
  }

  // Update by ID
  static async updateById(id, userId, updateData) {
    const container = getContainer(containerId);

    console.log('🔄 Đang cập nhật template:', id);

    const template = await this.findById(id, userId);

    if (!template) {
      console.log('❌ Không thể cập nhật: không tìm thấy template');
      return null;
    }

    const updatedData = {
      ...template,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await container.item(id, template.userId).replace(updatedData);

    console.log('✅ Cập nhật template thành công');

    return new TaskTemplate(resource);
  }

  // Delete by ID
  static async deleteById(id, userId) {
    const container = getContainer(containerId);

    console.log('🗑️ Đang xóa template:', id, 'User:', userId);

    const template = await this.findById(id, userId);

    if (!template) {
      console.log('❌ Không thể xóa: không tìm thấy template hoặc không có quyền');
      return false;
    }

    try {
      // Use userId as partition key value since partition key path is '/userId'
      await container.item(id, template.userId).delete();
      console.log('✅ Xóa template thành công');
      return true;
    } catch (error) {
      // Handle case where item was already deleted or doesn't exist
      if (error.code === 404 || error.statusCode === 404) {
        console.log('⚠️ Template đã được xóa trước đó hoặc không tồn tại');
        return true; // Consider it successful since the item is gone
      }
      throw error; // Re-throw other errors
    }
  }

  // To plain object
  toObject() {
    return {
      _id: this.id,
      id: this.id,
      name: this.name,
      title: this.title,
      status: this.status,
      category: this.category,
      dueDate: this.dueDate,
      priority: this.priority,
      description: this.description,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Mongoose-like methods for compatibility
  static find(query = {}) {
    // Return a query-like object that supports chaining
    return new TaskTemplateQuery(query);
  }

  static async findOne(query = {}) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const template = await this.findOne(query);
    if (!template) return null;

    Object.assign(template, updateData);
    template.updatedAt = new Date().toISOString();

    const container = getContainer(containerId);
    const { resource } = await container.item(template.id, template.userId).replace(template.toObject());
    const updatedTemplate = new TaskTemplate(resource);

    if (options.new !== false) {
      return updatedTemplate;
    }
    return updatedTemplate;
  }

  static async findOneAndDelete(query) {
    const template = await this.findOne(query);
    if (!template) return null;

    const container = getContainer(containerId);
    await container.item(template.id, template.userId).delete();
    return template;
  }

  // Instance methods
  async save() {
    const container = getContainer(containerId);
    this.updatedAt = new Date().toISOString();

    const { resource } = await container.item(this.id, this.userId).replace(this.toObject());
    return new TaskTemplate(resource);
  }

  async delete() {
    const container = getContainer(containerId);
    await container.item(this.id, this.userId).delete();
  }

  // Populate method (simplified)
  populate(field) {
    // For now, return this - populate will be handled in controllers
    return this;
  }
}

// Query class for chaining methods like .sort()
class TaskTemplateQuery {
  constructor(query = {}) {
    this.query = query;
    this.sortOptions = {};
  }

  sort(options) {
    this.sortOptions = options;
    return this;
  }

  async then(resolve, reject) {
    try {
      const container = getContainer(containerId);
      let sqlQuery = "SELECT * FROM c";
      const parameters = [];
      const conditions = [];

      // Handle different query fields
      if (this.query._id) {
        conditions.push("c.id = @_id");
        parameters.push({ name: "@_id", value: this.query._id });
      }
      if (this.query.user) {
        conditions.push("c.user = @user");
        parameters.push({ name: "@user", value: this.query.user });
      }

      if (conditions.length > 0) {
        sqlQuery += " WHERE " + conditions.join(" AND ");
      }

      // Build ORDER BY clause
      if (this.sortOptions && Object.keys(this.sortOptions).length > 0) {
        const sortFields = [];
        for (const [field, order] of Object.entries(this.sortOptions)) {
          const direction = order === -1 ? 'DESC' : 'ASC';
          sortFields.push(`c.${field} ${direction}`);
        }
        sqlQuery += ` ORDER BY ${sortFields.join(', ')}`;
      } else {
        sqlQuery += " ORDER BY c.createdAt DESC";
      }

      const querySpec = { query: sqlQuery, parameters };
      const { resources } = await container.items.query(querySpec).fetchAll();
      
      // 🔥 FIX: Loại bỏ duplicate ở query builder
      const uniqueTemplates = [];
      const seenIds = new Set();
      
      for (const item of resources) {
        if (item.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueTemplates.push(new TaskTemplate(item));
        }
      }
      
      resolve(uniqueTemplates);
    } catch (error) {
      reject(error);
    }
  }
}

export default TaskTemplate;