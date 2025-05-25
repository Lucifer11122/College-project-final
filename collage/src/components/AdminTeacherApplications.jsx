import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const AdminTeacherApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionResult, setActionResult] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Use the api instance with auth token
      const response = await api.get('/api/admin/teacher-applications');
      setApplications(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teacher applications:', error);
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(`Failed to load teacher applications: ${error.response?.data?.message || error.message}`);
      }
      setLoading(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setAdminRemarks(application.adminRemarks || '');
  };

  const handleCloseDetails = () => {
    setSelectedApplication(null);
    setAdminRemarks('');
    setActionResult(null);
  };

  const handleRemarksChange = (e) => {
    setAdminRemarks(e.target.value);
  };

  const handleUpdateStatus = async (status) => {
    try {
      setLoading(true);
      const response = await api.put(`/api/admin/teacher-applications/${selectedApplication._id}/status`, {
        status,
        adminRemarks
      });
      
      if (response.data.success) {
        setActionResult({
          success: true,
          message: `Application ${status === 'accepted' ? 'accepted' : 'rejected'} successfully.`
        });
        
        // Update the application in the list
        setApplications(applications.map(app => 
          app._id === selectedApplication._id 
            ? { ...app, status, adminRemarks } 
            : app
        ));
        
        // Update the selected application
        setSelectedApplication({ ...selectedApplication, status, adminRemarks });
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
      
      setLoading(false);
    } catch (error) {
      console.error(`Error ${status === 'accepted' ? 'accepting' : 'rejecting'} application:`, error);
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        setActionResult({
          success: false,
          message: 'Authentication failed. Please log in again.'
        });
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setActionResult({
          success: false,
          message: `Failed to ${status === 'accepted' ? 'accept' : 'reject'} application. ${error.response?.data?.message || 'Please try again.'}`
        });
      }
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && applications.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Teacher Applications</h2>
          <button
            onClick={() => navigate('/AdminPanel')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Admin Panel
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && applications.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Teacher Applications</h2>
          <button
            onClick={() => navigate('/AdminPanel')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Admin Panel
          </button>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <div className="mt-4">
            <button 
              onClick={() => fetchApplications()} 
              className="mr-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Teacher Applications</h2>
        <button
          onClick={() => navigate('/AdminPanel')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Back to Admin Panel
        </button>
      </div>
      
      {applications.length === 0 ? (
        <div className="bg-gray-100 p-4 rounded-md text-center">
          <p>No teacher applications found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Subjects</th>
                <th className="py-3 px-4 text-left">Date Applied</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{application.firstName} {application.lastName}</td>
                  <td className="py-3 px-4">{application.email}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {application.subjects.slice(0, 2).map((subject, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {subject}
                        </span>
                      ))}
                      {application.subjects.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          +{application.subjects.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{formatDate(application.applicationDate)}</td>
                  <td className="py-3 px-4">{getStatusBadge(application.status)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Application Details</h3>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              {actionResult && (
                <div className={`mb-4 p-3 rounded ${actionResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {actionResult.message}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700">Personal Information</h4>
                  <p><span className="font-medium">Name:</span> {selectedApplication.firstName} {selectedApplication.lastName}</p>
                  <p><span className="font-medium">Email:</span> {selectedApplication.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedApplication.phone}</p>
                  <p><span className="font-medium">Date of Birth:</span> {formatDate(selectedApplication.dob)}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700">Address</h4>
                  <p>{selectedApplication.address.street}</p>
                  <p>{selectedApplication.address.city}, {selectedApplication.address.state} {selectedApplication.address.zip}</p>
                  <p>{selectedApplication.address.country}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Education</h4>
                {selectedApplication.education.map((edu, index) => (
                  <div key={index} className="mb-2 p-3 bg-gray-50 rounded-md">
                    <p><span className="font-medium">Degree:</span> {edu.degree}</p>
                    <p><span className="font-medium">Institution:</span> {edu.institution}</p>
                    <p><span className="font-medium">Year:</span> {edu.year}</p>
                    {edu.specialization && <p><span className="font-medium">Specialization:</span> {edu.specialization}</p>}
                  </div>
                ))}
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Experience</h4>
                {selectedApplication.experience.map((exp, index) => (
                  <div key={index} className="mb-2 p-3 bg-gray-50 rounded-md">
                    <p><span className="font-medium">Institution:</span> {exp.institution}</p>
                    <p><span className="font-medium">Position:</span> {exp.position}</p>
                    <p><span className="font-medium">Duration:</span> {exp.startYear} - {exp.currentlyWorking ? 'Present' : exp.endYear}</p>
                    {exp.description && <p><span className="font-medium">Description:</span> {exp.description}</p>}
                  </div>
                ))}
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.subjects.map((subject, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              
              {selectedApplication.coverLetter && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2">Cover Letter</h4>
                  <div className="p-3 bg-gray-50 rounded-md whitespace-pre-line">
                    {selectedApplication.coverLetter}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Admin Remarks</h4>
                <textarea
                  value={adminRemarks}
                  onChange={handleRemarksChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Add your remarks here..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                {selectedApplication.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      disabled={loading}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('accepted')}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                      disabled={loading}
                    >
                      Accept
                    </button>
                  </>
                )}
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeacherApplications;
