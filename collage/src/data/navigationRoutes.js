// Navigation routes for the chatbot to redirect users
export const navigationRoutes = [
  {
    id: 'admission',
    keywords: ['apply', 'admission', 'application', 'enroll', 'register', 'sign up'],
    title: 'Admissions Page',
    description: 'Apply for admission or check application status',
    path: '/admission'
  },
  {
    id: 'courses',
    keywords: ['courses', 'classes', 'subjects', 'curriculum', 'syllabus', 'study', 'major', 'program'],
    title: 'Academic Programs',
    description: 'Browse our courses and academic programs',
    path: '/academics'
  },
  {
    id: 'tuition',
    keywords: ['tuition', 'fees', 'cost', 'price', 'payment', 'financial', 'pay', 'money', 'expensive'],
    title: 'Tuition & Fees',
    description: 'Information about tuition, fees, and payment options',
    path: '/tuition'
  },
  {
    id: 'scholarships',
    keywords: ['scholarship', 'financial aid', 'grant', 'funding', 'assistance', 'support'],
    title: 'Scholarships & Financial Aid',
    description: 'Explore scholarship opportunities and financial aid options',
    path: '/scholarships'
  },
  {
    id: 'housing',
    keywords: ['housing', 'dorm', 'residence', 'accommodation', 'live', 'stay', 'room'],
    title: 'Campus Housing',
    description: 'Information about on-campus housing options',
    path: '/housing'
  },
  {
    id: 'events',
    keywords: ['event', 'activity', 'calendar', 'schedule', 'happening', 'workshop', 'seminar'],
    title: 'Events Calendar',
    description: 'See upcoming events and activities on campus',
    path: '/events'
  },
  {
    id: 'contact',
    keywords: ['contact', 'reach', 'email', 'phone', 'call', 'message', 'support', 'help'],
    title: 'Contact Us',
    description: 'Get in touch with our support team',
    path: '/contact'
  },
  {
    id: 'form',
    keywords: ['form', 'application form', 'admission form', 'fill', 'submit'],
    title: 'Admission Form',
    description: 'Fill out our admission application form',
    path: '/admission-form'
  },
  {
    id: 'course-recommender',
    keywords: [
      // Direct mentions
      'course recommender', 'recommend courses', 'course recommendations', 'recommend programs',
      'suggest courses', 'suggest programs', 'course suggestions', 'program suggestions',
      
      // Questions about courses
      'which course', 'what course', 'best course', 'suitable course', 'right course for me',
      'which program', 'what program', 'best program', 'suitable program',
      
      // Decision help
      'help me choose', 'help me decide', 'help me select', 'help me find', 'guide me',
      'what to study', 'what should i study', 'what can i study', 'career guidance',
      
      // Interest and career related
      'interested in', 'career in', 'want to become', 'want to be a', 'career path',
      'future career', 'job prospects', 'career options', 'academic path'
    ],
    title: 'Course Recommender',
    description: 'Get personalized course recommendations based on your interests and career goals',
    path: '/course-recommender'
  }
];

/**
 * Finds navigation suggestions based on user input
 * @param {string} query - The user's message
 * @param {number} limit - Maximum number of suggestions to return
 * @returns {Array} - Array of navigation suggestions
 */
export function findNavigationSuggestions(query, limit = 2) {
  if (!query || typeof query !== 'string') return [];
  
  const lowercaseQuery = query.toLowerCase();
  const matchedRoutes = [];
  
  // Score each route based on keyword matches
  navigationRoutes.forEach(route => {
    let score = 0;
    
    route.keywords.forEach(keyword => {
      if (lowercaseQuery.includes(keyword.toLowerCase())) {
        // Increase score based on keyword length (longer keywords are more specific)
        score += keyword.length;
      }
    });
    
    if (score > 0) {
      matchedRoutes.push({
        ...route,
        score
      });
    }
  });
  
  // Sort by score (highest first) and limit results
  return matchedRoutes
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
