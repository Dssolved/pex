const { verifyToken } = require('../utils/jwt');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = auth;
