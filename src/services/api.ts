import apiClient from '@/lib/axios';

// API base paths
const API_V1_PATH = '/v1';

// Projects related API calls
export const projectsApi = {
  getAllProjects: async () => {
    const response = await apiClient.get(`${API_V1_PATH}/projects`);
    return response.data;
  },
  getProject: async (id: number | string) => {
    const response = await apiClient.get(`${API_V1_PATH}/projects/${id}`);
    return response.data;
  },
  getProjectWithAllImages: async (id: number | string) => {
    const response = await apiClient.get(`${API_V1_PATH}/projects/${id}/full`);
    console.log(`response: ${JSON.stringify(response.data)}`) 
    return response.data;
  },
  getProjectWithReloadedImages: async (id: number | string) => {
    const response = await apiClient.get(`${API_V1_PATH}/projects/${id}?reload_images=true`);
    return response.data;
  },
  createProject: async (projectData: any) => {
    const response = await apiClient.post(`${API_V1_PATH}/projects`, projectData);
    return response.data;
  },
  updateProject: async (id: number | string, projectData: any) => {
    const response = await apiClient.put(`${API_V1_PATH}/projects/${id}`, projectData);
    return response.data;
  },
  deleteProject: async (id: number | string) => {
    const response = await apiClient.delete(`${API_V1_PATH}/projects/${id}`);
    return response.data;
  },
};

// Add more API services as needed 