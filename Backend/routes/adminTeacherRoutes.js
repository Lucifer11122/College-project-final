import express from 'express';
import TeacherApplication from '../models/TeacherApplication.js';
import User from '../models/User.js';
import { generateUsername } from '../utils/userUtils.js';
import { sendTeacherAcceptanceEmail, sendTeacherRejectionEmail } from '../utils/emailService.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all teacher applications - temporarily disabled auth for debugging
router.get('/teacher-applications', async (req, res) => {
  try {
    const applications = await TeacherApplication.find({}).sort({ applicationDate: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific teacher application
router.get('/teacher-applications/:id', protect, adminOnly, async (req, res) => {
  try {
    const application = await TeacherApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update teacher application status (accept/reject) - temporarily disabled auth for debugging
router.put('/teacher-applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const application = await TeacherApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Update application status
    application.status = status;
    application.adminRemarks = adminRemarks || '';
    await application.save();
    
    // If accepted, create a user account for the teacher
    if (status === 'accepted') {
      // Generate a username based on first and last name
      const username = generateUsername(application.firstName, application.lastName);
      
      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this username' });
      }
      
      // Create a new user with teacher role
      const newUser = new User({
        username,
        email: application.email,
        firstName: application.firstName,
        lastName: application.lastName,
        role: 'teacher',
        applicationId: application._id
      });
      
      await newUser.save();
      
      // Send acceptance email with username
      await sendTeacherAcceptanceEmail(application, username);
      
      res.json({
        success: true,
        message: 'Application accepted and teacher account created',
        username
      });
    } else if (status === 'rejected') {
      // Check if a user was created for this application and delete it
      const deletedUser = await User.findOneAndDelete({ 
        email: application.email,
        role: 'teacher',
        profileSetup: false
      });
      
      if (deletedUser) {
        console.log('Deleted teacher user for rejected application:', deletedUser._id);
      }
      
      // Send rejection email
      await sendTeacherRejectionEmail(application);
      
      res.json({
        success: true,
        message: 'Application rejected and notification sent'
      });
    }
  } catch (error) {
    console.error('Error updating teacher application status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
});

export default router;
