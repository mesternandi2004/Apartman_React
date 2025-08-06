// frontend/src/hooks/useAuth.js
import { useContext, createContext } from 'react';

// Create the context (you'll need to export this from AuthContext.jsx)
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// You'll need to export AuthContext from your AuthContext.jsx file
export { AuthContext };