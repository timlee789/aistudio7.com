import { Client } from 'pg';

export function createDbClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

export async function executeQuery(queryText, params = []) {
  const client = createDbClient();
  try {
    await client.connect();
    const result = await client.query(queryText, params);
    await client.end();
    return result;
  } catch (error) {
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    throw error;
  }
}