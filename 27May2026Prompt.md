# 🍕 FoodZone — Master Enhancement Prompt v3.0

> **Project:** FoodZone — Social + Food Ordering Super-App  
> **Status:** Phases 1–24 Complete (133 tests passing, 27 mobile routes, full CI)  
> **Goal:** Elevate every layer — UI, UX, performance, features — beyond Instagram & Facebook  
> **Prepared by:** Abhishek Prajapati | Prompt Version: 3.0 | 2026

---

## 📋 Context for the AI

You are working on **FoodZone**, a production-grade, full-stack super-app that combines a social media platform (posts, stories, chat, follows) with a food ordering marketplace (multi-vendor, real-time tracking, payments). The project is **fully built through Phase 24** across three tiers:

- **Backend:** Laravel 11, MySQL 8, Redis, Laravel Reverb (WebSockets), Laravel Scout + Meilisearch, Razorpay/Stripe payments, queued jobs, Sanctum auth — **133 tests passing**
- **Web:** Next.js 16 (App Router, React 19, Turbopack), Zustand + TanStack Query, Tailwind CSS v4, shadcn/ui, Recharts, Laravel Echo — **27 pages built**
- **Mobile:** Expo SDK 55 (React Native 0.83, React 19, expo-router), StyleSheet-based styling, SecureStore auth, expo-notifications, expo-image-picker — **27 routes bundling on iOS + Android + Web**

### What's Already Built (Never Re-implement These)

- Full auth: register, login, email verify, password reset, 2FA scaffold, rate limiting
- Social: posts (text/image/video/polls), stories, likes, nested comments, follow system, blocks, hashtags, mentions
- Food ordering: vendor discovery, menu with variants/add-ons, cart, checkout with vouchers, real-time order tracking, ratings, reorder
- Chat: 1:1 DMs, real-time via Reverb, read receipts, message reactions
- Notifications: in-app, push (Expo), email, real-time badges
- Admin console: dashboard, user/vendor management, bulk actions, analytics with charts, audit logs
- Vendor dashboard: orders, menu CRUD, analytics, operating hours, reviews
- Delivery partner: registration, order claiming, pick-up/deliver flow
- Payments: Razorpay + Stripe + Mock gateway, webhooks, refunds
- Search: global search, Meilisearch integration with DB fallback
- Favorites, address book, reorder
- Infrastructure: Redis caching, queued jobs, Reverb WebSockets, CI/CD pipeline, security headers, audit logs

---

## 🎯 Master Enhancement Goals

Work through the following phases **in order**. Each phase is a coherent, independently deployable improvement slice. Read all context before starting any phase.

---

## PHASE 25 — Public Landing Page + Role-Separated Auth

**Priority: CRITICAL — Do this first**  
**Tiers:** Web  
**Goal:** Create a stunning public-facing landing page with separate login/signup flows for users, vendors, and admins.

### 25.1 Landing Page (`/` — public, unauthenticated)

Build a world-class marketing landing page at the root URL. When a logged-in user visits `/`, redirect to `/feed`. When unauthenticated, show the landing page.

**Sections to build (in order):**

**Hero Section**

- Full-viewport dark hero with animated gradient background (radial gradients animating slowly — deep purple/orange/black)
- Floating food illustration or lottie animation (use CSS/SVG if no lottie available)
- Headline: `"Where Food Meets Community"` — large, bold, gradient text (orange to pink)
- Subheadline: `"Order from local restaurants. Share your food journey. Connect with food lovers."`
- Two CTA buttons: `"Get Started Free"` → `/register` and `"Order Food Now"` → `/login`
- Social proof strip: `"50,000+ orders delivered · 2,000+ restaurants · 100,000+ food lovers"`
- Subtle animated particles or floating food emoji in the background

**Features Section**

- Section title: `"Everything you love, in one app"`
- Three feature cards side by side (glass morphism style):
  - 🍔 **Order Food** — Browse 2000+ restaurants, real-time tracking, instant delivery
  - 📱 **Social Feed** — Share food posts, follow foodies, discover trending restaurants
  - 💬 **Connect** — Chat with friends, share recommendations, build your food community
- Each card has an animated icon, headline, description, and subtle hover lift effect

**How It Works Section**

- Numbered steps with connecting line:
  1. Create your account (30 seconds)
  2. Discover restaurants near you
  3. Order & track in real-time
  4. Share your experience with the community
- Alternating layout (text left / illustration right)

**Social Proof / Stats Section**

- Large animated counter numbers (count up on scroll into view):
  - `50K+` Happy Customers
  - `2K+` Partner Restaurants
  - `1M+` Orders Delivered
  - `4.9★` Average Rating
- Dark card with orange gradient border

**Trending Food Section**

- Horizontal scrolling card row of food category chips (Biryani, Pizza, Burgers, Sushi, Desserts, etc.)
- Each chip links to `/vendors?category=X`

**App Download Section**

- Side-by-side: mockup phone image (CSS-drawn or placeholder) + download badges
- `"Take FoodZone anywhere"` headline
- App Store + Play Store badges (linked, with UTM params)

**Vendor CTA Section**

- Dark section with gradient: `"Are you a restaurant owner?"`
- `"Join 2,000+ vendors already growing on FoodZone"`
- `"Start selling today"` button → `/vendor/register`
- Bullet benefits: Free setup · Real-time analytics · Grow your customer base

**Footer**

- Logo + tagline
- Links: About, Careers, Blog, Press
- For Vendors: Partner with us, Vendor Login, Vendor Register
- Legal: Terms, Privacy Policy, Cookie Policy
- Social icons (Instagram, Twitter/X, Facebook, YouTube)
- Copyright

### 25.2 Separate Auth Pages

**User Login** (`/login`)

- Clean card-based layout, centered, dark background
- Logo at top
- Email + password fields with floating labels
- "Forgot password?" link
- "Sign in" button (orange gradient)
- Divider: "or continue with"
- Google OAuth button (scaffold even if not wired yet — Phase 2)
- Bottom: "Don't have an account? **Sign up**" → `/register`
- Link: "Are you a vendor? **Vendor Login →**" and "Admin? **Admin Login →**"

**User Register** (`/register`)

