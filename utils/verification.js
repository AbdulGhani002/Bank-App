const db = require('../data/database');
const { ObjectId } = require('mongodb');

// Check if a verification token has expired (2 hours)
function isVerificationExpired(tokenCreatedAt) {
  if (!tokenCreatedAt) return true;
  const createdTime = new Date(tokenCreatedAt).getTime();
  const currentTime = new Date().getTime();
  const twoHoursMs = 2 * 60 * 60 * 1000;
  return (currentTime - createdTime) > twoHoursMs;
}

// Check and lock account if verification expired; returns { expired: bool, locked: bool }
async function checkAndLockExpiredAccounts() {
  try {
    const unverifiedUsers = await db
      .getDb()
      .collection('Users')
      .find({ isVerified: false, accountLocked: false })
      .toArray();

    const expiredUserIds = [];
    for (const user of unverifiedUsers) {
      if (isVerificationExpired(user.tokenCreatedAt)) {
        expiredUserIds.push(user._id);
      }
    }

    if (expiredUserIds.length > 0) {
      await db
        .getDb()
        .collection('Users')
        .updateMany(
          { _id: { $in: expiredUserIds } },
          { $set: { accountLocked: true } }
        );
    }

    return { lockedCount: expiredUserIds.length };
  } catch (error) {
    console.error('Error checking expired accounts:', error);
    return { lockedCount: 0, error };
  }
}

// Check if user account is locked or verification expired
async function getUserAccountStatus(userId) {
  try {
    const user = await db
      .getDb()
      .collection('Users')
      .findOne({ _id: new ObjectId(userId) });

    if (!user) return { status: 'not_found' };

    if (user.accountLocked) {
      return { status: 'locked', message: 'Your account has been locked. Please contact customer support.' };
    }

    if (!user.isVerified && isVerificationExpired(user.tokenCreatedAt)) {
      // Lock the account now
      await db
        .getDb()
        .collection('Users')
        .updateOne(
          { _id: user._id },
          { $set: { accountLocked: true } }
        );
      return { status: 'locked', message: 'Your email verification window has expired. Please contact customer support.' };
    }

    if (!user.isVerified) {
      return { status: 'unverified', message: 'Your account is not yet verified. Please check your email.' };
    }

    return { status: 'active' };
  } catch (error) {
    console.error('Error checking account status:', error);
    return { status: 'error', error };
  }
}

module.exports = {
  isVerificationExpired,
  checkAndLockExpiredAccounts,
  getUserAccountStatus,
};
