// api/api.js
import axios from 'axios';

const API_BASE = __DEV__
  ? 'http://192.168.100.4:8000/api/' // 👈 Your local IP for development
  : 'https://mosquetrack-production.up.railway.app/api/'; // 👈 Production server


const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api; // ✅ this is important!
