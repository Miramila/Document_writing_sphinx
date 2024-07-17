import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  withCredentials: true,
  headers: {
    post: {
      "Access-Control-Allow-Origin": "*"
    }
  }
});

export default axiosInstance;