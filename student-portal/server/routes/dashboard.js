import express from 'express';
import { Announcement, Enrollment, Course, Attendance, Assignment, InternalMarks, NoDue } from '../../shared/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard data
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get general announcements
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get student's current courses
    const currentEnrollments = await Enrollment.find({
      studentId: req.user.studentId,
      status: 'current'
    }).populate('courseId');

    const currentCourses = await Promise.all(
      currentEnrollments.map(async (enrollment) => {
        const course = await Course.findOne({ courseId: enrollment.courseId });
        return {
          ...enrollment.toObject(),
          course
        };
      })
    );

    // Get upcoming assignments
    const upcomingAssignments = await Assignment.find({
      courseId: { $in: currentEnrollments.map(e => e.courseId) },
      dueDate: { $gte: new Date() }
    })
      .sort({ dueDate: 1 })
      .limit(3);

    res.json({
      announcements,
      currentCourses,
      upcomingAssignments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get announcements
router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;