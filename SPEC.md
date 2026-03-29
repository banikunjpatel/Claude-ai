# ChampionKids — Product Specification

| Field | Value |
|---|---|
| Version | 1.0.0 |
| Status | Draft |
| Owner | Hiral Patel |
| Last Updated | 2026-03-25 |

## Changelog

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0.0 | 2026-03-25 | Hiral Patel | Initial draft |

---

## Glossary

| Term | Definition |
|---|---|
| Activity Card | The primary content unit — a single coaching activity with prompt, follow-up questions, and optional tip |
| Age Band | One of 6 age groupings (1–2, 3–4, 5–6, 7–8, 9–10, 11–12) used to tailor activity complexity |
| Coaching Prompt | The 2–4 sentence instruction shown to the parent describing how to run the activity |
| Skill Category | One of 7 skill domains: Communication, Leadership, Critical Thinking, Creativity, Resilience, Social Skills, Emotional Intelligence |
| Session | A single parent–child activity completion event |
| Streak | Consecutive days on which at least one activity was completed |
| Family Plan | A subscription tier covering up to 4 child profiles under one parent account |
| Entitlement | The resolved subscription access level granted to a parent account, regardless of payment platform |
| Daily Selection | The activity pre-selected by the engine for a specific child on a specific date |
| Age Band Calculation | Age band derived at runtime from date of birth — never stored as a fixed field |

## How to Read This Spec

- **Phase labels:** [P1] = MVP (Weeks 1–12), [P2] = Growth (Weeks 13–20), [P3] = Scale (Weeks 21–32)
- **Priority labels:** P0 = must-have for phase launch, P1 = should-have, P2 = could-have
- **`[DECISION REQUIRED: description]`** — an open decision that must be resolved before implementation begins
- Acceptance criteria are written to be testable and binary (pass/fail)

---

## Section 1: Product Vision & Goals

### 1.1 Mission

> "Help parents be the best coach they can for their kids, building the 21st century skills they need to thrive."

### 1.2 Problem Statement

Parents are the most present adults in a child's life, sharing approximately 80% of their child's waking hours. Yet most structured child-development tools are designed for educators, therapists, or specialist coaches — not for parents in the flow of daily life. The result: parents who want to invest in their child's development are left without accessible, bite-sized, practical tools that fit into a commute, a dinner table, or a bedtime routine.

Existing parenting apps focus on screen time management, educational content for children, or passive tracking. None address the coaching conversation — the parent-as-guide relationship that research consistently identifies as the primary driver of social-emotional and cognitive development in children aged 1–12.

### 1.3 Solution

ChampionKids delivers a daily 5-minute activity card to parents, tailored to each child's age band and skill focus. Each card contains a coaching prompt that parents read and act on immediately — no preparation, no materials, no expertise required. The parent guides a short conversation or activity with their child and marks it complete. Over time, the app tracks progress across 7 skill categories, building streaks, badges, and a visible record of development.

The experience works anywhere: in the car, at the dinner table, before bed. It demands five minutes per day, not a dedicated session. It positions the parent — not the app — as the coach.

### 1.4 Target Audience Personas

**Persona 1: The Time-Poor Parent (Primary)**
Sarah is a 34-year-old working mother of two (ages 4 and 7). She wants to be an intentional parent but rarely has more than 10 minutes of dedicated "teaching time" per day. She uses her phone for everything. She feels guilty that she isn't doing more to develop her children's emotional and social skills. She needs something that takes zero preparation and produces immediate results she can see.

**Persona 2: The Intentional Parent**
James is a 41-year-old father of one (age 9) who has read several parenting books and wants structured, age-appropriate activities. He is willing to pay for quality content. He wants to track progress and see his child's development over time. He values the coaching framing — he sees himself as a guide, not just a caregiver.

**Persona 3: The Admin / Content Team**
Alex is a content editor who writes and reviews activity cards. They need a simple CMS-style admin panel to draft, review, and publish activities, view content performance, and manage the growing library without engineering support.

### 1.5 Success Metrics by Phase

**Phase 1 (MVP)**
- Day-7 retention: ≥ 40% of new signups return on day 7
- Activity completion rate: ≥ 60% of daily selected activities are completed
- Trial-to-paid conversion: ≥ 15% of trial users convert within 7 days
- Time to first activity: ≤ 3 minutes from app download to first activity started

**Phase 2 (Growth)**
- Day-30 retention: ≥ 25%
- Weekly active parents: 3+ activities per week
- Push notification opt-in rate: ≥ 55%
- Referral conversion rate: ≥ 10% of referred users convert to paid

**Phase 3 (Scale)**
- Monthly churn rate: ≤ 5%
- NPS score: ≥ 50
- AI personalisation lift: ≥ 10% improvement in 7-day activity completion rate vs. rule-based baseline

### 1.6 Out of Scope (All Phases Unless Stated)

- Real-time video or audio calls between parent and coach
- Child-facing login or child-operated device flow
- Direct child–child social interaction
- Classroom or school integration
- AI-generated activity content (content is human-authored; AI is used for selection/ranking in Phase 3 only)
- Live chat or synchronous support
- Physical product integration

---

## Section 2: User Types & Personas

### 2.1 Parent (Primary User)

**Description:** The adult who creates an account, sets up child profiles, and uses the app daily.

**Authentication:** Email/password + Google OAuth + Apple OAuth via Supabase Auth

**Permissions:**
- Create, read, update, delete their own account
- Create, read, update, delete child profiles linked to their account (subject to plan limits)
- Access the full activity library (subject to subscription tier)
- View progress data for their children
- Manage subscription and billing
- Set notification preferences
- Delete their account (triggers soft delete + anonymisation)

**Usage context:** Mobile-first, often one-handed, frequently interrupted. Interactions must be completable in under 2 minutes without deep focus.

**Plan limits:**
- Free / Trial: 1 child profile, limited activity access (defined in Section 4.6)
- Pro Monthly / Pro Annual: 1 child profile, full access
- Family Plan: up to 4 child profiles, full access

### 2.2 Child (Beneficiary — No Login)

**Description:** The child the parent is coaching. Never authenticates directly. All data is collected through the parent account.

**Data stored per child profile:**
- Display name (parent-provided)
- Date of birth (used to calculate age band dynamically at runtime)
- Avatar selection (preset illustrations — no photo upload)
- Skill focus preferences (up to 3 selected by parent)
- Activity completion history

**Privacy:** No direct data is collected from the child. All child profile data is created and managed by the parent. COPPA (USA) and UK GDPR-K compliance is maintained by ensuring the child never directly provides data, consents, or interacts with data collection mechanisms. See Section 12.1 for full compliance details.

**Age band calculation:** Always derived at query time from `date_of_birth`. Never stored as a fixed field. This ensures the child's age band automatically advances as they grow without any manual update.

### 2.3 Admin (Internal Web Dashboard)

**Description:** Internal team members who manage content, users, subscriptions, and analytics.

**Authentication:** Separate auth flow from parent accounts. Staff role enforced via RBAC.

**Roles and Permission Matrix:**

| Permission | Super Admin | Content Editor | Support Agent |
|---|---|---|---|
| Create / edit / archive activities | ✓ | ✓ | — |
| Publish activities | ✓ | — | — |
| Manage skill categories & age bands | ✓ | — | — |
| View all user accounts | ✓ | — | ✓ |
| Override subscription status | ✓ | — | ✓ |
| View analytics dashboard | ✓ | ✓ | — |
| Manage feature flags | ✓ | — | — |
| Manage admin user accounts | ✓ | — | — |
| View content performance | ✓ | ✓ | — |

---

## Section 3: Information Architecture

### 3.1 Mobile App (React Native) — Screen Hierarchy

```
App
├── Unauthenticated Stack
│   ├── SplashScreen
│   ├── OnboardingScreen1 (Welcome)
│   ├── OnboardingScreen2 (Parent name)
│   ├── OnboardingScreen3 (Add first child)
│   ├── OnboardingScreen4 (Select skill focuses)
│   ├── OnboardingComplete (Trial activated)
│   ├── LoginScreen
│   ├── SignUpScreen
│   ├── ForgotPasswordScreen
│   └── ResetPasswordScreen (deep link)
│
└── Authenticated — Bottom Tab Navigator
    ├── Today Tab
    │   ├── TodayScreen
    │   ├── ActivityDetailScreen
    │   └── ActivityCompleteScreen
    │
    ├── Library Tab
    │   ├── LibraryScreen
    │   ├── ActivityDetailScreen (shared)
    │   └── SavedActivitiesScreen [P2]
    │
    ├── Progress Tab
    │   ├── ProgressScreen
    │   ├── ProgressHistoryScreen
    │   └── BadgeDetailScreen [P2]
    │
    └── Profile Tab
        ├── ProfileScreen
        ├── EditProfileScreen
        ├── AddChildScreen / EditChildScreen
        ├── SubscriptionScreen
        ├── NotificationSettingsScreen [P2]
        └── HelpScreen
```

**Modals / Overlays (accessible from any screen):**
- PaywallSheet (bottom sheet, triggered contextually)
- UpgradePromptModal
- OnboardingTooltips (first-time use hints)
- ChildSwitcherSheet [P2]

### 3.2 Web App (Next.js — Parent Portal)

```
/                       → Marketing homepage (out of spec scope)
/login                  → Login page
/signup                 → Sign-up page
/forgot-password        → Forgot password
/reset-password         → Reset password (token via URL param)
/app/today              → Today's activity (mirrors Today tab)
/app/library            → Activity library (mirrors Library tab)
/app/progress           → Progress (mirrors Progress tab)
/app/profile            → Profile & settings
/app/children/add       → Add child form
/app/children/:id/edit  → Edit child form
/app/subscribe          → Plan selection + Stripe Checkout redirect
/app/subscription/success  → Post-payment confirmation
/app/subscription/cancel   → User cancelled checkout
/app/subscription/manage   → Stripe customer portal redirect
```

### 3.3 Admin Dashboard (Next.js — separate deployment)

```
/admin/login
/admin/dashboard
/admin/content/activities
/admin/content/activities/new
/admin/content/activities/:id/edit
/admin/content/categories
/admin/users
/admin/users/:id
/admin/analytics/retention
/admin/analytics/revenue
/admin/analytics/content
/admin/settings/feature-flags
/admin/settings/notification-templates  [P2]
```

---

## Section 4: Feature Specifications

### 4.1 Onboarding Flow [P1]

**Description:** A linear 4-step flow that collects the minimum data required to serve the first daily activity, then activates the 7-day free trial. Runs once per account on first launch.

**User Story:** As a new parent, I want to set up my account and my child's profile in under 3 minutes so that I can start using the app immediately without friction.

**Flow:**

