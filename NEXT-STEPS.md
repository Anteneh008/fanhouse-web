# FanHouse — Next Steps Guide

## ✅ What We Just Built (Phase 0 - Checkpoint 1)

### Creator Onboarding System
- ✅ Extended database schema (`creator_profiles`, `kyc_verifications`)
- ✅ Creator application API (`POST /api/creators/apply`)
- ✅ Creator status API (`GET /api/creators/status`)
- ✅ Admin creator management (`/admin/creators`)
- ✅ Admin approval/rejection endpoints
- ✅ Creator application page (`/become-creator`)

### Database Tables Created
1. **creator_profiles** - Creator profile information
2. **kyc_verifications** - Identity verification status (Persona integration ready)

---

## 🎯 What to Do Next

### Immediate Next Steps (This Week)

#### 1. Test the Creator Onboarding Flow
```bash
# 1. Start your dev server
npm run dev

# 2. Create a test user account
# Go to http://localhost:3000/register

# 3. Apply to become a creator
# Go to http://localhost:3000/become-creator

# 4. As admin, approve the creator
# Go to http://localhost:3000/admin/creators
```

#### 2. Integrate Persona (Identity Verification)

**Option A: Use Persona Sandbox (Recommended)**
1. Sign up at https://withpersona.com
2. Get API keys from sandbox environment
3. Install Persona SDK:
   ```bash
   npm install @withpersona/node
   ```
4. Create webhook handler: `app/api/webhooks/persona/route.ts`
5. Update creator application flow to trigger Persona verification

**Option B: Mock Persona (For Development)**
- Create mock Persona responses
- Simulate verification states
- Document real integration for production

**Files to Create:**
- `lib/persona.ts` - Persona client wrapper
- `app/api/creators/verify/route.ts` - Start verification flow
- `app/api/webhooks/persona/route.ts` - Handle Persona webhooks

#### 3. Add Creator Dashboard
Create `/creator/dashboard` page showing:
- Application status
- Profile information
- Earnings (placeholder for now)
- Next steps (complete verification, etc.)

---

### Phase 0 Remaining Tasks (Weeks 0-2)

#### Infrastructure Setup
- [ ] Set up Redis (already in docker-compose.yml)
- [ ] Configure GCP project (or continue local)
- [ ] Set up Cloud Storage buckets (or use local storage)
- [ ] Configure environment variables for all services

#### Core Systems
- [ ] Complete Persona integration
- [ ] Set up event system (Pub/Sub or local event bus)
- [ ] Create audit logging system
- [ ] Add rate limiting middleware

---

### Phase 1 Tasks (Weeks 3-8) - MVP Build

#### Content System
- [ ] Create `posts` table
- [ ] Create `media_assets` table
- [ ] Build post creation API
- [ ] Build feed API
- [ ] Implement content gating (subscriber-only, PPV)

#### Payments
- [ ] Set up CCBill sandbox
- [ ] Create `subscriptions` table
- [ ] Create `transactions` table
- [ ] Create `ledger_entries` table (append-only)
- [ ] Build subscription API
- [ ] Build PPV unlock API
- [ ] Build tips API
- [ ] Handle CCBill webhooks

#### Media Pipeline
- [ ] Set up file upload endpoints
- [ ] Integrate with GCS (or local storage)
- [ ] Image processing (resize, thumbnails)
- [ ] Video transcoding setup (HLS)
- [ ] Signed URL generation for media

#### Messaging
- [ ] Create `threads` and `messages` tables
- [ ] Set up Ably integration
- [ ] Build DM API
- [ ] Implement paid messages
- [ ] Add presence indicators

#### Notifications
- [ ] Set up Knock.app
- [ ] Create notification system
- [ ] In-app notifications
- [ ] Email notifications (SFW only)

---

## 📋 Current File Structure

```
fanhouse-web/
├── app/
│   ├── api/
│   │   ├── auth/              ✅ Complete
│   │   ├── creators/
│   │   │   ├── apply/        ✅ Complete
│   │   │   └── status/       ✅ Complete
│   │   └── admin/
│   │       └── creators/     ✅ Complete
│   ├── become-creator/       ✅ Complete
│   ├── admin/
│   │   └── creators/         ✅ Complete
│   ├── login/                ✅ Complete
│   ├── register/             ✅ Complete
│   └── dashboard/            ✅ Complete
├── lib/
│   ├── auth.ts               ✅ Complete
│   ├── db.ts                 ✅ Complete
│   ├── types.ts              ✅ Extended
│   ├── db-schema.sql         ✅ Base schema
│   └── db-schema-extended.sql ✅ Creator tables
└── middleware.ts             ✅ Complete
```

---

## 🔧 Development Commands

```bash
# Start all services
docker-compose up -d

# Initialize database (if needed)
npm run db:init
# Then apply extended schema:
docker exec -i fanhouse-postgres psql -U fanhouse -d fanhouse_db < lib/db-schema-extended.sql

# Create admin user
npm run db:create-admin admin@example.com SecurePassword123

# Start dev server
npm run dev

# Access pgAdmin
# http://localhost:5050
# Email: admin@fanhouse.com
# Password: admin
```

---

## 📚 Key Files to Review

1. **`lib/db-schema-extended.sql`** - New database tables
2. **`app/api/creators/apply/route.ts`** - Creator application logic
3. **`app/admin/creators/page.tsx`** - Admin management UI
4. **`lib/types.ts`** - Extended TypeScript types

---

## 🚀 Recommended Order of Implementation

1. **Test current system** ✅
2. **Persona integration** (or mock) ← **Do this next**
3. **Creator dashboard** (status, profile)
4. **Content system** (posts, media)
5. **Payments** (CCBill, subscriptions)
6. **Messaging** (Ably, DMs)
7. **Notifications** (Knock)

---

## 💡 Important Notes

### Persona Integration
- Persona handles ID verification and age checks
- We store only `persona_inquiry_id` and status
- Never store raw ID documents
- Webhooks update verification status

### Creator Status Flow
```
fan → apply → pending → (Persona verification) → approved/rejected
```

### Admin Workflow
- Admins can approve/reject creators
- Rejection requires a reason (stored in KYC table)
- All actions should be logged (audit trail)

---

## 🐛 Troubleshooting

### Database Issues
```bash
# Check if tables exist
docker exec fanhouse-postgres psql -U fanhouse -d fanhouse_db -c "\dt"

# View creator profiles
docker exec fanhouse-postgres psql -U fanhouse -d fanhouse_db -c "SELECT * FROM creator_profiles;"
```

### API Issues
- Check browser console for errors
- Check server logs in terminal
- Verify JWT_SECRET is set in `.env.local`
- Verify DATABASE_URL is correct

---

## 📞 Next Actions

1. **Test the creator onboarding flow end-to-end**
2. **Set up Persona account** (or create mock)
3. **Build creator dashboard**
4. **Start planning content system** (posts, media)

You're making great progress! The foundation is solid. 🎉

