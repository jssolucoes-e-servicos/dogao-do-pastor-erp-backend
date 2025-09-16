export interface IUserResponse {
  id: string;
  churhId: string;
  name: string;
  genre: string;
  birth: string;
  photo: string;
  email: string;
  username: string;
  password: string;
  loginAttempts: number;
  statsLogin: string;
  inRecovery: boolean;
  isAdmin: boolean;
  TwoFactorAuthenticationActive: boolean;
  church: {
    id: string;
    name: string;
    fantasy: string;
    image: string;
  };
  permitChurch: boolean;
  permitEAD: boolean;
  permitEAD_CMS: boolean;
  permitPortal: boolean;
  dizimist: boolean;
  member: boolean;
  singnedAt: Date | string;
}
