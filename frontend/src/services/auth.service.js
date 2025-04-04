import axios from 'axios';

const API_URL = '/api/auth/';

const login = async (username, password) => {
  const response = await axios.post(API_URL + 'login', {
    username,
    password
  });
  
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  
  return response.data;
};

const getCurrentUser = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user || !user.token) {
    return null;
  }
  
  try {
    // Verificar token válido con el backend
    const response = await axios.get(API_URL + 'me', {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });
    
    return {
      ...user,
      ...response.data.user
    };
  } catch (error) {
    logout();
    return null;
  }
};

const authService = {
  login,
  logout,
  register,
  getCurrentUser
};

export default authService;
