# Phase 1 Action Plan — Content System & Monetization

## ✅ What's Complete (Phase 0)

- ✅ Authentication & sessions
- ✅ Role-based access control
- ✅ Creator onboarding flow
- ✅ Admin creator management
- ✅ Database foundation (users, creator_profiles, kyc_verifications)

## 🎯 Next Priority: Content System (Roadmap Checkpoint #2)

**Why this first:**
- Core product feature (posts are the platform's foundation)
- Required before subscriptions make sense
- Enables monetization (PPV, gating)
- Feeds into entitlements engine

---

## Step 1: Database Schema for Content (30 min)

### Tables to Create

1. **`posts`** - Post metadata
   - id, creator_id, content (text), visibility_type, price_cents, created_at, updated_at
   - visibility_type: 'free' | 'subscriber' | 'ppv'

2. **`media_assets`** - Media files
   - id, post_id, file_url, file_type, file_size, thumbnail_url, processing_status
   - file_type: 'image' | 'video'
   - processing_status: 'pending' | 'processing' | 'completed' | 'failed'

3. **`entitlements`** - Access control
   - id, user_id, post_id, entitlement_type, purchased_at, expires_at
   - entitlement_type: 'subscription' | 'ppv_purchase' | 'tip'

4. **`subscriptions`** - Fan subscriptions
   - id, fan_id, creator_id, tier_name, price_cents, status, started_at, expires_at
   - status: 'active' | 'canceled' | 'expired'

5. **`transactions`** - Payment records
   - id, user_id, creator_id, amount_cents, transaction_type, status, created_at
   - transaction_type: 'subscription' | 'ppv' | 'tip'
   - status: 'pending' | 'completed' | 'failed' | 'refunded'

6. **`ledger_entries`** - Append-only earnings ledger
   - id, creator_id, transaction_id, amount_cents, platform_fee_cents, net_amount_cents, description, created_at

### SQL Schema File
Create: `lib/db-schema-content.sql`

---

## Step 2: Content API Endpoints (2-3 hours)

### Creator Endpoints
- `POST /api/creators/posts` - Create post
- `GET /api/creators/posts` - List creator's posts
- `PUT /api/creators/posts/[postId]` - Update post
- `DELETE /api/creators/posts/[postId]` - Delete post
- `POST /api/creators/posts/[postId]/media` - Upload media

### Fan Endpoints
- `GET /api/feed` - Get feed (with access control)
- `GET /api/posts/[postId]` - Get single post (with access check)
- `POST /api/posts/[postId]/unlock` - Unlock PPV post (mock payment)

### Admin Endpoints
- `GET /api/admin/posts` - List all posts
- `POST /api/admin/posts/[postId]/disable` - Disable post

---

## Step 3: Media Upload System (2-3 hours)

### Local Development (Phase 1)
- File upload to `public/uploads/` (or similar)
- Basic image validation
- Store file paths in database
- Generate thumbnails (optional for MVP)

### Future (Phase 2+)
- GCS signed upload URLs
- Image processing pipeline
- Video transcoding
- CDN delivery

### Files to Create
- `app/api/upload/route.ts` - Upload endpoint
- `lib/media.ts` - Media utilities
- `lib/upload.ts` - Upload handling

---

## Step 4: Feed & Access Control (2-3 hours)

### Entitlements Engine
- Check if user has access to post
- Subscription check
- PPV purchase check
- Free post access

### Feed Logic
- Show free posts to everyone
- Show subscriber posts to subscribers
- Show PPV posts only if purchased
- Order by created_at DESC

### Files to Create
- `lib/entitlements.ts` - Access control logic
- `app/api/feed/route.ts` - Feed endpoint

---

## Step 5: Frontend - Creator Post Creation (2-3 hours)

### Pages/Components
- `/creator/posts/new` - Create post form
- `/creator/posts` - List creator's posts
- Post creation form with:
  - Text content
  - Media upload
  - Visibility selection (free/subscriber/PPV)
  - Price input (for PPV)

---

## Step 6: Frontend - Fan Feed (2-3 hours)

### Pages/Components
- `/feed` - Main feed page
- Post card component
- Media display (images)
- "Unlock PPV" button
- Access denied overlay

---

## Step 7: Mock Payments (1-2 hours)

### Subscription Mock
- `POST /api/subscriptions` - Create subscription
- Mock CCBill flow
- Update entitlements
- Create transaction record
- Add ledger entry

### PPV Unlock Mock
- `POST /api/posts/[postId]/unlock` - Unlock PPV
- Mock payment
- Create entitlement
- Create transaction
- Add ledger entry

---

## Step 8: Ledger System (1 hour)

### Append-Only Ledger
- Every transaction creates ledger entry
- Calculate platform fees (e.g., 20%)
- Net amount to creator
- No balance updates - calculate from ledger

### Files to Create
- `lib/ledger.ts` - Ledger utilities
- `app/api/creators/earnings/route.ts` - Get earnings

---

## Implementation Order (Recommended)

### Week 1: Foundation
1. ✅ Database schema (Step 1)
2. ✅ Content API endpoints (Step 2)
3. ✅ Media upload (basic) (Step 3)
4. ✅ Entitlements engine (Step 4)

### Week 2: Frontend & Payments
5. ✅ Creator post creation UI (Step 5)
6. ✅ Fan feed UI (Step 6)
7. ✅ Mock payments (Step 7)
8. ✅ Ledger system (Step 8)

---

## Quick Start Commands

```bash
# 1. Create content schema
docker exec -i fanhouse-postgres psql -U fanhouse -d fanhouse_db < lib/db-schema-content.sql

# 2. Test API endpoints
# Use Postman or curl to test

# 3. Start building frontend
npm run dev
```

---

## Success Criteria

After completing this phase, you should have:
- ✅ Creators can create posts with media
- ✅ Posts can be free, subscriber-only, or PPV
- ✅ Fans can view feed with proper access control
- ✅ Fans can subscribe (mock)
- ✅ Fans can unlock PPV (mock)
- ✅ All transactions recorded in ledger
- ✅ Creator earnings calculated from ledger

---

## Next After Content System

1. **Real-time features** (Ably integration)
2. **Notifications** (Knock integration)
3. **Persona integration** (if not done)
4. **Media pipeline** (GCS, processing)
5. **Real payments** (CCBill integration)

---

## Files to Create (Summary)

### Database
- `lib/db-schema-content.sql`

### API Routes
- `app/api/creators/posts/route.ts`
- `app/api/creators/posts/[postId]/route.ts`
- `app/api/creators/posts/[postId]/media/route.ts`
- `app/api/feed/route.ts`
- `app/api/posts/[postId]/route.ts`
- `app/api/posts/[postId]/unlock/route.ts`
- `app/api/subscriptions/route.ts`
- `app/api/creators/earnings/route.ts`
- `app/api/admin/posts/route.ts`

### Utilities
- `lib/entitlements.ts`
- `lib/ledger.ts`
- `lib/media.ts`
- `lib/upload.ts`

### Frontend Pages
- `app/creator/posts/new/page.tsx`
- `app/creator/posts/page.tsx`
- `app/feed/page.tsx`

### Components
- `app/components/PostCard.tsx`
- `app/components/MediaUpload.tsx`

---

## Estimated Time: 12-16 hours

This gets you a working content system with monetization. Perfect foundation for Phase 1 MVP!

