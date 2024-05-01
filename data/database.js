
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URL;

if (!uri) {
  throw new Error("MongoDB connection URI is not provided. Make sure you set the MONGO_URL environment variable.");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
}

function getDb() {
  if (!client) {
    throw new Error("You must connect first!");
  }

  return client.db(); 
}

module.exports = {
  connectToDatabase: connectToDatabase,
  getDb: getDb,
};
