import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token failed or expired' });
  }
};

export const restrictTo = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    try {
      const user = await User.findById(req.user.id);
      
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error while checking roles' });
    }
  };
};
