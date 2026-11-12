const mongoose = require('mongoose');
const { supportsTransactions } = require('../config/db');

/**
 * Executes an operation inside a MongoDB ACID transaction when running on a
 * replica set or mongos, and falls back gracefully to session-less execution
 * when running against a standalone MongoDB server.
 *
 * @param {(session: import('mongoose').ClientSession | null) => Promise<any>} work
 */
async function runWithOptionalTransaction(work) {
  if (!supportsTransactions()) {
    return work(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    // Handle standalone topologies discovered dynamically
    if (
      err &&
      (err.code === 20 ||
        (typeof err.message === 'string' &&
          err.message.includes('Transaction numbers are only allowed')))
    ) {
      return work(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  runWithOptionalTransaction,
};

