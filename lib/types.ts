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

// Content system types
export type PostVisibility = 'free' | 'subscriber' | 'ppv';
export type MediaType = 'image' | 'video';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'pending';
export type EntitlementType = 'subscription' | 'ppv_purchase' | 'tip' | 'free';
export type TransactionType = 'subscription' | 'ppv' | 'tip';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type LedgerEntryType = 'earnings' | 'payout' | 'refund' | 'adjustment';

export interface Post {
  id: string;
  creatorId: string;
  content: string | null;
  visibilityType: PostVisibility;
  priceCents: number;
  isPinned: boolean;
  isDisabled: boolean;
  disabledReason: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAsset {
  id: string;
  postId: string;
  fileUrl: string;
  fileType: MediaType;
  fileSize: number | null;
  mimeType: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  processingStatus: ProcessingStatus;
  processingError: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  fanId: string;
  creatorId: string;
  tierName: string;
  priceCents: number;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date | null;
  canceledAt: Date | null;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Entitlement {
  id: string;
  userId: string;
  postId: string | null;
  creatorId: string | null;
  entitlementType: EntitlementType;
  subscriptionId: string | null;
  transactionId: string | null;
  purchasedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  creatorId: string | null;
  postId: string | null;
  subscriptionId: string | null;
  amountCents: number;
  transactionType: TransactionType;
  status: TransactionStatus;
  paymentProvider: string;
  paymentProviderTransactionId: string | null;
  failureReason: string | null;
  refundedAt: Date | null;
  refundReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  creatorId: string;
  transactionId: string | null;
  amountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  description: string | null;
  entryType: LedgerEntryType;
  createdAt: Date;
}

export interface CreatorEarnings {
  totalEarningsCents: number;
  totalPayoutsCents: number;
  pendingEarningsCents: number;
}

// Post with creator and media
export interface PostWithDetails extends Post {
  creator: {
    id: string;
    email: string;
    displayName: string | null;
  };
  media: MediaAsset[];
  hasAccess: boolean; // Whether current user can view this post
}

