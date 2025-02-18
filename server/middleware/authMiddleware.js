const jwt = require('jsonwebtoken');
const config = require("config");
require("dotenv").config();
const httpStatus = require("http-status-codes").StatusCodes;
const JWT_SECRET = config.get("jwt_secret");

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(httpStatus.UNAUTHORIZED).json({ error: 'Invalid token.' });
  }
};

module.exports = authenticateToken;