- Multi-step form (3 steps with progress bar):
  - Step 1: Name, Username (live availability check), Email
  - Step 2: Password, Confirm Password, Date of Birth
  - Step 3: Food preferences (multi-select chips: Vegetarian, Non-Veg, Vegan, etc.) + location city
- Smooth step transitions with Framer Motion-like CSS transitions
- "Already have an account? **Sign in**"

**Vendor Register** (`/vendor/register`)

- Dedicated vendor registration page (separate from user register)
- Headline: `"Partner with FoodZone"` + subtext `"Join thousands of restaurants growing with us"`
- Fields: Business Name, Owner Name, Email, Phone, Business Address, Business Type (Restaurant/Cloud Kitchen/Bakery/etc.), GST/Tax ID (optional), Description, expected order volume
- Upload: Business License (file input, styled)
- Bank details: Account holder, Account number, IFSC/routing
- "I agree to FoodZone Vendor Terms" checkbox
- Submit → "Application received" success screen with expected review time
- Left panel (desktop): vendor benefits (animated stats, testimonials)

**Vendor Login** (`/vendor/login`)

- Same card design as user login but with orange/amber accent instead of purple
- Header: "Vendor Portal"
- Email + password
- After login, redirect to `/vendor` dashboard
- "Not a vendor yet? **Apply to join →**" → `/vendor/register`

**Admin Login** (`/admin/login`)

- Separate page at `/admin/login` (not linked publicly)
- Minimal, professional design — slate/neutral dark
- Header: "FoodZone Admin Console"
- Email + password + 2FA code field (shows after password is entered)
- No registration link (admin accounts are created server-side only)
- After login, redirect to `/admin` dashboard

**Implementation notes:**

- The existing `useAuthStore` routes to `/feed` after login — add a `role` check: `vendor`/`admin` roles get redirected to their dashboards
- Vendor login and user login can share the same `/auth/login` API endpoint (Sanctum already handles this)
- Add a `redirectAfterLogin(role)` utility: `user` → `/feed`, `vendor` → `/vendor`, `admin` → `/admin`, `delivery` → `/delivery`
- The `(app)` layout guard should check role and prevent vendors from accessing user-only routes and vice versa

---

## PHASE 26 — Design System Overhaul (UI Renaissance)

**Priority: HIGH**  
**Tiers:** Web + Mobile  
**Goal:** Rebuild the visual layer to be stunning, consistent, and faster than Instagram.

### 26.1 Design Token System (Web)

Extend `app/globals.css` with a comprehensive token set. **Never hardcode colors anywhere — always use tokens.**

```css
@theme {
  /* Brand */
  --color-brand: #ff6b35;
  --color-brand-light: #ff8c5a;
  --color-brand-dark: #e55a22;
  --color-brand-glow: rgba(255, 107, 53, 0.25);

  /* Backgrounds */
  --color-bg-base: #09090b;
  --color-bg-elevated: #111113;
  --color-bg-overlay: #18181b;
  --color-bg-card: #1c1c1f;
  --color-bg-hover: #222226;
  --color-bg-glass: rgba(255, 255, 255, 0.04);

  /* Surfaces */
  --color-surface-1: #27272a;
  --color-surface-2: #3f3f46;
  --color-surface-3: #52525b;

  /* Text */
  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-text-tertiary: #71717a;
  --color-text-disabled: #52525b;
  --color-text-inverse: #09090b;

  /* Borders */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.16);
  --color-border-brand: rgba(255, 107, 53, 0.4);

  /* Semantic */
  --color-success: #22c55e;
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-warning: #f59e0b;
  --color-warning-bg: rgba(245, 158, 11, 0.1);
  --color-danger: #ef4444;
  --color-danger-bg: rgba(239, 68, 68, 0.1);
  --color-info: #3b82f6;
  --color-info-bg: rgba(59, 130, 246, 0.1);

  /* Gradients */
  --gradient-brand: linear-gradient(135deg, #ff6b35, #ff4081);
  --gradient-brand-subtle: linear-gradient(
    135deg,
    rgba(255, 107, 53, 0.15),
    rgba(255, 64, 129, 0.08)
  );
  --gradient-card: linear-gradient(145deg, #1c1c1f, #111113);
  --gradient-hero:
    radial-gradient(
      ellipse at 30% 50%,
      rgba(255, 107, 53, 0.15) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse at 70% 20%,
      rgba(139, 92, 246, 0.1) 0%,
      transparent 50%
    ),
    #09090b;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-brand: 0 0 24px rgba(255, 107, 53, 0.3);
  --shadow-glow: 0 0 40px rgba(255, 107, 53, 0.15);

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Typography */
  --font-display: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-md: 17px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  --font-size-3xl: 48px;
  --font-size-hero: 72px;

  /* Motion */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
  --duration-page: 400ms;
}
```

### 26.2 Component Library Rebuilds

**Button Component** — Replace all basic buttons with a composable `<Button>` component:

- Variants: `primary` (brand gradient + shadow), `secondary` (surface bg), `ghost` (transparent), `danger` (red), `outline` (border only)
- Sizes: `xs`, `sm`, `md` (default), `lg`, `xl`
- States: loading spinner (inline), disabled (reduced opacity), success (brief checkmark animation)
- Icon support: `leftIcon`, `rightIcon` props
- Subtle scale on press: `transform: scale(0.98)` on active

**Card Component** — Reusable `<Card>` with variants:

- `default`: `bg-card` + border + `shadow-md`
- `elevated`: slight lift shadow, glassmorphism bg
- `interactive`: hover lift (`translateY(-2px)`) + border color change + glow
- `glass`: `backdrop-blur-xl` + semi-transparent bg
- All cards get `border-radius: var(--radius-lg)` and `border: 1px solid var(--color-border)`

**Input Component** — Floating label inputs:

- Label floats up on focus/fill
- Brand-colored focus ring (`box-shadow: 0 0 0 3px var(--color-brand-glow)`)
- Animated underline variant for minimal forms
- Error state: red border + shake animation + error message below
- Password toggle button built in
- Character count (optional)

**Avatar Component** — User avatars with:

