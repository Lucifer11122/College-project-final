import mongoose from 'mongoose';

const teacherApplicationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  education: [{
    degree: String,
    institution: String,
    year: Number,
    specialization: String
  }],
  experience: [{
    institution: String,
    position: String,
    startYear: Number,
    endYear: Number,
    currentlyWorking: Boolean,
    description: String
  }],
  subjects: [{
    type: String,
    trim: true
  }],
  resume: {
    type: String,  // URL or file path
    default: ''
  },
  coverLetter: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  applicationDate: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'teacher_applications'
});

const TeacherApplication = mongoose.model('TeacherApplication', teacherApplicationSchema);
export default TeacherApplication;
