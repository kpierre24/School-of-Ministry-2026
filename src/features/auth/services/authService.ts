import { googleSignIn, logout as firebaseLogout } from './firebaseAuth';

let cachedAccessToken: string | null = null;

export const authService = {
  signIn: async () => {
    const result = await googleSignIn();
    if (result) {
      cachedAccessToken = result.accessToken;
    }
    return result;
  },
  
  getAccessToken: () => cachedAccessToken,
  
  logout: async () => {
    await firebaseLogout();
    cachedAccessToken = null;
  }
};
