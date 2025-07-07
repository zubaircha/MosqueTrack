import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ffdc-165-99-40-129.ngrok-free.app/api/', // ✅ use your current ngrok URL
});

export default api;
