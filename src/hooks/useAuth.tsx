
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
      
      console.log("Auth Provider - Setting user from localStorage:", {
        name: userName,
        email: userEmail,
        role: userRole
      });
      
      setUser({
        name: userName,
        email: userEmail,
        role: userRole
      });
    } else {
      console.log("Auth Provider - User not authenticated");
      setUser(null);
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
  const context = useContext(AuthContext);
  
  if (!context) {
    // If we're outside the provider, create a minimal implementation
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userName = localStorage.getItem('userName') || 'User';
    const userRole = localStorage.getItem('userRole') || '';
    
    return {
      user: isAuthenticated ? {
        name: userName,
        email: userEmail,
        role: userRole
      } : null,
      loading: false,
      signOut: () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
      }
    };
  }
  
  return context;
};
