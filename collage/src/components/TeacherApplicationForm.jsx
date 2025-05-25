import React, { useState } from 'react';
import axios from '../config/axios';

const TeacherApplicationForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'India'
    },
    education: [{ degree: '', institution: '', year: '', specialization: '' }],
    experience: [{ institution: '', position: '', startYear: '', endYear: '', currentlyWorking: false, description: '' }],
    subjects: [],
    coverLetter: ''
  });

  const [errors, setErrors] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);

  // List of subjects that can be taught
  const availableSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English', 'Hindi', 'History', 'Geography', 'Political Science',
    'Economics', 'Business Studies', 'Accountancy', 'Psychology',
    'Sociology', 'Physical Education', 'Fine Arts', 'Music'
  ];

  const handleChange = (e) => {
    const { id, value } = e.target;
    
    // Handle nested address fields
    if (id.startsWith('address.')) {
      const addressField = id.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({ ...formData, [id]: value });
    }

    // Clear error when the user types
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index][field] = value;
    setFormData({ ...formData, education: updatedEducation });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { degree: '', institution: '', year: '', specialization: '' }]
    });
  };

  const removeEducation = (index) => {
    const updatedEducation = [...formData.education];
    updatedEducation.splice(index, 1);
    setFormData({ ...formData, education: updatedEducation });
  };

  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...formData.experience];
    updatedExperience[index][field] = field === 'currentlyWorking' ? !updatedExperience[index][field] : value;
    setFormData({ ...formData, experience: updatedExperience });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { institution: '', position: '', startYear: '', endYear: '', currentlyWorking: false, description: '' }]
    });
  };

  const removeExperience = (index) => {
    const updatedExperience = [...formData.experience];
    updatedExperience.splice(index, 1);
    setFormData({ ...formData, experience: updatedExperience });
  };

  const handleSubjectToggle = (subject) => {
    const updatedSubjects = formData.subjects.includes(subject)
      ? formData.subjects.filter(s => s !== subject)
      : [...formData.subjects, subject];
    
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    
    // Address validation
    if (!formData.address.city.trim()) newErrors['address.city'] = "City is required";
    if (!formData.address.state.trim()) newErrors['address.state'] = "State is required";
    
    // Education validation
    if (formData.education.length === 0) {
      newErrors.education = "At least one education entry is required";
    } else {
      formData.education.forEach((edu, index) => {
        if (!edu.degree.trim()) newErrors[`education[${index}].degree`] = "Degree is required";
        if (!edu.institution.trim()) newErrors[`education[${index}].institution`] = "Institution is required";
      });
    }
    
    // Subject validation
    if (formData.subjects.length === 0) {
      newErrors.subjects = "Please select at least one subject you can teach";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    setSubmissionResult(null); // Clear previous submission result

    if (Object.keys(formErrors).length === 0) {
      try {
        console.log('Preparing to submit teacher application with data:', formData);

        const response = await axios.post('/api/teacher-applications', formData);
        console.log('Received response from server:', response);

        if (response.data.success) {
          setSubmissionResult({
            success: true,
            message: response.data.message,
            applicationId: response.data.applicationId
          });

          // Reset form after successful submission
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dob: '',
            address: {
              street: '',
              city: '',
              state: '',
              zip: '',
              country: 'India'
            },
            education: [{ degree: '', institution: '', year: '', specialization: '' }],
            experience: [{ institution: '', position: '', startYear: '', endYear: '', currentlyWorking: false, description: '' }],
            subjects: [],
            coverLetter: ''
          });
        } else {
          throw new Error(response.data.message || 'Submission failed');
        }
      } catch (error) {
        console.error("Form submission error:", error);
        let errorMessage = "Error submitting form. Please try again.";
        
        if (error.response) {
          console.error('Error response:', error.response);
          errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
          if (error.response.data?.errors) {
            setErrors(error.response.data.errors);
          }
        } else if (error.request) {
          console.error('Error request:', error.request);
          errorMessage = "Could not connect to the server. Please check your internet connection.";
        } else {
          console.error('Error message:', error.message);
          errorMessage = error.message;
        }
        
        setSubmissionResult({
          success: false,
          message: errorMessage
        });
      }
    } else {
      setErrors(formErrors);
      setSubmissionResult({
        success: false,
        message: "Please fix the errors in the form."
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-center text-2xl font-bold mb-6">Teacher Application Form</h2>
      
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block font-medium text-gray-700 mb-1">First Name*</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            
            <div>
              <label htmlFor="lastName" className="block font-medium text-gray-700 mb-1">Last Name*</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
            
            <div>
              <label htmlFor="email" className="block font-medium text-gray-700 mb-1">Email*</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label htmlFor="phone" className="block font-medium text-gray-700 mb-1">Phone Number*</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            
            <div>
              <label htmlFor="dob" className="block font-medium text-gray-700 mb-1">Date of Birth*</label>
              <input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.dob ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Address</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="address.street" className="block font-medium text-gray-700 mb-1">Street Address</label>
              <input
                id="address.street"
                type="text"
                value={formData.address.street}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="address.city" className="block font-medium text-gray-700 mb-1">City*</label>
              <input
                id="address.city"
                type="text"
                value={formData.address.city}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors['address.city'] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors['address.city'] && <p className="text-red-500 text-sm mt-1">{errors['address.city']}</p>}
            </div>
            
            <div>
              <label htmlFor="address.state" className="block font-medium text-gray-700 mb-1">State*</label>
              <input
                id="address.state"
                type="text"
                value={formData.address.state}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors['address.state'] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors['address.state'] && <p className="text-red-500 text-sm mt-1">{errors['address.state']}</p>}
            </div>
            
            <div>
              <label htmlFor="address.zip" className="block font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                id="address.zip"
                type="text"
                value={formData.address.zip}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="address.country" className="block font-medium text-gray-700 mb-1">Country</label>
              <input
                id="address.country"
                type="text"
                value={formData.address.country}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                readOnly
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Education</h3>
          
          {formData.education.map((edu, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Education #{index + 1}</h4>
                {formData.education.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Degree*</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                    className={`w-full p-2 border rounded-md ${errors[`education[${index}].degree`] ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors[`education[${index}].degree`] && <p className="text-red-500 text-sm mt-1">{errors[`education[${index}].degree`]}</p>}
                </div>
                
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Institution*</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                    className={`w-full p-2 border rounded-md ${errors[`education[${index}].institution`] ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors[`education[${index}].institution`] && <p className="text-red-500 text-sm mt-1">{errors[`education[${index}].institution`]}</p>}
                </div>
                
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Year of Completion</label>
                  <input
                    type="number"
                    value={edu.year}
                    onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1950"
                    max={new Date().getFullYear()}
                  />
                </div>
                
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={edu.specialization}
                    onChange={(e) => handleEducationChange(index, 'specialization', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addEducation}
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            + Add Another Education
          </button>
          
          {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Teaching Experience</h3>
          
          {formData.experience.map((exp, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Experience #{index + 1}</h4>
                {formData.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={exp.institution}
                    onChange={(e) => handleExperienceChange(index, 'institution', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Start Year</label>
                  <input
                    type="number"
                    value={exp.startYear}
                    onChange={(e) => handleExperienceChange(index, 'startYear', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1950"
                    max={new Date().getFullYear()}
                  />
                </div>
                
                <div>
                  <label className="block font-medium text-gray-700 mb-1">End Year</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={exp.endYear}
                      onChange={(e) => handleExperienceChange(index, 'endYear', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min={exp.startYear || "1950"}
                      max={new Date().getFullYear()}
                      disabled={exp.currentlyWorking}
                    />
                    <div className="ml-4 flex items-center">
                      <input
                        type="checkbox"
                        id={`currentlyWorking-${index}`}
                        checked={exp.currentlyWorking}
                        onChange={() => handleExperienceChange(index, 'currentlyWorking')}
                        className="mr-2"
                      />
                      <label htmlFor={`currentlyWorking-${index}`} className="text-sm">Currently Working</label>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addExperience}
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            + Add Another Experience
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Subjects You Can Teach*</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableSubjects.map((subject) => (
              <div key={subject} className="flex items-center">
                <input
                  type="checkbox"
                  id={`subject-${subject}`}
                  checked={formData.subjects.includes(subject)}
                  onChange={() => handleSubjectToggle(subject)}
                  className="mr-2"
                />
                <label htmlFor={`subject-${subject}`}>{subject}</label>
              </div>
            ))}
          </div>
          
          {errors.subjects && <p className="text-red-500 text-sm mt-2">{errors.subjects}</p>}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Cover Letter</h3>
          
          <textarea
            id="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="5"
            placeholder="Tell us why you want to join our institution and what makes you a good fit..."
          ></textarea>
        </div>
        
        <div className="mt-6 text-center">
          <button
            type="submit"
            className="w-full py-3 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition duration-300"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherApplicationForm;
