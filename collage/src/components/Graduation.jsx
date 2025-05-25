import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
} from "@material-tailwind/react";

// Import default images
import cimage1 from "../assets/cimage1.jpeg";
import cimage2 from "../assets/cimage2.jpeg";
import cimage3 from "../assets/cimage3.jpeg";

const defaultImages = {
  'cimage1.jpeg': cimage1,
  'cimage2.jpeg': cimage2,
  'cimage3.jpeg': cimage3
};

const Graduation = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/courses/graduate');
        setCourses(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching graduate courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="container mx-auto p-4 bg-gray-50">
      <Typography variant="h3" color="blue-gray" className="text-center mb-8 font-semibold">
        Postgraduate Courses
      </Typography>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <Typography variant="h6" color="red" className="mb-2">
            {error}
          </Typography>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="text-center py-10">
          <Typography variant="h6" color="blue-gray" className="mb-2">
            No courses available at the moment.
          </Typography>
        </div>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Card key={course.title} className="w-full">
              <CardHeader color="blue-gray" className="relative h-56">
                <img
                  src={defaultImages[course.image] || defaultImages['cimage1.jpeg']}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
              </CardHeader>
              <CardBody>
                <Typography variant="h5" color="blue-gray" className="mb-2">
                  {course.title}
                </Typography>
                <Typography variant="paragraph" color="gray" className="text-sm mb-2">
                  {course.description}
                </Typography>
                <Typography variant="body2" color="blue-gray" className="mt-2">
                  Duration: {course.duration}
                </Typography>
                <Typography variant="body2" color="blue-gray" className="mt-2">
                  Fees: {course.fees}
                </Typography>
                <Typography variant="body2" color="blue-gray" className="mt-2">
                  Eligibility: {course.criteria}
                </Typography>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Graduation;