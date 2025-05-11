
import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated) {
      const userName = localStorage.getItem('userName') || '';
      const userEmail = localStorage.getItem('userEmail') || '';
      const userRole = localStorage.getItem('userRole') || '';
      
      setUser({
        name: userName,
        email: userEmail,
        role: userRole
      });
    }
    
    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Add this to ensure userName is always available
  const userName = localStorage.getItem('userName') || 
                  (user && user.name) || 
                  (user && user.email) || 
                  'User';
  
  // Make sure to include userName in your return value
  return {
    user,
    userName, // Add this line
    isAuthenticated,
    signIn: () => {
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
    },
    signOut: () => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      setIsAuthenticated(false);
      setUser(null);
    },
    loading
  };
};
