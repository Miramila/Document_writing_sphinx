import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    post: {
      "Access-Control-Allow-Origin": "*"
    }
  }
});

export default axiosInstance;