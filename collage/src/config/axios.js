import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000', // Your backend API URL
  headers: {
    'Content-Type': 'application/json'
  },
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accept all responses to handle errors properly
  }
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log('Making request to:', config.url, config.data);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    // Log the response for debugging
    console.log('Received response:', response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance; 