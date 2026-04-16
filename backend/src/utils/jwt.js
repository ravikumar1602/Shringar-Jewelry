'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

const signToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn, issuer: 'shringar-jewelry' });
};

const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          reject(new AppError('Token has expired. Please log in again.', 401));
        } else if (err.name === 'JsonWebTokenError') {
          reject(new AppError('Invalid token. Please log in again.', 401));
        } else {
          reject(new AppError('Token verification failed.', 401));
        }
      } else {
        resolve(decoded);
      }
    });
  });
};

const generateTokenPair = (userId, role) => {
  const payload = { id: userId, role };
  const accessToken = signToken(payload, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '7d');
  const refreshToken = signToken(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  );
  return { accessToken, refreshToken };
};

module.exports = { signToken, verifyToken, generateTokenPair };
