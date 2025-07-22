import express from 'express';
import { InternalMarks, NoDue, Enrollment, Course } from '../../shared/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get internal marks
router.get('/internal-marks', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user.studentId,
      status: 'current'
    });

    const marksData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await Course.findOne({ courseId: enrollment.courseId });
        const marks = await InternalMarks.find({
          studentId: req.user.studentId,
          courseId: enrollment.courseId
        });

        return {
          course,
          marks
        };
      })
    );

    res.json(marksData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get NO Due status
router.get('/no-due', authenticateToken, async (req, res) => {
  try {
    let noDue = await NoDue.findOne({ studentId: req.user.studentId });
    
    if (!noDue) {
      // Create initial NO Due record with 5 departments
      const departments = [
        { name: 'Library', status: 'pending' },
        { name: 'Hostel', status: 'pending' },
        { name: 'Laboratory', status: 'pending' },
        { name: 'Sports', status: 'pending' },
        { name: 'Finance', status: 'pending' }
      ];

      noDue = new NoDue({
        studentId: req.user.studentId,
        departments
      });
      await noDue.save();
    }

    res.json(noDue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request NO Due (initiate process)
router.post('/no-due/request', authenticateToken, async (req, res) => {
  try {
    let noDue = await NoDue.findOne({ studentId: req.user.studentId });
    
    if (!noDue) {
      const departments = [
        { name: 'Library', status: 'pending' },
        { name: 'Hostel', status: 'pending' },
        { name: 'Laboratory', status: 'pending' },
        { name: 'Sports', status: 'pending' },
        { name: 'Finance', status: 'pending' }
      ];

      noDue = new NoDue({
        studentId: req.user.studentId,
        departments
      });
    } else {
      // Reset all departments to pending
      noDue.departments.forEach(dept => dept.status = 'pending');
      noDue.status = 'pending';
      noDue.requestDate = new Date();
    }

    await noDue.save();
    res.json({ message: 'NO Due request initiated successfully', noDue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Simulate department approval (for demo purposes)
router.post('/no-due/approve/:department', authenticateToken, async (req, res) => {
  try {
    const { department } = req.params;
    
    const noDue = await NoDue.findOne({ studentId: req.user.studentId });
    if (!noDue) {
      return res.status(404).json({ message: 'NO Due record not found' });
    }

    const dept = noDue.departments.find(d => d.name.toLowerCase() === department.toLowerCase());
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    dept.status = 'approved';
    
    // Check if all departments are approved
    const allApproved = noDue.departments.every(d => d.status === 'approved');
    if (allApproved) {
      noDue.status = 'approved';
      noDue.approvalDate = new Date();
    }

    await noDue.save();
    res.json({ message: `${department} approval granted`, noDue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;