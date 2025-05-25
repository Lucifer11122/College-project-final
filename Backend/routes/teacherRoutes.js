import express from 'express';
import TeacherApplication from '../models/TeacherApplication.js';
import { generateUsername } from '../utils/userUtils.js';
import User from '../models/User.js';
import { sendTeacherApplicationConfirmation } from '../utils/emailService.js';

const router = express.Router();

// Submit a new teacher application
router.post('/', async (req, res) => {
  try {
    const applicationData = req.body;
    
    // Create a new teacher application
    const teacherApplication = new TeacherApplication(applicationData);
    await teacherApplication.save();
    
    // Send confirmation email
    await sendTeacherApplicationConfirmation(teacherApplication);
    
    res.status(201).json({
      success: true,
      message: 'Teacher application submitted successfully. You will receive a confirmation email shortly.',
      applicationId: teacherApplication._id
    });
  } catch (error) {
    console.error('Error submitting teacher application:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

// Get all teacher applications (for admin use)
router.get('/', async (req, res) => {
  try {
    const applications = await TeacherApplication.find().sort({ applicationDate: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching teacher applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// Get a specific teacher application by ID
router.get('/:id', async (req, res) => {
  try {
    const application = await TeacherApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Teacher application not found'
      });
    }
    res.json(application);
  } catch (error) {
    console.error('Error fetching teacher application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
});

export default router;
