import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

const api = axios.create({
  baseURL: BASE_URL,
}); 

// Export/Import API functions
export const exportTasks = async (format) => {
  try {
    const response = await api.get(`/tasks/export/${format}`, {
      responseType: 'blob',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const importTasks = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/tasks/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export default api;
