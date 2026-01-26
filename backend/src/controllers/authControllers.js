import jwt from "jsonwebtoken";
import User from "../models/User.js";

import {
  blobServiceClient,
  containerName,
  isAzureConfigured,
  uploadsDir
} from "../config/azureStorage.js";

import path from "path";
import fs from "fs";

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = await User.create({
      username,
      email,
      password,
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Lỗi khi register:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );


    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    console.error("Lỗi khi login:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/* ================= GET PROFILE ================= */
export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Lỗi khi getProfile:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/* ================= UPLOAD AVATAR ================= */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    const file = req.file;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: "Chỉ chấp nhận ảnh JPEG, PNG, GIF, WebP",
      });
    }

    let avatarUrl;

    /* ===== AZURE MODE ===== */
    if (isAzureConfigured && blobServiceClient) {
      const containerClient =
        blobServiceClient.getContainerClient(containerName);

      await containerClient.createIfNotExists({
        access: "blob",
      });

      const ext = path.extname(file.originalname);
      const blobName = `avatars/${req.user.id}/${Date.now()}${ext}`;

      const blockBlobClient =
        containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      });

      avatarUrl = blockBlobClient.url;
    }

    /* ===== LOCAL MODE ===== */
    else {
      const userDir = path.join(uploadsDir, req.user.id.toString());
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}${ext}`;
      const filePath = path.join(userDir, fileName);

      fs.writeFileSync(filePath, file.buffer);

      // Use absolute URL for local uploads to work in development (different ports)
    avatarUrl = `${req.user.id}/${fileName}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true } 
    );

    res.status(200).json({
      message: "Avatar đã được cập nhật thành công",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    console.error("Lỗi khi uploadAvatar:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
