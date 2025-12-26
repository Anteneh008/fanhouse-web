// User types matching the database schema
export type UserRole = 'fan' | 'creator' | 'admin';
export type CreatorStatus = 'pending' | 'approved' | 'rejected' | null;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  creatorStatus: CreatorStatus;
  createdAt: Date;
}

// JWT payload structure
export interface JWTPayload {
  userId: string;
  role: UserRole;
  creatorStatus: CreatorStatus;
}

// User without sensitive data (for client responses)
export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  creatorStatus: CreatorStatus;
  createdAt: Date;
}

