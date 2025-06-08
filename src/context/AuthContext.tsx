import { createContext, Dispatch, SetStateAction } from 'react';

// Define la interfaz para el contexto
interface AuthContextType {
  userId: string | null;
  setUserId: Dispatch<SetStateAction<string | null>>;
}

// Crea el contexto con un valor inicial que respete los tipos
const AuthContext = createContext<AuthContextType>({
  userId: null,
  setUserId: () => {},
});

export default AuthContext;
