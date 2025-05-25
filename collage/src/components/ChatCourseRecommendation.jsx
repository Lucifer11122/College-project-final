import React from 'react';
import { BookOpen, Briefcase, Star } from 'lucide-react';

// Component to display course recommendations in the chat interface
const ChatCourseRecommendation = ({ recommendations }) => {
  const { courses, detectedInterests, type } = recommendations;
  
  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
        <h3 className="text-blue-800 font-semibold text-sm mb-2">
          {type === 'personalized' 
            ? 'Personalized Course Recommendations' 
            : 'Popular Courses at B.B. College'}
        </h3>
        
        {type === 'personalized' && (
          <div className="mb-2">
            <p className="text-xs text-gray-600 mb-1">Based on your interests in:</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {detectedInterests.careers.map((career, index) => (
                <span key={`career-${index}`} className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                  <Briefcase className="inline-block w-3 h-3 mr-1" />
                  {career}
                </span>
              ))}
              {detectedInterests.interests.map((interest, index) => (
                <span key={`interest-${index}`} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                  <BookOpen className="inline-block w-3 h-3 mr-1" />
                  {interest}
                </span>
              ))}
              {detectedInterests.skills.map((skill, index) => (
                <span key={`skill-${index}`} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                  <Star className="inline-block w-3 h-3 mr-1" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {courses.map((course) => (
            <div key={course.id} className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-orange-100 px-3 py-1.5 border-b border-gray-200">
                <h4 className="font-semibold text-sm text-orange-800">{course.name}</h4>
                <p className="text-xs text-gray-600">{course.department} • {course.duration}</p>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-700 mb-2">{course.description}</p>
                <div className="mb-1.5">
                  <p className="text-xs font-medium text-gray-700 mb-0.5">Career Paths:</p>
                  <div className="flex flex-wrap gap-1">
                    {course.careerPaths.slice(0, 3).map((path, index) => (
                      <span key={index} className="inline-block bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                        {path}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-0.5">Eligibility:</p>
                  <p className="text-xs text-gray-600">{course.eligibility}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 text-xs text-gray-600">
          <p>For more detailed information on these courses, you can visit the Admissions page or contact the respective departments.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatCourseRecommendation;
