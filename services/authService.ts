import { UserProfile, FopGroup, TaxRate } from "../types";
import { dbService } from "./dbService";

export const authService = {
  // Simulate Google Login
  loginWithGoogle: async (): Promise<UserProfile> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if profile exists, otherwise create a shell one
        let profile = dbService.getProfile();
        
        // If it's the default shell, update with "Google" data
        if (!profile.email) {
          profile = {
            ...profile,
            name: "Тарас Шевченко", // Simulated Google User Name
            email: "taras@example.com",
            photoUrl: "https://lh3.googleusercontent.com/a/default-user",
          };
          dbService.saveProfile(profile);
        }
        
        resolve(profile);
      }, 1500); // Fake network delay
    });
  },

  logout: () => {
    localStorage.removeItem('taxify_profile');
    window.location.reload();
  },

  isAuthenticated: (): boolean => {
    const profile = dbService.getProfile();
    return !!profile.email; // Simple check
  }
};