- Sizes: `xs` (24px), `sm` (32px), `md` (40px), `lg` (48px), `xl` (64px), `2xl` (96px), `3xl` (128px)
- Fallback: initials on gradient background (deterministic color from username hash)
- Online indicator dot (green, animated pulse)
- Story ring: gradient border (`var(--gradient-brand)`) with gap — animated on hover
- Verified badge overlay (blue checkmark)
- Loading skeleton

**Badge/Chip Component:**

- Status badges: Online/Busy/Offline dots
- Category chips: rounded pill, outline and filled variants
- Notification count badge: positioned overlay with bounce animation on increment
- Vendor status: Pending/Approved/Rejected with semantic colors

### 26.3 Page Layout Improvements (Web)

**App Shell (`AppShell.tsx`):**

- Redesign the left sidebar to be more like a premium social app:
  - Logo at top (FoodZone wordmark with icon)
  - Navigation items: large icon + label, active state has brand gradient bg pill
  - User profile mini-card at bottom: avatar + name + username + settings cog
  - Collapsed state (icon-only) on medium screens, full on large
  - Role-specific nav items shown/hidden cleanly
- Top bar: only visible on mobile — logo centered, notification bell + DM icon right
- Main content area: `max-w-2xl` centered for social content, `max-w-4xl` for dashboards
- Right sidebar (desktop, 320px): "Who to Follow" suggestions, trending hashtags, active vendors nearby — lazy loaded

**Feed Layout:**

- Feed column: `max-w-[600px]` — same as Twitter/Instagram ratio
- Story bar at top (horizontal scrollable stories row)
- Infinite scroll with virtual list (only render visible items — use `react-virtual` or intersection observer pattern)
- "Back to top" floating button after scrolling 3 screens

### 26.4 Mobile Theme (`src/constants/theme.ts`)

Extend the mobile theme to match web tokens exactly:

```typescript
export const colors = {
  brand: "#FF6B35",
  brandLight: "#FF8C5A",
  brandDark: "#E55A22",
  bgBase: "#09090B",
  bgElevated: "#111113",
  bgCard: "#1C1C1F",
  bgOverlay: "#18181B",
  surface1: "#27272A",
  surface2: "#3F3F46",
  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  brand: {
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
};

export const radii = { sm: 6, md: 12, lg: 16, xl: 24, full: 9999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48 };
```

---

## PHASE 27 — Feed & Post Experience (Instagram-Killer)

**Priority: HIGH**  
**Tiers:** Web + Mobile + Backend  
**Goal:** Make the social feed feel world-class — smooth, fast, engaging.

### 27.1 Backend (`FoodZoneServer/`)

**Enhanced Feed Algorithm (`GET /feed`)**

- Add `?page=N&per_page=15` — already done. Improve ranking:
  - Posts from people you interact with most (reply/like frequency) score higher
  - Vendor posts you've ordered from score higher
  - Time-decay: older posts score progressively lower
  - Add a `source` field to each post in the feed response: `"following"` | `"suggested"` | `"sponsored"` — clients use this for labeling
- Add `GET /feed/suggested` — posts from non-followed users based on hashtag overlap with posts you've liked (DB query, no ML needed)
- Add `GET /posts/trending?hours=6` — posts with most engagement in last N hours
- Add `POST /posts/{id}/share` — record a share event (increments `shares_count`); already has `post_shares` table
- Add `GET /posts/{id}/shares` — who shared a post
- Add `POST /posts/{id}/save` + `DELETE /posts/{id}/save` + `GET /saved` — bookmark/save posts to a collection; use a `saved_posts` table (user_id, post_id, created_at)
- Add `GET /posts/{id}/liked-by` — paginated list of who liked a post (top 3 avatars shown inline)
- Add `GET /hashtags/trending` — top 10 hashtags by post count in last 24h
- Add `GET /hashtags/{tag}/posts` — posts for a hashtag feed

**Stories Endpoint**

- `GET /stories` — stories from followed users, grouped by user, not yet expired (already `stories` table exists)
- `POST /stories` — create a story (image or video, 24h expiry auto-set)
- `DELETE /stories/{id}` — delete own story
- `POST /stories/{id}/view` — record a view
- `GET /stories/{id}/views` — who viewed (own stories only)

**Post Polls**

