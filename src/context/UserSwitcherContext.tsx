
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CurrentUser } from '@/types/supabase';

interface UserSwitcherContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  showUserSwitcher: boolean;
  setShowUserSwitcher: (show: boolean) => void;
  // Adding the missing properties
  switchUser: (role: CurrentUser['role']) => void;
  isUserSwitcherOpen: boolean;
  toggleUserSwitcher: () => void;
  closeUserSwitcher: () => void;
}

const UserSwitcherContext = createContext<UserSwitcherContextType | undefined>(undefined);

export const UserSwitcherProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  // Function to switch user based on role
  const switchUser = (role: CurrentUser['role']) => {
    // Create a mock user with the selected role
    const mockedUser: CurrentUser = {
      id: `mock-${role}-${Date.now()}`, // Generate a unique ID
      role: role,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`, // Capitalize role name
      email: `${role}@example.com`,
      avatar_url: null
    };
    
    setCurrentUser(mockedUser);
    closeUserSwitcher();
  };

  // Toggle user switcher menu
  const toggleUserSwitcher = () => {
    setIsUserSwitcherOpen(prev => !prev);
  };

  // Close user switcher menu
  const closeUserSwitcher = () => {
    setIsUserSwitcherOpen(false);
  };

  return (
    <UserSwitcherContext.Provider 
      value={{ 
        currentUser, 
        setCurrentUser, 
        showUserSwitcher, 
        setShowUserSwitcher,
        switchUser,
        isUserSwitcherOpen,
        toggleUserSwitcher,
        closeUserSwitcher
      }}
    >
      {children}
    </UserSwitcherContext.Provider>
  );
};

export const useUserSwitcher = () => {
  const context = useContext(UserSwitcherContext);
  
  if (context === undefined) {
    throw new Error('useUserSwitcher must be used within a UserSwitcherProvider');
  }
  
  return context;
};
