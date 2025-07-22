import express from 'express';
import { Attendance, Enrollment, Course } from '../../shared/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get attendance for all courses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user.studentId,
      status: 'current'
    });

    const attendanceData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await Course.findOne({ courseId: enrollment.courseId });
        let attendance = await Attendance.findOne({
          studentId: req.user.studentId,
          courseId: enrollment.courseId
        });

        if (!attendance) {
          attendance = new Attendance({
            studentId: req.user.studentId,
            courseId: enrollment.courseId,
            totalClasses: 0,
            attendedClasses: 0,
            absentDates: [],
            percentage: 0
          });
          await attendance.save();
        }

        return {
          course,
          attendance
        };
      })
    );

    res.json(attendanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance details for a specific course
router.get('/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findOne({ courseId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let attendance = await Attendance.findOne({
      studentId: req.user.studentId,
      courseId
    });

    if (!attendance) {
      attendance = new Attendance({
        studentId: req.user.studentId,
        courseId,
        totalClasses: 0,
        attendedClasses: 0,
        absentDates: [],
        percentage: 0
      });
      await attendance.save();
    }

    res.json({
      course,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;