import React from 'react';
import { Link } from 'react-router-dom';

const ApplicationTypeSelector = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-center text-2xl font-bold mb-6">Choose Application Type</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-center mb-4">Student Application</h3>
          <p className="text-gray-600 mb-4">
            Apply as a student to enroll in our academic programs. Submit your academic records and personal information.
          </p>
          <div className="flex justify-center mt-6">
            <Link 
              to="/admission-form" 
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-md transition duration-300"
            >
              Apply as Student
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-center mb-4">Teacher Application</h3>
          <p className="text-gray-600 mb-4">
            Join our faculty as a teacher. Submit your qualifications, experience, and areas of expertise.
          </p>
          <div className="flex justify-center mt-6">
            <Link 
              to="/teacher-application" 
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-md transition duration-300"
            >
              Apply as Teacher
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTypeSelector;
