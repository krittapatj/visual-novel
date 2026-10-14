
import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = sessionStorage.getItem('token');

      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get('/auth/me');

        if (active) {
          setUser(response.data.user);
        }
      } catch {
        if (active) {
          sessionStorage.removeItem('token');
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });

    const { token, user: loggedInUser } = response.data;

    sessionStorage.setItem('token', token);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const register = async (formData) => {
    const response = await api.post(
      '/auth/register',
      formData
    );

    return response.data;
  };

  const updateUser = (updatedUser) => {
    if (!updatedUser || typeof updatedUser !== 'object') {
      return;
    }

    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      if (
        Number(currentUser.user_id) !==
        Number(updatedUser.user_id)
      ) {
        return currentUser;
      }

      return {
        ...currentUser,
        ...updatedUser
      };
    });
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: Boolean(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}
