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

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Người dùng với email hoặc tên người dùng này đã tồn tại",
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Lỗi khi register:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Lỗi khi login:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const getProfile = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt,
    },
  });
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file upload" });
    }

    const file = req.file;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: "File không hợp lệ" });
    }

    let avatarUrl;

    /* ================== AZURE BLOB ================== */
    if (isAzureConfigured && blobServiceClient) {
      const containerClient =
        blobServiceClient.getContainerClient(containerName);

      await containerClient.createIfNotExists({ access: "blob" });

      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}${ext}`;

      const blobName = `avatars/${req.user._id}/${fileName}`;
      const blockBlobClient =
        containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      });
<<<<<<< Updated upstream
    } else {
      // Upload to local storage
      const userDir = path.join(uploadsDir, req.user._id.toString());
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = path.join(userDir, uniqueFileName);

      fs.writeFileSync(filePath, file.buffer);
      avatarUrl = `/api/uploads/avatars/${req.user._id}/${uniqueFileName}`;
=======

      // 👉 URL công khai HTTPS
      avatarUrl = blockBlobClient.url;
    }

    /* ================== LOCAL (DEV) ================== */
    else {
      const userDir = path.join(
        uploadsDir,
        req.user._id.toString()
      );
      fs.mkdirSync(userDir, { recursive: true });

      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}${ext}`;

      fs.writeFileSync(path.join(userDir, fileName), file.buffer);

      avatarUrl = `${req.protocol}://${req.get("host")}/api/uploads/avatars/${req.user._id}/${fileName}`;
>>>>>>> Stashed changes
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({
      message: "Avatar đã được cập nhật thành công",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    console.error("Lỗi uploadAvatar:", error);
    res.status(500).json({ message: "Upload avatar thất bại" });
  }
};
