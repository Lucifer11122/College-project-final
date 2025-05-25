// Course recommendation utility for the chatbot
import { 
  courses, 
  careerPathRecommendations, 
  interestAreaRecommendations, 
  skillSetRecommendations,
  getCourseById,
  getPopularCourses
} from '../data/courseData';

// Keywords that might indicate interest in specific career paths
const careerKeywords = {
  'Technology': ['tech', 'software', 'it', 'computer', 'programming', 'developer', 'coding'],
  'Healthcare': ['medical', 'health', 'doctor', 'biology', 'medicine', 'healthcare', 'hospital'],
  'Business': ['business', 'management', 'finance', 'accounting', 'marketing', 'entrepreneur', 'commerce'],
  'Education': ['teaching', 'teacher', 'professor', 'education', 'academic', 'school', 'instructor'],
  'Research': ['research', 'scientist', 'laboratory', 'analysis', 'investigation', 'phd', 'discovery'],
  'Media & Communication': ['media', 'journalism', 'writing', 'communication', 'content', 'journalist', 'reporter'],
  'Civil Services': ['government', 'civil', 'public', 'administration', 'service', 'ias', 'policy'],
  'Environmental': ['environment', 'nature', 'conservation', 'ecology', 'wildlife', 'sustainability', 'green'],
  'Creative Arts': ['creative', 'art', 'design', 'writing', 'literature', 'culture', 'artistic']
};

// Keywords that might indicate interest in specific areas
const interestKeywords = {
  'Science & Technology': ['science', 'technology', 'physics', 'chemistry', 'technical', 'engineering', 'innovation'],
  'Literature & Language': ['literature', 'language', 'writing', 'reading', 'books', 'poetry', 'stories'],
  'Business & Finance': ['business', 'finance', 'money', 'economics', 'market', 'trade', 'investment'],
  'Nature & Environment': ['nature', 'environment', 'plants', 'animals', 'ecology', 'wildlife', 'outdoors'],
  'Social Sciences': ['society', 'people', 'culture', 'politics', 'psychology', 'sociology', 'anthropology'],
  'Mathematics & Analysis': ['math', 'mathematics', 'calculation', 'statistics', 'analysis', 'logic', 'numbers'],
  'Teaching & Education': ['teaching', 'education', 'learning', 'students', 'school', 'knowledge', 'mentoring'],
  'Research & Development': ['research', 'development', 'innovation', 'investigation', 'discovery', 'lab', 'experiment'],
  'Management & Leadership': ['management', 'leadership', 'organization', 'team', 'coordination', 'strategy', 'direction']
};

// Keywords that might indicate strengths in specific skill areas
const skillKeywords = {
  'Analytical & Logical': ['analytical', 'logical', 'problem solving', 'reasoning', 'critical thinking', 'analysis'],
  'Communication & Writing': ['communication', 'writing', 'speaking', 'presentation', 'articulate', 'expression'],
  'Research & Investigation': ['research', 'investigation', 'curious', 'thorough', 'detailed', 'methodical'],
  'Technical & Practical': ['technical', 'practical', 'hands-on', 'building', 'fixing', 'operating', 'crafting'],
  'Creative & Innovative': ['creative', 'innovative', 'imagination', 'artistic', 'original', 'inventive', 'novel'],
  'Organization & Planning': ['organized', 'planning', 'systematic', 'structured', 'methodical', 'orderly'],
  'People & Social': ['social', 'people', 'interpersonal', 'friendly', 'outgoing', 'team player', 'collaborative'],
  'Data & Numbers': ['data', 'numbers', 'calculation', 'statistics', 'quantitative', 'mathematical', 'numerical']
};

// Extract career interests from user message
function extractCareerInterests(message) {
  const lowercaseMessage = message.toLowerCase();
  const detectedCareers = [];
  
  Object.entries(careerKeywords).forEach(([career, keywords]) => {
    for (const keyword of keywords) {
      if (lowercaseMessage.includes(keyword.toLowerCase())) {
        detectedCareers.push(career);
        break; // Found a match for this career, move to next
      }
    }
  });
  
  return [...new Set(detectedCareers)]; // Remove duplicates
}

// Extract interest areas from user message
function extractInterestAreas(message) {
  const lowercaseMessage = message.toLowerCase();
  const detectedInterests = [];
  
  Object.entries(interestKeywords).forEach(([interest, keywords]) => {
    for (const keyword of keywords) {
      if (lowercaseMessage.includes(keyword.toLowerCase())) {
        detectedInterests.push(interest);
        break; // Found a match for this interest, move to next
      }
    }
  });
  
  return [...new Set(detectedInterests)]; // Remove duplicates
}

