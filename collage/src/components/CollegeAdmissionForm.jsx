  import React, { useState, useEffect } from "react";
import axios from "../config/axios";

const CollegeAdmissionForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
    course: "",
    city: "",
    state: "",
    zip: "",
    board: "",
    selectedSubjects: [],
    subjectMarks: {}
  });
  
  const [calculatedPercentage, setCalculatedPercentage] = useState(0);

  const [errors, setErrors] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [courseSeats, setCourseSeats] = useState({});
  const [courses, setCourses] = useState([]);

  const boards = [
    "CBSE",
    "ICSE",
    "State Board",
    "Other"
  ];

  const subjects = [
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Computer Science",
    "English",
    "Economics",
    "Business Studies",
    "Accountancy",
    "History",
    "Geography",
    "Political Science",
    "Psychology",
    "Sociology",
    "Physical Education"
  ];

  // Fetch courses from the database
  const fetchCourses = async () => {
    try {
      const [undergradRes, gradRes] = await Promise.all([
        axios.get('/api/admin/courses/undergraduate'),
        axios.get('/api/admin/courses/graduate')
      ]);
      
      const allCourses = [...undergradRes.data, ...gradRes.data];
      setCourses(allCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAvailableSeats = async (courseTitle) => {
    try {
      const response = await axios.get(`/api/applications/available-seats/${courseTitle}`);
      if (response.data) {
        setCourseSeats(prev => ({
          ...prev,
          [courseTitle]: {
            available: response.data.availableSeats,
            total: response.data.totalCapacity,
            current: response.data.currentApplications,
            meritCutoff: response.data.meritCutoff
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching available seats:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      courses.forEach(course => fetchAvailableSeats(course.title));
    }
  }, [courses]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    // Clear error when the user types
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSubjectSelect = (subject) => {
    const updatedSubjects = formData.selectedSubjects.includes(subject)
      ? formData.selectedSubjects.filter(s => s !== subject)
      : [...formData.selectedSubjects, subject];

    setFormData(prev => ({
      ...prev,
      selectedSubjects: updatedSubjects,
      subjectMarks: updatedSubjects.reduce((acc, sub) => {
        acc[sub] = prev.subjectMarks[sub] || "";
        return acc;
      }, {})
    }));
  };

  const handleSubjectMarkChange = (subject, mark) => {
    const updatedMarks = {
      ...formData.subjectMarks,
      [subject]: mark
    };
    
    setFormData(prev => ({
      ...prev,
      subjectMarks: updatedMarks
    }));
    
    // Calculate percentage automatically
    const marks = Object.values(updatedMarks).filter(m => m !== '');
    if (marks.length > 0) {
      const total = marks.reduce((sum, current) => sum + Number(current), 0);
      const percentage = total / marks.length;
      setCalculatedPercentage(percentage);
    } else {
      setCalculatedPercentage(0);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate that at least 5 subjects are selected
    if (formData.selectedSubjects.length < 5) {
      newErrors.subjects = "Please select at least 5 subjects";
    }

    // Validate subject marks
    formData.selectedSubjects.forEach(subject => {
      if (!formData.subjectMarks[subject] || formData.subjectMarks[subject] === '') {
        newErrors[`mark_${subject}`] = `Please enter marks for ${subject}`;
      } else {
        const mark = Number(formData.subjectMarks[subject]);
        if (isNaN(mark) || mark < 0 || mark > 100) {
          newErrors[`mark_${subject}`] = `Marks must be between 0 and 100`;
        }
      }
    });

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous results and errors
    setSubmissionResult(null);
    setErrors({});
    
    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmissionResult({
        success: false,
        message: "Please fix the errors in the form."
      });
      return;
    }
    
    // Prepare submission data
    try {
      // Find selected course
      const selectedCourse = courses.find(c => c.title === formData.course);
      
      // Format data for submission
      // Prepare submission data with proper type conversion for numeric values
      const submissionData = {
        ...formData,
        courseType: selectedCourse?.type || 'undergraduate',
        subjectMarks: Object.fromEntries(
          Object.entries(formData.subjectMarks).map(([key, value]) => [key, Number(value) || 0])
        )
      };
      
      // First verify the server is accessible before attempting submission
      await axios.get('http://localhost:5000/api/applications');
      
      /**
       * Submit application to backend API
       * The server will calculate the merit score based on class12Percentage
       * and send a confirmation email upon successful submission
       */
      const response = await axios.post(
        'http://localhost:5000/api/applications',
        submissionData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10s timeout for slow connections
        }
      );
      
      console.log('Received response from server:', response);
      
      if (response.status >= 200 && response.status < 300 && response.data && response.data.success) {
        const responseData = response.data;
        // Success - show success message and reset form
        setSubmissionResult({
          success: true,
          message: responseData.message || 'Application submitted successfully!',
          applicationId: responseData.applicationId || 'N/A'
        });
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          dob: "",
          course: "",
          city: "",
          state: "",
          zip: "",
          board: "",
          selectedSubjects: [],
          subjectMarks: {}
        });
        
        // Reset calculated percentage
        setCalculatedPercentage(0);
        
        // Refresh available seats
        if (courses.length > 0) {
          courses.forEach(course => fetchAvailableSeats(course.title));
        }
      } else {
        // Server returned an error
        throw new Error(responseData.message || 'Submission failed');
      }
    } catch (error) {
      console.error("Form submission error:", error);
      
      // Set error message based on the type of error
      let errorMessage = "Error submitting application. Please try again.";
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = "Could not connect to the server. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmissionResult({
        success: false,
        message: errorMessage
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-center text-2xl font-bold mb-6">College Admission Form</h2>
      
      {/* Show submission result if exists */}
      {submissionResult && (
        <div className={`mb-4 p-4 rounded ${submissionResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <p className="font-semibold">{submissionResult.success ? 'Application Submitted Successfully!' : 'Error'}</p>
          <p className="mt-2">{submissionResult.message}</p>
          {submissionResult.applicationId && (
            <p className="mt-2">
              Application ID: <span className="font-semibold">{submissionResult.applicationId}</span>
              <br />
              <span className="text-sm">Please save this application ID for future reference.</span>
            </p>
          )}
          {submissionResult.success && (
            <p className="mt-2 text-sm">
              <i className="fas fa-envelope mr-1"></i> A confirmation email has been sent to your email address.
              <br />
              <i className="fas fa-info-circle mr-1"></i> You will receive another email with login instructions if your application is accepted.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="firstName" className="block font-semibold mb-2">First Name</label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            className={`w-full p-3 border rounded-md focus:outline-none ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="lastName" className="block font-semibold mb-2">Last Name</label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            className={`w-full p-3 border rounded-md focus:outline-none ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block font-semibold mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@example.com"
            className={`w-full p-3 border rounded-md focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="dob" className="block font-semibold mb-2">Date of Birth</label>
          <input
            id="dob"
            type="date"
            value={formData.dob}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none ${errors.dob ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.dob && <p className="text-red-500 text-sm">{errors.dob}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="city" className="block font-semibold mb-2">City</label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            className={`w-full p-3 border rounded-md focus:outline-none ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="state" className="block font-semibold mb-2">State</label>
          <input
            id="state"
            type="text"
            value={formData.state}
            onChange={handleChange}
            placeholder="State"
            className={`w-full p-3 border rounded-md focus:outline-none ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="zip" className="block font-semibold mb-2">ZIP</label>
          <input
            id="zip"
            type="text"
            value={formData.zip}
            onChange={handleChange}
            placeholder="90210"
            className={`w-full p-3 border rounded-md focus:outline-none ${errors.zip ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.zip && <p className="text-red-500 text-sm">{errors.zip}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="board" className="block text-sm font-medium text-gray-700">
            Class 12th Board
          </label>
          <select
            id="board"
            value={formData.board}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.board ? 'border-red-500' : ''
            }`}
          >
            <option value="">Select Board</option>
            {boards.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
          {errors.board && <p className="mt-1 text-sm text-red-500">{errors.board}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Class 12th Percentage (Calculated)
          </label>
          <div className="mt-1 p-3 bg-gray-100 rounded-md border border-gray-300">
            <span className="font-semibold">{calculatedPercentage.toFixed(2)}%</span>
            <p className="text-xs text-gray-600 mt-1">
              This percentage is automatically calculated as the average of your subject marks.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subjects (minimum 5)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div key={subject} className="flex flex-col space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedSubjects.includes(subject)}
                    onChange={() => handleSubjectSelect(subject)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="ml-2">{subject}</span>
                </label>
                {formData.selectedSubjects.includes(subject) && (
                  <input
                    type="number"
                    value={formData.subjectMarks[subject] || ""}
                    onChange={(e) => handleSubjectMarkChange(subject, e.target.value)}
                    placeholder="Marks (0-100)"
                    min="0"
                    max="100"
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors[`mark_${subject}`] ? 'border-red-500' : ''
                    }`}
                  />
                )}
                {errors[`mark_${subject}`] && (
                  <p className="text-sm text-red-500">{errors[`mark_${subject}`]}</p>
                )}
              </div>
            ))}
          </div>
          {errors.subjects && <p className="mt-1 text-sm text-red-500">{errors.subjects}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="course" className="block font-semibold mb-2">Course</label>
          <select
            id="course"
            value={formData.course}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none ${errors.course ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select a course</option>
            <optgroup label="Undergraduate Courses">
              {courses
                .filter(course => course.type === 'undergraduate')
                .map(course => (
                  <option key={course._id} value={course.title}>
                    {course.title} ({course.duration}, {course.fees})
                  </option>
                ))}
            </optgroup>
            <optgroup label="Graduate Courses">
              {courses
                .filter(course => course.type === 'graduate')
                .map(course => (
                  <option key={course._id} value={course.title}>
                    {course.title} ({course.duration}, {course.fees})
                  </option>
                ))}
            </optgroup>
          </select>
          {errors.course && <p className="text-red-500 text-sm">{errors.course}</p>}
          {formData.course && courseSeats[formData.course] && courseSeats[formData.course].meritCutoff > 0 && (
            <p className="text-amber-600 text-sm mt-1">
              Current merit cutoff: {courseSeats[formData.course].meritCutoff.toFixed(2)}
            </p>
          )}
          {formData.course && courses.find(c => c.title === formData.course)?.criteria && (
            <p className="text-gray-600 text-sm mt-1">
              Eligibility: {courses.find(c => c.title === formData.course).criteria}
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            type="submit"
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 transition duration-300"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollegeAdmissionForm;