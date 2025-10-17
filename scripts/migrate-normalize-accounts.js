require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

async function run() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URL;
  if (!uri) {
    console.error("Missing MONGO_URL/MONGODB_URL env");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const users = db.collection("Users");
  const accounts = db.collection("Accounts");

  // Step 1: Ensure Accounts.userId is an ObjectId and references a real Users._id
  const cursor = accounts.find({});
  let fixed = 0, removedLegacy = 0;
  while (await cursor.hasNext()) {
    const acc = await cursor.next();
    let update = {};

    // Drop legacy accountId if present
    if (acc.accountId !== undefined) {
      update.$unset = { ...(update.$unset || {}), accountId: "" };
      removedLegacy++;
    }

    // Coerce userId to ObjectId if it’s string, and verify existence
    if (acc.userId && typeof acc.userId === "string") {
      try {
        const oid = new ObjectId(acc.userId);
        const user = await users.findOne({ _id: oid });
        if (user) {
          update.$set = { ...(update.$set || {}), userId: oid };
          fixed++;
        }
      } catch (_) {
        // not a valid ObjectId; try linking by legacy Users.userId (custom string)
        const user = await users.findOne({ userId: acc.userId });
        if (user) {
          update.$set = { ...(update.$set || {}), userId: user._id };
          fixed++;
        }
      }
    }

    if (Object.keys(update).length) {
      await accounts.updateOne({ _id: acc._id }, update);
    }
  }

  console.log(`Migration complete. Fixed userId links: ${fixed}, removed legacy accountId fields: ${removedLegacy}`);
  await client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