// Extract skills from user message
function extractSkills(message) {
  const lowercaseMessage = message.toLowerCase();
  const detectedSkills = [];
  
  Object.entries(skillKeywords).forEach(([skill, keywords]) => {
    for (const keyword of keywords) {
      if (lowercaseMessage.includes(keyword.toLowerCase())) {
        detectedSkills.push(skill);
        break; // Found a match for this skill, move to next
      }
    }
  });
  
  return [...new Set(detectedSkills)]; // Remove duplicates
}

// Generate course recommendations based on user message
export function generateCourseRecommendations(message, limit = 3) {
  // Extract interests from message
  const careerInterests = extractCareerInterests(message);
  const interestAreas = extractInterestAreas(message);
  const skills = extractSkills(message);
  
  // If no interests detected, return popular courses
  if (careerInterests.length === 0 && interestAreas.length === 0 && skills.length === 0) {
    return {
      courses: getPopularCourses(limit),
      detectedInterests: {
        careers: [],
        interests: [],
        skills: []
      },
      type: 'popular'
    };
  }
  
  // Score each course based on detected interests
  const courseScores = {};
  
  // Initialize scores for all courses
  courses.forEach(course => {
    courseScores[course.id] = 0;
  });
  
  // Add scores based on career interests
  careerInterests.forEach(career => {
    const recommendedCourseIds = careerPathRecommendations[career] || [];
    recommendedCourseIds.forEach((courseId, index) => {
      // Higher weight for first recommendations
      courseScores[courseId] = (courseScores[courseId] || 0) + (5 - Math.min(index, 4));
    });
  });
  
  // Add scores based on interest areas
  interestAreas.forEach(interest => {
    const recommendedCourseIds = interestAreaRecommendations[interest] || [];
    recommendedCourseIds.forEach((courseId, index) => {
      courseScores[courseId] = (courseScores[courseId] || 0) + (5 - Math.min(index, 4));
    });
  });
  
  // Add scores based on skills
  skills.forEach(skill => {
    const recommendedCourseIds = skillSetRecommendations[skill] || [];
    recommendedCourseIds.forEach((courseId, index) => {
      courseScores[courseId] = (courseScores[courseId] || 0) + (5 - Math.min(index, 4));
    });
  });
  
  // Sort courses by score and get top recommendations
  const sortedCourseIds = Object.keys(courseScores)
    .filter(courseId => courseScores[courseId] > 0)
    .sort((a, b) => courseScores[b] - courseScores[a]);
  
  // Get full course objects for the top scored courses
  const topRecommendations = sortedCourseIds
    .slice(0, limit)
    .map(courseId => getCourseById(courseId))
    .filter(Boolean); // Remove any undefined values
  
  // If we don't have enough recommendations, add some popular courses
  if (topRecommendations.length < limit) {
    const popularCourses = getPopularCourses(limit * 2);
    popularCourses.forEach(course => {
      if (!topRecommendations.find(c => c.id === course.id)) {
        topRecommendations.push(course);
        if (topRecommendations.length >= limit) return;
      }
    });
  }
  
  return {
    courses: topRecommendations,
    detectedInterests: {
      careers: careerInterests,
      interests: interestAreas,
      skills: skills
    },
    type: 'personalized'
  };
}

// Check if a message is asking for course recommendations
export function isAskingForCourseRecommendation(message) {
  const lowercaseMessage = message.toLowerCase();
  const recommendationTriggers = [
    // Course related triggers
    'which course', 'what course', 'recommend course', 'suggest course',
    'course recommendation', 'course suggestion', 'which program', 'what program',
    'recommend program', 'suggest program', 'program recommendation', 'program suggestion',
    'what should i study', 'what can i study', 'help me choose', 'best course for me',
    'suitable course', 'course for', 'program for', 'career in', 'interested in studying',
    'want to become', 'want to be a', 'career as', 'which subject', 'what subject',
    
    // Navigation related triggers
    'course recommender', 'go to course recommender', 'open course recommender',
    'take me to course recommender', 'navigate to course recommender',
    'show me course recommendations', 'find courses for me', 'course finder',
    'help me find a course', 'course selector', 'course matcher',
    
    // Interest/career related triggers
    'interested in', 'good at', 'skilled in', 'passion for', 'enjoy',
    'like to study', 'want to learn about', 'career options', 'job prospects',
    'future career', 'professional path', 'academic path', 'study options',
    'degree options', 'majors', 'specializations', 'fields of study'
  ];
  
  return recommendationTriggers.some(trigger => lowercaseMessage.includes(trigger));
}
