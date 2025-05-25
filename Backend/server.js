import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import adminTeacherRoutes from "./routes/adminTeacherRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import { protect } from './middleware/authMiddleware.js';
import dotenv from "dotenv";
import dashboardRoutes from './routes/dashboardRoutes.js';
import Query from './models/Query.js';
import User from './models/User.js';
import Class from './models/Class.js';
import Notice from './models/Notice.js';
import Course from './models/Course.js';
import compression from 'compression';
import Notification from './models/Notification.js';
import Grievance from './models/Grievance.js';

dotenv.config();
const app = express();
const port = 5000;

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * CORS configuration
 * Note: In production, replace '*' with specific allowed origins
 */
app.use(cors({
  origin: '*', // TODO: Restrict to specific origins in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'Pragma', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  maxAge: 86400 // Cache preflight request for 24 hours
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add compression middleware
app.use(compression());

// Update the cache middleware
app.use((req, res, next) => {
  // List of routes that should never be cached
  const noCacheRoutes = [
    '/api/auth/',
    '/api/admin/',
    '/grievances',
    '/notifications',
    '/api/queries',
    '/api/notices'
  ];

  // Check if the current route should not be cached
  const shouldNotCache = noCacheRoutes.some(route => req.path.includes(route));

  if (shouldNotCache) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  } else {
    // Limited caching for static content only
    res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
  }
  next();
});

// All notifications and grievances are now stored in MongoDB

// Get all notifications
app.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });
    res.json(notifications.map(n => n.message));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Add a new notification
app.post("/notifications", async (req, res) => {
  try {
    const { notification } = req.body;
    
    if (!notification || typeof notification !== "string" || !notification.trim()) {
      return res.status(400).json({ message: "Invalid notification format!" });
    }

    const newNotification = new Notification({
      message: notification.trim()
    });

    await newNotification.save();
    
    // Fetch all notifications after adding new one
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });

    res.status(201).json(notifications.map(n => n.message));
  } catch (error) {
    console.error('Error adding notification:', error);
    res.status(500).json({ message: "Error adding notification" });
  }
});

// Delete a notification
app.delete("/notifications/:index", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });
    const index = parseInt(req.params.index);

    if (index >= 0 && index < notifications.length) {
      await Notification.findByIdAndDelete(notifications[index]._id);
      
      // Get updated notifications
      const updatedNotifications = await Notification.find()
        .sort({ createdAt: -1 });

      res.json(updatedNotifications.map(n => n.message));
    } else {
      res.status(404).json({ message: "Notification not found!" });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: "Error deleting notification" });
  }
});

// Get all grievances
app.get("/grievances", async (req, res) => {
  try {
    const grievances = await Grievance.find().sort({ date: -1 });
    res.json(grievances);
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({ message: "Error fetching grievances" });
  }
});

// Add a new grievance
app.post("/grievances", async (req, res) => {
  try {
    const { complaint, username, role } = req.body;
    
    if (!complaint || !complaint.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "Complaint text is required" 
      });
    }

    const newGrievance = new Grievance({
      complaint: complaint.trim(),
      username: username || 'Anonymous',
      role: role || 'Unknown',
      date: new Date()
    });

    const savedGrievance = await newGrievance.save();
    
    res.status(201).json({ 
      success: true,
      message: "Grievance submitted successfully!",
      grievance: savedGrievance 
    });
  } catch (error) {
    console.error('Error adding grievance:', error);
    res.status(500).json({ 
      success: false,
      message: "Error submitting grievance",
      error: error.message 
    });
  }
});

// Delete a grievance
app.delete("/grievances/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid grievance ID format" 
      });
    }

    console.log('Attempting to delete grievance:', id);

    const deletedGrievance = await Grievance.findByIdAndDelete(id);
    
    if (!deletedGrievance) {
      console.log('Grievance not found:', id);
      return res.status(404).json({ 
        success: false,
        message: "Grievance not found" 
      });
    }

    console.log('Grievance deleted successfully:', deletedGrievance);
    
    // Fetch updated grievances
    const updatedGrievances = await Grievance.find().sort({ date: -1 });
    
    res.json({ 
      success: true,
      message: "Grievance deleted successfully",
      grievances: updatedGrievances
    });
  } catch (error) {
    console.error('Error deleting grievance:', error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting grievance",
      error: error.message 
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminTeacherRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/teacher-applications", teacherRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/queries', queryRoutes);

// Admin routes for class management
app.get("/api/admin/teachers", async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teachers" });
  }
});

app.get("/api/admin/students", async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

app.get("/api/admin/classes", async (req, res) => {
  try {
    console.log('Fetching all classes...');
    const classes = await Class.find()
      .populate('teacher', 'firstName lastName')
      .populate('students', 'firstName lastName');
    
    console.log('Found classes:', classes);
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: "Error fetching classes" });
  }
});

app.post("/api/admin/classes", async (req, res) => {
  try {
    const { name, teacher, students, description } = req.body;
    console.log('Creating new class:', { name, teacher, students, description });

    const newClass = new Class({
      name,
      teacher,
      students,
      description: description || ''
    });

    await newClass.save();
    
    // Fetch the populated class data
    const populatedClass = await Class.findById(newClass._id)
      .populate('teacher', 'firstName lastName')
      .populate('students', 'firstName lastName');

    console.log('Created class:', populatedClass);
    res.status(201).json({ 
      message: "Class created successfully",
      class: populatedClass
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ 
      message: "Error creating class",
      error: error.message 
    });
  }
});

// Add a route to get classes assigned to a teacher
app.get("/api/teacher/classes", protect, async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user._id })
      .populate('students', 'firstName lastName');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching classes for teacher" });
  }
});

// Add a route to get classes a student is enrolled in
app.get("/api/student/classes", protect, async (req, res) => {
  try {
    console.log('Fetching classes for student:', req.user._id);
    const classes = await Class.find({ students: req.user._id })
      .populate('teacher', 'firstName lastName');
    console.log('Found student classes:', classes);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching student classes:', error);
    res.status(500).json({ message: "Error fetching student's classes" });
  }
});

app.post("/api/admin/notices", async (req, res) => {
  try {
    const { title, message, targetRole } = req.body;
    
    // Validate required fields
    if (!title || !message || !targetRole) {
      return res.status(400).json({ 
        message: "Title, message and target role are required" 
      });
    }

    const newNotice = new Notice({ 
      title, 
      message, 
      targetRole 
    });

    await newNotice.save();
    console.log('Notice saved:', newNotice); // Debug log

    res.status(201).json({ 
      message: "Notice sent successfully",
      notice: newNotice 
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ 
      message: "Error sending notice",
      error: error.message 
    });
  }
});

app.get("/api/notices/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const notices = await Notice.find({
      $or: [{ targetRole: 'all' }, { targetRole: role }]
    }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notices" });
  }
});

// Course routes have been moved to adminRoutes.js to prevent duplication and conflicts

app.delete("/api/admin/classes/:id", async (req, res) => {
  try {
    const classId = req.params.id;
    console.log('Attempting to delete class:', classId);

    const deletedClass = await Class.findByIdAndDelete(classId);
    
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    console.log('Class deleted successfully:', deletedClass);
    res.json({ message: "Class deleted successfully", deletedClass });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ 
      message: "Error deleting class",
      error: error.message 
    });
  }
});

app.get("/api/auth/clear-session", (req, res) => {
  res.set({
    'Clear-Site-Data': '"cache", "cookies", "storage"',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.status(200).json({ message: 'Session cleared' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


