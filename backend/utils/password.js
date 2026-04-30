const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;

  const candidate = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return candidate === hash;
}

module.exports = { hashPassword, verifyPassword };