| Step | Screen | Fields Collected | Validation |
|---|---|---|---|
| 1 | Welcome | — (CTA only) | — |
| 2 | Parent name | `full_name` (text input) | Required, 2–50 characters |
| 3 | Add first child | `display_name` (text), `date_of_birth` (date picker) | Name required (2–30 chars); DOB required, must produce an age between 1–12 years |
| 4 | Skill focuses | Up to 3 selected from 7 skill categories | Minimum 1 selection required |
| 5 | Trial activated | Confirmation screen | — |

**Acceptance Criteria:**
- [ ] Completing all 4 steps creates a user account, a child profile, and a `subscriptions` record with `plan_type = 'trial'` and `trial_ends_at = now() + 7 days`
- [ ] If a user exits mid-onboarding and returns, they resume at the step they left (state persisted locally)
- [ ] A child with a DOB that produces an age outside 1–12 years displays an inline validation error and cannot proceed
- [ ] The back button is available on steps 2–4; pressing back does not clear already-entered data
- [ ] On completion, the app navigates to TodayScreen and the first daily activity is immediately available

**Edge Cases:**
- User closes app after step 3 but before step 4: On return, they see step 4 pre-populated with the child data already saved
- User enters a DOB that makes the child exactly 12 years old today: Valid — maps to 11–12 age band
- User enters a DOB that makes the child 13 or older: Validation error — "ChampionKids is designed for children aged 1 to 12"
- Network failure during account creation: Show error toast, allow retry; do not create duplicate accounts

**Analytics Events:**
- `onboarding_started`
- `onboarding_step_completed` (with `step_number` property: 1–4)
- `onboarding_completed`
- `onboarding_abandoned` (fired if user exits without completing, on next app open)

---

### 4.2 Daily Activity Engine [P1]

**Description:** A server-side engine that selects one activity per child per day and serves it as the "Today" card. In Phase 1, selection is rule-based. In Phase 3, it is augmented by ML personalisation.

**User Story:** As a parent, I want to open the app each day and immediately see a relevant activity for my child so that I don't have to think about what to do.

**Selection Algorithm (Phase 1 — Rule-Based):**

Inputs:
- Child's age band (calculated from DOB at runtime)
- Child's skill focus preferences (ordered list of up to 3)
- Child's activity completion history (activity IDs completed in last 90 days)
- Day of week

Logic:
1. Filter activity library to `status = 'published'` and `age_band = child's current age band`
2. Exclude any activity completed by this child in the last 30 days (deduplication window)
3. Weight candidates: activities matching the child's first skill focus get 3× weight, second focus 2×, third focus 1×, all others 0.5×
4. Select one activity via weighted random selection
5. Store the result in `daily_activity_selections` with `selected_for_date = today` and `was_shown = false`

**Pre-generation:** A nightly cron job (runs at 02:00 UTC) pre-generates the next day's selection for all active child profiles. This ensures zero latency on app open.

**Fallback:** If all activities for a child's age band have been seen within the deduplication window, reset the deduplication window to 14 days and re-select. If still insufficient (library too small), select from all time with a note to admin.

**Activity Card Anatomy:**

| Field | Description | Example |
|---|---|---|
| Title | Short, engaging title | "The 'What If' Game" |
| Age band tag | Displays the age band | "Ages 7–8" |
| Skill category tag | Displays the skill | "Critical Thinking" |
| Time estimate | Always "~5 min" | "~5 min" |
| Coaching prompt | 2–4 sentence parent instruction | "Ask your child to pick any everyday object nearby. Then challenge them: what are 5 unusual ways you could use it?" |
| Follow-up questions | 2–3 deepening questions | "Which idea surprised you most?", "How did you come up with that?" |
| Parent tip | Optional brief guidance | "Don't evaluate their ideas — the stranger the better!" |
| Variation | Optional extension/simplification | "For younger kids in this band, just ask for 3 ideas." |

**Completion Flow:**
1. Parent taps "We did this!"
2. Optional: parent selects an emoji reaction (😊 😂 🤩 😮 🤔)
3. `activity_completions` record created; streak updated; badges checked [P2]
4. Celebration animation plays
5. Screen shows: current streak count, "Done for today" CTA, "Do another from the library" CTA

**Acceptance Criteria:**
- [ ] Every active child profile has exactly one `daily_activity_selections` record per day
- [ ] The same activity is never shown to the same child twice within 30 days (unless library is exhausted — see fallback)
- [ ] A child who has completed today's activity cannot complete it again today (complete button disabled/hidden after completion)
- [ ] Pre-generation cron runs without failure for any child profile with a valid age band
- [ ] Completing an activity increments the streak counter if it's the first completion of that calendar day in the parent's local timezone

**Edge Cases:**
- Child's birthday falls today, moving them to a new age band: next day's pre-generation uses the new age band
- Activity is archived by admin after pre-generation: the `/activities/today/:childId` endpoint detects the archived activity and generates a replacement on the fly
- Parent completes an activity, then deletes the child profile: completion records are soft-deleted with the child profile

---

### 4.3 Activity Library [P1]

**Description:** A browsable, searchable catalogue of all published activities.

**User Story:** As a parent, I want to browse and search all available activities so that I can choose something different when the daily card doesn't suit the moment.

