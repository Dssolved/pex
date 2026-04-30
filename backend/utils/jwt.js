const crypto = require('crypto');

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function getSecret() {
  return process.env.JWT_SECRET || 'dev_secret_change_me';
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signPart(data) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function signToken(user) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    id: user._id.toString(),
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const unsigned = `${encode(header)}.${encode(payload)}`;
  const signature = signPart(unsigned);

  return `${unsigned}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is missing');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token format is invalid');
  }

  const [header, payload, signature] = parts;
  const unsigned = `${header}.${payload}`;
  const expectedSignature = signPart(unsigned);

  if (signature !== expectedSignature) {
    throw new Error('Token signature is invalid');
  }

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return decoded;
}

module.exports = { signToken, verifyToken };
