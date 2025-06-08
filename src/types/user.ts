export interface User {
  id: string; // Or number, depending on your backend response
  name: string;
  email: string;
  profilePicture?: string;
  preferences?: any; // Consider a more specific type if preferences structure is known
  hasCompletedPreferences: boolean;
}
