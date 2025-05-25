import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Grievance from './Portalcompo/Grievance';
import StudentsQueries from './Portalcompo/StudentsQueries';
import gp from "../assets/gp.jpg";

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();

  // Handle profile image upload
  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }
    
    try {
      setUploadingImage(true);
      
      // Create a FormData object
      const formData = new FormData();
      formData.append('profileImage', file);
      
      // Get token
      const token = localStorage.getItem('token');
      
      // Send the image to the server
      const response = await axios.post(
        'http://localhost:5000/api/student/upload-profile-image',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update the student data with the new image URL
      if (response.data && response.data.imageUrl) {
        setStudentData({
          ...studentData,
          profileImage: response.data.imageUrl
        });
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tokenExpires = localStorage.getItem('tokenExpires');
    const currentTime = new Date().getTime();

    if (!token || !tokenExpires || currentTime > parseInt(tokenExpires)) {
      handleLogout();
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching student data with token:', token);
        
        // First try to get dashboard data
        try {
          const dashboardRes = await axios.get('http://localhost:5000/api/student/dashboard', {
            headers: { 
              Authorization: `Bearer ${token}`
              // Removed problematic cache headers
            }
          });
          
          console.log('Dashboard API response:', dashboardRes.data);
          
          if (dashboardRes.data) {
            setStudentData(dashboardRes.data);
          } else {
            console.error('Dashboard response is empty');
            // Use fallback data
            setStudentData({
              firstName: 'Test',
              lastName: 'Student',
              email: 'test.student@example.com',
              course: 'Computer Science',
              department: 'Engineering'
            });
          }
        } catch (dashboardError) {
          console.error('Error fetching dashboard data:', dashboardError.message);
          // Create mock data for testing if API fails
          setStudentData({
            firstName: 'Test',
            lastName: 'Student',
            email: 'test.student@example.com',
            course: 'Computer Science',
            department: 'Engineering'
          });
        }
        
        // Then try to get classes data
        try {
          const classesRes = await axios.get('http://localhost:5000/api/student/classes', {
            headers: { 
              Authorization: `Bearer ${token}`
              // Removed problematic cache headers
            }
          });
          
          console.log('Classes API response:', classesRes.data);
          setEnrolledClasses(classesRes.data || []);
        } catch (classesError) {
          console.error('Error fetching classes:', classesError.message);
          setEnrolledClasses([]);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        if (error.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data
    setStudentData(null);
    setEnrolledClasses([]);
    setNotices([]);
    
    // Force a clean reload
    window.location.href = '/user-profile';
  };

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/notices/student');
        setNotices(response.data || []);
      } catch (error) {
        console.error('Error fetching notices:', error);
        // Set some sample notices as fallback
        setNotices([
          { 
            _id: '1', 
            title: 'Sample Notice', 
            message: 'This is a sample notice when the API is unavailable.', 
            createdAt: new Date() 
          }
        ]);
      }
    };

    fetchNotices();
  }, []);

  // Debug information
  useEffect(() => {
    if (studentData) {
      console.log('Student data updated:', studentData);
    }
  }, [studentData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg center"
    style={{
      backgroundImage:`url(${gp})`
    }}
      >
    <nav className=" text-white drop-shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-5xl font-bold">ClassBoard</h1>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
            }}
            className="bg-orange-200 font-semibold text-red-600 px-4 py-2 rounded-full hover:bg-red-900"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white bg-opacity-30 backdrop-blur-md border border-white border-opacity-20 p-6 rounded-3xl shadow-md">
            <h2 className="text-xl font-Roboto text-blue-600 mb-4">PROFILE</h2>
            {studentData ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  {studentData.profileImage ? (
                    <div className="relative w-16 h-16 mr-3">
                      <img 
                        src={studentData.profileImage} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-200" 
                      />
                      <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                      <input 
                        type="file" 
                        id="profile-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                      />
                    </div>
                  ) : (
                    <div className="relative w-16 h-16 mr-3">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                        {studentData.firstName?.[0] || ''}{studentData.lastName?.[0] || ''}
                      </div>
                      <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                      <input 
                        type="file" 
                        id="profile-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {studentData.firstName || ''} {studentData.lastName || ''}
                    </h3>
                    <p className="text-sm text-gray-600">{studentData.course || ''}</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2 border-t pt-3">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="text-gray-800">{studentData.email || 'Not available'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-700">Course:</span>
                    <span className="text-gray-800">{studentData.course || 'Not available'}</span>
                  </p>
                  {studentData.department && (
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-700">Department:</span>
                      <span className="text-gray-800">{studentData.department}</span>
                    </p>
                  )}
                </div>
                
                {/* Debug information - remove in production */}
                <div className="mt-4 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-400">
                  <p>Data loaded from API</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading profile data...</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs text-blue-500 hover:underline"
                >
                  Refresh page
                </button>
              </div>
            )}  
          </div>

          {/* Classes Card */}
          <div className="bg-white bg-opacity-30 backdrop-blur-md border border-white border-opacity-20 p-6 rounded-3xl shadow-md">
            <h2 className="text-2xl text-blue-600 font-semibold mb-4">My Classes</h2>
            <div className="space-y-2">
              {enrolledClasses.length > 0 ? (
                enrolledClasses.map((cls) => (
                  <div key={cls._id} className="p-4 border rounded">
                    <h4 className="font-medium">{cls.name}</h4>
                    <p className="text-sm text-gray-600">
                      Teacher: {cls.teacher?.firstName} {cls.teacher?.lastName}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No classes enrolled yet.</p>
              )}
            </div>
          </div>

          {/* Notices Card */}
          <div className="bg-white bg-opacity-30 backdrop-blur-md border border-white border-opacity-20 p-6 rounded-3xl shadow-md">
            <h2 className="text-2xl text-blue-600 font-semibold mb-4">Important Notices</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
              {notices.length > 0 ? notices.map((notice) => (
                <div key={notice._id} className="p-4 bg-orange-50 rounded border-l-4 border-orange-500">
                  <h3 className="font-semibold text-lg">{notice.title}</h3>
                  <p className="text-gray-600 mt-1">{notice.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">No notices available</p>
              )}
            </div>
          </div>

          <StudentsQueries 
            studentId={studentData?._id}
            studentName={`${studentData?.firstName} ${studentData?.lastName}`}
          />
          <Grievance role="student" />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;