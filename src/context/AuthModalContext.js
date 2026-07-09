import { createContext, useContext, useState, useCallback } from 'react';

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [state, setState] = useState({ open: false, message: '' });

  // Call this anywhere a guest tries a protected action:
  //   if (!user) { requireAuth('Please sign in to like prompts.'); return; }
  const requireAuth = useCallback((message = 'Please sign in to continue.') => {
    setState({ open: true, message });
    return false;
  }, []);

  const closeAuthModal = useCallback(() => {
    setState(s => ({ ...s, open: false }));
  }, []);

  return (
    <AuthModalContext.Provider value={{ ...state, requireAuth, closeAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export const useAuthModal = () => useContext(AuthModalContext);
