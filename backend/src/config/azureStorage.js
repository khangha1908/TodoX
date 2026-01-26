// config/azureStorage.js
import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

/* ===== FIX __dirname (ESM) ===== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===== ENV VARIABLES ===== */
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
export const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

/* ===== EXPORTS ===== */
export let blobServiceClient = null;
export let isAzureConfigured = false;

/* ===== AZURE CONFIGURATION ===== */
const initializeAzureStorage = () => {
  try {
    // Priority 1: Connection String (works for both dev and prod)
    if (connectionString) {
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      isAzureConfigured = true;
      console.log("✅ Azure Blob Storage configured (Connection String)");
      return;
    }

    // Priority 2: Managed Identity (for production on Azure)
    if (accountName && (process.env.NODE_ENV === "production" || process.env.USE_MANAGED_IDENTITY === "true")) {
      const credential = new DefaultAzureCredential();
      const accountUrl = `https://${accountName}.blob.core.windows.net`;
      blobServiceClient = new BlobServiceClient(accountUrl, credential);
      isAzureConfigured = true;
      console.log("✅ Azure Blob Storage configured (Managed Identity)");
      return;
    }

    // Fallback: Local storage
    console.log("ℹ️ Azure Storage not configured, using local uploads");
    console.log("   To enable Azure Storage, set:");
    console.log("   - AZURE_STORAGE_CONNECTION_STRING (recommended), or");
    console.log("   - AZURE_STORAGE_ACCOUNT_NAME (for Managed Identity)");
  } catch (error) {
    console.error("❌ Error initializing Azure Storage:", error.message);
    console.log("ℹ️ Falling back to local storage");
    isAzureConfigured = false;
  }
};

// Initialize on module load
initializeAzureStorage();

/* ===== LOCAL UPLOAD FOLDER ===== */
export const uploadsDir = path.join(__dirname, "../../uploads/avatars");

// Create local uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Local uploads directory created:", uploadsDir);
  } catch (error) {
    console.error("❌ Error creating uploads directory:", error.message);
  }
}

/* ===== HELPER FUNCTIONS ===== */

/**
 * Ensure container exists
 * @param {string} containerName - Container name
 * @returns {Promise<ContainerClient>}
 */
export const ensureContainerExists = async (containerName) => {
  if (!blobServiceClient) {
    throw new Error("Azure Blob Storage is not configured");
  }

  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  try {
    await containerClient.createIfNotExists({
      access: "blob", // Public read access for blobs
    });
    return containerClient;
  } catch (error) {
    console.error("Error ensuring container exists:", error.message);
    throw error;
  }
};

/**
 * Upload file to Azure Blob Storage
 * @param {string} containerName - Container name
 * @param {string} blobName - Blob name/path
 * @param {Buffer} buffer - File buffer
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Blob URL
 */
export const uploadToBlob = async (containerName, blobName, buffer, contentType) => {
  if (!blobServiceClient) {
    throw new Error("Azure Blob Storage is not configured");
  }

  try {
    const containerClient = await ensureContainerExists(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading to blob:", error.message);
    throw error;
  }
};

/**
 * Delete blob from Azure Blob Storage
 * @param {string} containerName - Container name
 * @param {string} blobName - Blob name/path
 * @returns {Promise<boolean>}
 */
export const deleteFromBlob = async (containerName, blobName) => {
  if (!blobServiceClient) {
    throw new Error("Azure Blob Storage is not configured");
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.deleteIfExists();
    return true;
  } catch (error) {
    console.error("Error deleting from blob:", error.message);
    return false;
  }
};

/**
 * Get blob URL (for generating SAS tokens later if needed)
 * @param {string} containerName - Container name
 * @param {string} blobName - Blob name/path
 * @returns {string}
 */
export const getBlobUrl = (containerName, blobName) => {
  if (!blobServiceClient) {
    throw new Error("Azure Blob Storage is not configured");
  }

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  return blockBlobClient.url;
};