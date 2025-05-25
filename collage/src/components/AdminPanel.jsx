import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
}, error => {
  console.log('Response Error:', error);
  return Promise.reject(error);
});

const AdminPanel = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState("");
  const [grievances, setGrievances] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({
    name: '',
    teacher: '',
    students: [],
    description: ''
  });
  const [notice, setNotice] = useState({
    title: '',
    message: '',
    targetRole: 'all'
  });
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    title: '',
    type: 'undergraduate',
    description: '',
    duration: '',
    fees: '',
    criteria: '',
    capacity: 60,
    image: 'cimage1.jpeg'
  });

  // Add new state for applications
  const [applications, setApplications] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('shortlisted');

  // Add new state for filtered courses
  const [courseTypeFilter, setCourseTypeFilter] = useState('all');
  
  // Add function to filter courses by type
  const filteredCourses = courses.filter(course => 
    courseTypeFilter === 'all' ? true : course.type === courseTypeFilter
  );

  // Fetch data
  const fetchData = async () => {
    try {
      console.log('Fetching admin data...');
      const [notificationsRes, grievancesRes, usersRes, teachersRes, studentsRes, classesRes] = await Promise.all([
        axios.get("http://localhost:5000/notifications"),
        fetch("http://localhost:5000/grievances"),
        fetch("http://localhost:5000/api/admin/users/new"),
        axios.get("http://localhost:5000/api/admin/teachers"),
        axios.get("http://localhost:5000/api/admin/students"),
        axios.get("http://localhost:5000/api/admin/classes")
      ]);

      if (Array.isArray(notificationsRes.data)) {
        setNotifications(notificationsRes.data);
      }
      
      if (grievancesRes.ok && usersRes.ok) {
        setGrievances(await grievancesRes.json());
        setNewUsers(await usersRes.json());
        setTeachers(teachersRes.data);
        setStudents(studentsRes.data);
        setClasses(classesRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const [undergradRes, gradRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/courses/undergraduate'),
        axios.get('http://localhost:5000/api/admin/courses/graduate')
      ]);
      
      const allCourses = [...undergradRes.data, ...gradRes.data];
      setCourses(allCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      let url = 'http://localhost:5000/api/admin/applications';
      if (selectedCourseFilter) {
        // For course filtering, we need to pass the course title
        url += `/${selectedCourseFilter}`;
      }
      const response = await axios.get(url);
      
      // Process the response data
      let apps = Array.isArray(response.data) ? response.data : response.data.applications || [];
      
      // Sort applications by merit score in descending order
      apps.sort((a, b) => b.meritScore - a.meritScore);
      
      // Update the applications state
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCourses();
    fetchApplications();
  }, []);

  // Add this useEffect to log classes whenever they change
  useEffect(() => {
    console.log('Current classes:', classes);
  }, [classes]);

  // Add useEffect for applications
  useEffect(() => {
    fetchApplications();
  }, [selectedCourseFilter]);

  // Add a new notification
  const handleAddNotification = async () => {
    if (!newNotification.trim()) {
      alert("Please enter a valid notification.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/notifications", {
        notification: newNotification
      });
      
      // Update notifications with the response data
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
        setNewNotification("");
      } else {
        console.error("Unexpected response format:", response.data);
      }
    } catch (error) {
      console.error("Error adding notification:", error);
      alert("Failed to add notification.");
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (index) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      try {
        const response = await axios.delete(`http://localhost:5000/notifications/${index}`);
        
        // Update notifications with the response data
        if (Array.isArray(response.data)) {
          setNotifications(response.data);
        } else {
          console.error("Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
        alert("Failed to delete notification.");
      }
    }
  };

  // Delete a grievance
  const handleDeleteGrievance = async (grievanceId) => {
    if (!grievanceId || typeof grievanceId !== 'string') {
      console.error('Invalid grievance ID:', grievanceId);
      alert('Invalid grievance ID');
      return;
    }

    if (window.confirm("Are you sure you want to delete this grievance?")) {
      try {
        console.log('Deleting grievance with ID:', grievanceId);
        const response = await axios.delete(`http://localhost:5000/grievances/${grievanceId}`);

        if (response.data.success) {
          setGrievances(response.data.grievances);
          alert("Grievance deleted successfully");
        } else {
          alert(response.data.message || "Failed to delete grievance");
        }
      } catch (error) {
        console.error("Error deleting grievance:", error);
        alert(error.response?.data?.message || "Failed to delete grievance");
      }
    }
  };

  // Create a new class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      if (!newClass.name || !newClass.teacher || !newClass.students.length) {
        alert("Please fill in all required fields");
        return;
      }

      const response = await axios.post("http://localhost:5000/api/admin/classes", newClass);
      console.log('Class creation response:', response.data);
      
      setNewClass({
        name: '',
        teacher: '',
        students: [],
        description: ''
      });
      
      fetchData();
      alert("Class created successfully!");
    } catch (error) {
      console.error("Error creating class:", error);
      alert(error.response?.data?.message || "Failed to create class");
    }
  };

  const handleNoticeSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting notice:', notice); // Debug log
      const response = await axios.post("http://localhost:5000/api/admin/notices", notice);
      console.log('Notice response:', response.data); // Debug log
      
      if (response.data.notice) {
        setNotice({ title: '', message: '', targetRole: 'all' });
        alert("Notice sent successfully!");
      }
    } catch (error) {
      console.error("Error sending notice:", error.response?.data || error);
      alert(error.response?.data?.message || "Failed to send notice");
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      const courseData = {
        title: newCourse.title,
        type: newCourse.type,
        description: newCourse.description,
        duration: newCourse.duration,
        fees: newCourse.fees,
        criteria: newCourse.criteria,
        capacity: Number(newCourse.capacity) || 60,
        image: 'cimage1.jpeg'
      };

      console.log('Submitting course:', courseData);
      const response = await axios.post('http://localhost:5000/api/admin/courses', courseData);
      console.log('Course response:', response.data);
      
      if (response.data._id) {
        setNewCourse({
          title: '',
          type: 'undergraduate',
          description: '',
          duration: '',
          fees: '',
          criteria: '',
          capacity: 60,
          image: 'cimage1.jpeg'
        });
        fetchCourses();
        alert('Course added successfully!');
      }
    } catch (error) {
      console.error('Error adding course:', error);
      alert(error.response?.data?.message || 'Failed to add course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/courses/${courseId}`);
        fetchCourses();
        alert('Course deleted successfully!');
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course');
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    navigate('/');
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        console.log('Deleting class:', classId);
        const response = await axios.delete(`http://localhost:5000/api/admin/classes/${classId}`);
        console.log('Delete response:', response.data);
        
        if (response.data.message === "Class deleted successfully") {
          // Update the classes state by removing the deleted class
          setClasses(prevClasses => prevClasses.filter(cls => cls._id !== classId));
          alert('Class deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Update handleApplicationStatus function
  const handleApplicationStatus = async (applicationId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/applications/${applicationId}/status`, {
        status: newStatus
      });
      
      // Show success message
      alert(`Application ${newStatus} successfully`);
      
      // Refresh applications list
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      alert(`Failed to ${newStatus} application`);
    }
  };

  // Add function to process applications for a course
  const handleProcessApplications = async (courseTitle) => {
    try {
      // Find the course by title to get its ID
      const course = courses.find(c => c.title === courseTitle);
      if (!course) {
        alert('Course not found');
        return;
      }
      
      await axios.post(`http://localhost:5000/api/admin/process-applications/${course._id}`);
      fetchApplications();
      alert('Applications processed successfully!');
    } catch (error) {
      console.error('Error processing applications:', error);
      alert('Failed to process applications');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-100">
            <h3 className="text-lg font-semibold text-orange-800">Total Students</h3>
            <p className="text-3xl font-bold text-orange-600">{students.length}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800">Total Teachers</h3>
            <p className="text-3xl font-bold text-blue-600">{teachers.length}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="text-lg font-semibold text-green-800">Active Classes</h3>
            <p className="text-3xl font-bold text-green-600">{classes.length}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Notification Section */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manage Notifications</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={newNotification}
                  onChange={(e) => setNewNotification(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                  placeholder="Enter new notification"
                />
                <button
                  onClick={handleAddNotification}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Add
                </button>
              </div>
              
              {/* Display Notifications */}
              <div className="mt-6">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 italic">No notifications available</p>
                ) : (
                  <ul className="space-y-4">
                    {notifications.map((notif, index) => (
                      <li 
                        key={index} 
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300"
                      >
                        <span className="flex-1 text-gray-700">{notif}</span>
                        <button
                          onClick={() => handleDeleteNotification(index)}
                          className="ml-4 text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-300"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Notice Management Section */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Send Notice</h2>
              <form onSubmit={handleNoticeSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Notice Title"
                  value={notice.title}
                  onChange={(e) => setNotice({ ...notice, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                
                <textarea
                  placeholder="Notice Message"
                  value={notice.message}
                  onChange={(e) => setNotice({ ...notice, message: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                
                <select
                  value={notice.targetRole}
                  onChange={(e) => setNotice({ ...notice, targetRole: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Users</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="student">Students Only</option>
                </select>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Send Notice
                </button>
              </form>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* New User Registrations Section */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">New User Registrations</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {newUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'student' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.profileSetup ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {user.profileSetup ? 'Complete' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grievances Section */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Grievances</h2>
              <div className="space-y-4">
                {grievances.map((grievance) => (
                  <div key={grievance._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {grievance.username}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            grievance.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {grievance.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{grievance.complaint}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(grievance.date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGrievance(grievance._id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-300"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Applications Management Section */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Manage Applications</h2>
            <div className="space-x-4">
              <button
                onClick={() => window.location.href = '/admin/teacher-applications'}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Teacher Applications
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="p-2 border rounded-md flex-grow"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course.title}>
                  {course.title} ({course.type})
                </option>
              ))}
            </select>

            <select
              value={applicationStatusFilter}
              onChange={(e) => setApplicationStatusFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="waitlisted">Waitlisted</option>
            </select>

            {selectedCourseFilter && (
              <button
                onClick={() => handleProcessApplications(selectedCourseFilter)}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                Process Applications
              </button>
            )}
            
            <button
              onClick={() => {
                // Sort applications by class12Percentage in descending order
                const sortedApps = [...applications].sort((a, b) => b.class12Percentage - a.class12Percentage);
                setApplications(sortedApps);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Sort by Class 12%
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class 12%</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications
                  .filter(app => app.status === applicationStatusFilter)
                  .map((application, index) => (
                    <tr key={application._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {application.firstName} {application.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {application.course}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {application.class12Percentage || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {application.meritRank || index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          application.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'waitlisted' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(application.status === 'shortlisted' || application.status === 'pending') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApplicationStatus(application._id, 'accepted')}
                              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleApplicationStatus(application._id, 'rejected')}
                              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            
            {applications.filter(app => app.status === applicationStatusFilter).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No applications found with status: {applicationStatusFilter}
              </div>
            )}
          </div>
        </div>

        {/* Replace the Course Management Section with this updated version */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manage Courses</h2>
          
          {/* Course Type Filter */}
          <div className="mb-6">
            <select
              value={courseTypeFilter}
              onChange={(e) => setCourseTypeFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="all">All Courses</option>
              <option value="undergraduate">Undergraduate Courses</option>
              <option value="graduate">Graduate Courses</option>
            </select>
          </div>

          {/* Display Current Courses */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((course) => (
                <div key={course._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-lg text-gray-800">{course.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">{course.type}</p>
                      <p className="text-sm text-gray-600">{course.description}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Duration:</span> {course.duration}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Fees:</span> {course.fees}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Criteria:</span> {course.criteria}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Capacity:</span> {course.capacity} students
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Current Applications:</span> {course.currentApplications}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-300"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Course Form */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Course</h3>
          <form onSubmit={handleCourseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Course Title"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />

              <select
                value={newCourse.type}
                onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                  <option value="">Select Course Type</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>

            <textarea
              placeholder="Course Description"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                  placeholder="Duration (e.g., 4 years)"
                value={newCourse.duration}
                onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />

              <input
                type="text"
                  placeholder="Fees (e.g., $10,000 per year)"
                value={newCourse.fees}
                onChange={(e) => setNewCourse({ ...newCourse, fees: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Admission Criteria"
                  value={newCourse.criteria}
                  onChange={(e) => setNewCourse({ ...newCourse, criteria: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />

                <input
                  type="number"
                  placeholder="Course Capacity"
                  value={newCourse.capacity}
                  onChange={(e) => setNewCourse({ ...newCourse, capacity: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  min="1"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Add Course
            </button>
          </form>
          </div>
        </div>

        {/* Class Management Section */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Manage Classes</h2>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Class Name"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />

              <select
                value={newClass.teacher}
                onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                multiple
                value={newClass.students}
                onChange={(e) => setNewClass({
                  ...newClass,
                  students: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple students</p>
            </div>

            <textarea
              placeholder="Class Description (Optional)"
              value={newClass.description}
              onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Create Class
            </button>
          </form>

          {/* Display Current Classes */}
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Current Classes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">{cls.name}</h4>
                      <p className="text-sm text-gray-600">
                        Teacher: {cls.teacher?.firstName} {cls.teacher?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Students: {cls.students?.length || 0}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(cls._id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-300"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;