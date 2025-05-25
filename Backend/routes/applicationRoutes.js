import express from 'express';
import Application from '../models/Application.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { sendApplicationConfirmation } from '../utils/emailService.js';

const router = express.Router();

/**
 * Test endpoint for API verification
 * @route GET /api/applications/test
 */
router.get('/test', (req, res) => {
  console.log('Test endpoint accessed');
  return res.status(200).json({ success: true, message: 'Application API is working!' });
});

/**
 * Health check endpoint
 * @route GET /api/applications
 */
router.get('/', (req, res) => {
  return res.status(200).json({ status: 'ok', message: 'Application API is running' });
});

/**
 * Submit a new student application
 * @route POST /api/applications
 * @param {string} firstName - Student's first name
 * @param {string} lastName - Student's last name
 * @param {string} email - Student's email address
 * @param {string} dob - Date of birth
 * @param {string} course - Selected course name
 * @param {string} courseType - Type of course (undergraduate/postgraduate)
 * @param {Object} subjectMarks - Object containing subject marks
 * @returns {Object} Application data or error message
 */
router.post('/', async (req, res) => {
  try {
    console.log('Received application submission request');
    
    // Extract data from request
    const { 
      firstName, 
      lastName, 
      email, 
      dob, 
      course,
      courseType,
      city, 
      state, 
      zip,
      board,
      class12Percentage,
      selectedSubjects,
      subjectMarks
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email) {
      console.error('Missing required fields');
      return res.status(400).json({ success: false, message: 'Missing required fields: firstName, lastName, and email are required' });
    }
    
    // Generate a unique username for future use
    const timestamp = Date.now();
    const uniqueUsername = `student_${firstName.toLowerCase()}_${timestamp}`;
    
    // Calculate percentage from subject marks if not provided
    let finalPercentage = Number(class12Percentage || 0);
    if (!finalPercentage && subjectMarks && Object.keys(subjectMarks).length > 0) {
      const marks = Object.values(subjectMarks);
      const total = marks.reduce((sum, mark) => sum + Number(mark), 0);
      finalPercentage = total / marks.length;
    }
    
    // Create the application object
    const application = new Application({
      firstName,
      lastName,
      email,
      dob: dob ? new Date(dob) : new Date(),
      course: course || 'Unspecified',
      courseType: courseType || 'undergraduate',
      city: city || '',
      state: state || '',
      zip: zip || '',
      board: board || '',
      class12Percentage: finalPercentage,
      selectedSubjects: selectedSubjects || [],
      subjectMarks: subjectMarks || {},
      status: 'pending',
      applicationDate: new Date(),
      meritScore: finalPercentage, // Using class12Percentage as merit score
      generatedUsername: uniqueUsername
    });
    
    // Save the application
    const savedApplication = await application.save();
    console.log('Application saved successfully with ID:', savedApplication._id);
    
    // Generate a user-friendly application ID
    const applicationId = `APP${new Date().getFullYear()}${savedApplication._id.toString().slice(-6)}`;
    
    // Try to send confirmation email
    try {
      await sendApplicationConfirmation(savedApplication);
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue even if email fails
    }
    
    // Send success response
    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully! A confirmation email has been sent.',
      applicationId,
      score: finalPercentage
    });
    
  } catch (error) {
    console.error('Error in application submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Error submitting application. Please try again.',
      error: error.message
    });
  }
});

// Get available seats for a course
router.get('/available-seats/:courseTitle', async (req, res) => {
  try {
    const course = await Course.findOne({ title: req.params.courseTitle });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get current merit cutoff
    const applications = await Application.find({
      course: req.params.courseTitle,
      status: { $ne: 'rejected' }
    }).sort({ meritScore: -1 });
    
    console.log(`Found ${applications.length} applications for course: ${req.params.courseTitle}`);

    const availableSeats = course.capacity - applications.length;
    const meritCutoff = applications.length >= course.capacity 
      ? applications[course.capacity - 1].meritScore 
      : 0;

    res.json({
      success: true,
      availableSeats,
      totalCapacity: course.capacity,
      currentApplications: applications.length,
      meritCutoff: meritCutoff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available seats',
      error: error.message
    });
  }
});

// Get application status
router.get('/status/:id', async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    res.json({
      success: true,
      status: application.status,
      meritScore: application.meritScore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching application status"
    });
  }
});

// Process applications for a course (to be run periodically or on-demand)
router.post('/process/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { capacity } = req.body;

    // Get all pending applications for the course
    const applications = await Application.find({
      course: courseId,
      status: 'pending'
    }).sort({ meritScore: -1 }); // Sort by merit score in descending order

    // Process applications based on merit and capacity
    const acceptedCount = 0;
    const updatedApplications = applications.map(app => {
      if (acceptedCount < capacity && app.meritScore >= 60) { // Minimum merit score threshold
        return {
          ...app,
          status: 'accepted'
        };
      }
      return {
        ...app,
        status: 'rejected'
      };
    });

    // Update all applications
    await Promise.all(updatedApplications.map(app => 
      Application.findByIdAndUpdate(app._id, { status: app.status })
    ));

    res.json({
      success: true,
      message: "Applications processed successfully",
      accepted: acceptedCount,
      total: applications.length
    });
  } catch (error) {
    console.error('Error processing applications:', error);
    res.status(500).json({
      success: false,
      message: "Error processing applications"
    });
  }
});

export default router;