- `POST /posts/{id}/polls/{option_id}/vote` — cast a vote (one per user)
- `GET /posts/{id}/polls` — results (percentages, total votes, user's vote)

**Tests:** `FeedAlgorithmTest` (suggested posts, trending), `StoriesTest`, `SavedPostsTest`, `PollTest`

### 27.2 Web — Feed Redesign

**Story Bar** (new component: `components/feed/StoryBar.tsx`)

- Horizontal scrollable row pinned above the feed
- First item: "Your Story" — your avatar with a `+` button; if you have a story, show it with the gradient ring
- Other items: followed users with stories, gradient ring border, username below
- Clicking opens a full-screen story viewer modal
- Story viewer: full-screen overlay, tap left/right to navigate, progress bars at top, swipe down to close, user info at top, time elapsed, react button

**PostCard — Complete Rebuild** (`components/feed/PostCard.tsx`)

- Header: avatar (with story ring if they have an active story), display name + username, follow button (if not following), timestamp, `•••` more menu (Edit, Delete, Report, Share link, Embed)
- `source` label: if `"suggested"` show subtle "Suggested" pill, if `"sponsored"` show "Sponsored" with info icon
- Body text: hashtags highlighted in brand color, @mentions tappable, "See more" truncation at 3 lines
- Media: full-width images, proper aspect ratios (1:1, 4:5, 16:9), multi-image carousel with dot indicators and swipe
- Poll: option buttons with fill bars showing %, total votes, your selection highlighted, locked after voting
- Reaction bar:
  - Like button: heart icon, on click — heart bounces and fills red, count increments optimistically
  - Comment count: clicking opens comment sheet
  - Share: opens share sheet (copy link, share to story, share to DM, share to external)
  - Save/bookmark: ribbon icon, filled when saved
  - Right-aligned: view count (eye icon + number)
- "Liked by **username** and **2,847 others**" — tappable, opens liked-by modal with follower avatars
- Comment preview: top comment with reply count below (collapsed by default)
- Vendor tag: if post tags a vendor, show a pill `🍽 Kitchen Palace` → taps to vendor page

**PostComposer — Rebuilt** (`components/feed/PostComposer.tsx`)

- Full-screen modal (drawer on mobile) with a rich compose experience
- Audience selector: Public / Followers / Only Me (dropdown with icons)
- Text area: auto-grows, hashtag highlighting in real-time, @mention autocomplete dropdown
- Attachment bar: 📷 Photo, 🎬 Video, 📊 Poll, 📍 Location, 😊 Feeling, 🏷 Tag Vendor, 🔗 Link
- Photo picker: opens `ImageUpload` with multi-select (up to 10), drag to reorder
- Poll builder: 2–4 option inputs + duration selector
- Posting: submit button goes to loading state → success → card animates into feed from top
- Character counter at 240+

**Comment Section** (`components/feed/CommentSection.tsx`)

- Bottom drawer (mobile) / inline expansion (desktop)
- Virtualized list for large comment threads
- Each comment: avatar, username, text, time, like count, Reply button
- Reply: indent slightly, show "Replying to @username"
- Swipe left on comment (mobile) → quick reply
- Input pinned at bottom: avatar + text field + emoji picker + send

**Trending Sidebar** (new component: `components/feed/TrendingSidebar.tsx` — desktop right panel)

- "Trending Hashtags" card: top 10 with post count
- "Suggested Accounts" card: 5 users with mutual follow count + Follow button
- "Nearby Restaurants" card: 3 vendor cards with order CTA
- "Flash Deals" card: active flash deals from vendors

### 27.3 Mobile Feed

**Stories component** (`src/components/story-bar.tsx`)

- Horizontal `FlatList` of story circles
- `StoryViewer` component: full-screen, `Animated` progress bars, tap zones

**PostCard improvements** (`src/components/post-card.tsx`)

- Double-tap to like (with heart burst animation using `Animated`)
- Swipe up on post to see comments
- Haptic feedback on like (`expo-haptics`)
- `Animated.spring` for like button bounce
- Share sheet: `expo-sharing` + native share

**Feed screen** (`src/app/(tabs)/index.tsx`)

- `FlashList` from `@shopify/flash-list` instead of `FlatList` (much faster for feeds)
- Stories bar above feed
- Pull-to-refresh with branded spinner (lottie or Animated)
- "New posts" banner when WebSocket signals new content

---

## PHASE 28 — Profile Experience (Next-Level)

**Priority: HIGH**  
**Tiers:** Web + Mobile + Backend  
**Goal:** Profiles that feel as rich as Instagram but unique to FoodZone.

### 28.1 Backend

- `GET /users/{username}` — extend response to include:
  - `posts_count`, `followers_count`, `following_count`
  - `top_food_tags`: top 5 food tags from their posts (aggregate)
  - `orders_placed` (own profile only): total orders, favourite vendor
  - `member_since`: joined date formatted
  - `mutual_followers`: up to 3 mutual follower objects (for "Followed by X, Y, Z")
  - `is_verified`: platform-verified account flag (admin can set)
- `PUT /users/profile` — extend to accept: `website`, `location` (free text city), `bio` (up to 150 chars), `is_private`; avatar and cover handled via media upload already
- `GET /users/{username}/food-journey` — paginated posts that have a vendor tag or food item tag
- `GET /users/{username}/saved` — saved posts (own profile only)
- Add `story_highlights` table management endpoints (already in schema):
  - `POST /story-highlights` — create highlight from story ids
  - `DELETE /story-highlights/{id}`
  - `GET /users/{username}/highlights`
- `POST /users/{id}/report` — report a user for violations
- `GET /users/{username}/tagged-in` — posts where username is tagged

### 28.2 Web — Profile Page (`/u/[username]`)

**Profile Header:**

- Cover photo (full-width, 3:1 ratio, blurred gradient overlay at bottom) with edit button (own profile)
- Avatar: large (80px on mobile, 100px on desktop), bordered, positioned overlapping cover
- Verified badge if `is_verified`
- Name + username + bio (rich text: hashtags and links clickable)
- Stats row: Posts count, Followers count (tappable → modal list), Following count (tappable)
- Website link with external icon
- Location pin + city
- "Followed by @alice, @bob, and 47 others" — mutual follower callout
- CTA buttons:
  - Own profile: `Edit Profile` + `Share Profile` + `Settings`
  - Other user: `Follow`/`Following` (dropdown: Unfollow/Mute/Block on following state) + `Message` + `•••` (Report/Block)
  - Vendor: additional `Order Now` button

**Story Highlights Bar** (below profile header):

- Horizontal scrollable circles with cover image + label
- `+` button to create new highlight (own profile)

**Profile Content Tabs:**

- Grid (default): 3-column photo grid — hover shows like + comment count overlay
- List: full post cards
- Food Journey: posts with vendor/food tags
- Saved: only visible on own profile
- Tagged: posts where user is tagged

**Profile Edit Modal/Drawer:**

- Side-by-side (desktop): avatar on left, form fields on right
- Fields: Name, Username (availability check), Bio (150 char counter), Website, Location, Gender (optional), Date of birth (visibility toggle)
- Avatar change: click avatar → opens image upload
- Cover change: click cover → opens image upload
- Privacy toggle: Public/Private account
- Save with optimistic update + rollback on error

### 28.3 Mobile — Profile Screen

- Parallax scroll on cover photo (moves slower than content)
- Avatar centered above content, with edit pencil icon (own profile)
- Highlights horizontal scroll
- Grid/List/Food tab switcher
- Profile edit screen: dedicated `/edit-profile` screen (not modal on mobile)

---

## PHASE 29 — Chat System v2 (WhatsApp-Level Quality)

**Priority: HIGH**  
**Tiers:** Backend + Web + Mobile  
**Goal:** Make chat feel as good as WhatsApp/Telegram.

### 29.1 Backend

**Conversations — Extensions:**

- Add `is_pinned` (per user) to `conversation_user` pivot
- Add `is_muted` (per user) with `muted_until` to `conversation_user`
- `PUT /conversations/{id}/pin` and `PUT /conversations/{id}/mute`
- Add `typing_status` broadcast event: `POST /conversations/{id}/typing` → broadcasts `user.typing` on the conversation channel (TTL: 3 seconds)
- Add message **reactions**: `POST /messages/{id}/react` (emoji string), `DELETE /messages/{id}/react` — store in `message_reactions` (already in schema)
- Add message **reply-to**: `replied_to_message_id` nullable on messages — `MessageResource` includes replied-to message snippet
- Add **forward message**: `POST /conversations/{c}/forward` with `message_id` — creates a copy in the target conversation
- Add **delete message** for self: `DELETE /messages/{id}` (soft delete, shows "This message was deleted")
- Add **starred messages**: `POST /messages/{id}/star`, `GET /conversations/{id}/starred`
- Add **media messages**: message `type` can be `text|image|voice|file` — `body` for text, `media_url` for others
- Add **search within conversation**: `GET /conversations/{id}/search?q=term`

### 29.2 Web — Chat UI Rebuild

**Conversation List** (`/messages`):

- Left panel (350px, dark):
  - Search bar at top (searches across conversations)
  - `+ New Message` button
  - Filter tabs: All / Unread / Pinned
  - Conversation row: avatar, name, last message preview, timestamp, unread badge
  - Pinned conversations at top with pin icon
  - Muted with muted icon
  - Right-click / hover: Pin, Mute, Delete, Clear chat
  - Empty state: illustration + "No messages yet. Start a conversation!"
- Right panel: conversation thread or empty state

**Thread View** (`/messages/[id]`):

- Header: avatar, name, online status dot, typing indicator, call buttons (future), info icon
- Message area:
  - Date separators: `Today`, `Yesterday`, `Dec 15, 2025`
  - Message bubbles: brand color for sent (right), dark surface for received (left)
  - Rounded corners: top corners rounded differently based on adjacent message from same sender (bubble grouping — messages within 60s grouped visually)
  - Images: full-width in bubble, tap to open lightbox
  - Reactions: emoji row below bubble, tappable (shows who reacted)
  - Reply-to: quoted snippet above bubble with left border line
  - "Deleted" style: italic grey text
  - Read receipt: single check (sent), double check (delivered), blue double check (read)
  - Hover: show timestamp + action icons (React, Reply, Forward, Star, Delete) as a floating toolbar
- Message Input:
  - Textarea (auto-grow, max 5 lines)
  - Left: emoji picker, image attach, file attach, audio record
  - Right: send button (arrow) — brand gradient, spins to loading on send
  - Active reply/forward: dismissable bar above input showing quoted message
  - Typing indicator: shows "Alice is typing..." with animated dots when received

**New Message Modal:**

- Search for users
- Show mutual follows first
- Multi-select for group chat (Phase 2)

### 29.3 Mobile — Chat UI Rebuild

- `FlashList` for message list (better performance)
- `KeyboardAvoidingView` with proper `behavior` per platform
- Animated bubble entrance (slide + fade from send side)
- Long-press message → action sheet: React / Reply / Forward / Star / Delete / Copy
- Swipe right on message to reply (like Telegram)
- Image messages: tap to full-screen lightbox (`expo-image` for fast loading)
- Voice message: record with hold-to-record (expo-av), waveform visualization (animated bars)
- Typing indicator: three animated dots in a bubble

---

## PHASE 30 — Vendor Store (Best-in-Class Food App UI)

**Priority: HIGH**  
**Tiers:** Web + Mobile + Backend

### 30.1 Backend

- `GET /vendors/{id}/menu` — add `popular_items`: IDs of top 5 ordered items (so clients can badge them)
- `GET /vendors/{id}` — extend: `delivery_estimate_min`, `delivery_estimate_max`, `is_open`, `opens_at` (if closed — next open time), `tags` (cuisine type array), `has_offer` (any active voucher)
- `POST /vendors/{id}/report` — report a vendor
- `GET /vendors/nearby?lat=&lng=&radius=` — vendors sorted by distance (use Haversine formula in SQL or compute in PHP; add lat/lng to `vendor_stores`)
- `GET /items/trending` — globally most ordered items in last 24h (cross-vendor)

### 30.2 Web — Vendor Store Page (`/vendors/[id]`)

**Vendor Hero:**

- Full-width banner (aspect ratio 3:1 on desktop, 2:1 on mobile) with dark gradient overlay at bottom
- Logo floating bottom-left of banner
- Star rating + review count (tappable)
- Tags: cuisine chips (Indian, Chinese, Fast Food)
- Open status: green `●  Open` or red `●  Closed · Opens at 11:00 AM`
- Delivery info strip: `🚴 25–35 min  ·  ₹2.00 delivery  ·  Free above ₹200`
- CTA: `Favorite ♡` and `Share ↗`

**Sticky Category Navigation:**

- Horizontal tabs for menu categories — sticks to top when scrolled past header
- Active category highlighted
- Clicking scrolls to that category section (smooth scroll, offset for sticky nav)

**Menu Item Cards:**

- Image on right, info on left (like Zomato)
- Name, description (2 lines, expandable), price, rating
- "Best Seller" / "New" / "Popular" badge
- Veg/Non-veg indicator dot (green/red)
- `+` button (adds to cart with animation) or stepper if already in cart

**Sticky Cart Panel** (desktop right side):

- Appears when cart has items
- Item list with steppers and remove
- Subtotal, delivery, discount, total
- Promo code input with apply
- "Proceed to Checkout" button

**Cart Drawer** (mobile — sheet from bottom):

- Handle bar to drag
- Same content as desktop cart panel

### 30.3 Mobile — Vendor Screen

- Parallax hero image
- Sticky category tab bar with ScrollView
- `FlashList` for menu items
- Smooth cart drawer with `react-native-reanimated` (or `Animated` API)
- Item detail bottom sheet on tap: full image, full description, variant/add-on picker

---

## PHASE 31 — Vendor Dashboard v3 (Professional Business Console)

**Priority: MEDIUM**  
**Tiers:** Web + Backend

### 31.1 Backend

- `GET /vendor/analytics/items?days=N` — per-item revenue + order count + rating (not already separate)
- `GET /vendor/customers` — anonymized customer list with: order count, total spend, last order date, avg rating given; support for `?flagged=1` (suspicious behavior)
- `POST /vendor/customers/{userId}/warn` — send a system DM warning to a customer
- `POST /vendor/customers/{userId}/block` — block a customer from ordering from this vendor (stores in `vendor_user_blocks` table); `DELETE` to unblock
- `GET /vendor/inventory` + `POST /vendor/inventory` + `PUT /vendor/inventory/{id}` — ingredient CRUD (schema already has `inventory_items`)
- `POST /vendor/inventory/{id}/adjust` — manual stock adjustment with reason
- `GET /vendor/payouts` — payout history list (stub with calculated data from orders)
- `GET /vendor/vouchers` + `POST/PUT/DELETE` — full voucher CRUD (already in schema)
- `POST /vendor/flash-deals` — create flash deal with start/end time and discount

### 31.2 Web — Vendor Dashboard

**Dashboard Home** (`/vendor`):

- Today's stats ticker: Orders | Revenue | Avg Order Value | Pending Orders (real-time auto-refresh every 30s)
- Store open/close toggle — prominent, can't miss it
- Quick actions: "Add Menu Item", "Create Voucher", "View Orders"
- Revenue chart (7/14/30d) already built — enhance with area fill gradient
- Top items chart: horizontal bar chart (easiest to read for rankings)
- Customer satisfaction: donut chart of ratings (5★/4★/3★/etc)
- Recent orders table (last 5, with quick-action buttons)

**Orders Page** (`/vendor/orders`):

- Kanban board view (columns: New / Accepted / Preparing / Ready / Delivered / Cancelled)
- Each column is a scrollable card lane
- Order card: order number, customer first name, items summary, total, time elapsed, action button
- NEW orders: flash/pulse animation on card, sound alert (use `Audio API`)
- Filter toggle: Kanban / List view
- Order detail panel slides in from right when card clicked

**Menu Management** (`/vendor/menu`):

- Category reordering via drag-and-drop
- Item grid view (image thumbnails) vs list view
- Bulk actions: select all → toggle availability / delete
- Availability toggle has a confirmation if item is in active orders
- Quick-edit inline (name + price) without opening full form

**Customers Page** (`/vendor/customers`):

- Table: Avatar, Name (anonymized as "Customer #1234"), Orders, Total Spend, Last Order, Status
- Flagged customers highlighted in amber
- Click → Customer detail drawer: order history, notes, block/warn actions

**Inventory Page** (`/vendor/inventory`):

- Table: Ingredient name, Unit, Stock, Threshold, Status (OK / Low / Out)
- Status row colors: OK (normal), Low (yellow bg), Out (red bg)
- Inline adjust button: modal with +/- quantity + reason
- Low stock alerts summary card at top

**Vouchers Page** (`/vendor/vouchers`):

- Active vouchers grid with QR code preview
- Create voucher wizard: 4-step form
- Redemption chart per voucher

---

## PHASE 32 — Admin Console v3 (Enterprise Grade)

**Priority: MEDIUM**  
**Tiers:** Web + Backend

### 32.1 Backend

- `GET /admin/reports` — user reports (post/comment/user reported by users); filterable by type/status; `PUT /admin/reports/{id}/resolve` with action: `dismiss|remove|warn|ban`
- `GET /admin/violations` — all violations in system (schema already has `violations` table)
- `POST /admin/violations/{id}/action` — manual admin action (warn/suspend/ban/pardon)
- `GET /admin/revenue?days=N` — detailed revenue breakdown: gross, commission, refunds, net, per-vendor slice
- `POST /admin/feature/{vendorId}` — feature/unfeature a vendor on the homepage
- `GET /admin/content` — flagged content queue (reported posts/comments awaiting moderation)
- `POST /admin/broadcast` — send a system-wide notification to all users (or filtered segment)
- `GET /admin/system-health` — already exists via `/health` routes; wire into admin dashboard

### 32.2 Web — Admin Dashboard

**Dashboard** (`/admin`):

- Live stats (auto-refresh 60s): Active Users Now, Orders in Progress, Revenue Today, Pending Vendors
- System health widget: colored indicators for DB / Cache / Queue / WebSocket / Search
- Alert cards: "3 pending vendor applications", "12 open reports", "2 failed jobs" — clickable
- Revenue area chart (already built) — enhance with comparison line (vs last period)

**Content Moderation** (`/admin/content`):

- Split view: reported content on left, evidence/context on right
- Quick actions: Dismiss Report / Remove Content / Warn User / Ban User
- Bulk select + bulk action
- Filter: Reports / Auto-flagged / All

**User Reports** (`/admin/reports`):

- Similar split view
- Shows reporter + reportee + reason + evidence
- Action buttons

**Platform Broadcast** (`/admin/broadcast`):

- Compose a message/notification to send to all users or filtered segment
- Segment filters: All users / Verified only / Users in city X / Vendors only
- Preview notification appearance before sending
- Schedule: Send now / Pick datetime

---

## PHASE 33 — Explore & Discovery (Algorithm-Powered)

**Priority: MEDIUM**  
**Tiers:** Web + Mobile + Backend

### 33.1 Backend

- `GET /explore` — curated sections:
  - `trending_posts`: top posts by engagement last 6h
  - `trending_vendors`: most orders in last 24h (with `order_delta` % change)
  - `trending_hashtags`: top 10 by post count last 24h
  - `trending_items`: most ordered food items last 24h
  - `suggested_users`: accounts you may know (mutual follows algo)
  - `nearby_vendors`: if lat/lng provided, vendors within radius
- `GET /explore/map` — vendors with lat/lng for map view

### 33.2 Web — Explore Page (`/explore`)

- Hero search bar (large, centered) with placeholder cycling through: "Search restaurants...", "Find food lovers...", "Discover trending posts..."
- Section-based layout (like Netflix categories):
  - Trending Now (posts grid)
  - 🔥 Hot Restaurants Today (horizontal vendor scroll)
  - 📈 Trending Hashtags (chip cloud with size reflecting volume)
  - 🍽 Most Ordered Today (food item cards)
  - 👥 People You May Know (user cards with mutual count + Follow button)
- Category filter bar: All / Food / People / Vendors / Hashtags
- Map view toggle: shows vendors on an embedded map (use Leaflet.js — no API key needed for OpenStreetMap tiles)

### 33.3 Mobile — Explore Tab

- Search bar at top, always visible
- Segmented control: All / Restaurants / People / Hashtags
- Masonry grid for posts (2-column, alternating heights for visual interest)
- Horizontal scroll sections for vendors and users

---

## PHASE 34 — Notifications & Onboarding Polish

**Priority: MEDIUM**  
**Tiers:** Web + Mobile + Backend

### 34.1 Backend

- `GET /notifications` — group by time: Today / This Week / Earlier
- Add notification type `story_mention`, `post_tagged`, `vendor_offer`, `flash_deal`
- `POST /notifications/preferences` — save per-type per-channel preferences
- `GET /notifications/preferences` — load them

### 34.2 Web — Notifications Page

- Grouped by time (Today / This Week / Earlier)
- Per-notification type icon (unique SVG per type)
- Actor avatar inline
- "Mark as read" on hover (blue dot → disappears)
- Action button inline for relevant types: "View post", "Follow back", "Rate order", "View offer"
- Notification preferences panel (accessible from settings): per-type toggles for Push / Email / In-App

### 34.3 Onboarding Flow (Post-Register)

New users (first login) see a 4-step onboarding wizard **before** reaching the feed:

1. **Welcome** — personalized greeting, brief "what you can do" cards
2. **Set Your Location** — city picker + GPS option (enables nearby vendor discovery)
3. **Food Preferences** — multi-select chips: Vegetarian, Non-Vegetarian, Vegan, Halal, Gluten-Free, etc.
4. **Follow Suggestions** — show 12 suggested accounts (mix of users + vendors), pre-select 5, "Follow selected & start exploring" button

After onboarding, set a `onboarding_completed` flag in user profile (add column) so it never shows again.

---

## PHASE 35 — Performance & Speed Optimization

**Priority: MEDIUM**  
**Tiers:** Backend + Web + Mobile

### 35.1 Backend Performance

**Query Optimization:**

- Add composite indexes:
  ```sql
  ALTER TABLE posts ADD INDEX idx_feed (user_id, privacy, created_at);
  ALTER TABLE follows ADD INDEX idx_follower (follower_id, following_id);
  ALTER TABLE orders ADD INDEX idx_vendor_status (vendor_id, status, created_at);
  ALTER TABLE post_likes ADD UNIQUE INDEX idx_user_post (user_id, post_id);
  ALTER TABLE notifications ADD INDEX idx_user_read (user_id, read_at, created_at);
  ALTER TABLE messages ADD INDEX idx_conversation (conversation_id, created_at);
  ```
- Review all `with()` eager loads — ensure every relationship-loaded query uses eager loading, not lazy
- Cache the feed for logged-in users: `"feed:{userId}:{page}"` — 2 minute TTL, invalidated when a new post is created by a followed user
- Cache vendor menu: `"vendor:{id}:menu"` — 10 minute TTL
- Cache trending: `"trending:hashtags"`, `"trending:posts"` — 15 minute TTL
- Add `GET /feed` to return early from Redis cache on page > 1

**API Response Compression:**

- Ensure Nginx has `gzip` enabled for `application/json`
- Laravel: trim `null` fields from all Resources (use `whenNotNull()` everywhere)
- Paginated endpoints: only return `data`, `meta.current_page`, `meta.last_page`, `meta.total` — remove unused Eloquent pagination metadata

### 35.2 Web Performance

- Add `loading="lazy"` on all `<Image>` tags below the fold
- Implement `<Suspense>` with skeleton fallbacks on every async data boundary
- Route-level code splitting is automatic in App Router — verify bundle sizes with `next build --debug`
- Pre-fetch vendor page on hover of vendor card (`router.prefetch('/vendors/[id]')`)
- Add `staleTime: 5 * 60 * 1000` to all TanStack Query hooks that serve static-ish data (vendor info, user profiles)
- Move Recharts to lazy import (it's large): `const Charts = dynamic(() => import('./Charts'), { ssr: false })`
- Add `<link rel="preconnect" href="https://api.foodzone.app">` in `app/layout.tsx`
- Service Worker for offline shell (Next.js + `next-pwa` or manual SW registration)

### 35.3 Mobile Performance

- Replace `FlatList` with `@shopify/flash-list` throughout (significant perf gain)
- Add `memo()` wrapping to `PostCard`, `VendorCard`, `MessageBubble`, `OrderCard`
- Use `useCallback` for all event handlers passed to list items
- Image caching: use `expo-image` instead of `Image` from react-native (built-in disk cache)
- Prefetch next page of feed when user is at 80% scroll position
- `InteractionManager.runAfterInteractions()` for heavy operations on mount

---

## PHASE 36 — Advanced Features (Competitive Edge)

**Priority: LOW–MEDIUM (Future)**  
**Tiers:** Backend + Web + Mobile

### 36.1 Vendor Promotions System

- **Flash Deals**: vendor creates a deal with: item, discount%, duration (1–8 hours), quantity limit
  - Active flash deals shown on homepage explore section with countdown timer
  - `GET /flash-deals` — active deals sorted by time remaining
  - Push notification sent to users who favorited the vendor when deal goes live
- **Happy Hours**: recurring time-based discounts (e.g., 20% off Mondays 2–5 PM)
  - Applied automatically at checkout if order time falls in window

### 36.2 Loyalty & Gamification

- **Points system** (schema `loyalty_points` already exists):
  - Earn 1 point per ₹10 spent
  - Bonus points: first order (50 pts), post with review photo (+10), refer a friend (+100)
  - Redeem: ₹1 per 10 points
- **Tiers**: Bronze (0–499 pts) / Silver (500–1999) / Gold (2000–4999) / Platinum (5000+)
  - Tier perks: Silver = priority support, Gold = free delivery on orders over ₹300, Platinum = exclusive deals
- **Badges/Achievements**: "First Order", "100th Order", "Top Reviewer", "Social Butterfly (50 followers)", "Food Explorer (ordered from 20 vendors)" — shown on profile
- **Leaderboard** (`GET /leaderboard?type=orders|points|reviews`) — top 100 users

### 36.3 Food Review Enhancement

- **Video reviews**: attach a 30s video to a review
- **Review helpfulness**: "Was this review helpful?" thumbs up/down
- **Verified Purchase badge** on reviews (automatically added since all reviews are from order ratings)
- **Vendor response**: already exists — improve the UI with a clear visual distinction
- **Review photos gallery**: aggregate all review photos into a scrollable gallery on the vendor page

### 36.4 Social Commerce

- **Food Tagging in Posts**: when creating a post, type `@vendor:menu-item-name` to tag a menu item
  - Tagged items appear as interactive cards in the post: item image, price, "Order Now" CTA
- **Shoppable Posts**: posts from vendors can include "Shop Now" CTAs linked to their menu
- **Collaborative Orders** (Phase 3): multiple users can add to the same cart and split the bill

### 36.5 Settings Page (Web + Mobile)

Build a comprehensive settings page that is currently missing:

**Account Settings:**

- Change email (requires verification)
- Change password
- Connected accounts (Google, Apple — Phase 2)
- 2FA setup (TOTP QR code)
- Download my data (triggers data export job)
- Deactivate account / Delete account (with confirmation dialogs)

**Privacy Settings:**

- Account privacy: Public / Private
- Who can message me: Everyone / Followers / Nobody
- Who can see my activity status: Everyone / Followers / Nobody
- Blocked accounts list (with unblock)
- Muted accounts list

**Notification Settings:**

- Per-type toggles for: In-App / Push / Email
- Do Not Disturb: time range picker
- Notification sound: On/Off

**Appearance:**

- Theme: Dark / Light / System
- Font size: Default / Large / Larger
- Language: English (more Phase 3)

**About:**

- App version
- Terms of Service
- Privacy Policy
- Contact Support
- Rate the app

---

## 🏗 Technical Standards for All Phases

These rules apply to every line of code written across all phases above.

### Code Quality

```
Backend (Laravel):
- Every new endpoint must have a corresponding Feature test
- All tests must be portable (MySQL + SQLite)
- Use Form Request validation classes — never validate in controllers
- Use API Resources for all response shaping
- Services handle business logic — controllers stay thin
- Use database transactions for multi-step writes
- Never expose IDs that could be enumerated — use UUIDs for public-facing ones (Phase 36+)

Web (Next.js):
- All data fetching via TanStack Query hooks — never fetch in components
- All mutations use `useMutation` with `onSuccess` invalidation
- Loading state: always show skeleton, never blank white
- Error state: always show retry option
- Empty state: always show illustration + CTA
- TypeScript strict mode — no `any`
- All new components export from `components/index.ts`
- CSS: Tailwind utility classes only (no inline styles except dynamic values)
- Forms: React Hook Form + Zod schemas

Mobile (Expo):
- All screens must handle: loading, error, empty, and data states
- StyleSheet.create() for all styles — no inline style objects in JSX
- Use `useCallback` and `memo` on any component that appears in a list
- Always handle keyboard dismiss on tap outside inputs
- Test on both iOS and Android mental models
```

### Design Standards

```
- Never use hardcoded colors — always use design tokens
- Every interactive element has a hover/active state
- Every action has a loading state
- Minimum touch target: 44×44px (mobile)
- All images must have alt text / accessibilityLabel
- Animation duration: 150–300ms for UI feedback, 400ms for page transitions
- Never block the UI thread — async everything
- Skeleton loaders must match the actual content shape exactly
```

### API Contract

```
- All responses follow: { success: bool, message: string, data: any, errors?: {} }
- Pagination: { data: [], meta: { current_page, last_page, total, per_page } }
- Timestamps: ISO 8601 (2026-01-15T10:30:00Z)
- Money: integer paise/cents (never float)
- Errors: 422 validation, 401 unauthenticated, 403 forbidden, 404 not found, 429 rate limited, 500 server error
- Always version: /api/v1/
```

---

## 📊 Success Metrics

After completing all phases, the platform should achieve:

| Metric                       | Target      |
| ---------------------------- | ----------- |
| Lighthouse Performance (Web) | ≥ 90        |
| Lighthouse Accessibility     | ≥ 95        |
| Feed Load Time (cold)        | < 1.2s      |
| API p95 Response Time        | < 200ms     |
| Time to Interactive (Web)    | < 2.5s      |
| App Launch Time (Mobile)     | < 1.5s      |
| Test Coverage                | ≥ 150 tests |
| Mobile Routes                | ≥ 35 routes |
| Web Pages                    | ≥ 40 pages  |
| Concurrent Users Target      | 10,000+     |

---

## 🚀 Phase Execution Order

```
P25 — Landing Page + Role Auth          ← START HERE (highest visibility impact)
P26 — Design System Overhaul            ← Do before any feature UI work
P27 — Feed & Post Experience            ← Core social differentiator
P28 — Profile Experience                ← Trust and identity layer
P29 — Chat System v2                    ← Retention driver
P30 — Vendor Store UI                   ← Revenue driver
P31 — Vendor Dashboard v3               ← Vendor retention
P32 — Admin Console v3                  ← Operations
P33 — Explore & Discovery               ← Growth/acquisition
P34 — Notifications & Onboarding        ← Activation
P35 — Performance & Speed              ← Quality of life
P36 — Advanced Features                 ← Competitive moat
```

---

## ⚡ Quick-Start Command

When starting any new phase, run this verification first:

```bash
# Backend
cd FoodZoneServer
php artisan migrate:status          # All migrations applied
php artisan test                     # 133 tests passing
php artisan route:list | wc -l      # Routes count

# Web
cd foodzoneweb
npm run build                        # No TypeScript errors
npm run lint                         # No lint errors

# Mobile
cd FoodZoneApp
npx tsc --noEmit                     # No TS errors
npx expo lint                        # No lint errors
npx expo export --platform web       # Bundles clean (27 routes)
```

Then implement the phase, and end with the same verification to confirm nothing regressed.

---

_FoodZone Master Prompt v3.0 | Phases 25–36 Roadmap | Abhishek Prajapati | 2026_  
_Base: 133 tests · 27 mobile routes · 27 web pages · Full CI/CD_
