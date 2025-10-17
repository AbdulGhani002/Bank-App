require("dotenv").config();
const { MongoClient } = require("mongodb");

async function run() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URL;
  if (!uri) {
    console.error("Missing MONGO_URL/MONGODB_URL env");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const result = await db.collection("Accounts").createIndex({ userId: 1 }, { unique: true, name: "uniq_userId" });
  console.log("Index created:", result);
  await client.close();
}

run().catch((err) => {
  if (err && err.codeName === "IndexOptionsConflict") {
    console.log("Index already exists with different options. Consider dropping/recreating manually.");
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
