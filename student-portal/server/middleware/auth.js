import jwt from 'jsonwebtoken';
import { Student } from '../../shared/schema.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findOne({ studentId: decoded.studentId });
    
    if (!student) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = student;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};