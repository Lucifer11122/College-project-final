import React, { useState, useEffect } from 'react';
import { 
  courses, 
  careerPathRecommendations, 
  interestAreaRecommendations, 
  skillSetRecommendations,
  getCourseById,
  getPopularCourses
} from '../data/courseData';

function CourseRecommender() {
  const [careerGoals, setCareerGoals] = useState([]);
  const [interests, setInterests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentEducation, setCurrentEducation] = useState('');

  // Career paths, interest areas, and skills from our data
  const careerPaths = Object.keys(careerPathRecommendations);
  const interestAreas = Object.keys(interestAreaRecommendations);
  const skillSets = Object.keys(skillSetRecommendations);

  // Generate recommendations based on user selections with enhanced algorithm
  const generateRecommendations = () => {
    if (careerGoals.length === 0 && interests.length === 0 && skills.length === 0) {
      // If no selections, show popular courses
      const popularCourses = getPopularCourses(6).map(course => ({
        ...course,
        matchScore: 100,
        matchReason: 'Popular course at our college',
        strengthAreas: ['High enrollment', 'Student satisfaction']
      }));
      setRecommendedCourses(popularCourses);
      setShowResults(true);
      return;
    }

    setLoading(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      // Create a map to score each course
      const courseScores = {};
      const courseMatchReasons = {};
      const courseStrengthAreas = {};
      
      // Initialize scores and data for all courses
      courses.forEach(course => {
        courseScores[course.id] = 0;
        courseMatchReasons[course.id] = [];
        courseStrengthAreas[course.id] = [];
      });
      
      // Add scores based on career goals (highest weight)
      const careerWeight = 2.5;
      careerGoals.forEach(career => {
        const recommendedCourseIds = careerPathRecommendations[career] || [];
        recommendedCourseIds.forEach((courseId, index) => {
          // Higher weight for first recommendations and apply career multiplier
          const score = (5 - Math.min(index, 4)) * careerWeight;
          courseScores[courseId] = (courseScores[courseId] || 0) + score;
          
          // Add match reason
          if (!courseMatchReasons[courseId].includes(`Aligns with ${career} career path`)) {
            courseMatchReasons[courseId].push(`Aligns with ${career} career path`);
          }
          
          // Add to strength areas
          if (!courseStrengthAreas[courseId].includes('Career Alignment')) {
            courseStrengthAreas[courseId].push('Career Alignment');
          }
        });
      });
      
      // Add scores based on interests (medium weight)
      const interestWeight = 2.0;
      interests.forEach(interest => {
        const recommendedCourseIds = interestAreaRecommendations[interest] || [];
        recommendedCourseIds.forEach((courseId, index) => {
          const score = (5 - Math.min(index, 4)) * interestWeight;
          courseScores[courseId] = (courseScores[courseId] || 0) + score;
          
          // Add match reason
          if (!courseMatchReasons[courseId].includes(`Matches your interest in ${interest}`)) {
            courseMatchReasons[courseId].push(`Matches your interest in ${interest}`);
          }
          
          // Add to strength areas
          if (!courseStrengthAreas[courseId].includes('Interest Alignment')) {
            courseStrengthAreas[courseId].push('Interest Alignment');
          }
        });
      });
      
      // Add scores based on skills (medium weight)
      const skillWeight = 1.8;
      skills.forEach(skill => {
        const recommendedCourseIds = skillSetRecommendations[skill] || [];
        recommendedCourseIds.forEach((courseId, index) => {
          const score = (5 - Math.min(index, 4)) * skillWeight;
          courseScores[courseId] = (courseScores[courseId] || 0) + score;
          
          // Add match reason
          if (!courseMatchReasons[courseId].includes(`Utilizes your strength in ${skill}`)) {
            courseMatchReasons[courseId].push(`Utilizes your strength in ${skill}`);
          }
          
          // Add to strength areas
          if (!courseStrengthAreas[courseId].includes('Skill Utilization')) {
            courseStrengthAreas[courseId].push('Skill Utilization');
          }
        });
      });
      
      // Consider current education level if provided
      if (currentEducation) {
        courses.forEach(course => {
          // Check if the course eligibility matches the current education
          if (course.eligibility && course.eligibility.toLowerCase().includes(currentEducation.toLowerCase())) {
            courseScores[course.id] = (courseScores[course.id] || 0) + 3;
            
            // Add match reason
            if (!courseMatchReasons[course.id].includes('Matches your educational background')) {
              courseMatchReasons[course.id].push('Matches your educational background');
            }
            
            // Add to strength areas
            if (!courseStrengthAreas[course.id].includes('Educational Fit')) {
              courseStrengthAreas[course.id].push('Educational Fit');
            }
          }
        });
      }
      
      // Calculate maximum possible score for normalization
      const maxPossibleScore = (
        careerGoals.length * 5 * careerWeight +
        interests.length * 5 * interestWeight +
        skills.length * 5 * skillWeight +
        (currentEducation ? 3 : 0)
      );
      
      // Sort courses by score
      const sortedCourseIds = Object.keys(courseScores)
        .filter(courseId => courseScores[courseId] > 0)
        .sort((a, b) => courseScores[b] - courseScores[a]);
      
      // Get full course objects for the top scored courses with match percentage
      const topRecommendations = sortedCourseIds
        .slice(0, 8) // Get more recommendations initially
        .map(courseId => {
          const course = getCourseById(courseId);
          if (!course) return null;
          
          // Calculate match percentage (normalized score)
          const matchScore = Math.round((courseScores[courseId] / maxPossibleScore) * 100);
          
          // Limit reasons to top 3
          const matchReasons = courseMatchReasons[courseId].slice(0, 3);
          
          return {
            ...course,
            matchScore: Math.min(matchScore, 100), // Cap at 100%
            matchReason: matchReasons.length > 0 ? matchReasons[0] : 'Recommended based on your selections',
            allMatchReasons: matchReasons,
            strengthAreas: courseStrengthAreas[courseId]
          };
        })
        .filter(Boolean) // Remove any undefined values
        .slice(0, 6); // Limit to 6 final recommendations
      
      // If we don't have enough recommendations, add some popular courses
      if (topRecommendations.length < 3) {
        const popularCourses = getPopularCourses(6).map(course => ({
          ...course,
          matchScore: 70,
          matchReason: 'Popular course at our college',
          strengthAreas: ['High enrollment', 'Student satisfaction']
        }));
        
        popularCourses.forEach(course => {
          if (!topRecommendations.find(c => c.id === course.id)) {
            topRecommendations.push(course);
            if (topRecommendations.length >= 6) return;
          }
        });
      }
      
      setRecommendedCourses(topRecommendations);
      setShowResults(true);
      setLoading(false);
    }, 1500); // Simulate processing time
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    generateRecommendations();
  };

  // Handle multi-select changes
  const handleCareerChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setCareerGoals(selected);
  };

  const handleInterestChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setInterests(selected);
  };

  const handleSkillChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setSkills(selected);
  };

  // Reset form
  const handleReset = () => {
    setCareerGoals([]);
    setInterests([]);
    setSkills([]);
    setCurrentEducation('');
    setShowResults(false);
    setRecommendedCourses([]);
  };

  return (
    <div className="bg-orange-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">
            B.B. College Course Recommender
          </h1>
          <p className="text-gray-600">
            Find the perfect course at Banwarilal Bhalotia College based on your interests and career goals
          </p>
        </div>

        {!showResults ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Education
                </label>
                <select
                  id="education"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  value={currentEducation}
                  onChange={(e) => setCurrentEducation(e.target.value)}
                >
                  <option value="">Select your education level</option>
                  <option value="10th">10th Standard</option>
                  <option value="12th-science">12th Science</option>
                  <option value="12th-arts">12th Arts</option>
                  <option value="12th-commerce">12th Commerce</option>
                  <option value="diploma">Diploma</option>
                  <option value="undergraduate">Undergraduate</option>
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="careers" className="block text-sm font-medium text-gray-700 mb-1">
                  Career Goals (Hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  id="careers"
                  multiple
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 h-32"
                  value={careerGoals}
                  onChange={handleCareerChange}
                >
                  {careerPaths.map(career => (
                    <option key={career} value={career}>
                      {career}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Select one or more career paths you're interested in</p>
              </div>

              <div className="mb-6">
                <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Areas (Hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  id="interests"
                  multiple
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 h-32"
                  value={interests}
                  onChange={handleInterestChange}
                >
                  {interestAreas.map(interest => (
                    <option key={interest} value={interest}>
                      {interest}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Select one or more areas that interest you</p>
              </div>

              <div className="mb-6">
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Strengths (Hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  id="skills"
                  multiple
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 h-32"
                  value={skills}
                  onChange={handleSkillChange}
                >
                  {skillSets.map(skill => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Select one or more skill areas where you excel</p>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Get Course Recommendations
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-orange-800">
                  Your Recommended Courses
                </h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Start Over
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-6">
                    Based on your {careerGoals.length > 0 ? 'career goals' : ''} 
                    {interests.length > 0 ? (careerGoals.length > 0 ? ', interests' : 'interests') : ''} 
                    {skills.length > 0 ? (careerGoals.length > 0 || interests.length > 0 ? ', and strengths' : 'strengths') : ''}, 
                    we recommend the following courses at Banwarilal Bhalotia College:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedCourses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Match Score Badge */}
                        <div className="relative">
                          <div className="absolute top-3 right-3 bg-orange-600 text-white text-sm font-bold rounded-full h-12 w-12 flex items-center justify-center">
                            {course.matchScore}%
                          </div>
                          <div className="bg-orange-100 px-4 py-3 border-b border-gray-200">
                            <h3 className="font-bold text-orange-800">{course.name}</h3>
                            <p className="text-sm text-gray-600">{course.department} • {course.duration}</p>
                          </div>
                        </div>
                        
                        {/* Match Reason */}
                        <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Why this matches you:</span> {course.matchReason}
                          </p>
                        </div>
                        
                        <div className="p-4">
                          <p className="text-gray-700 mb-4">{course.description}</p>
                          
                          {/* Strength Areas */}
                          {course.strengthAreas && course.strengthAreas.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Your Strength Match:</h4>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {course.strengthAreas.map((strength, index) => (
                                  <span key={index} className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                                    {strength}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Career Paths:</h4>
                            <div className="flex flex-wrap gap-1">
                              {course.careerPaths.slice(0, 3).map((path, index) => (
                                <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {path}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Key Skills:</h4>
                            <div className="flex flex-wrap gap-1">
                              {course.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <strong>Eligibility:</strong> {course.eligibility}
                          </p>
                          {course.allMatchReasons && course.allMatchReasons.length > 1 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 font-semibold">Additional match reasons:</p>
                              <ul className="text-xs text-gray-500 list-disc list-inside">
                                {course.allMatchReasons.slice(1).map((reason, index) => (
                                  <li key={index}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
                    <p className="text-gray-700 mb-3">
                      Interested in these courses? Here's what you can do next:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Visit the <a href="/admission" className="text-blue-600 hover:underline">Admissions Page</a> for application details</li>
                      <li>Contact the department for more information about specific courses</li>
                      <li>Schedule a campus visit to explore facilities and meet faculty</li>
                      <li>Check the <a href="/admission-form" className="text-blue-600 hover:underline">Application Form</a> for admission requirements</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-orange-800 mb-4">About Our Course Recommender</h2>
          <p className="text-gray-700 mb-4">
            The B.B. College Course Recommender uses an intelligent algorithm to match your interests, career goals, and strengths with our diverse range of academic programs. Our recommendations are based on:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li>Career path alignment with course outcomes</li>
            <li>Interest area matching with course content</li>
            <li>Skill requirements for success in each program</li>
            <li>Course popularity and student satisfaction</li>
          </ul>
          <p className="text-gray-700">
            This tool is designed to help you explore options that might be a good fit for you, but the final decision should be based on your personal goals and consultation with academic advisors.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CourseRecommender;
