import express from 'express';
import Application from '../models/Application.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { sendAcceptanceEmail, sendRejectionEmail } from '../utils/emailService.js';

const router = express.Router();

// Get all applications
router.get('/applications', async (req, res) => {
  try {
    const applications = await Application.find({}).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all applications sorted by merit score for a specific course
router.get('/applications/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    const query = { course: courseId };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .sort({ meritScore: -1 })
      .select('-subjectMarks'); // Exclude detailed marks for list view

    // Calculate merit ranks for the course
    applications.forEach((app, index) => {
      app.meritRank = index + 1;
      app.save();
    });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
});

// Get application details
router.get('/application/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching application details'
    });
  }
});

// Get all applications for a specific course (this route is more specific and should be defined first)
router.get('/applications/course/:courseId', async (req, res) => {
  try {
    let query = {};
    if (req.params.courseId) {
      const course = await Course.findById(req.params.courseId);
      if (course) {
        query.course = course.title;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
    }

    const applications = await Application.find(query)
      .sort({ class12Percentage: -1 });  // Sort by class12Percentage in descending order

    // Calculate ranks based on class12Percentage
    let currentRank = 1;
    let prevScore = null;
    let sameRankCount = 0;

    applications.forEach((app) => {
      if (prevScore === app.class12Percentage) {
        sameRankCount++;
      } else {
        currentRank += sameRankCount;
        sameRankCount = 0;
      }
      app.meritRank = currentRank;
      prevScore = app.class12Percentage;
    });

    await Promise.all(applications.map(app => app.save()));

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// Update application status
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    console.log('Updating application status:', { id: req.params.id, status, adminRemarks });

    const application = await Application.findById(req.params.id);
    if (!application) {
      console.log('Application not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update the current application
    application.status = status;
    application.adminRemarks = adminRemarks || '';
    await application.save();
    console.log('Application updated successfully:', application._id);
    
    let username = application.generatedUsername || null;
    
    // Handle user creation or deletion based on application status
    if (status === 'accepted') {
      // Check if user already exists
      let existingUser = await User.findOne({ email: application.email });
      
      if (!existingUser) {
        // Create a new user account for the accepted student
        if (!username) {
          // Generate a username if one doesn't exist
          const baseUsername = `student_${(application.firstName || 'user').toLowerCase()}_${Date.now()}`;
          username = baseUsername;
          let counter = 1;
          
          while (await User.findOne({ username })) {
            username = `${baseUsername}_${counter}`;
            counter++;
          }
          
          // Save the generated username to the application
          application.generatedUsername = username;
          await application.save();
        }
        
        // Create the user
        const newUser = new User({
          username,
          email: application.email,
          firstName: application.firstName,
          lastName: application.lastName,
          role: 'student',
          profileSetup: false
        });
        
        await newUser.save();
        console.log('User created for accepted application:', newUser._id);
      } else {
        username = existingUser.username;
        console.log('User already exists for this application');
      }
    } else if (status === 'rejected') {
      // If application is rejected, delete the user if they exist
      const deletedUser = await User.findOneAndDelete({ email: application.email, profileSetup: false });
      if (deletedUser) {
        console.log('Deleted user for rejected application:', deletedUser._id);
      }
    }
    
    // Send appropriate email based on the new status
    try {
      if (status === 'accepted') {
        // Send acceptance email with the username for login
        const emailResult = await sendAcceptanceEmail(application, username);
        console.log('Acceptance email sent:', emailResult);
      } else if (status === 'rejected') {
        // Send rejection email
        const emailResult = await sendRejectionEmail(application);
        console.log('Rejection email sent:', emailResult);
      }
    } catch (emailError) {
      console.error(`Failed to send ${status} email:`, emailError);
      // Continue with the response even if email fails
    }

    // If an application is rejected, promote the next waitlisted application
    if (status === 'rejected') {
      const nextWaitlisted = await Application.findOne({
        course: application.course,
        status: 'waitlisted'
      }).sort({ meritScore: -1 });

      if (nextWaitlisted) {
        nextWaitlisted.status = 'shortlisted';
        await nextWaitlisted.save();
        console.log('Promoted next waitlisted application:', nextWaitlisted._id);
      }
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      application: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
});

// Process applications for a course
/**
 * Process applications for a specific course
 * @route POST /api/admin/process-applications/:courseId
 * @param {string} courseId - The ID of the course to process applications for
 * @returns {Object} Success message or error
 * 
 * Applications are ranked by class12Percentage in descending order
 * Top applications up to course capacity are shortlisted
 * Remaining applications are waitlisted with appropriate position numbers
 */
router.post('/process-applications/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get all pending applications for this course, sorted by class12Percentage
    const applications = await Application.find({
      course: course.title,
      status: 'pending'
    }).sort({ class12Percentage: -1 });

    // Get the course capacity
    const courseCapacity = course.capacity || 60; // Default to 60 if not set

    // Process applications based on ranking and capacity
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      if (i < courseCapacity) {
        app.status = 'shortlisted';
      } else {
        app.status = 'waitlisted';
        app.waitlistPosition = i - courseCapacity + 1;
      }
      await app.save();
    }

    res.json({ message: 'Applications processed successfully' });
  } catch (error) {
    console.error('Error processing applications:', error);
    res.status(500).json({ message: 'Error processing applications' });
  }
});

// Get new users (registered in the last 30 days)
router.get('/users/new', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .sort({ createdAt: -1 }) // Most recent first
    .select('-password'); // Exclude password field

    res.json(newUsers);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all courses of a specific type (undergraduate or graduate)
const getCoursesByType = async (type, res) => {
  try {
    // Fetch courses of the specified type from the database
    const courses = await Course.find({ type });
    return res.json(courses);
  } catch (error) {
    console.error(`Error fetching ${type} courses:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all undergraduate courses
router.get('/courses/undergraduate', async (req, res) => {
  await getCoursesByType('undergraduate', res);
});

// Get all graduate courses
router.get('/courses/graduate', async (req, res) => {
  await getCoursesByType('graduate', res);
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new course
router.post('/courses', async (req, res) => {
  try {
    const { title, type, description, duration, fees, criteria, capacity, image } = req.body;
    
    console.log('Received course data:', req.body);

    // Create course with all fields optional
    const newCourse = new Course({
      title: title || '',
      type: type || 'undergraduate',
      duration: duration || '',
      fees: fees || '',
      description: description || '',
      criteria: criteria || '',
      capacity: Number(capacity) || 60,
      image: image || 'cimage1.jpeg'
    });

    const savedCourse = await newCourse.save();
    console.log('Course saved successfully:', savedCourse);

    res.status(201).json(savedCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      message: 'Error creating course',
      error: error.message 
    });
  }
});

// Delete a course
router.delete('/courses/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course' });
  }
});

export default router;