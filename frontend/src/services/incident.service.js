import axios from 'axios';
import authHeader from './auth-header';

const API_URL = '/api/incidents/';

const getAllIncidents = async (params = {}) => {
  const response = await axios.get(API_URL, { 
    headers: authHeader(),
    params
  });
  return response.data;
};

const getIncidentById = async (id) => {
  const response = await axios.get(API_URL + id, { headers: authHeader() });
  return response.data;
};

const createIncident = async (incidentData) => {
  const response = await axios.post(API_URL, incidentData, { 
    headers: authHeader() 
  });
  return response.data;
};

const updateIncident = async (id, incidentData) => {
  const response = await axios.put(API_URL + id, incidentData, { 
    headers: authHeader() 
  });
  return response.data;
};

const deleteIncident = async (id) => {
  const response = await axios.delete(API_URL + id, { 
    headers: authHeader() 
  });
  return response.data;
};

const incidentService = {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident
};

export default incidentService;
