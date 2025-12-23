const { ObjectId } = require('mongodb');
const db = require('../data/database');

// Format a date consistently across views and PDFs
function formatDate(date, opts) {
  const d = new Date(date);
  const options = opts || {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  };
  return d.toLocaleString('en-US', options);
}

// Load the current user's account details by res.locals.user
async function getCurrentAccount(user) {
  if (!user || !user._id) return null;
  return db.getDb().collection('Accounts').findOne({ userId: new ObjectId(user._id) });
}

// Given transactions and current accountNumber, enrich with direction, counterpart and formatted date
async function enrichTransactions(transactions, currentAccountNumber) {
  const counterpartNumbers = new Set();
  for (const t of transactions) {
    const isSender = t.senderAccountNumber === currentAccountNumber;
    t.direction = isSender ? 'out' : 'in';
    t.counterpartAccountNumber = isSender ? t.receiverAccountNumber : t.senderAccountNumber;
    t.formattedDate = formatDate(t.date);
    if (t.counterpartAccountNumber) counterpartNumbers.add(t.counterpartAccountNumber);
  }
  const counterpartAccounts = await db
    .getDb()
    .collection('Accounts')
    .find({ accountNumber: { $in: Array.from(counterpartNumbers) } })
    .toArray();
  const userIds = counterpartAccounts.map(a => a.userId).filter(Boolean);
  const counterpartUsers = await db
    .getDb()
    .collection('Users')
    .find({ _id: { $in: userIds } })
    .toArray();
  const accountMap = new Map(counterpartAccounts.map(a => [a.accountNumber, a]));
  const userMap = new Map(counterpartUsers.map(u => [String(u._id), u]));
  for (const t of transactions) {
    const acc = accountMap.get(t.counterpartAccountNumber);
    if (acc) {
      const u = userMap.get(String(acc.userId));
      t.counterpartName = u?.name || null;
      t.counterpartEmail = u?.email || null;
    }
  }
  return transactions;
}

module.exports = {
  formatDate,
  getCurrentAccount,
  enrichTransactions,
};
