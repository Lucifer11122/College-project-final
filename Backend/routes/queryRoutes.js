import express from 'express';
import Query from '../models/Query.js';

const router = express.Router();

// Get all queries
router.get('/', async (req, res) => {
  try {
    const { teacherId, studentName } = req.query;
    const query = {};
    
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    if (studentName) {
      query.studentName = { $regex: studentName, $options: 'i' };
    }

    const queries = await Query.find(query)
      .sort({ createdAt: -1 })
      .populate('teacherId', 'firstName lastName');
    res.json(queries);
  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ message: "Error fetching queries" });
  }
});

// Submit a new query
router.post('/', async (req, res) => {
  try {
    const { question, studentName, studentEmail, teacherId } = req.body;
    
    if (!question || !question.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "Question is required" 
      });
    }

    const newQuery = new Query({
      question,
      studentName: studentName || 'Anonymous',
      studentEmail: studentEmail || '',
      teacherId: teacherId || null,
      status: 'pending'
    });

    await newQuery.save();
    
    res.status(201).json({ 
      success: true,
      message: "Query submitted successfully",
      query: newQuery
    });
  } catch (error) {
    console.error('Error submitting query:', error);
    res.status(500).json({ 
      success: false,
      message: "Error submitting query",
      error: error.message 
    });
  }
});

// Answer a query
router.post('/:queryId/answer', async (req, res) => {
  try {
    const { answer } = req.body;
    const { queryId } = req.params;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: "Answer is required" });
    }

    const query = await Query.findById(queryId);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    query.answer = answer;
    query.status = 'answered';
    query.answeredAt = new Date();

    await query.save();

    res.json({ 
      success: true,
      message: "Query answered successfully",
      query
    });
  } catch (error) {
    console.error('Error answering query:', error);
    res.status(500).json({ 
      success: false,
      message: "Error answering query",
      error: error.message 
    });
  }
});

export default router;
