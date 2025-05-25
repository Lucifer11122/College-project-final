import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Grievance from './Portalcompo/Grievance';
import TeacherQueries from './Portalcompo/TeacherQueries';
import gp from "../assets/gp.jpg"

const TeacherDashboard = () => {
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignedClasses, setAssignedClasses] = useState([]);
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
        'http://localhost:5000/api/teacher/upload-profile-image',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update the teacher data with the new image URL
      if (response.data && response.data.imageUrl) {
        setTeacherData({
          ...teacherData,
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
        try {
          // Get teacher dashboard data
          const dashboardRes = await axios.get('http://localhost:5000/api/teacher/dashboard', {
            headers: { 
              Authorization: `Bearer ${token}`
              // Removed problematic cache headers
            }
          });
          
          console.log('Teacher dashboard data:', dashboardRes.data);
          setTeacherData(dashboardRes.data);
        } catch (dashboardError) {
          console.error('Error fetching teacher dashboard:', dashboardError.message);
          // Fallback data
          setTeacherData({
            firstName: 'Teacher',
            lastName: 'User',
            email: 'teacher@example.com',
            department: 'Computer Science',
            profileImage: null
          });
        }
        
        try {
          // Get teacher classes
          const classesRes = await axios.get('http://localhost:5000/api/teacher/classes', {
            headers: { 
              Authorization: `Bearer ${token}`
              // Removed problematic cache headers
            }
          });
          
          console.log('Teacher classes:', classesRes.data);
          setAssignedClasses(classesRes.data || []);
        } catch (classesError) {
          console.error('Error fetching teacher classes:', classesError.message);
          setAssignedClasses([]);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
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
    setTeacherData(null);
    setAssignedClasses([]);
    
    // Force a clean reload
    window.location.href = '/user-profile';
  };

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
      <nav className="text-white drop-shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-5xl font-bold">OfficeBoard</h1>
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
            <h2 className="text-2xl font-Roboto text-blue-600 mb-4">Profile</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                {teacherData?.profileImage ? (
                  <div className="relative w-20 h-20 mr-4">
                    <img 
                      src={teacherData.profileImage} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-200" 
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
                  <div className="relative w-20 h-20 mr-4">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                      {teacherData?.firstName?.[0] || ''}{teacherData?.lastName?.[0] || ''}
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
                    {teacherData?.firstName || ''} {teacherData?.lastName || ''}
                  </h3>
                  <p className="text-sm text-gray-600">{teacherData?.department || ''}</p>
                </div>
              </div>
              
              <div className="space-y-2 border-t pt-3">
                <p><span className="font-medium">Email:</span> {teacherData?.email}</p>
                <p><span className="font-medium">Department:</span> {teacherData?.department}</p>
                {uploadingImage && <p className="text-xs text-blue-500">Uploading image...</p>}
              </div>
            </div>
          </div>

          {/* Classes Card */}
          <div className="bg-white bg-opacity-30 backdrop-blur-md border border-white border-opacity-20 p-6 rounded-3xl shadow-md">
            <h2 className="text-2xl font-Roboto text-blue-600 mb-4">Classes Assigned</h2>
            <div className="space-y-2">
              {assignedClasses.length > 0 ? (
                assignedClasses.map((cls) => (
                  <div key={cls._id} className="p-4 border rounded">
                    <h4 className="font-medium">{cls.name}</h4>
                    <p className="text-sm text-gray-600">Students:</p>
                    <ul className="list-disc pl-5 text-sm">
                      {cls.students?.map((student) => (
                        <li key={student._id}>
                          {student.firstName} {student.lastName}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No classes assigned yet.</p>
              )}
            </div>
          </div>

          <TeacherQueries />
          <Grievance role="teacher" />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;