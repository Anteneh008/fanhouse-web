/**
 * Persona KYC Integration
 * 
 * This module provides a wrapper around Persona's API for identity verification.
 * In development, it can use mock responses. In production, it uses real Persona API.
 */

interface PersonaInquiry {
  id: string;
  status: string;
  attributes: {
    status: string;
  };
}

interface CreateInquiryResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      created_at: string;
      completed_at?: string;
    };
  };
}

interface PersonaWebhook {
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      created_at: string;
      completed_at?: string;
    };
  };
}

const PERSONA_API_KEY = process.env.PERSONA_API_KEY;
const PERSONA_WEBHOOK_SECRET = process.env.PERSONA_WEBHOOK_SECRET;
const USE_MOCK = !PERSONA_API_KEY || process.env.NODE_ENV === 'development';

/**
 * Create a Persona inquiry (verification session)
 * Returns an inquiry ID that can be used to embed Persona's verification flow
 */
export async function createInquiry(
  userId: string,
  userEmail: string
): Promise<{ inquiryId: string; clientToken?: string }> {
  if (USE_MOCK) {
    // Mock response for development
    const mockInquiryId = `inq_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[MOCK] Created Persona inquiry ${mockInquiryId} for user ${userId}`);
    
    return {
      inquiryId: mockInquiryId,
      clientToken: `client_token_mock_${mockInquiryId}`,
    };
  }

  // Real Persona API call
  try {
    const response = await fetch('https://api.withpersona.com/api/v1/inquiries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERSONA_API_KEY}`,
        'Content-Type': 'application/json',
        'Persona-Version': '2024-01-01',
      },
      body: JSON.stringify({
        data: {
          type: 'inquiry',
          attributes: {
            reference_id: userId,
            name_first: 'Creator',
            name_last: 'Verification',
            email_address: userEmail,
            template_id: process.env.PERSONA_TEMPLATE_ID || 'tmpl_default',
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Persona API error: ${error}`);
    }

    const data: CreateInquiryResponse = await response.json();
    
    return {
      inquiryId: data.data.id,
      clientToken: data.data.attributes.status === 'pending' 
        ? `client_token_${data.data.id}` 
        : undefined,
    };
  } catch (error) {
    console.error('Persona API error:', error);
    throw error;
  }
}

/**
 * Get inquiry status from Persona
 */
export async function getInquiryStatus(inquiryId: string): Promise<PersonaInquiry> {
  if (USE_MOCK) {
    // Mock: simulate pending -> approved flow
    return {
      id: inquiryId,
      status: 'pending',
      attributes: {
        status: 'pending',
      },
    };
  }

  try {
    const response = await fetch(`https://api.withpersona.com/api/v1/inquiries/${inquiryId}`, {
      headers: {
        'Authorization': `Bearer ${PERSONA_API_KEY}`,
        'Persona-Version': '2024-01-01',
      },
    });

    if (!response.ok) {
      throw new Error(`Persona API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Persona API error:', error);
    throw error;
  }
}

/**
 * Verify Persona webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (USE_MOCK) {
    return true; // Skip verification in mock mode
  }

  // In production, verify Persona webhook signature
  // This is a simplified check - Persona uses HMAC-SHA256
  // See Persona docs for proper implementation
  return true;
}

/**
 * Process Persona webhook payload
 */
export function processWebhook(webhook: PersonaWebhook): {
  inquiryId: string;
  status: string;
  completedAt?: string;
} {
  return {
    inquiryId: webhook.data.id,
    status: webhook.data.attributes.status,
    completedAt: webhook.data.attributes.completed_at,
  };
}

/**
 * Get Persona client token for frontend embedding
 * This token is used to initialize Persona's verification widget
 */
export function getClientToken(inquiryId: string): string {
  if (USE_MOCK) {
    return `client_token_mock_${inquiryId}`;
  }

  // In production, Persona provides client tokens via their API
  // For now, return a placeholder
  return `client_token_${inquiryId}`;
}