**Features:**
- Filter by skill category (7 chips, multi-select OR)
- Filter by age band (6 options, single-select — defaults to current child's age band)
- Full-text search on activity title and tags
- Infinite scroll / pagination (20 activities per page, cursor-based)
- Activity detail view (same component as Today card)
- Save / favourite activities [P2]

**Access rules:**
- Free/expired tier: see library structure and titles, but attempting to start an activity from the library triggers the PaywallSheet. Today's pre-selected card is always accessible regardless of tier.
- Pro/Family tier: full access

**Acceptance Criteria:**
- [ ] Filters apply immediately without a loading state > 300ms (cached response)
- [ ] Search returns results within 500ms for queries of 3+ characters
- [ ] "No results" empty state shown when filters/search yield 0 activities
- [ ] Free-tier users can see activity titles and descriptions but are blocked from starting library activities via PaywallSheet
- [ ] Today's daily activity is accessible from the library detail view regardless of tier

---

### 4.4 Child Profile Management [P1/P2]

**Description:** Parents can create and manage child profiles. Phase 1 supports one child. Phase 2 supports up to 4 under the Family Plan.

**User Story:** As a parent, I want to set up accurate profiles for each of my children so that each child gets age-appropriate activities matched to what I want to develop in them.

**Fields per child profile:**

| Field | Type | Required | Notes |
|---|---|---|---|
| display_name | string | Yes | 2–30 characters |
| date_of_birth | date | Yes | Must produce age 1–12; never stored as age band |
| avatar_id | enum | Yes | 8 preset illustrations; no photo upload |
| skill_focuses | array (up to 3) | Yes (min 1) | FK to skill_categories |

**Plan limits:**
- Trial / Pro Monthly / Pro Annual: 1 child profile
- Family Plan: up to 4 child profiles
- Attempting to add a 2nd child without Family Plan triggers PaywallSheet with Family Plan highlighted [P2]

**Deletion:** Soft-delete. Child profile and completion history are retained for 90 days post-deletion, then anonymised.

**Acceptance Criteria:**
- [ ] Age band is recalculated correctly on every API call (not stored)
- [ ] Deleting a child profile does not affect the parent account or other child profiles
- [ ] A parent on Family Plan can add up to 4 children; adding a 5th returns a `CHILD_LIMIT_REACHED` error
- [ ] Changing a child's DOB (e.g., parent entered wrong year) immediately changes the age band used for next daily selection [P2 — edit DOB feature]

---

### 4.5 Progress Tracking [P1/P2]

**Description:** Visualises a child's engagement and skill development over time.

**User Story:** As a parent, I want to see how consistently my child is developing each skill so that I feel motivated to keep going and can see what areas to focus on.

**Phase 1 — Basic Progress:**
- Total activities completed (lifetime count)
- Activities by skill category (horizontal bar chart, count per skill)
- Current streak (days)
- Longest streak (days)

**Phase 2 — Enhanced Progress:**
- Streak calendar (GitHub-style heatmap by day)
- Badge wall (awarded badges with date earned)
- Per-skill completion trend (week-over-week)
- Weekly email digest (opt-in): "This week with [child name]" — activities completed, streak status, badge progress

**Streak definition:** A streak increments by 1 each calendar day during which at least one activity is completed. The calendar day boundary is determined by the parent's local timezone (stored on the device/profile). A streak is broken when no activity is completed on a full calendar day.

**Acceptance Criteria:**
- [ ] Streak counter increments immediately upon first activity completion of the day
- [ ] Streak does not increment for a second completion on the same calendar day
- [ ] Streak resets to 0 if no activity is completed on a full calendar day (checked at midnight cron)
- [ ] Skill breakdown bar chart correctly counts completions per skill for the selected child
- [ ] Progress data is never mixed between different child profiles

---

### 4.6 Subscription & Paywall [P1]

**Description:** A freemium subscription model with a 7-day free trial (no credit card required) and three paid plans.

**User Story:** As a parent, I want to try the app for free before committing so that I can evaluate whether it works for my family.

**Plan Matrix:**

| Plan | Price | Children | Trial eligible | Payment platform |
|---|---|---|---|---|
| Trial | Free for 7 days | 1 | — | N/A |
| Pro Monthly | £4.99/month | 1 | No | Stripe / Apple IAP / Google Play |
| Pro Annual | £39.99/year | 1 | No | Stripe / Apple IAP / Google Play |
| Family Plan | £7.99/month | Up to 4 | No | Stripe / Apple IAP / Google Play |

**Free / Expired Tier Limits:**
- 3 activities per week accessible from the library
- Today's daily card always accessible (unrestricted)
- Progress history: last 7 days only
- No badge access [P2]
- No multi-child profiles [P2]

**Paywall Trigger Points:**
- Attempting to access a library activity beyond the weekly free limit
- Attempting to add a 2nd child profile [P2]
- Accessing progress history beyond 7 days
- Attempting to access badge wall [P2]
- Accessing saved activities [P2]

**Platform Payment Paths:**

*Web (Stripe):*
1. Parent clicks upgrade → Stripe Checkout session created server-side
2. Parent completes payment on Stripe-hosted page
3. Stripe sends `checkout.session.completed` webhook → entitlement updated
4. Parent redirected to `/app/subscription/success`
5. Cancellation / management via Stripe Customer Portal

*iOS (Apple IAP / StoreKit 2):*
1. Parent selects plan in-app → `SKProduct` loaded via StoreKit 2
2. Purchase initiated → `Transaction` object received on success
3. App sends transaction to `/api/v1/subscriptions/validate-iap`
4. Server validates with App Store Server API → entitlement updated
5. Subscription management via native iOS Settings / Manage Subscriptions

*Android (Google Play Billing v5+):*
1. Parent selects plan in-app → `ProductDetails` loaded
2. `launchBillingFlow` initiated → `Purchase` object received
3. App sends purchase token to `/api/v1/subscriptions/validate-google-play`
4. Server validates with Google Play Developer API → entitlement updated
5. Subscription management via Google Play Store

**Entitlement Architecture:**
- Single `subscriptions` table in PostgreSQL is the source of truth
- Webhooks from all three platforms update this table
- Every protected API call checks the `subscriptions` table via an entitlement middleware
- Mobile apps cache the entitlement status locally (TTL: 1 hour) for offline access. On reconnect, entitlement is re-fetched and cache refreshed.

**Cancellation & Expiry:**
- When a subscription is cancelled, `status` is set to `cancelled` but access continues until `current_period_end`
- After `current_period_end`, status moves to `expired` and free-tier limits apply
- A 3-day grace period is applied for payment failures before access is restricted (`status = 'grace'`)
- Reactivation restores full access immediately and resets period dates

**Acceptance Criteria:**
- [ ] Trial starts automatically on onboarding completion with no payment required
- [ ] Trial end is exactly 7 days from `trial_started_at` timestamp
- [ ] Stripe, Apple IAP, and Google Play purchases all result in an `active` entitlement within 60 seconds of payment
- [ ] A parent on an expired subscription sees the PaywallSheet on next app open
- [ ] Webhook idempotency: duplicate webhooks do not create duplicate `subscription_events` records
- [ ] Family Plan allows exactly 4 child profiles; a 5th returns `CHILD_LIMIT_REACHED`

---

### 4.7 Push Notifications [P2]

**Description:** Server-scheduled push notifications delivered via Firebase Cloud Messaging to remind parents and celebrate progress.

**User Story:** As a parent, I want a daily reminder at a time that suits me so that I don't forget to do ChampionKids with my child.

**Notification Types:**

| Type | Trigger | Default timing |
|---|---|---|
| Daily reminder | No activity completed today | Parent's preferred time (default: 18:00 local) |
| Streak reminder | No activity completed; streak > 2 days | Parent's preferred time |
| Badge earned | Badge awarded | Immediate |
| Weekly summary | Every Sunday | 09:00 local |

**Scheduling:** Cron job runs every 30 minutes. For each active parent with notifications enabled and no activity completed today, checks if the current server time matches the parent's preferred notification time (within 30-minute window), then dispatches FCM message.

**Acceptance Criteria:**
- [ ] Notifications are not sent to parents who have completed an activity today
- [ ] Notifications respect the parent's timezone (stored on device record)
- [ ] Notification permission is requested after the parent completes their first activity (not at onboarding)
- [ ] Parents can disable all notifications or individual notification types
- [ ] FCM token is refreshed and updated whenever the device token changes

---

### 4.8 Badges & Streaks [P2]

**Description:** A gamification layer that rewards consistent engagement and skill exploration.

**Badge Taxonomy:**

| Badge | Type | Criteria |
|---|---|---|
| First Step | Milestone | Complete first activity |
| Perfect 10 | Milestone | Complete 10 activities |
| Half Century | Milestone | Complete 50 activities |
| Century | Milestone | Complete 100 activities |
| 3-Day Streak | Streak | 3 consecutive days |
| Week Warrior | Streak | 7 consecutive days |
| Fortnight Champion | Streak | 14 consecutive days |
| Monthly Master | Streak | 30 consecutive days |
| Two-Month Legend | Streak | 60 consecutive days |
| 100-Day Champion | Streak | 100 consecutive days |
| Communicator (Bronze/Silver/Gold) | Skill | 10/25/50 Communication activities |
| Leader (Bronze/Silver/Gold) | Skill | 10/25/50 Leadership activities |
| Thinker (Bronze/Silver/Gold) | Skill | 10/25/50 Critical Thinking activities |
| Creator (Bronze/Silver/Gold) | Skill | 10/25/50 Creativity activities |
| Champion (Bronze/Silver/Gold) | Skill | 10/25/50 Resilience activities |
| Connector (Bronze/Silver/Gold) | Skill | 10/25/50 Social Skills activities |
| EQ Star (Bronze/Silver/Gold) | Skill | 10/25/50 Emotional Intelligence activities |
| Explorer | Explorer | At least 1 activity in all 7 skills |

**Award rules:**
- Badge award logic is idempotent — checked after every activity completion; cannot be awarded twice per child
- Celebration animation (Lottie confetti) plays exactly once on badge award
- Badge is written to `child_badges` table with `awarded_at` timestamp

**Acceptance Criteria:**
- [ ] No badge is awarded twice to the same child
- [ ] Celebration animation triggers on the ActivityCompleteScreen on the same session the badge is earned
- [ ] Streak badges are awarded at the moment the qualifying streak day is recorded
- [ ] Skill badges count only completed activities (not attempted)

---

### 4.9 Referral Programme [P2]

**Description:** Viral growth mechanism rewarding parents who bring new paying users.

**User Story:** As a parent who loves the app, I want to share it with other parents and get a reward when they subscribe so that we both benefit.

**Mechanics:**
- Every parent account has a unique `referral_code` generated at signup
- Shareable referral link: `https://championkids.app/join?ref={code}`
- Attribution window: 30 days from click to conversion
- Reward: Referrer receives 1 month of Pro access free when referred user converts to any paid plan
- Referred user: no reward (keeps trial as standard)
- Referral dashboard shows: total referrals, pending conversions, rewards earned

**Acceptance Criteria:**
- [ ] Referral code is unique per user and does not change after creation
- [ ] Referral attribution is credited only on conversion to a paid plan (not on trial start)
- [ ] Referrer reward is applied within 24 hours of referred user's first payment
- [ ] A user cannot refer themselves (same email detection)
- [ ] Referral codes applied after the 30-day window are rejected silently (no error shown to user)

---

### 4.10 AI Personalisation [P3]

**Description:** Replace the rule-based daily activity selection with an ML-augmented ranking system that learns from parent and child behaviour.

**Input signals:**
- Activity completion rate per skill category (per child)
- Parent emoji reactions (sentiment signal)
- Time of day activity is typically completed
- Child age progression (age band changes over time)
- Days since last activity in each skill

**Output:** Re-ranked daily activity candidates; personalised "you haven't tried X skill recently" nudges in the Today screen.

**Model approach:** `[DECISION REQUIRED: collaborative filtering vs. rules-augmented ML vs. LLM re-ranking — to be designed in Phase 2 planning]`

**Privacy:** Only aggregated behavioural signals are used. No child's name, DOB, or identifiable data is passed to the ML layer. Signals are anonymised at the child ID level.

---

### 4.11 Audio Guides [P3]

**Description:** Short narrated coaching guides attached to activity cards, providing spoken guidance for parents who prefer audio.

**Specifications:**
- Duration: 60–90 seconds per audio guide
- Format: MP3, 128kbps, mono
- Storage: Supabase Storage (or S3) with CDN delivery
- Playback: background audio supported on mobile (continues when screen locked)
- Coverage target: 50% of activity library at Phase 3 launch

**Acceptance Criteria:**
- [ ] Audio continues playing when the phone screen is locked
- [ ] Audio player shows progress bar, play/pause, and 10-second rewind
- [ ] Activity cards without audio guides do not show an audio player component

---

### 4.12 Community Features [P3]

**Description:** A parent community feed where parents can share completions and tips, moderated by the admin team.

**Scope:**
- Parent can optionally share a completion to the community feed (opt-in per completion)
- Feed shows: parent first name, child age band (not name/age), skill category, brief note
- Report mechanism: any parent can flag a post for review
- Moderation queue in admin panel: flagged posts + new posts requiring approval (configurable: pre-moderation vs. post-moderation)

**Note:** Community is additive. The core app value must not depend on community content.

---

### 4.13 Multi-Language Support [P3]

**Description:** Localisation of the app UI and activity content into additional languages.

**Phase 3 target languages:** `[DECISION REQUIRED: confirm 2 additional languages via Phase 2 user survey]`

**i18n framework:** `react-i18next` on all clients. Locale stored on user profile. Fallback locale: `en-GB`.

**Content translation:** Admin panel must support locale variants per activity (same activity ID, different locale text). Translation workflow to be defined in Phase 2 planning.

---

## Section 5: Technical Architecture

### 5.1 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                       │
│  React Native (iOS + Android)   Next.js Web   Next.js Admin │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTPS / Bearer JWT
┌──────────────────▼──────────────────────────────────────┐
│                 API LAYER (NestJS REST)                  │
│              /api/v1/*   •   /api/v1/admin/*             │
└──────┬─────────────┬──────────────┬──────────────────────┘
       │             │              │
┌──────▼───┐  ┌──────▼──────┐  ┌───▼──────────────────────┐
│ Supabase │  │ PostgreSQL  │  │ External Services          │
│  Auth    │  │ (via        │  │  Stripe (web payments)     │
│ (JWT)    │  │  Supabase)  │  │  Apple IAP (iOS)           │
└──────────┘  └─────────────┘  │  Google Play (Android)     │
                                │  Firebase Cloud Messaging  │
                                │  Sentry (error tracking)   │
                                │  Analytics provider [DR]   │
                                │  Email provider [DR]       │
                                │  CDN (audio/assets)        │
                                └────────────────────────────┘
```

**Hosting:**
- API (NestJS): `[DECISION REQUIRED: Railway / Render / Fly.io]`
- Next.js Web + Admin: Vercel
- Database: Supabase (hosted PostgreSQL)
- Object Storage: Supabase Storage or AWS S3 (for audio in Phase 3)
- CDN: Cloudflare or Vercel Edge Network

### 5.2 Authentication & Authorisation

**Supabase Auth configuration:**
- Providers enabled: Email/Password, Google OAuth, Apple OAuth
- Email confirmation required: Yes (with resend option)
- JWT access token TTL: 1 hour
- Refresh token TTL: 30 days (rolling)
- JWT contains: `sub` (user UUID), `email`, `role` (`parent` or `admin`)

**Row-Level Security (RLS) policies:**

| Table | Policy | Rule |
|---|---|---|
| children | SELECT | `auth.uid() = parent_id` |
| children | INSERT/UPDATE/DELETE | `auth.uid() = parent_id` |
| activity_completions | SELECT/INSERT | `child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())` |
| daily_activity_selections | SELECT | `child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())` |
| activities | SELECT | `status = 'published'` (public read) |
| subscriptions | SELECT/UPDATE | `auth.uid() = user_id` |
| users | SELECT/UPDATE | `auth.uid() = id` |

**Admin auth:** Separate Supabase Auth project or custom JWT with `role = 'admin'` claim. All `/api/v1/admin/*` routes enforce admin role middleware.

**Mobile token storage:** Tokens stored in `expo-secure-store` (or React Native Keychain for bare workflow). Never stored in AsyncStorage.

### 5.3 API Design Principles

**Style:** REST

**Base URL:** `https://api.championkids.app/api/v1/`

**Versioning:** URI versioning (`/v1/`). Breaking changes increment the version.

**Authentication:** `Authorization: Bearer <access_token>` on all protected routes.

**Standard response envelope:**

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 145, "nextCursor": "abc123" }
}

// Error
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_REQUIRED",
    "message": "A Pro subscription is required to access the full library.",
    "statusCode": 403
  }
}
```

**Pagination:** Cursor-based for all list endpoints. Query params: `limit` (default 20, max 100), `cursor` (opaque string).

**Custom error codes:**

| Code | HTTP Status | Meaning |
|---|---|---|
| `SUBSCRIPTION_REQUIRED` | 403 | Feature requires a paid subscription |
| `CHILD_LIMIT_REACHED` | 403 | Cannot add more children on current plan |
| `ACTIVITY_ALREADY_COMPLETED` | 409 | Activity already completed today |
| `INVALID_REFERRAL_CODE` | 422 | Referral code not found or expired |
| `TRIAL_ALREADY_USED` | 409 | Parent already used their free trial |
| `ENTITLEMENT_SYNC_FAILED` | 500 | Payment provider validation failed |

**Rate limiting:**
- Global: 100 requests/minute per authenticated user
- Auth endpoints: 10 requests/minute per IP
- Webhook endpoints: 1000 requests/minute (high volume expected)

### 5.4 Subscription Entitlement Architecture

**Source of truth:** `subscriptions` table in PostgreSQL.

**Webhook flow:**

```
Payment Provider → Webhook Endpoint → Verify Signature → Parse Event
→ Upsert subscriptions table → Write subscription_events log → Return 200
```

**Webhook security:**
- Stripe: verify `Stripe-Signature` header using `stripe.webhooks.constructEvent()`
- Apple: verify signed JWS payload using Apple's public keys
- Google Play: verify JWT signature using Google's public keys (Real-Time Developer Notifications via Pub/Sub)

**Entitlement middleware (applied to all protected routes):**
1. Extract `user_id` from JWT
2. Query `subscriptions` WHERE `user_id = $1` AND `status IN ('trial', 'active', 'grace')` AND `current_period_end > NOW()`
3. If found: attach entitlement object to request context and proceed
4. If not found: return `SUBSCRIPTION_REQUIRED` error

**Mobile offline behaviour:**
- Entitlement cached in device secure storage with 1-hour TTL
- On cache miss or app foreground: re-fetch from `/api/v1/subscriptions/me`
- During offline period: use cached entitlement (do not block access)
- On reconnect: refresh cache immediately

### 5.5 Content Delivery Architecture

- Activities stored in PostgreSQL (not a CMS) with rich text as plain text fields
- Activity library endpoint is heavily cached (CDN cache TTL: 5 minutes; stale-while-revalidate: 1 hour)
- Content versioning: editing a published activity creates a new version snapshot in `activity_versions` (future table — `[DECISION REQUIRED]`). Existing completions reference the activity ID; historical display uses the version at time of completion.
- Audio files [P3]: stored in Supabase Storage or S3, delivered via CDN. URL stored as `audio_url` on the activity record.

### 5.6 Push Notification Architecture

- FCM token captured immediately after notification permission is granted
- Token stored in `devices` table per device (one parent can have multiple devices)
- Token refreshed: whenever `FirebaseMessaging.onTokenRefresh()` fires, update the `devices` record
- Scheduling: NestJS cron job (`@Cron`) runs every 30 minutes, identifies parents due for notifications, dispatches via Firebase Admin SDK
- Notification payload includes: `childId` (for deep link routing) and `notificationType`
- Opt-out: setting `notification_enabled = false` on the `devices` record excludes the device from all cron dispatches

### 5.7 Analytics & Observability

**Analytics provider:** `[DECISION REQUIRED: Mixpanel / Amplitude / PostHog]`

**Core events to track:**

| Event | Properties | Trigger |
|---|---|---|
| `app_opened` | platform, is_first_open | App foreground |
| `onboarding_completed` | time_to_complete_ms | Step 4 completed |
| `activity_viewed` | activity_id, skill_category, age_band, source (today/library) | Activity detail opened |
| `activity_completed` | activity_id, skill_category, age_band, reaction_emoji | Completion recorded |
| `paywall_triggered` | trigger_point, current_plan | Paywall shown |
| `subscription_started` | plan_type, platform | Entitlement activated |
| `subscription_cancelled` | plan_type, platform, days_active | Cancellation recorded |
| `badge_earned` | badge_slug, child_id (anonymised) | Badge awarded [P2] |
| `streak_broken` | streak_length | Streak reset to 0 [P2] |

**Error tracking:** Sentry — both client (React Native + Next.js) and server (NestJS).

**Server monitoring:** API p95 latency alert threshold: 500ms. Uptime monitoring via Sentry or BetterUptime.

**Admin analytics dashboard (Phase 2):**
- Daily active parents (DAP) — 7-day rolling
- Weekly retention cohort table
- MRR by plan type
- Activity completion rate (completions / daily selections)
- Top 10 most completed activities
- Top 10 least completed activities (content improvement signal)

---

## Section 6: Data Models

### 6.1 `users`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK; also Supabase Auth UID |
| email | varchar(255) | NOT NULL | — | UNIQUE |
| full_name | varchar(100) | NOT NULL | — | |
| avatar_url | text | NULL | — | |
| created_at | timestamptz | NOT NULL | `now()` | |
| updated_at | timestamptz | NOT NULL | `now()` | |
| deleted_at | timestamptz | NULL | — | Soft delete |
| referral_code | varchar(10) | NOT NULL | Generated | UNIQUE |
| referred_by | uuid | NULL | — | FK → users.id |

**Indexes:** `(email)` UNIQUE, `(referral_code)` UNIQUE, `(referred_by)`

---

### 6.2 `children`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| parent_id | uuid | NOT NULL | — | FK → users.id |
| display_name | varchar(30) | NOT NULL | — | |
| date_of_birth | date | NOT NULL | — | Age band always derived at runtime |
| avatar_id | smallint | NOT NULL | — | 1–8 (preset illustrations) |
| created_at | timestamptz | NOT NULL | `now()` | |
| updated_at | timestamptz | NOT NULL | `now()` | |
| deleted_at | timestamptz | NULL | — | Soft delete |

**Indexes:** `(parent_id)`, `(parent_id, deleted_at)` partial index

**Constraint:** Max 4 non-deleted children per parent_id (enforced at application layer; DB trigger as safety net)

---

### 6.3 `child_skill_focuses`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| child_id | uuid | NOT NULL | — | FK → children.id |
| skill_category_id | uuid | NOT NULL | — | FK → skill_categories.id |
| priority_order | smallint | NOT NULL | — | 1, 2, or 3 |
| created_at | timestamptz | NOT NULL | `now()` | |

**Unique constraint:** `(child_id, skill_category_id)`

---

### 6.4 `skill_categories`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| slug | varchar(50) | NOT NULL | — | e.g., `critical-thinking` — UNIQUE |
| display_name | varchar(100) | NOT NULL | — | |
| description | text | NULL | — | |
| icon_name | varchar(50) | NULL | — | |
| colour_hex | varchar(7) | NULL | — | e.g., `#FF6B6B` |
| sort_order | smallint | NOT NULL | 0 | |
| is_active | boolean | NOT NULL | true | |

**Seed data:** 7 rows (Communication, Leadership, Critical Thinking, Creativity, Resilience, Social Skills, Emotional Intelligence)

---

### 6.5 `age_bands`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| label | varchar(10) | NOT NULL | — | e.g., `5–6` |
| min_age_years | smallint | NOT NULL | — | |
| max_age_years | smallint | NOT NULL | — | |
| sort_order | smallint | NOT NULL | 0 | |

**Seed data:** 6 rows (1–2, 3–4, 5–6, 7–8, 9–10, 11–12). Reference table — rarely changes.

---

### 6.6 `activities`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| title | varchar(80) | NOT NULL | — | |
| slug | varchar(100) | NOT NULL | — | UNIQUE; URL-safe |
| skill_category_id | uuid | NOT NULL | — | FK → skill_categories.id |
| age_band_id | uuid | NOT NULL | — | FK → age_bands.id |
| coaching_prompt | text | NOT NULL | — | 50–200 words |
| follow_up_questions | jsonb | NOT NULL | `'[]'` | Array of 2–3 strings |
| parent_tip | text | NULL | — | |
| variation | text | NULL | — | |
| time_estimate_minutes | smallint | NOT NULL | 5 | |
| status | varchar(20) | NOT NULL | `'draft'` | `draft` / `published` / `archived` |
| created_by | uuid | NOT NULL | — | FK → admin user id |
| published_at | timestamptz | NULL | — | |
| audio_url | text | NULL | — | P3 — CDN URL |
| created_at | timestamptz | NOT NULL | `now()` | |
| updated_at | timestamptz | NOT NULL | `now()` | |

**Indexes:**
- `(skill_category_id, age_band_id, status)`
- Full-text search: GIN index on `to_tsvector('english', title)`
- `(status, published_at)` for admin ordering

---

### 6.7 `activity_tags`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| activity_id | uuid | NOT NULL | — | FK → activities.id |
| tag | varchar(50) | NOT NULL | — | |

**Index:** `(activity_id)`, `(tag)`

---

### 6.8 `activity_completions`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| child_id | uuid | NOT NULL | — | FK → children.id |
| activity_id | uuid | NOT NULL | — | FK → activities.id |
| completed_at | timestamptz | NOT NULL | `now()` | |
| parent_reaction | varchar(10) | NULL | — | Emoji character |
| parent_note | text | NULL | — | P2 |

**Indexes:** `(child_id, completed_at DESC)` — primary query pattern; `(activity_id)`

**Scale note:** This table grows at rate of ~1 row/day/active child. Partition by `completed_at` (monthly) when row count exceeds ~10M.

---

### 6.9 `daily_activity_selections`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| child_id | uuid | NOT NULL | — | FK → children.id |
| activity_id | uuid | NOT NULL | — | FK → activities.id |
| selected_for_date | date | NOT NULL | — | |
| generated_at | timestamptz | NOT NULL | `now()` | |
| was_shown | boolean | NOT NULL | false | |
| was_completed | boolean | NOT NULL | false | |

**Unique constraint:** `(child_id, selected_for_date)` — one selection per child per day

**Index:** `(child_id, selected_for_date)`

---

### 6.10 `streaks`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| child_id | uuid | NOT NULL | — | FK → children.id — UNIQUE |
| current_streak_days | integer | NOT NULL | 0 | |
| longest_streak_days | integer | NOT NULL | 0 | |
| last_activity_date | date | NULL | — | Date of most recent completion |
| updated_at | timestamptz | NOT NULL | `now()` | |

**Updated transactionally** whenever an `activity_completions` record is inserted.

---

### 6.11 `badges` [P2]

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| slug | varchar(50) | NOT NULL | — | UNIQUE |
| display_name | varchar(100) | NOT NULL | — | |
| description | text | NULL | — | |
| icon_name | varchar(50) | NULL | — | |
| badge_type | varchar(20) | NOT NULL | — | `streak` / `skill` / `milestone` / `explorer` |

---

### 6.12 `child_badges` [P2]

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| child_id | uuid | NOT NULL | — | FK → children.id |
| badge_id | uuid | NOT NULL | — | FK → badges.id |
| awarded_at | timestamptz | NOT NULL | `now()` | |

**Unique constraint:** `(child_id, badge_id)` — ensures idempotency

---

### 6.13 `subscriptions`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| user_id | uuid | NOT NULL | — | FK → users.id — UNIQUE |
| plan_type | varchar(20) | NOT NULL | — | `trial` / `pro_monthly` / `pro_annual` / `family` |
| status | varchar(20) | NOT NULL | — | `trial` / `active` / `cancelled` / `expired` / `grace` |
| platform | varchar(20) | NOT NULL | — | `web` / `ios` / `android` |
| external_subscription_id | varchar(255) | NULL | — | Stripe sub ID or platform token |
| current_period_start | timestamptz | NULL | — | |
| current_period_end | timestamptz | NULL | — | |
| trial_ends_at | timestamptz | NULL | — | Set on trial start |
| cancelled_at | timestamptz | NULL | — | |
| created_at | timestamptz | NOT NULL | `now()` | |
| updated_at | timestamptz | NOT NULL | `now()` | |

**Index:** `(user_id)`, `(status, current_period_end)` — for entitlement checks

---

### 6.14 `subscription_events`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| user_id | uuid | NOT NULL | — | FK → users.id |
| event_type | varchar(50) | NOT NULL | — | `trial_started` / `payment_succeeded` / `payment_failed` / `cancelled` / `reactivated` / `expired` |
| platform | varchar(20) | NOT NULL | — | |
| raw_payload | jsonb | NULL | — | Full webhook payload |
| created_at | timestamptz | NOT NULL | `now()` | |

**Immutable audit log** — no updates or deletes ever. Retained 7 years (financial compliance).

---

### 6.15 `devices` [P2]

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| user_id | uuid | NOT NULL | — | FK → users.id |
| fcm_token | text | NOT NULL | — | UNIQUE |
| platform | varchar(10) | NOT NULL | — | `ios` / `android` / `web` |
| notification_enabled | boolean | NOT NULL | true | |
| preferred_notification_time | time | NULL | `18:00:00` | Local time |
| timezone | varchar(50) | NULL | — | IANA timezone string (e.g., `Europe/London`) |
| last_seen_at | timestamptz | NOT NULL | `now()` | |
| created_at | timestamptz | NOT NULL | `now()` | |

---

### 6.16 `referrals` [P2]

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | `gen_random_uuid()` | PK |
| referrer_id | uuid | NOT NULL | — | FK → users.id |
| referred_user_id | uuid | NULL | — | FK → users.id (set on signup) |
| referral_code | varchar(10) | NOT NULL | — | Matches referrer's users.referral_code |
| status | varchar(20) | NOT NULL | `'pending'` | `pending` / `converted` / `rewarded` |
| created_at | timestamptz | NOT NULL | `now()` | |
| converted_at | timestamptz | NULL | — | |

---

## Section 7: API Endpoint Inventory

### 7.1 Auth

| Method | Path | Auth | Phase | Notes |
|---|---|---|---|---|
| POST | `/api/v1/auth/signup` | None | P1 | Creates user + starts trial |
| POST | `/api/v1/auth/login` | None | P1 | Returns access + refresh tokens |
| POST | `/api/v1/auth/logout` | Bearer | P1 | Invalidates refresh token |
| POST | `/api/v1/auth/refresh` | Refresh token | P1 | Returns new access token |
| POST | `/api/v1/auth/forgot-password` | None | P1 | Sends reset email |
| POST | `/api/v1/auth/reset-password` | Reset token | P1 | Updates password |
| GET | `/api/v1/auth/me` | Bearer | P1 | Returns current user profile |
| DELETE | `/api/v1/auth/account` | Bearer | P1 | Soft-deletes account + anonymises child data |

### 7.2 Children

| Method | Path | Auth | Phase | Notes |
|---|---|---|---|---|
| GET | `/api/v1/children` | Bearer | P1 | List parent's children (non-deleted) |
| POST | `/api/v1/children` | Bearer | P1 | Create child profile |
| GET | `/api/v1/children/:childId` | Bearer | P1 | Get child detail |
| PATCH | `/api/v1/children/:childId` | Bearer | P1 | Update child (name, DOB, avatar) |
| DELETE | `/api/v1/children/:childId` | Bearer | P1 | Soft-delete child profile |
| GET | `/api/v1/children/:childId/skill-focuses` | Bearer | P1 | Get ordered skill focuses |
| PUT | `/api/v1/children/:childId/skill-focuses` | Bearer | P1 | Replace all skill focuses |

### 7.3 Activities

| Method | Path | Auth | Phase | Notes |
|---|---|---|---|---|
| GET | `/api/v1/activities/today/:childId` | Bearer | P1 | Returns today's selected activity |
| GET | `/api/v1/activities` | Bearer | P1 | Library browse; query: `skill_category`, `age_band`, `search`, `cursor`, `limit` |
| GET | `/api/v1/activities/:activityId` | Bearer | P1 | Activity detail |
| POST | `/api/v1/activities/:activityId/complete` | Bearer | P1 | Record completion; body: `{ childId, reaction?, note? }` |
| GET | `/api/v1/activities/saved` | Bearer | P2 | List saved activities |
| POST | `/api/v1/activities/:activityId/save` | Bearer | P2 | Save activity to favourites |
| DELETE | `/api/v1/activities/:activityId/save` | Bearer | P2 | Remove from saved |

### 7.4 Progress

| Method | Path | Auth | Phase | Notes |
|---|---|---|---|---|
| GET | `/api/v1/progress/:childId/summary` | Bearer | P1 | Streak, total completed, by-skill breakdown |
| GET | `/api/v1/progress/:childId/history` | Bearer | P1 | Paginated completion list; `cursor`, `limit` |
| GET | `/api/v1/progress/:childId/badges` | Bearer | P2 | List earned badges with `awarded_at` |

### 7.5 Subscriptions

| Method | Path | Auth | Phase | Notes |
|---|---|---|---|---|
| GET | `/api/v1/subscriptions/me` | Bearer | P1 | Current subscription status + entitlement |
| POST | `/api/v1/subscriptions/start-trial` | Bearer | P1 | Activates 7-day trial (idempotent) |
| POST | `/api/v1/subscriptions/create-checkout-session` | Bearer | P1 | Stripe only; body: `{ planType }` |
| POST | `/api/v1/subscriptions/validate-iap` | Bearer | P1 | iOS; body: `{ transactionId, productId }` |
| POST | `/api/v1/subscriptions/validate-google-play` | Bearer | P1 | Android; body: `{ purchaseToken, productId }` |
| POST | `/api/v1/subscriptions/cancel` | Bearer | P1 | Web/Stripe cancellation |
| GET | `/api/v1/subscriptions/portal-session` | Bearer | P1 | Returns Stripe portal URL |

### 7.6 Webhooks (server-to-server)

| Method | Path | Auth | Phase | Notes |
|---|---|---|---|---|
| POST | `/api/v1/webhooks/stripe` | Stripe signature | P1 | Processes all Stripe subscription events |
| POST | `/api/v1/webhooks/apple` | JWS validation | P1 | App Store Server Notifications |
| POST | `/api/v1/webhooks/google-play` | JWT validation | P1 | Google RTDN via Pub/Sub |

### 7.7 Notifications [P2]

| Method | Path | Auth | Phase | Notes |
|---|---|---|---|---|
| GET | `/api/v1/notifications/preferences` | Bearer | P2 | Get notification settings |
| PUT | `/api/v1/notifications/preferences` | Bearer | P2 | Update preferences + timezone |
| POST | `/api/v1/notifications/register-device` | Bearer | P2 | Register FCM token |
| DELETE | `/api/v1/notifications/deregister-device` | Bearer | P2 | Remove FCM token |

### 7.8 Referrals [P2]

| Method | Path | Auth | Phase | Notes |
|---|---|---|---|---|
| GET | `/api/v1/referrals/me` | Bearer | P2 | Referral code, stats, rewards |
| POST | `/api/v1/referrals/apply` | Bearer | P2 | Apply referral code at signup; body: `{ code }` |

### 7.9 Admin Endpoints (require `role = 'admin'`)

| Method | Path | Phase | Notes |
|---|---|---|---|
| GET | `/api/v1/admin/activities` | P1 | All statuses; filter: `status`, `skill_category`, `age_band` |
| POST | `/api/v1/admin/activities` | P1 | Create activity draft |
| PATCH | `/api/v1/admin/activities/:id` | P1 | Update activity (including publish/archive) |
| DELETE | `/api/v1/admin/activities/:id` | P1 | Soft-delete (archive) |
| GET | `/api/v1/admin/activities/:id` | P1 | Admin detail view (all fields) |
| GET | `/api/v1/admin/skill-categories` | P1 | List skill categories |
| PATCH | `/api/v1/admin/skill-categories/:id` | P1 | Update category |
| GET | `/api/v1/admin/users` | P1 | Paginated user list with search |
| GET | `/api/v1/admin/users/:id` | P1 | User detail: profile, children, subscription |
| PATCH | `/api/v1/admin/users/:id/subscription` | P1 | Override subscription status |
| GET | `/api/v1/admin/analytics/overview` | P2 | KPI summary (DAP, MRR, completion rate) |
| GET | `/api/v1/admin/analytics/retention` | P2 | Weekly cohort retention table |
| GET | `/api/v1/admin/analytics/revenue` | P2 | MRR, plan breakdown, churn rate |
| GET | `/api/v1/admin/analytics/content` | P2 | Activity performance metrics |
| GET | `/api/v1/admin/feature-flags` | P1 | List feature flags |
| PUT | `/api/v1/admin/feature-flags/:key` | P1 | Toggle feature flag |

---

## Section 8: Screen & Page Inventory

### 8.1 React Native — Mobile Screens

| # | Screen Name | Route/ID | Platform | Phase | Description |
|---|---|---|---|---|---|
| 1 | SplashScreen | `Splash` | iOS + Android | P1 | Logo + brand colour; auto-navigates after 2s |
| 2 | OnboardingScreen1 | `Onboarding1` | iOS + Android | P1 | Welcome, value proposition, "Get started" CTA |
| 3 | OnboardingScreen2 | `Onboarding2` | iOS + Android | P1 | Parent name input |
| 4 | OnboardingScreen3 | `Onboarding3` | iOS + Android | P1 | Child name + DOB date picker |
| 5 | OnboardingScreen4 | `Onboarding4` | iOS + Android | P1 | Skill category multi-select (max 3) |
| 6 | OnboardingComplete | `OnboardingComplete` | iOS + Android | P1 | Trial activated confirmation; "Let's start" CTA |
| 7 | LoginScreen | `Login` | iOS + Android | P1 | Email/password + Google/Apple sign-in |
| 8 | SignUpScreen | `SignUp` | iOS + Android | P1 | Name, email, password, T&C checkbox |
| 9 | ForgotPasswordScreen | `ForgotPassword` | iOS + Android | P1 | Email input; sends reset link |
| 10 | ResetPasswordScreen | `ResetPassword` | iOS + Android | P1 | Deep link from email; new password input |
| 11 | TodayScreen | `Today` | iOS + Android | P1 | Child switcher [P2], today's activity card preview, "Let's go" CTA |
| 12 | ActivityDetailScreen | `ActivityDetail` | iOS + Android | P1 | Full activity card; coaching prompt, follow-ups, tip, audio [P3] |
| 13 | ActivityCompleteScreen | `ActivityComplete` | iOS + Android | P1 | Celebration animation, emoji reaction, streak display, CTAs |
| 14 | LibraryScreen | `Library` | iOS + Android | P1 | Skill filter chips, age band filter, search, activity grid |
| 15 | SavedActivitiesScreen | `SavedActivities` | iOS + Android | P2 | List of saved/favourite activities |
| 16 | ProgressScreen | `Progress` | iOS + Android | P1 | Streak card, total count, skill breakdown chart, badge row [P2] |
| 17 | ProgressHistoryScreen | `ProgressHistory` | iOS + Android | P1 | Paginated completion history |
| 18 | BadgeDetailScreen | `BadgeDetail` | iOS + Android | P2 | Badge wall with earned/locked states |
| 19 | ProfileScreen | `Profile` | iOS + Android | P1 | Account info, children list, subscription card, nav links |
| 20 | EditProfileScreen | `EditProfile` | iOS + Android | P1 | Name, email edit |
| 21 | AddChildScreen | `AddChild` | iOS + Android | P1 | Name, DOB, avatar, skill focuses |
| 22 | EditChildScreen | `EditChild` | iOS + Android | P1 | Edit child profile fields |
| 23 | SubscriptionScreen | `Subscription` | iOS + Android | P1 | Plan matrix, upgrade CTA (platform-appropriate) |
| 24 | PaywallSheet | `PaywallSheet` | iOS + Android | P1 | Bottom sheet: plan options, upgrade CTA |
| 25 | NotificationSettingsScreen | `NotificationSettings` | iOS + Android | P2 | Toggle per notification type, time picker |
| 26 | HelpScreen | `Help` | iOS + Android | P1 | FAQ accordion, contact support link |

### 8.2 Next.js Web — Parent Portal Pages

| Route | Phase | Description |
|---|---|---|
| `/login` | P1 | Login form |
| `/signup` | P1 | Sign-up form |
| `/forgot-password` | P1 | Forgot password |
| `/reset-password` | P1 | Reset password (token via URL) |
| `/app/today` | P1 | Today's activity (mirrors mobile Today tab) |
| `/app/library` | P1 | Activity library |
| `/app/progress` | P1 | Progress overview |
| `/app/profile` | P1 | Account + child management |
| `/app/children/add` | P1 | Add child form |
| `/app/children/:id/edit` | P1 | Edit child form |
| `/app/subscribe` | P1 | Plan selection + Stripe Checkout redirect |
| `/app/subscription/success` | P1 | Post-payment confirmation |
| `/app/subscription/cancel` | P1 | User cancelled Stripe checkout |
| `/app/subscription/manage` | P1 | Stripe Customer Portal redirect |

### 8.3 Admin Dashboard — Pages

| Route | Phase | Description |
|---|---|---|
| `/admin/login` | P1 | Admin login |
| `/admin/dashboard` | P1 | KPI overview cards and charts |
| `/admin/content/activities` | P1 | Activity table (filter, bulk actions) |
| `/admin/content/activities/new` | P1 | Create activity form |
| `/admin/content/activities/:id/edit` | P1 | Edit activity form |
| `/admin/content/categories` | P1 | Skill categories + age bands management |
| `/admin/users` | P1 | Searchable parent account table |
| `/admin/users/:id` | P1 | User detail: profile, children, subscription history |
| `/admin/analytics/retention` | P2 | Cohort retention table |
| `/admin/analytics/revenue` | P2 | MRR, plan breakdown, churn |
| `/admin/analytics/content` | P2 | Activity performance metrics |
| `/admin/settings/feature-flags` | P1 | Feature flag toggles |

---

## Section 9: Phase Scope Definitions

### 9.1 Phase 1 — MVP (Weeks 1–12)

**Objective:** Ship a working, lovable product that validates the core loop: parent signs up → adds child → receives daily activity → completes it → sees progress → converts to paid.

**Infrastructure to establish in Week 1–2:**
- NestJS API scaffold: modules, DTOs, guards, global error handler, request logging
- PostgreSQL schema (all tables from Section 6 — build the full schema once, even for P2/P3 tables)
- Supabase Auth integration + JWT guards
- React Native app scaffold: `[DECISION REQUIRED: Expo managed workflow vs. bare workflow]`
- Next.js web app scaffold + Next.js admin scaffold (separate deployments)
- CI/CD: GitHub Actions pipelines for API (test → build → deploy), web (test → build → Vercel), mobile (test → EAS build)
- Stripe integration: checkout sessions, customer portal, webhooks
- Apple IAP: StoreKit 2 integration + receipt validation
- Google Play Billing: library integration + token validation
- Error tracking: Sentry on all four services

**Features in Phase 1 scope:**
- Full onboarding flow (single child only)
- Daily activity engine (rule-based, single child, nightly pre-generation cron)
- Activity library (browse, filter, search — no save)
- Activity completion recording + basic streak tracking
- Progress: total count, by-skill bar chart, streak display
- Subscription: trial, Pro Monthly, Pro Annual — Stripe (web) + Apple IAP + Google Play
- Admin panel: activity CRUD with publish/archive, user list, basic subscription override

**Content requirement:** 200+ published activities covering all 42 combinations (7 skills × 6 age bands); target minimum 4 activities per combination at launch.

**Phase 1 exit criteria (all must pass):**
- [ ] Core loop completes without error on iOS (min iOS 16), Android (min API 29), and web (Chrome, Safari, Firefox)
- [ ] Stripe, Apple IAP, and Google Play payments all validated end-to-end in production environments
- [ ] Admin can create, edit, and publish an activity that appears in the app within 5 minutes
- [ ] 200+ activities published and distributed across all age band × skill combinations
- [ ] All P1 API endpoints return correct responses under load (10 concurrent users, p95 < 500ms)
- [ ] OWASP Top 10 review completed and critical/high findings resolved

---

### 9.2 Phase 2 — Growth Features (Weeks 13–20)

**Objective:** Increase retention and virality through multi-child support, gamification, notifications, and referrals.

**Features in Phase 2 scope:**
- Multi-child profiles (up to 4 per Family Plan; child switcher in Today screen)
- Family Plan subscription tier (Stripe + Apple IAP + Google Play)
- Full badge system (all badge types from Section 4.8)
- Enhanced streak: streak calendar heatmap UI
- Push notifications: daily reminder, streak nudge, badge earned (FCM)
- In-app notification preferences screen
- Referral programme
- Save / favourite activities
- Parent note on completion
- Progress history pagination
- Weekly email digest (opt-in)
- Admin analytics dashboard: retention, revenue, content performance

**Phase 2 exit criteria:**
- [ ] Multi-child switching works without any progress data mixing between children
- [ ] Push notifications delivered within 5 minutes of scheduled time (measured in test)
- [ ] Badge award is idempotent: completing the same qualifying action twice never awards the same badge twice
- [ ] Family Plan subscription correctly enforces 4-child limit and billing on all three platforms
- [ ] Referral conversion tracking correctly attributes rewards within 30-day window

---

### 9.3 Phase 3 — Scale & Personalisation (Weeks 21–32)

**Objective:** Deepen personalisation, expand content reach, and build community to support scale.

**Features in Phase 3 scope:**
- AI personalisation engine (replaces rule-based daily selection for qualifying users)
- Audio guides on activity cards (60–90s narrated MP3 per activity)
- Community feed (parent sharing, moderation, report mechanism)
- Multi-language support (languages TBD in Phase 2)
- Admin: translation management UI, audio upload per activity, community moderation queue
- Advanced analytics: personalisation model performance vs. rule-based baseline

**Infrastructure additions:**
- ML pipeline or LLM integration for personalisation `[DECISION REQUIRED]`
- Audio CDN delivery
- Translation workflow tooling
- Community moderation queue in admin

**Phase 3 exit criteria:**
- [ ] AI personalisation produces measurably higher 7-day activity completion rate than rule-based baseline (A/B test)
- [ ] Audio guides available on ≥ 50% of published activity library
- [ ] Community feature live with moderation workflow: all posts reviewed within 24 hours
- [ ] At least 1 additional language fully translated and available in the app

---

## Section 10: Content Strategy & Taxonomy

### 10.1 Activity Content Structure

**Field limits:**

| Field | Min | Max | Notes |
|---|---|---|---|
| Title | 10 chars | 60 chars | Engaging, action-oriented |
| Coaching prompt | 50 words | 200 words | What the parent does/says |
| Follow-up question (each) | 5 words | 30 words | 2–3 questions required |
| Parent tip | — | 80 words | Optional; practical guidance |
| Variation | — | 100 words | Optional; simplify or extend |

**Tone of voice:**
- Second person, addressing the parent directly ("Ask your child...", "Try this...")
- Warm, encouraging, non-judgmental
- Action-oriented — every prompt starts with a verb
- Jargon-free — no educational theory terminology
- Inclusive — activities work for all family structures and settings

**Quality checklist for every activity:**
- [ ] Completable in under 5 minutes
- [ ] Requires zero materials (verbal/conversational only unless otherwise noted)
- [ ] Works in at least 3 settings (car, dinner table, bedtime, walk, etc.)
- [ ] Age-appropriate for the stated age band (validated by at least one parent reviewer)
- [ ] Clearly maps to exactly one skill category
- [ ] Does not duplicate an existing activity (title or coaching prompt)

### 10.2 Skill Category Definitions & Progression

**Communication**
- Definition: The ability to express thoughts clearly, listen actively, and adapt communication style to context.
- Progression across age bands:
  - 1–2: Basic verbal expression, naming objects, simple responses
  - 3–4: Sentence construction, turn-taking in conversation, storytelling
  - 5–6: Explaining reasoning, asking questions, active listening
  - 7–8: Persuasion, structured storytelling, adapting to audience
  - 9–10: Debate basics, presenting ideas, constructive feedback
  - 11–12: Public speaking, negotiation, written and verbal clarity

**Leadership**
- Definition: The ability to take initiative, motivate others, make decisions, and take responsibility.
- Progression: 1–2 (helping behaviours) → 3–4 (taking turns being "the boss") → 5–6 (organising small tasks) → 7–8 (group decision-making) → 9–10 (project leadership) → 11–12 (mentoring, accountability)

**Critical Thinking**
- Definition: The ability to analyse information, question assumptions, and solve problems systematically.
- Progression: 1–2 (cause/effect awareness) → 3–4 (simple "why" questions) → 5–6 (comparing options) → 7–8 (identifying pros/cons) → 9–10 (evaluating evidence) → 11–12 (logical argument construction)

**Creativity**
- Definition: The ability to generate original ideas, think divergently, and approach problems with imagination.
- Progression: 1–2 (free play, naming imaginative scenarios) → 3–4 (role-play, invention games) → 5–6 (open-ended challenges, "what if" questions) → 7–8 (brainstorming, combining unrelated ideas) → 9–10 (design thinking basics) → 11–12 (original creation, iterative improvement)

**Resilience**
- Definition: The ability to manage setbacks, regulate emotions, persist through difficulty, and adapt to change.
- Progression: 1–2 (coping with small frustrations, comfort-seeking) → 3–4 (identifying feelings, trying again) → 5–6 (reframing setbacks, asking for help) → 7–8 (growth mindset conversations, perseverance) → 9–10 (stress management strategies, self-reflection) → 11–12 (coping frameworks, learning from failure)

**Social Skills**
- Definition: The ability to build relationships, empathise, collaborate, and navigate social situations effectively.
- Progression: 1–2 (parallel play, sharing) → 3–4 (taking turns, recognising others' emotions) → 5–6 (making friends, conflict resolution basics) → 7–8 (teamwork, understanding different perspectives) → 9–10 (reading social cues, managing conflict) → 11–12 (empathy in complex situations, social responsibility)

**Emotional Intelligence**
- Definition: The ability to identify, understand, and manage one's own emotions, and to recognise and respond to others' emotions.
- Progression: 1–2 (naming basic emotions: happy, sad, angry) → 3–4 (linking events to emotions) → 5–6 (understanding mixed feelings) → 7–8 (emotional regulation strategies) → 9–10 (empathy in complex situations) → 11–12 (emotional self-awareness, supporting others)

### 10.3 Content Roadmap

**Launch (Phase 1):**
- 200+ published activities
- Target distribution: minimum 4 activities per skill × age band combination (42 combinations = 168 minimum; exceed to 200+)
- All activities reviewed by at least 1 parent outside the creation team before publish

**Ongoing growth:**
- 5–10 new activities per week
- Admin content workflow: `Draft` → `Review` → `Approved` → `Published` → `Archived`
- Quarterly content audit: retire activities with < 40% completion rate; refresh with new variations

**Seasonal content (future):** Themed packs for holidays, back-to-school, summer — designed as tags on existing structure, not a separate content type.

---

## Section 11: Design System & UX Principles

### 11.1 Brand & Visual Identity

**Colour palette:** `[DECISION REQUIRED: to be defined with brand designer; suggested: warm primary (coral/orange), supporting neutrals, semantic colours for status]`

| Token | Role | Placeholder Hex |
|---|---|---|
| `color-primary` | Brand primary, CTAs | `#FF6B35` |
| `color-secondary` | Accents | `#4ECDC4` |
| `color-neutral-900` | Body text | `#1A1A2E` |
| `color-neutral-100` | Backgrounds | `#F8F9FA` |
| `color-success` | Positive feedback | `#06D6A0` |
| `color-warning` | Alerts | `#FFD166` |
| `color-error` | Errors | `#EF233C` |

**Typography:** `[DECISION REQUIRED: confirm font choice — suggested: Nunito (friendly, rounded) for headings + Inter for body]`

**Iconography:** Phosphor Icons (MIT licensed, 1000+ icons, available for React Native + web)

**Illustration style:** Child-friendly, inclusive, diverse family representations. Flat vector with warm colour fills. Custom illustrations required for: app icon, onboarding screens, empty states, age band illustrations (6), skill category icons (7), avatar set (8).

**Animation principles:**
- Celebratory: Lottie animations for badge awards and activity completion
- Transitions: 200ms ease-in-out for screen transitions
- No auto-playing animations that could trigger motion sensitivity issues (respect `prefers-reduced-motion`)

### 11.2 Component Library

Key reusable components (platform: RN = React Native only, Web = web only, Both = shared logic):

| Component | Platform | Variants |
|---|---|---|
| ActivityCard | Both | preview, detail, skeleton loading |
| SkillBadge | Both | 7 skill variants, active/inactive |
| AgeBandChip | Both | 6 age band variants, selected/unselected |
| StreakCounter | Both | default, milestone (7/30/100 day), broken |
| ProgressBar | Both | by-skill colours, animated fill |
| ChildAvatar | Both | 8 presets, size variants (sm/md/lg) |
| PaywallSheet | RN | bottom sheet; plan options |
| PaywallModal | Web | modal overlay; plan options |
| BottomTabBar | RN | 4 tabs, active/inactive, badge count |
| EmptyState | Both | illustration + message + optional CTA |
| LoadingState | Both | skeleton screens per context |
| ErrorState | Both | illustration + message + retry CTA |
| BadgeIcon | Both | earned/locked states, badge type variants |
| DatePicker | RN | iOS/Android native pickers |
| EmojiReactionPicker | RN | 5 emoji options, selected state |

### 11.3 Accessibility Requirements

- **Standard:** WCAG 2.1 Level AA minimum
- **Touch targets:** Minimum 44×44 pt on mobile (iOS HIG and Material Design guidance)
- **Colour contrast:** Minimum 4.5:1 for body text; 3:1 for large text and UI components
- **Screen reader:** Full VoiceOver (iOS) and TalkBack (Android) support for all interactive elements and the core loop (onboarding → activity → complete)
- **Dynamic text:** All text sizes must scale with system font size settings on iOS and Android
- **Focus management:** On navigation, focus moves to the correct element (critical for keyboard / switch-access users)

---

## Section 12: Security, Privacy & Compliance

### 12.1 Data Privacy

**GDPR (UK + EU):**
- Lawful basis for processing parent data: Contractual necessity (account, subscription) + Legitimate interest (analytics, app improvement)
- Data minimisation: only collect data required for stated purpose
- Right to erasure: account deletion triggers soft delete → anonymisation of all personally identifiable data within 30 days
- Data portability: parents can request export of their account data (roadmap — not Phase 1)
- UK ICO registration required before launch

**COPPA / GDPR-K (child data):**
- Children never directly interact with or provide data to the app
- All child profile data (name, DOB, avatar) is provided by the parent
- No persistent identifiers, no behavioural tracking, no advertising targeted at children
- Privacy policy must include specific COPPA disclosure
- `display_name` for children must never include surnames (enforced by UX guidance, not technically)

**Privacy policy must cover:**
- What data is collected and why
- How it is stored and for how long
- Third-party services used (Stripe, Firebase, Supabase, analytics provider)
- Children's data handling under COPPA/GDPR-K
- Cookie policy (web)
- Contact details for data requests

### 12.2 Data Retention

| Data Type | Retention | Post-deletion |
|---|---|---|
| User account data | Life of account | Anonymised within 30 days of deletion |
| Child profiles | Life of account | Soft-deleted with account; anonymised within 30 days |
| Activity completion data | Life of account | Anonymised within 90 days of account deletion |
| Subscription events | 7 years | Not deleted (financial compliance) |
| Push notification tokens | 90 days from `last_seen_at` | Automatically purged by cron |
| Analytics events | `[DECISION REQUIRED: per analytics provider's policy]` | — |

### 12.3 API Security

- All endpoints require authentication except: `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, webhook endpoints (authenticated via signature)
- Webhook endpoints: always verify provider signatures before processing (Stripe, Apple, Google)
- Rate limiting: defined in Section 5.3
- Input validation: all DTOs validated with `class-validator` in NestJS; never trust client input
- SQL injection: prevented by using parameterised queries via Prisma ORM (or TypeORM — `[DECISION REQUIRED]`)
- XSS: all user-generated content (parent notes, child names) sanitised before storage and escaped on render
- PCI compliance: card data never touches the application server — handled entirely by Stripe
- OWASP Top 10 review required before Phase 1 launch
- Penetration test recommended before Phase 3 launch (or at 10,000 MAU, whichever comes first)

---

## Section 13: Testing Strategy

### 13.1 Unit Tests
- Coverage target: ≥ 80% line coverage on all NestJS service classes
- Framework: Jest (NestJS + Next.js)
- Mandatory unit test coverage: entitlement service, daily activity selection algorithm, streak calculation, badge award logic, age band calculation
- React Native: React Native Testing Library for component tests

### 13.2 Integration Tests
- All API endpoints covered by integration tests running against a dedicated test PostgreSQL database (seeded fresh per test run)
- Payment integration tests: Stripe test mode, Apple Sandbox, Google Play test track
- Framework: Jest + Supertest for API; Prisma seeding for DB state

### 13.3 End-to-End Tests
Critical paths requiring E2E coverage (Playwright for web, Detox for React Native):
1. Full onboarding flow → first activity completed
2. Subscribe via Stripe → entitlement active → access library
3. Complete 7 consecutive days → streak = 7 → week-warrior badge awarded [P2]
4. Add 4 child profiles on Family Plan → attempt 5th → error shown [P2]

### 13.4 Device Matrix

**iOS:** minimum iOS 16 (covers ~95% of iOS market at time of writing)
- Test devices: iPhone SE (small screen), iPhone 14 (standard), iPhone 14 Plus (large screen)

**Android:** minimum API level 29 (Android 10)
- Test devices: Small budget device (e.g., Pixel 3a), mid-range (Pixel 6), large screen (Samsung Galaxy S23+)

### 13.5 Performance Benchmarks

| Metric | Target |
|---|---|
| API p95 response time (all endpoints) | < 500ms |
| `GET /activities/today/:childId` (cache hit) | < 100ms |
| App cold start time (iOS + Android) | < 3 seconds |
| Activity library load (first page) | < 300ms |
| Time to interactive (Next.js web, first load) | < 2.5s (LCP) |

### 13.6 Accessibility Testing
- Automated: axe-core (integrated into Playwright for web); Android Accessibility Scanner
- Manual: VoiceOver on iOS through full core loop; TalkBack on Android through full core loop
- Frequency: accessibility check before each phase launch

---

## Section 14: Launch & Operations

### 14.1 App Store Requirements

**iOS (App Store):**
- Age rating: 4+ (no objectionable content, parental controls not required)
- Privacy nutrition label: data types collected (name, email, usage data, identifiers)
- App Review notes: explain the parent/child dynamic and why no child login exists
- Required metadata: app description (4000 chars max), keywords, screenshots (6.5" iPhone, 12.9" iPad), preview video (optional)
- In-app purchase products must be configured in App Store Connect before submission

**Android (Google Play):**
- Content rating: PEGI 3 / ESRB Everyone (questionnaire-based)
- Data safety section: complete for all data types collected
- Target API level: current Google Play requirement (API 34 at time of writing — verify at launch)
- In-app products must be configured in Google Play Console before submission
- Initial release: closed testing → open testing → production (phased rollout recommended)

### 14.2 Deployment Architecture

**Environments:**

| Environment | Purpose | Data |
|---|---|---|
| Development | Local developer machines | Seeded local DB |
| Staging | Pre-release testing | Sanitised copy of prod data |
| Production | Live users | Live data |

**Environment variables:** All secrets stored in environment-specific secret managers (e.g., Vercel env vars, Railway secrets). Never committed to version control. Full list in Appendix E.

**Database migrations:**
- Managed with Prisma Migrate (or equivalent — `[DECISION REQUIRED]`)
- All migrations are backwards-compatible (no column drops without a deprecation period)
- Staging migration run and verified before applying to production
- Rollback: maintain ability to roll back the last migration without data loss

**Deployment pipeline:**
- API: merge to `main` → GitHub Actions → test → build Docker image → deploy to hosting provider (zero-downtime rolling deploy)
- Next.js (web + admin): Vercel automatic deploy on merge to `main`
- Mobile: EAS Build on merge to `release` branch → TestFlight / Internal Test Track → manual promotion to production

### 14.3 Support Operations

**In-app Help (FAQ categories at launch):**
- Getting started / onboarding issues
- Subscription and billing
- Activity library and daily card
- Child profiles
- Progress and streaks
- Technical issues (can't log in, app crashing)

**Support tooling:** `[DECISION REQUIRED: Intercom / Crisp / Zendesk — recommend Intercom for in-app chat + knowledge base]`

**Admin subscription override:** Support agents can manually set `subscriptions.status` to `active` and set a `current_period_end` date via the admin panel to resolve billing edge cases.

**Known Phase 1 limitations (communicate proactively):**
- Single child profile only (multi-child coming in Phase 2)
- No push notifications at launch (coming in Phase 2)
- No saved activities (coming in Phase 2)
- English only (additional languages coming in Phase 3)

---

## Appendices

### Appendix A: Competitor Analysis Matrix

| Feature | ChampionKids | GoNoodle | Kinedu | BrainPOP | Highlights for Children |
|---|---|---|---|---|---|
| Parent-led coaching | ✓ | — | Partial | — | — |
| Age bands 1–12 | ✓ | 3–12 | 0–3 | 6–13 | 2–12 |
| 7 skill categories | ✓ | Movement/mindfulness only | Developmental only | Academic only | Mixed |
| 5-min zero-prep format | ✓ | — | — | — | — |
| No child login required | ✓ | — | ✓ | — | — |
| Subscription | £4.99/mo | Free/Ad-supported | £9.99/mo | £9.99/mo | £7.99/mo |
| Family plan | ✓ [P2] | N/A | — | — | — |
| Progress tracking | ✓ | — | ✓ | — | — |
| Push notifications | ✓ [P2] | — | ✓ | — | — |
| iOS + Android + Web | ✓ | iOS + Android | iOS + Android | All | iOS + Android |

**Gap identified:** No direct competitor combines parent-as-coach framing + daily 5-min format + cross-age coverage (1–12) + 7 skill dimensions. ChampionKids owns this specific positioning.

---

### Appendix B: Sample Activities

**Age band 1–2 | Skill: Emotional Intelligence**
*Title:* "The Feelings Face Game"
*Coaching prompt:* Sit with your toddler and make a happy face. Say "Happy!" and smile big. Then make a sad face and say "Sad!" Let them copy you. Take turns making different faces — surprised, sleepy, silly. Name each feeling as you go.
*Follow-up questions:* "Can you show me a happy face?", "What makes you feel happy?"
*Parent tip:* Keep it light and playful — laugh when they make silly faces!

**Age band 3–4 | Skill: Creativity**
*Title:* "The Invention Game"
*Coaching prompt:* Pick up any everyday object near you — a spoon, a sock, a cup. Ask your child: "If this wasn't a [object], what else could it be?" Encourage as many wild ideas as possible. There are no wrong answers!
*Follow-up questions:* "What's the silliest thing it could be?", "Could it be a spaceship? A hat? What else?"
*Parent tip:* Join in! The more ridiculous your suggestions, the more they'll open up.

**Age band 5–6 | Skill: Resilience**
*Title:* "The Try Again Story"
*Coaching prompt:* Think of something you tried and failed at as a child — riding a bike, learning to swim, a school test. Tell your child the story, including how it felt and what happened when you kept trying. Keep it real and a little funny.
*Follow-up questions:* "Have you ever tried something that was really hard?", "What do you do when something is too tricky at first?"
*Parent tip:* Vulnerability is powerful here. Kids need to see that adults struggle too.

**Age band 7–8 | Skill: Critical Thinking**
*Title:* "The Desert Island Choice"
*Coaching prompt:* Tell your child: "You're stuck on a desert island and can only bring 3 things. What do you choose?" Then ask them to explain WHY they chose each one. Push back gently: "But what if it rains? Would you still choose that?" Encourage them to defend their reasoning.
*Follow-up questions:* "Would your choices change if you could bring a friend?", "What's the most important thing and why?"
*Parent tip:* This is about reasoning, not the "right" answer. Probe every choice!

**Age band 9–10 | Skill: Leadership**
*Title:* "The Problem Solver"
*Coaching prompt:* Ask your child to think of one problem in your home, school, or neighbourhood — it can be big or small. Then challenge them: "If you were in charge, what would you do to fix it?" Have them walk you through their plan step by step.
*Follow-up questions:* "Who would you need to help you?", "What's the first thing you'd do?", "What might go wrong?"
*Parent tip:* Resist fixing their plan — let them own it. Your job is to ask questions, not solve it for them.

---

### Appendix C: Figma Wireframes

`[PLACEHOLDER: Link to Figma workspace to be added when design begins]`

---

### Appendix D: Analytics Event Taxonomy

Full event list with properties and trigger conditions:

| Event Name | Properties | Trigger |
|---|---|---|
| `app_opened` | `platform`, `is_first_open`, `session_id` | App enters foreground |
| `screen_viewed` | `screen_name`, `platform` | Screen becomes active |
| `onboarding_started` | `platform` | Step 1 shown |
| `onboarding_step_completed` | `step_number` (1–4) | Each step submitted |
| `onboarding_completed` | `time_to_complete_ms` | Step 4 submitted |
| `onboarding_abandoned` | `last_step_completed` | App reopened before onboarding complete |
| `child_profile_created` | `age_band`, `skill_focus_count` | Child created |
| `activity_viewed` | `activity_id`, `skill_category`, `age_band`, `source` (`today`/`library`) | Activity detail opened |
| `activity_completed` | `activity_id`, `skill_category`, `age_band`, `reaction_emoji`, `source` | Completion recorded |
| `library_filtered` | `filter_type` (`skill`/`age_band`/`search`), `filter_value` | Filter applied |
| `paywall_triggered` | `trigger_point`, `current_plan` | Paywall shown |
| `paywall_dismissed` | `trigger_point` | Paywall closed without action |
| `subscription_started` | `plan_type`, `platform`, `is_trial_conversion` | Entitlement activated |
| `subscription_cancelled` | `plan_type`, `platform`, `days_active` | Cancellation recorded |
| `streak_updated` | `new_streak_length`, `child_id_hash` | Streak incremented |
| `streak_broken` | `streak_length_at_break`, `child_id_hash` | Streak reset to 0 |
| `badge_earned` | `badge_slug`, `badge_type`, `child_id_hash` | Badge awarded [P2] |
| `notification_received` | `notification_type` | FCM notification received [P2] |
| `notification_opened` | `notification_type` | Notification tapped [P2] |
| `referral_link_shared` | `share_method` (copy/native-share) | Referral link shared [P2] |

---

### Appendix E: Environment Variable Registry

All values are placeholders. Actual secrets stored in environment-specific secret managers.

**API (NestJS):**
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
APPLE_APP_BUNDLE_ID=app.championkids.ios
APPLE_IAP_SHARED_SECRET=xxx
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{...}'
FIREBASE_ADMIN_SDK_JSON='{...}'
SENTRY_DSN=https://xxx@sentry.io/xxx
ANALYTICS_WRITE_KEY=xxx
EMAIL_API_KEY=xxx
```

**Next.js Web:**
```
NEXT_PUBLIC_API_BASE_URL=https://api.championkids.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

**React Native:**
```
EXPO_PUBLIC_API_BASE_URL=https://api.championkids.app
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
GOOGLE_SERVICES_JSON='{...}'
GOOGLE_SERVICES_PLIST='{...}'
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

### Appendix F: Third-Party Service Accounts Checklist

Before Phase 1 launch, the following accounts must be created and configured:

- [ ] Supabase project (database + auth)
- [ ] Stripe account (test mode verified before live)
- [ ] Apple Developer account (required for IAP + App Store submission)
- [ ] Google Play Console account
- [ ] Firebase project (Cloud Messaging)
- [ ] Sentry organisation (4 projects: api, web, admin, mobile)
- [ ] Analytics provider account `[DECISION REQUIRED]`
- [ ] Email provider account `[DECISION REQUIRED]`
- [ ] Hosting provider account for API `[DECISION REQUIRED]`
- [ ] Vercel account (web + admin Next.js)
- [ ] GitHub repository + GitHub Actions enabled
- [ ] Domain: `championkids.app` (or equivalent) registered and DNS configured
- [ ] SSL certificates (auto via Vercel + hosting provider)

---

### Appendix G: Open Questions Log

All `[DECISION REQUIRED]` items tracked here. Each must be resolved before implementation of the affected feature begins.

| # | Question | Affects | Owner | Deadline |
|---|---|---|---|---|
| 1 | Expo managed workflow vs. bare React Native workflow? | All mobile development | Engineering lead | Week 1 |
| 2 | ORM choice: Prisma vs TypeORM? | API database layer | Engineering lead | Week 1 |
| 3 | API hosting: Railway vs Render vs Fly.io? | Infrastructure | Engineering lead | Week 1 |
| 4 | Analytics provider: Mixpanel vs Amplitude vs PostHog? | Analytics, Section 5.7 | Product lead | Week 2 |
| 5 | Email provider: Resend vs SendGrid vs Postmark? | Transactional email | Engineering lead | Week 2 |
| 6 | Brand colours and typography — confirmed design system? | Design, Section 11.1 | Design lead | Week 2 |
| 7 | Activity content versioning strategy? | Content delivery, Section 5.5 | Engineering lead | Week 4 |
| 8 | AI personalisation approach (Phase 3)? | Section 4.10 | Engineering lead | Week 13 |
| 9 | Additional languages for Phase 3? | Section 4.13 | Product lead | Week 13 |
| 10 | Support tooling: Intercom vs Crisp vs Zendesk? | Section 14.3 | Operations lead | Week 8 |
| 11 | Community moderation: pre-moderation vs post-moderation? | Section 4.12 | Product lead | Week 21 |
