// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useReducer, useEffect } from 'react';
import { authAPI, handleApiError } from '../services/api';
import { AuthActionTypes, initialState, authReducer } from './authTypes';

const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          dispatch({ type: AuthActionTypes.LOAD_USER_START });
          
          // Validate token
          const response = await authAPI.validateToken();
          
          dispatch({
            type: AuthActionTypes.LOAD_USER_SUCCESS,
            payload: response.data.user,
          });
        } catch (error) {
          console.error('Token validation failed:', error);
          dispatch({
            type: AuthActionTypes.LOAD_USER_FAILURE,
            payload: 'Session expired',
          });
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        dispatch({ type: AuthActionTypes.LOAD_USER_FAILURE, payload: null });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AuthActionTypes.LOGIN_START });
      
      const response = await authAPI.login(credentials);
      
      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({
        type: AuthActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AuthActionTypes.REGISTER_START });
      
      const response = await authAPI.register(userData);
      
      dispatch({
        type: AuthActionTypes.REGISTER_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({
        type: AuthActionTypes.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: AuthActionTypes.LOGOUT });
  };

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      
      dispatch({
        type: AuthActionTypes.UPDATE_PROFILE_SUCCESS,
        payload: response.data.user,
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user?.isAdmin || false;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!(state.user && state.token);
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAdmin,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;