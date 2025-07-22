import express from 'express';
import { Course, Enrollment, feedbackSchema } from '../../shared/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get student's current courses
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user.studentId,
      status: 'current'
    });

    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await Course.findOne({ courseId: enrollment.courseId });
        return {
          ...enrollment.toObject(),
          course
        };
      })
    );

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's completed courses
router.get('/completed', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user.studentId,
      status: 'completed'
    });

    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await Course.findOne({ courseId: enrollment.courseId });
        return {
          ...enrollment.toObject(),
          course
        };
      })
    );

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit feedback for a course
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { enrollmentId, feedback } = feedbackSchema.parse(req.body);
    
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.studentId !== req.user.studentId) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    enrollment.feedback = feedback;
    await enrollment.save();

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get courses for enrollment (by slot)
router.get('/enrollment/:slot', authenticateToken, async (req, res) => {
  try {
    const { slot } = req.params;
    
    const courses = await Course.find({ 
      slot: slot.toUpperCase(),
      isActive: true 
    });

    // Check which courses student is already enrolled in
    const enrolledCourses = await Enrollment.find({
      studentId: req.user.studentId,
      status: 'current'
    });
    
    const enrolledCourseIds = enrolledCourses.map(e => e.courseId);
    
    const availableCourses = courses.filter(course => 
      !enrolledCourseIds.includes(course.courseId)
    );

    res.json(availableCourses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enroll in a course
router.post('/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Check if course exists
    const course = await Course.findOne({ courseId });
    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found or inactive' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: req.user.studentId,
      courseId,
      status: 'current'
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const enrollment = new Enrollment({
      studentId: req.user.studentId,
      courseId
    });

    await enrollment.save();

    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;