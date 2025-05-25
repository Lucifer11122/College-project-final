import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  dob: {
    type: Date,
    default: Date.now
  },
  course: {
    type: String,
    default: 'Unspecified'
  },
  courseType: {
    type: String,
    enum: ['undergraduate', 'graduate'],
    default: 'undergraduate'
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  zip: {
    type: String,
    default: ''
  },
  board: {
    type: String,
    default: ''
  },
  class12Percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  selectedSubjects: {
    type: [String],
    default: []
  },
  subjectMarks: {
    type: Map,
    of: Number,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'accepted', 'rejected', 'waitlisted'],
    default: 'pending'
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  meritScore: {
    type: Number,
    default: 0
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  meritRank: {
    type: Number,
    default: 0
  },
  waitlistPosition: {
    type: Number,
    default: 0
  },
  generatedUsername: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  collection: 'applications'
});

/**
 * Pre-save hook to calculate class 12 percentage and set merit score
 * Applications are ranked based on class 12 percentage
 */
applicationSchema.pre('save', function(next) {
  // Calculate average percentage from subject marks
  const subjectMarks = Object.values(this.subjectMarks || {});
  if (subjectMarks.length > 0) {
    const totalMarks = subjectMarks.reduce((a, b) => a + Number(b), 0);
    this.class12Percentage = totalMarks / subjectMarks.length;
  } else {
    this.class12Percentage = 0;
  }
  
  // Merit score is equal to class12Percentage for ranking purposes
  this.meritScore = this.class12Percentage;
  
  // Cap merit score at 100
  this.meritScore = Math.min(this.meritScore, 100);
  
  next();
});

const Application = mongoose.model('Application', applicationSchema);
export default Application;