import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Textarea,
  Spinner,
  Select,
  Option
} from "@material-tailwind/react";
import axios from 'axios';

/**
 * AdminApplications Component
 * Allows administrators to view, approve, or reject student applications
 * Applications are ranked by merit score (class12Percentage)
 */
const AdminApplications = () => {
  // State management for application filtering and processing
  const [selectedCourse, setSelectedCourse] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const courses = {
    undergraduate: [
      "Computer Science",
      "Business Administration",
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil Engineering",
      "Psychology"
    ],
    graduate: [
      "Master of Computer Science",
      "MBA",
      "Master of Engineering",
      "Master of Psychology"
    ]
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchApplications();
    }
  }, [selectedCourse]);

  /**
   * Fetches applications for the selected course
   * Applications are automatically sorted by merit score (class12Percentage) on the server
   */
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/admin/applications/${selectedCourse}`);

      if (response.data.success) {
        setApplications(response.data.applications);
      } else {
        throw new Error(response.data.message || 'Failed to fetch applications');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Error fetching applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const processApplications = async () => {
    try {
      setProcessing(true);
      setError(null);

      console.log('Processing applications for course:', selectedCourse);
      const response = await axios.post(`/api/admin/process-applications/${selectedCourse}`);
      console.log('Process applications response:', response.data);

      if (response.data.success) {
        alert('Applications processed successfully');
        await fetchApplications();
      } else {
        throw new Error(response.data.message || 'Failed to process applications');
      }
    } catch (error) {
      console.error('Error processing applications:', error);
      setError(error.response?.data?.message || error.message || 'Error processing applications');
      alert('Failed to process applications. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      console.log('Updating application status:', { id: selectedApp._id, status, remarks });
      
      const response = await axios.put(`/api/admin/applications/${selectedApp._id}/status`, {
        status,
        adminRemarks: remarks
      });

      console.log('Status update response:', response.data);

      if (response.data.success) {
        setShowDialog(false);
        setRemarks('');
        await fetchApplications(); // Refresh the applications list
        alert(`Application ${status} successfully`);
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      setError(error.response?.data?.message || error.message || 'Error updating application status');
      alert('Failed to update application status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-700 bg-yellow-50',
      shortlisted: 'text-blue-700 bg-blue-50',
      accepted: 'text-green-700 bg-green-50',
      rejected: 'text-red-700 bg-red-50',
      waitlisted: 'text-purple-700 bg-purple-50'
    };
    return colors[status] || 'text-gray-700 bg-gray-50';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Typography variant="h4" color="blue-gray" className="mb-4">
          Manage Applications
        </Typography>

        <div className="flex gap-4 mb-4">
          <Select
            label="Select Course"
            value={selectedCourse}
            onChange={(value) => setSelectedCourse(value)}
            className="w-72"
          >
            <Option value="" disabled>
              Choose a course
            </Option>
            <optgroup label="Undergraduate Courses">
              {courses.undergraduate.map((course) => (
                <Option key={course} value={course}>
                  {course}
                </Option>
              ))}
            </optgroup>
            <optgroup label="Graduate Courses">
              {courses.graduate.map((course) => (
                <Option key={course} value={course}>
                  {course}
                </Option>
              ))}
            </optgroup>
          </Select>

          <Button
            color="blue"
            disabled={!selectedCourse || processing}
            onClick={processApplications}
          >
            {processing ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Processing...
              </>
            ) : (
              'Process Applications'
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card key={app._id} className="w-full">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div>
                      <Typography variant="h6" color="blue-gray">
                        {app.firstName} {app.lastName}
                      </Typography>
                      <Typography variant="small" color="gray" className="mb-2">
                        Merit Rank: {app.meritRank} | Score: {app.meritScore.toFixed(2)}
                      </Typography>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {app.status === 'shortlisted' && (
                        <>
                          <Button
                            color="green"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setShowDialog(true);
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            color="red"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setShowDialog(true);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} handler={() => setShowDialog(false)}>
        <DialogHeader>Update Application Status</DialogHeader>
        <DialogBody>
          <Textarea
            label="Admin Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setShowDialog(false)}
            className="mr-1"
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={() => updateStatus('accepted')}
          >
            Accept
          </Button>
          <Button
            variant="gradient"
            color="red"
            onClick={() => updateStatus('rejected')}
          >
            Reject
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default AdminApplications; 