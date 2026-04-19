import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUsersStore = create(
  persist(
    (set, get) => ({
      users: [], 
      
      /**
       * Adds a new user to the database
       */
      addUser: (user) => set((state) => ({
        users: [...state.users, {
          ...user,
          createdAt: new Date().toISOString(),
          onboarded: false, // Flag to check if they entered contact info
        }]
      })),

      /**
       * Regenerates password for an existing user
       */
      regeneratePassword: (userId, newTempPassword) => set((state) => ({
        users: state.users.map(u => 
          u.id === userId 
            ? { ...u, tempPassword: newTempPassword }
            : u
        )
      })),

      /**
       * Updates the user's data (e.g. for onboarding)
       */
      updateUser: (userId, updates) => set((state) => ({
        users: state.users.map(u => 
          u.id === userId 
            ? { ...u, ...updates }
            : u
        )
      })),

      /**
       * Attempt to find a user by their credentials
       */
      findUserByCredentials: (login, password) => {
        const { users } = get();
        // Since it's a SPA prototype, we store tempPassword for the first login checks
        return users.find(u => u.username === login && u.tempPassword === password);
      }
    }),
    {
      name: 'alfasvk-users',
    }
  )
);
