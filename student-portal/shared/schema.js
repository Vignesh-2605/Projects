import mongoose from 'mongoose';
import { z } from 'zod';

// Student Schema
const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  fatherName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  parentPhoneNumber: { type: String, required: true },
  degree: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Course Schema
const courseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  faculty: { type: String, required: true },
  slot: { type: String, required: true, enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] },
  credits: { type: Number, required: true },
  semester: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  enrollmentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['current', 'completed'], default: 'current' },
  grade: { type: String, default: '' },
  completedDate: { type: Date },
  feedback: { type: String, default: '' }
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  totalClasses: { type: Number, default: 0 },
  attendedClasses: { type: Number, default: 0 },
  absentDates: [{ type: Date }],
  percentage: { type: Number, default: 0 }
});

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  assignmentId: { type: String, required: true, unique: true },
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  maxMarks: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Assignment Submission Schema
const submissionSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  assignmentId: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  submissionDate: { type: Date, default: Date.now },
  marks: { type: Number, default: 0 }
});

// Internal Marks Schema
const internalMarksSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  marks: { type: Number, default: 0 },
  maxMarks: { type: Number, required: true },
  examType: { type: String, required: true } // CT1, CT2, Quiz, etc.
});

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// NO Due Schema
const noDueSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  departments: [{
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' }
  }],
  requestDate: { type: Date, default: Date.now },
  approvalDate: { type: Date }
});

// Create models
export const Student = mongoose.model('Student', studentSchema);
export const Course = mongoose.model('Course', courseSchema);
export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export const Attendance = mongoose.model('Attendance', attendanceSchema);
export const Assignment = mongoose.model('Assignment', assignmentSchema);
export const Submission = mongoose.model('Submission', submissionSchema);
export const InternalMarks = mongoose.model('InternalMarks', internalMarksSchema);
export const Announcement = mongoose.model('Announcement', announcementSchema);
export const NoDue = mongoose.model('NoDue', noDueSchema);

// Zod validation schemas
export const loginSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const feedbackSchema = z.object({
  enrollmentId: z.string().min(1),
  feedback: z.string().min(1, 'Feedback is required')
});

export const assignmentSubmissionSchema = z.object({
  assignmentId: z.string().min(1),
  file: z.any()
});