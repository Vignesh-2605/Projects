import express from 'express';
import multer from 'multer';
import path from 'path';
import { Assignment, Submission, Enrollment, Course } from '../../shared/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.studentId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs and documents are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get assignments by course
router.get('/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify student is enrolled in this course
    const enrollment = await Enrollment.findOne({
      studentId: req.user.studentId,
      courseId,
      status: 'current'
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    const assignments = await Assignment.find({ courseId }).sort({ dueDate: 1 });
    
    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          studentId: req.user.studentId,
          assignmentId: assignment.assignmentId
        });

        return {
          ...assignment.toObject(),
          submitted: !!submission,
          submission
        };
      })
    );

    res.json(assignmentsWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment
router.post('/submit', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const assignment = await Assignment.findOne({ assignmentId });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment is due
    if (new Date() > assignment.dueDate) {
      return res.status(400).json({ message: 'Assignment deadline has passed' });
    }

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      studentId: req.user.studentId,
      courseId: assignment.courseId,
      status: 'current'
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      studentId: req.user.studentId,
      assignmentId
    });

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.fileName = req.file.originalname;
      existingSubmission.filePath = req.file.path;
      existingSubmission.submissionDate = new Date();
      await existingSubmission.save();
    } else {
      // Create new submission
      const submission = new Submission({
        studentId: req.user.studentId,
        assignmentId,
        fileName: req.file.originalname,
        filePath: req.file.path
      });
      await submission.save();
    }

    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all courses for assignments dropdown
router.get('/courses/enrolled', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user.studentId,
      status: 'current'
    });

    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await Course.findOne({ courseId: enrollment.courseId });
        return course;
      })
    );

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;