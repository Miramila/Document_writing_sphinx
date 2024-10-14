import axios from 'axios';
const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

export default axiosInstance;