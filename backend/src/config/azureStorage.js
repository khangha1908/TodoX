import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads';

let blobServiceClient;
let isAzureConfigured = false;

if (process.env.NODE_ENV === 'production') {
  // Use managed identity in production
  if (accountName) {
    const credential = new DefaultAzureCredential();
    const accountUrl = `https://${accountName}.blob.core.windows.net`;
    blobServiceClient = new BlobServiceClient(accountUrl, credential);
    isAzureConfigured = true;
  }
} else {
  // Use connection string in development
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    isAzureConfigured = true;
  }
}

// Local storage fallback
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export { blobServiceClient, containerName, isAzureConfigured, uploadsDir };
