import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['undergraduate', 'graduate'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: ''
  },
  fees: {
    type: String,
    default: ''
  },
  criteria: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: 'cimage1.jpeg'
  },
  capacity: {
    type: Number,
    default: 60
  },
  currentApplications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Course', CourseSchema); 