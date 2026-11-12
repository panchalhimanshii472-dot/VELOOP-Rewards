const mongoose = require('mongoose');
const env = require('./env');

let transactionSupportCache = null;

/**
 * Connect to MongoDB using Mongoose and evaluate replica set transaction support.
 */
async function connectDatabase(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  await detectTransactionSupport();
  return mongoose.connection;
}

/**
 * Inspect MongoDB server hello output to verify whether multi-document transactions
 * (replica set or mongos) are supported in the active topology.
 */
async function detectTransactionSupport() {
  try {
    const admin = mongoose.connection.db.admin();
    const hello = await admin.command({ hello: 1 });
    transactionSupportCache = Boolean(hello.setName || hello.msg === 'isdbgrid');
  } catch {
    transactionSupportCache = false;
  }
  return transactionSupportCache;
}

function supportsTransactions() {
  return Boolean(transactionSupportCache);
}

async function disconnectDatabase() {
  transactionSupportCache = null;
  await mongoose.disconnect();
}

module.exports = {
  connectDatabase,
  detectTransactionSupport,
  supportsTransactions,
  disconnectDatabase,
};

