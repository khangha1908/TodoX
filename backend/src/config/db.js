import { CosmosClient } from '@azure/cosmos';

let client;
let database;

export const connectDB = async () => {
  try {
    const connectionString = process.env.COSMOSDB_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('COSMOSDB_CONNECTION_STRING not found');
    }

    // Parse Cosmos NoSQL connection string
    const parts = connectionString.split(';');
    let endpoint = '';
    let key = '';

    for (const part of parts) {
      if (part.startsWith('AccountEndpoint=')) {
        endpoint = part.replace('AccountEndpoint=', '');
      }
      if (part.startsWith('AccountKey=')) {
        key = part.replace('AccountKey=', '');
      }
    }

    if (!endpoint || !key) {
      throw new Error(
        'Invalid Cosmos connection string. Expected AccountEndpoint & AccountKey'
      );
    }

    console.log('Connecting to Azure Cosmos DB...');
    console.log('Endpoint:', endpoint);

    client = new CosmosClient({
      endpoint,
      key,
      userAgentSuffix: 'todox-app'
    });

    // ===== DATABASE (THROUGHPUT Ở DATABASE) =====
    const databaseId = process.env.COSMOSDB_DATABASE_ID || 'todoxdb';

    const { database: db } = await client.databases.createIfNotExists({
      id: databaseId,
      throughput: 1000 // FREE TIER
    });

    database = db;
    console.log(`✅ Database '${databaseId}' ready (1000 RU/s)`);

    // ===== CONTAINERS=====
    const containers = [
  { id: 'users', partitionKey: '/id' },
  { id: 'categories', partitionKey: '/userId' },
  { id: 'tasks', partitionKey: '/userId' },
  { id: 'tasktemplates', partitionKey: '/userId' }
];

    for (const c of containers) {
      const { container } = await database.containers.createIfNotExists({
        id: c.id,
        partitionKey: {
          paths: [c.partitionKey]
        }
      });

      console.log(`✅ Container '${c.id}' ready`);
    }

    console.log('🎉 Kết nối Cosmos DB thành công');

  } catch (error) {
    console.error('❌ Lỗi kết nối Cosmos DB:', error.message);
    process.exit(1);
  }
};

export const getDatabase = () => {
  if (!database) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return database;
};

export const getContainer = (containerId) => {
  return getDatabase().container(containerId);
};
