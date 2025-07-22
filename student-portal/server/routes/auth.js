import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Student, loginSchema, changePasswordSchema } from '../../shared/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = loginSchema.parse(req.body);
    
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { studentId: student.studentId, id: student._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        degree: student.degree,
        profilePicture: student.profilePicture
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await Student.findByIdAndUpdate(req.user._id, { password: hashedNewPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    studentId: req.user.studentId,
    name: req.user.name,
    email: req.user.email,
    address: req.user.address,
    dateOfBirth: req.user.dateOfBirth,
    fatherName: req.user.fatherName,
    phoneNumber: req.user.phoneNumber,
    parentPhoneNumber: req.user.parentPhoneNumber,
    degree: req.user.degree,
    profilePicture: req.user.profilePicture
  });
});

export default router;