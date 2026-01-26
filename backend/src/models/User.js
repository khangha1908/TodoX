import bcrypt from "bcryptjs";
import { getContainer } from "../config/db.js";

const containerId = "users";

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.avatar = data.avatar;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Hash password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Create user
  static async create(data) {
    const container = getContainer(containerId);

    // Validate required fields
    if (!data.username || !data.email || !data.password) {
      throw new Error("Username, email, and password are required");
    }

    // Check uniqueness (basic check, in production use unique constraints)
    const existingUser = await this.findOne({ $or: [{ email: data.email }, { username: data.username }] });
    if (existingUser) {
      throw new Error("User with this email or username already exists");
    }

    const hashedPassword = await this.hashPassword(data.password);

    const userData = {
      id: data.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: data.username.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: data.avatar || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await container.items.create(userData);
    return new User(resource);
  }

  // Find by ID
  static async findById(id) {
    const container = getContainer(containerId);
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    };
    const { resources } = await container.items.query(querySpec).fetchAll();
    if (resources.length === 0) return null;
    return new User(resources[0]);
  }

  // Find one by query
  static async findOne(query) {
    const container = getContainer(containerId);
    let querySpec;

    if (query.email) {
      querySpec = {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: query.email }],
      };
    } else if (query.username) {
      querySpec = {
        query: "SELECT * FROM c WHERE c.username = @username",
        parameters: [{ name: "@username", value: query.username }],
      };
    } else if (query.$or) {
      // For $or queries, need to handle multiple conditions
      const conditions = [];
      const parameters = [];
      query.$or.forEach((cond, index) => {
        if (cond.email) {
          conditions.push(`c.email = @email${index}`);
          parameters.push({ name: `@email${index}`, value: cond.email });
        }
        if (cond.username) {
          conditions.push(`c.username = @username${index}`);
          parameters.push({ name: `@username${index}`, value: cond.username });
        }
      });
      querySpec = {
        query: `SELECT * FROM c WHERE ${conditions.join(" OR ")}`,
        parameters,
      };
    } else {
      throw new Error("Unsupported query");
    }

    const { resources } = await container.items.query(querySpec).fetchAll();
    if (resources.length === 0) return null;
    return new User(resources[0]);
  }

  // Update by ID
  static async findByIdAndUpdate(id, updateData) {
    const container = getContainer(containerId);
    const user = await this.findById(id);
    if (!user) return null;

    const updatedData = {
      ...user,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await container.item(id, id).replace(updatedData);
    return new User(resource);
  }

  // To plain object
  toObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default User;
