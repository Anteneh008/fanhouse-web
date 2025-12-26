// User types matching the database schema
export type UserRole = 'fan' | 'creator' | 'admin';
export type CreatorStatus = 'pending' | 'approved' | 'rejected' | null;
export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'failed';
export type VerificationType = 'kyc' | 'age_verification';

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

// Creator profile types
export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  subscriptionTierName: string;
  subscriptionPriceCents: number;
  isFreeProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// KYC verification types
export interface KYCVerification {
  id: string;
  userId: string;
  personaInquiryId: string | null;
  personaVerificationId: string | null;
  status: KYCStatus;
  verificationType: VerificationType;
  riskLevel: string | null;
  personaWebhookData: Record<string, unknown> | null;
  rejectionReason: string | null;
  verifiedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Creator application request
export interface CreatorApplicationRequest {
  displayName: string;
  bio?: string;
}

// Persona webhook payload (simplified)
export interface PersonaWebhookPayload {
  data: {
    id: string; // inquiry_id
    attributes: {
      status: string;
      statuses: Array<{
        status: string;
        createdAt: string;
      }>;
    };
  };
}

