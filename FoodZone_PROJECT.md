# 🍕 FoodZone — Complete Project Specification

> **A unified Social + Food Ordering Platform** — Where community meets cuisine.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [User Roles & Access Control](#4-user-roles--access-control)
5. [Admin Panel — Full Specification](#5-admin-panel--full-specification)
6. [Vendor Dashboard — Full Specification](#6-vendor-dashboard--full-specification)
7. [Delivery Partner — Full Specification](#7-delivery-partner--full-specification)
8. [User (Consumer) — Full Specification](#8-user-consumer--full-specification)
9. [Social Features](#9-social-features)
10. [Food Ordering System](#10-food-ordering-system)
11. [Violation & Policy Enforcement System](#11-violation--policy-enforcement-system)
12. [Advertisement System](#12-advertisement-system)
13. [Vouchers, Offers & Promo Codes](#13-vouchers-offers--promo-codes)
14. [Notification System](#14-notification-system)
15. [Chat & Messaging System](#15-chat--messaging-system)
16. [Inventory Management](#16-inventory-management)
17. [Payment & Revenue System](#17-payment--revenue-system)
18. [Analytics & Reporting](#18-analytics--reporting)
19. [Search & Discovery](#19-search--discovery)
20. [UI/UX & Design System](#20-uiux--design-system)
21. [Performance & Scalability](#21-performance--scalability)
22. [Security](#22-security)
23. [API Design & Health Routes](#23-api-design--health-routes)
24. [Database Schema — Overview](#24-database-schema--overview)
25. [Mobile App (React Native Expo)](#25-mobile-app-react-native-expo)
26. [DevOps & Deployment](#26-devops--deployment)
27. [Future Roadmap](#27-future-roadmap)

---

## 1. Project Overview

**FoodZone** is a full-stack, production-grade platform that merges a social media experience with a food ordering marketplace. Users interact socially — posting, liking, following, messaging — while seamlessly discovering and ordering food from verified vendors on the same platform.

### Core Pillars

| Pillar | Description |
|---|---|
| 🌐 Social | Posts, stories, comments, likes, follows, shares — a complete social graph |
| 🍔 Food Ordering | Multi-vendor marketplace with real-time order tracking |
| 📢 Advertising | Vendor-run paid ad campaigns with targeting and analytics |
| 🔒 Policy Enforcement | Automated violation detection with graduated response system |
| 📦 Vendor Ecosystem | Full vendor dashboard: menu, inventory, orders, ads, revenue |
| 🚴 Delivery Network | Delivery partner system (Phase 2) |

### Platform Surfaces

- **Web App** — Next.js (primary)
- **Mobile App** — React Native (Expo)
- **Admin Panel** — Next.js (restricted access)
- **Vendor Dashboard** — Next.js (restricted access)

---

## 2. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | Laravel 11 (PHP) |
| Database | MySQL 8.x |
| Cache | Redis |
| Queue | Laravel Queues + Redis |
| Real-time | Laravel Reverb / Pusher (WebSockets) |
| Search | Meilisearch (full-text search) |
| File Storage | AWS S3 / Cloudflare R2 |
| Email | Laravel Mail + SMTP (Mailgun / SES) |
| Load Balancer | Nginx + HAProxy |
| Background Jobs | Laravel Scheduler + Horizon |

### Frontend (Web)
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| State Management | Zustand + React Query (TanStack) |
| UI Components | Tailwind CSS + shadcn/ui |
| Real-time Client | Pusher JS / Laravel Echo |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Image Handling | Next.js Image Optimization |

### Mobile
| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 51+) |
| Navigation | Expo Router |
| State | Zustand |
| Real-time | Pusher JS |
| Maps | React Native Maps (Google Maps API) |
| Notifications | Expo Push Notifications (FCM/APNs) |

### Infrastructure
| Layer | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Laravel Telescope + Sentry |
| Server | Ubuntu 22.04 LTS |
| CDN | Cloudflare |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│   Next.js Web   │  React Native App  │  Admin / Vendor Web  │
└────────┬────────┴──────────┬─────────┴──────────┬──────────┘
         │                   │                     │
         ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Cloudflare CDN + WAF                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│               Nginx Reverse Proxy / Load Balancer           │
└───────┬───────────────────┬─────────────────────────────────┘
        │                   │
┌───────▼──────┐    ┌───────▼──────┐
│ Laravel App  │    │ Laravel App  │  ← Multiple instances (horizontal scale)
│  Instance 1  │    │  Instance 2  │
└───────┬──────┘    └───────┬──────┘
        │                   │
┌───────▼───────────────────▼──────────────────────────────────┐
│                   Shared Services                            │
│  MySQL (Primary + Read Replica) │ Redis │ Meilisearch        │
│  S3/R2 Storage │ WebSocket Server (Reverb) │ Queue Workers    │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions
- **Horizontal scaling** via stateless Laravel instances behind load balancer
- **Read replicas** for MySQL for heavy read queries (feed, analytics)
- **Redis** for caching hot data (feed, sessions, rate limiting)
- **Queue workers** for emails, notifications, image processing, analytics
- **WebSocket server** (Laravel Reverb) for real-time: chat, order updates, live feed
- **CDN** for all static assets and media

---

## 4. User Roles & Access Control

### Role Hierarchy

```
SUPER ADMIN
    └── ADMIN
            ├── VENDOR (registered + approved)
            │       └── DELIVERY PARTNER (Phase 2)
            └── USER (registered + verified)
```

### Permission Matrix (Summary)

| Feature | Admin | Vendor | Delivery | User |
|---|:---:|:---:|:---:|:---:|
| Full Platform Control | ✅ | ❌ | ❌ | ❌ |
| Manage All Users | ✅ | ❌ | ❌ | ❌ |
| Manage Own Menu | ✅ | ✅ | ❌ | ❌ |
| Place Food Orders | ✅ | ❌ | ❌ | ✅ |
| Create Social Posts | ✅ | ✅ | ✅ | ✅ |
| Run Ad Campaigns | ❌ | ✅ | ❌ | ❌ |
| Accept Deliveries | ❌ | ❌ | ✅ | ❌ |
| View Platform Analytics | ✅ | Partial | Partial | ❌ |
| Ban Users | ✅ | Partial* | ❌ | ❌ |
| Create Vouchers | ✅ | ✅ | ❌ | ❌ |

> *Vendors can only ban users from ordering from their specific store.

---

## 5. Admin Panel — Full Specification

### 5.1 Dashboard Overview
- Real-time platform statistics: total users, active sessions, total orders today, revenue today, new vendor applications
- Live activity feed: recent signups, recent orders, policy violations triggered
- Quick action cards: approve vendor, ban user, create promo, review report
- Revenue trend chart (daily/weekly/monthly)
- Top performing vendors chart
- User growth graph

### 5.2 User Management
- View all users (paginated, searchable, filterable by: role, status, join date, location)
- View individual user profile with full activity log
- Manually verify, suspend, or permanently ban a user
- Send direct system messages to any user
- Override violation policy (manual warning or pardon)
- Export user data (CSV/Excel)
- View user's order history, posts, reports filed against them

### 5.3 Vendor Management
- View all vendors (approved, pending, suspended)
- Approve or reject vendor registration applications with reason
- View vendor's full store details, revenue, order history
- Force-close a vendor's store
- Adjust vendor's platform commission rate (default 5%)
- View active ad campaigns by vendor
- Export vendor reports

### 5.4 Food House / Store Management
- Admin can create and operate their own Food House(s)
- Manage menu items, categories, pricing for admin-run stores
- Admin store orders bypass the vendor commission
- Admin can feature any vendor or their own store on the homepage

### 5.5 Menu & Category Management
- Create global food categories (e.g., Fast Food, Desserts, Beverages)
- Approve or reject vendor-created categories
- Create and manage items for admin-run stores
- Manage dietary tags (Vegan, Gluten-Free, Halal, etc.)

### 5.6 Order Management
- View all orders across the platform in real-time
- Filter by status: pending, accepted, preparing, out for delivery, delivered, cancelled
- View order timeline and full audit log
- Manually update order status (for disputes)
- Initiate refunds and mark as resolved

### 5.7 Inventory Management (Admin Store)
- Add ingredients and raw materials
- Set low-stock alerts (threshold-based)
- Track stock per item: quantity available, units sold
- Auto-deduct stock when an order is placed
- Manual stock adjustment with reason logging

### 5.8 Platform Analytics
- Total revenue (gross, net after commission refunds)
- Per-vendor revenue breakdown
- Peak ordering hours heatmap
- Geographic order distribution map
- Most ordered items
- Ad campaign performance summary
- User engagement metrics (DAU, MAU, retention)
- Policy violation statistics

### 5.9 Content Moderation
- View all reported posts, comments, stories
- Approve removal or dismiss report
- View evidence, reported by, timestamps
- Bulk moderation tools
- Auto-flagged content queue (AI-assisted — Phase 2)

### 5.10 Promotion & Voucher Management
- Create platform-wide promo codes and vouchers
- Set validity period, max uses, per-user limit
- Apply to specific vendors, categories, or all orders
- View redemption analytics per promo

### 5.11 System Health Dashboard
- Server CPU, RAM, disk usage (real-time)
- API response time graphs
- Queue worker status and backlog size
- WebSocket connections count
- Failed jobs log
- Database query performance
- Error rate tracking (Sentry integration)

### 5.12 Configuration & Settings
- Platform name, logo, tagline
- Maintenance mode toggle
- Default commission rate
- Email template management
- Policy document editor (Terms, Privacy)
- Feature flags (enable/disable features without deploy)
- Supported delivery zones / city management

---

## 6. Vendor Dashboard — Full Specification

### 6.1 Vendor Registration & Approval
- Vendor can self-register with:
  - Business name, description, logo, banner
  - Business license / registration number
  - Tax ID / GST number
  - Bank account details (for payouts)
  - Primary contact details
  - Store address + service area (radius on map)
  - Operating hours (per day, with open/close time)
- Application enters "Pending" state → Admin reviews → Approves/Rejects
- Vendor receives email notification on decision with reason if rejected

### 6.2 Store Management
- Toggle store open/closed (with custom message)
- Edit store profile: name, description, logo, banner, operating hours
- Set delivery radius on interactive map
- Enable/disable delivery charges
- Set minimum order value
- Set estimated preparation time (displayed to users)
- Store-level rating visible with breakdown

### 6.3 Menu Management
- Create/edit/delete menu categories (subject to admin approval)
- Create food items with:
  - Name, description, price, images (multi-upload)
  - Category, dietary tags, allergen info
  - Variants (size: small/medium/large, customizations)
  - Add-ons / extras (e.g., extra cheese +₹20)
  - Availability toggle (e.g., seasonal or out of stock)
  - Preparation time per item
- Bulk item availability toggle
- Import/export menu via CSV

### 6.4 Order Management
- Live incoming order notifications (WebSocket)
- Accept / Reject order with reason (within configurable timer, default 3 mins)
- Order queue view: New → Accepted → Preparing → Ready → Out for Delivery → Delivered
- View full order details: items, customizations, customer address, payment method
- Mark order as ready for pickup / dispatch
- Print order receipt (thermal printer compatible)
- Order history with filters: date, status, customer
- Handle cancellations and initiate partial/full refunds

### 6.5 Inventory Management
- Add raw materials / ingredients
- Map ingredients to menu items (recipe-level inventory)
- Set stock quantities and low-stock alert thresholds
- Auto-deduction on order placement
- Manual stock updates with audit log
- Daily/weekly inventory summary report
- Supplier contact management (optional)

### 6.6 Customer Restriction System
- System flags suspicious customer patterns:
  - Repeatedly places orders and never accepts / cancels after preparation starts
  - Excessive refund requests
  - Abusive order notes
- Vendor receives alert with pattern summary and order history for that customer
- Vendor can:
  - Issue a warning to customer (system DM)
  - Temporarily block customer from ordering from their store (7/14/30 days)
  - Permanently block customer from their store
- Vendor block does not affect customer's ability to order from other vendors

### 6.7 Revenue & Payouts
- Total revenue dashboard: gross, platform commission (5%), net earnings
- Revenue breakdown by day, week, month
- Per-item revenue ranking
- Payout schedule: weekly/bi-weekly (configurable by admin)
- Payout history and status
- Downloadable invoices and tax statements

### 6.8 Advertisement System
- Create ad campaigns with:
  - Ad creative: image/video/carousel
  - Ad copy: headline, description, CTA
  - Target audience: city, age range, food preferences, gender
  - Campaign duration: pick start date + number of days
  - Budget: calculated automatically based on days × daily rate
- Pre-payment required (wallet or direct payment)
- Ad goes live after payment confirmation
- Real-time campaign analytics:
  - Impressions (times ad was shown)
  - Clicks and CTR (click-through rate)
  - Unique users reached
  - Conversion tracking (clicks → orders placed)
  - Geographic performance map
  - AI-generated improvement suggestions (copy, targeting, creative tips)
- Pause / resume campaigns
- Campaign history archive

### 6.9 Voucher & Offer Management
- Create store-specific vouchers:
  - Percentage or flat discount
  - Minimum order amount condition
  - Max discount cap
  - Single-use or multi-use per customer
  - Validity window
  - Promo code (custom or auto-generated)
- Create time-limited offers (Happy Hour, Weekend Special)
- Flash deals with countdown timer
- View redemption stats per voucher

### 6.10 Vendor Analytics
- Order volume trends
- Average order value
- Customer retention rate (repeat customers %)
- Peak order hours for their store
- Most/least popular items
- Customer satisfaction score (rating average + review sentiment)
- Comparison with last period (week-over-week, month-over-month)

### 6.11 Vendor Notifications & Alerts
- New order alert (sound + push)
- Low stock alert
- Review received
- Payout processed
- Ad campaign status change
- Policy violation alert on their post/content
- Customer flagged for suspicious activity

---

## 7. Delivery Partner — Full Specification

> **Phase 2 Feature** — Activated when platform scales. Architecture should be designed for this from Day 1.

### 7.1 Registration & Onboarding
- Apply with: full name, phone, email, vehicle type (bike, scooter, cycle, on-foot), vehicle number, ID proof, address
- Background check acknowledgement
- Bank account for salary/per-order credit
- Assigned to a delivery zone

### 7.2 Earning Model (Configurable by Admin)
- **Per-order model**: Fixed earning per delivery + optional tip from customer
- **Salary model**: Fixed monthly salary with target deliveries
- **Hybrid**: Base salary + per-order bonus above threshold

### 7.3 Delivery App Features
- Toggle availability: Online / Offline / On Delivery
- Incoming delivery request with:
  - Order details and item count
  - Pickup location (vendor map pin)
  - Drop location (customer address)
  - Estimated distance and time
  - Earning for this order
- Accept / Decline (with reason)
- Navigation integration (Google Maps deep link)
- Live location sharing (customer can track)
- Mark: Picked Up → Out for Delivery → Delivered
- Proof of delivery: photo capture on delivery
- Contact customer / vendor via masked number

### 7.4 Partner Dashboard
- Total deliveries completed (daily/weekly/monthly)
- Total earnings and payout breakdown
- Ratings received from customers
- Active zone map
- Performance report: on-time rate, acceptance rate, cancellation rate

### 7.5 Partner Management (Admin Side)
- Assign partners to zones
- View real-time partner map (live location)
- Manage earnings model per partner
- Issue warnings or deactivate partner
- View partner's delivery history and ratings
- Process payouts

---

## 8. User (Consumer) — Full Specification

### 8.1 Registration & Onboarding
- Register with: full name, username, email, password, date of birth, gender (optional), profile photo (optional)
- Email verification (tokenized link, expires in 24h)
- Add address details: full address, city, state, pincode, landmark, GPS auto-detect option
- Multiple saved addresses (Home, Work, Other — custom label)
- Onboarding wizard: select food preferences, follow suggested vendors/users

### 8.2 Profile Management
- Edit profile: name, username, bio, website link, profile photo, cover photo
- Change email (re-verification required)
- Change password (current password required)
- Manage saved addresses
- Food preferences: cuisine types, dietary restrictions
- Privacy settings: public / private account
- Account deactivation (temporary) or deletion (permanent, with 30-day grace period)

### 8.3 Feed & Discovery
- Personalized home feed (algorithm-based):
  - Posts from followed users
  - Suggested posts (based on interests)
  - Sponsored posts (ads from vendors)
  - New post banner: "10 new posts — tap to load"
- Explore page: trending posts, trending food, trending vendors
- Category filter on explore: Food, People, Vendors, Events
- Real-time feed updates via WebSocket

### 8.4 Order Flow
1. Browse vendors (by location, cuisine, rating)
2. View vendor store + menu
3. Add items to cart (with customizations/add-ons)
4. Apply promo code / voucher
5. Select delivery address
6. Choose payment method
7. Place order → real-time confirmation
8. Live order tracking: Accepted → Preparing → Ready → Out for Delivery → Delivered
9. Rate the order and write a review after delivery
10. Reorder from order history

### 8.5 Cart & Wishlist
- Cart persists across sessions (synced to server)
- Multi-vendor cart warning (merge or replace)
- Wishlist: save items for later
- Recently viewed items

### 8.6 Order History
- Full order history with filters (date, vendor, status)
- Reorder with one tap
- Download invoice per order
- Request refund on eligible orders

### 8.7 Wallet & Payments
- In-app wallet (FoodZone Credits)
- Top up wallet via UPI, card, net banking
- Payment methods: UPI, Credit/Debit Card, Net Banking, Wallet, Cash on Delivery (vendor option)
- Transaction history
- Refunds credited to wallet or original payment method

---

## 9. Social Features

### 9.1 Posts
- Create posts with:
  - Text (rich text with mentions @username and hashtags #tag)
  - Single or multiple images (up to 10 per post)
  - Videos (up to 60 seconds, web; up to 3 min on mobile)
  - GIFs
  - Tag a food item or vendor directly in a post
  - Tag location
  - Poll (2–4 options, set duration)
  - Feeling/Activity
- Post privacy: Public, Followers Only, Only Me
- Edit post (with edit history visible)
- Delete post
- Pin post to own profile (up to 3 posts)

### 9.2 Stories
- Create stories: image, video (15s), text card, boomerang
- Stories expire in 24 hours
- Story reactions (emoji quick react)
- Story reply (goes to DM)
- Story viewers list (only visible to creator)
- Highlights: save stories to profile as permanent highlight reels

### 9.3 Reels / Short Videos (Phase 2)
- Short-form vertical video (up to 60s)
- Dedicated reels feed
- Duet / remix feature

### 9.4 Interactions
- **Like**: on posts, comments, stories
- **Comment**: nested comments (1 level deep — comment + replies)
- **Share**: share to feed (repost), share to story, share via link, share to DM
- **Save / Bookmark**: save posts to collections (named folders)
- **Report**: report post/comment/user for violation

### 9.5 Follow System
- Follow / Unfollow users
- Follow request (for private accounts)
- Followers / Following lists
- Mutual followers display
- Suggested users to follow (based on mutual follows and interests)
- Block user (cannot view profile, posts, or message)
- Restrict user (can see posts, but comments hidden until approved)

### 9.6 Hashtags & Mentions
- Clickable hashtags → hashtag feed page
- Trending hashtags on Explore
- @mention autocomplete in composer
- Notification when mentioned
- Hashtag follow (follow a hashtag to see posts in feed)

### 9.7 Live Stream (Phase 2)
- Go live with real-time viewers
- Live comments and reactions
- Vendor live stream for food demos and promotions
- Save live stream as a replay

---

## 10. Food Ordering System

### 10.1 Vendor Discovery
- Search vendors by name, cuisine, item name
- Filter: distance, rating, price range, dietary tags, delivery time, open now
- Sort: relevance, rating, distance, newest
- Vendor map view (pins on map)
- Featured vendors (admin-boosted or ad-based)
- Vendor profile page: banner, info, ratings, reviews, menu

### 10.2 Menu Display
- Category tabs with scroll
- Item cards: image, name, price, rating, dietary badge
- Item detail modal: full description, images, variants, add-ons
- Search within vendor menu
- "Most Ordered" and "New" badges on items

### 10.3 Real-Time Order Tracking
- Order timeline stepper with timestamps
- Live map view of delivery partner (Phase 2)
- Push notification at each status change
- ETA displayed and updated in real time
- Contact delivery partner button (Phase 2)

### 10.4 Rating & Review System
- Rate order: 1–5 stars overall
- Rate specific items
- Rate delivery experience (Phase 2)
- Write text review (min 20 chars to prevent spam)
- Upload photos with review
- Vendor can respond to review (public reply)
- Helpful votes on reviews
- Review moderation (admin can remove reviews)

### 10.5 Delivery Charges
- Vendor can toggle delivery charges on/off
- If on: configurable flat fee or distance-based (per km)
- Free delivery above threshold (vendor-configured)
- Displayed clearly before checkout

---

## 11. Violation & Policy Enforcement System

### 11.1 Automated Detection Triggers
The system monitors for violations including (but not limited to):
- Hate speech or discriminatory language in posts/comments
- Harassment or bullying behaviour toward other users
- Spam posting (excessive identical or near-identical content)
- Posting prohibited content (adult content, graphic violence)
- Repeatedly placing and cancelling orders (order abuse)
- Fraudulent refund requests
- Using fake accounts to inflate own engagement
- Sharing external contact information to bypass the platform

### 11.2 Graduated Response Flow

```
Violation Detected
       │
       ▼
[1st Offence] → Email Warning + In-App Notification
       │         "You have violated platform policy. 1/3 warnings."
       │
[2nd Offence] → Email Warning + In-App Notification
       │         "Final warning before action. 2/3 warnings."
       │
[3rd Offence] → Email Warning + System DM sent to user in chat
       │         "You have received 3 warnings. Reply to acknowledge."
       │
[User Acknowledges via DM] ─────────────────────────────┐
       │                                                  │
       │ (Yes, I understand)                              │ (No response within 48h)
       ▼                                                  ▼
[Continues with Monitoring]                     [Account Suspended 7 days]
       │
[Violates Again After Acknowledgement]
       ▼
[Immediate Permanent Ban + Email Notice]
```

### 11.3 Ban System
- **Temporary Suspension**: 7, 14, or 30 days (configurable per severity)
- **Permanent Ban**: Account inaccessible, email notified
- **IP Ban**: Block IP addresses used by banned accounts (to prevent re-registration)
- **Device Ban**: Block device fingerprint (mobile)
- **Appeal Process**: Banned user can submit an appeal form (email-based) reviewed by admin within 5 business days
- All violation history stored permanently in admin panel

### 11.4 Admin Override
- Admin can manually trigger any violation stage
- Admin can pardon (clear violation record)
- Admin can skip to permanent ban for severe offences
- Full audit log of admin actions

---

## 12. Advertisement System

### 12.1 Ad Types
| Ad Type | Placement | Format |
|---|---|---|
| Feed Ad | Social feed (every 6th post) | Image, Carousel, Video |
| Story Ad | Between user stories | Full-screen image/video (15s) |
| Vendor Spotlight | Discovery / Search page | Image card with CTA |
| Banner Ad | Top of Explore page | Static image banner |
| Push Notification Ad | Mobile push | Short text + image |

### 12.2 Targeting Options
- **Geographic**: City, neighbourhood, delivery radius
- **Demographic**: Age range, gender
- **Behavioural**: Users who have ordered in this category, users who follow similar vendors
- **Interest-based**: Food preferences tags (Vegan, Biryani lovers, etc.)
- **Retargeting**: Users who viewed vendor profile but didn't order

### 12.3 Billing Model
- Daily rate (e.g., ₹X per day per ad type)
- Total cost = daily rate × number of days
- Pre-payment required before campaign goes live
- Payment via vendor wallet or direct payment
- Minimum campaign: 1 day; Maximum: 90 days

### 12.4 Campaign Analytics (Vendor Side)
- Impressions: total times ad was shown
- Reach: unique users who saw ad
- Clicks: total clicks on ad
- CTR: clicks ÷ impressions
- Conversions: users who placed an order within 24h of clicking ad
- Cost per click (CPC) and cost per conversion (CPC)
- Audience breakdown: age, gender, location
- Performance chart (daily impressions/clicks)
- AI-generated tips for improvement

### 12.5 Ad Review & Compliance (Admin)
- All ads reviewed before going live (within 24h)
- Rejection with reason (misleading, inappropriate, etc.)
- Vendor notified of approval/rejection
- Admin can take down a live ad at any time

---

## 13. Vouchers, Offers & Promo Codes

### 13.1 Types
| Type | Created By | Scope |
|---|---|---|
| Platform Promo Code | Admin | Platform-wide |
| Vendor Voucher | Vendor | Single vendor store |
| Flash Deal | Vendor | Time-limited (hours) |
| Welcome Bonus | Admin | New user on first order |
| Referral Reward | System | Referring + referred user |
| Loyalty Cashback | System | Based on order count |

### 13.2 Voucher Configuration
- Code: custom or auto-generated
- Discount: percentage (e.g., 20% off) or flat (e.g., ₹50 off)
- Max discount cap (for percentage types)
- Minimum order amount to apply
- Valid from / valid to (date range)
- Total usage limit (global)
- Per-user usage limit (e.g., once per user)
- Applicable categories or specific items
- Stackable with other offers: Yes / No

### 13.3 Referral System
- Each user gets a unique referral code
- Share via link, WhatsApp, social
- Reward: both parties get credit on referred user's first order
- Configurable reward amount (admin sets)
- Anti-abuse: referral code cannot be used by existing accounts

### 13.4 Loyalty Program
- FoodZone Points earned on every order (e.g., 1 point per ₹10 spent)
- Points visible in profile wallet
- Redeem: ₹1 per X points on future orders
- Tier system: Bronze → Silver → Gold → Platinum (based on lifetime spend)
- Higher tiers get better redemption rates and exclusive offers

---

## 14. Notification System

### 14.1 Notification Channels
| Channel | Use Case |
|---|---|
| In-App (Bell) | All social and order events |
| Push (Mobile) | Orders, messages, key social events |
| Email | Account events, violation warnings, order receipts, payouts |
| SMS | OTP, critical order updates (optional, Phase 2) |
| DM (System Chat) | Policy violation messages from system |

### 14.2 User Notification Events
- Someone liked / commented on your post
- New follower / follow request
- Mention in a post or comment
- Story viewed (aggregated)
- Order status changed
- Order delivered
- Refund processed
- Voucher expiring soon
- New post from followed user (batched)
- System violation alert

### 14.3 Vendor Notification Events
- New order placed
- Order auto-cancelled (timeout)
- Low stock alert
- Payout processed
- Ad campaign approved / rejected / ended
- New review received
- Customer flagged for suspicious behaviour
- Voucher redemption milestone

### 14.4 Notification Preferences
- Users can configure per-channel per-event preferences
- Global mute for push notifications
- DND hours (do not disturb: no push between X and Y hours)
- Unsubscribe from email notifications (non-critical only)

---

## 15. Chat & Messaging System

### 15.1 Direct Messages (DMs)
- One-to-one text messaging (real-time via WebSocket)
- Send images, GIFs, stickers
- Share posts / food items in DM
- Voice messages (mobile)
- Message reactions (emoji)
- Read receipts (optional, user-configurable)
- Message request (for non-followers)
- Block / report user from chat
- Disappearing messages (set duration: 24h, 7d, off)

### 15.2 Group Chats (Phase 2)
- Create groups (up to 200 members)
- Group admin controls (add/remove members, change name/photo)
- Vendor can create a customer group for offers and updates

### 15.3 System DM
- Automated system messages for policy violations
- System DM is from a dedicated "FoodZone System" account
- User can acknowledge or dispute via this chat
- Admin can view and respond through system account

### 15.4 Order Chat
- Per-order chat between customer and vendor (for special instructions)
- Customer and delivery partner chat (Phase 2)
- Chat disabled after order completed + 24h
- All order chats archived and available to admin for dispute resolution

### 15.5 Technical Implementation
- WebSocket via Laravel Reverb for all real-time messaging
- Message delivery status: sent → delivered → read
- Offline message queue (messages delivered when user comes online)
- Chat pagination: load last 30 messages, scroll to load more
- End-to-end encryption consideration (Phase 2)

---

## 16. Inventory Management

### 16.1 Vendor Inventory
- Ingredient / raw material list with unit (kg, litre, pieces)
- Current stock level + low-stock threshold
- Recipe builder: map ingredients to menu items with quantities
- Auto-deduct stock on order placement
- Alert when item stock reaches threshold (in-app + email)
- Item auto-mark as unavailable if ingredient is out of stock
- Stock replenishment log (manual update with date + quantity)
- Supplier list (name, contact, last order date)

### 16.2 Admin Store Inventory
- Same features as vendor inventory
- Additional: multi-location stock management if admin runs multiple food houses
- Cross-location stock transfer logging

---

## 17. Payment & Revenue System

### 17.1 Payment Methods
- UPI (GPay, PhonePe, Paytm, BHIM)
- Credit / Debit Card (Visa, Mastercard, Rupay)
- Net Banking
- FoodZone Wallet (in-app balance)
- Cash on Delivery (if vendor has enabled it)

### 17.2 Payment Gateway
- Primary: Razorpay (India-focused)
- Fallback: Stripe (for international users, Phase 2)
- All card data handled by gateway (PCI-DSS compliant — FoodZone stores no raw card data)
- Webhook-based payment confirmation

### 17.3 Platform Revenue Model
- **Commission**: 5% of every vendor order (deducted from vendor payout)
- **Ad Revenue**: 100% of vendor ad spend goes to platform
- **Delivery Charge**: Optional (shared between delivery partner and platform in Phase 2)
- **Featured Listing Fee**: Vendors can pay for featured placement (admin-set rate)

### 17.4 Vendor Payouts
- Automatic weekly/bi-weekly payout to registered bank account
- Payout = Total Revenue − Platform Commission − Refunds Issued
- Payout confirmation email with breakdown
- Hold mechanism for disputed orders (payout held until resolved)

### 17.5 Refund Policy
- Full refund: if order cancelled before vendor accepts
- Partial/full refund: if vendor cancels or item unavailable
- No refund: if order delivered and no valid complaint
- Refund to: wallet (instant) or original method (3–7 business days)
- All refunds require admin or system approval above ₹500

---

## 18. Analytics & Reporting

### 18.1 Admin Analytics
- Platform GMV (Gross Merchandise Value) by period
- Net revenue after refunds and chargebacks
- User acquisition funnel: visited → registered → verified → first order
- Vendor performance leaderboard
- Geographic order heatmap
- Device type breakdown (web vs mobile)
- Peak traffic hours
- Support ticket volume (Phase 2)

### 18.2 Vendor Analytics
- Daily/weekly/monthly order volume and revenue
- Average order value trend
- Item-level performance (ordered count, revenue, rating)
- Customer demographics (age, gender, location — anonymized)
- Repeat customer rate
- Cart abandonment indication (orders started but not placed)
- Review sentiment summary

### 18.3 User Analytics (Personal — Visible to User)
- Total orders placed and money spent (this month / all time)
- Favourite vendors and items
- Points and loyalty tier progress
- Post engagement summary (likes, comments, shares received)
- Followers growth chart

---

## 19. Search & Discovery

### 19.1 Global Search
- Search across: users, vendors, food items, posts, hashtags
- Autocomplete suggestions (debounced, 300ms)
- Recent searches (stored locally + server)
- Search result tabs: All, Users, Food, Vendors, Posts
- Powered by Meilisearch (typo-tolerant, fast)

### 19.2 Food Search & Filter
- By cuisine type, dietary tag, price range, rating
- By delivery time (< 30 min, < 45 min, etc.)
- By distance (slider: 1 km – 20 km)
- "Open now" toggle
- Sort: relevance, rating, distance, price (low to high)

### 19.3 Explore / Trending
- Trending hashtags (computed every hour)
- Trending food items (most ordered in last 24h)
- Trending vendors (most orders today)
- Trending posts (most engagement in last 6h)
- City-level and national trending

---

## 20. UI/UX & Design System

### 20.1 Design Philosophy
- **Modern & Clean**: Generous whitespace, clear hierarchy, intuitive navigation
- **Dark Theme First**: Deep backgrounds (#0A0A0A, #111111) with vibrant accents
- **Light Theme Available**: Pure white (#FFFFFF) with light greys, user-selectable
- **Theme Persistence**: Saved to user profile, synced across devices
- **Responsive**: Works flawlessly on desktop (1440px+), tablet (768px+), mobile (375px+)

### 20.2 Design Tokens (Dark Theme)
```
Background Primary:    #0A0A0A
Background Secondary:  #111827
Surface:               #1F2937
Border:                #374151
Text Primary:          #F9FAFB
Text Secondary:        #9CA3AF
Accent (Brand):        #FF6B35  (warm orange — food energy)
Accent Secondary:      #10B981  (green — success / available)
Danger:                #EF4444
Warning:               #F59E0B
Info:                  #3B82F6
```

### 20.3 Loading States
- **Skeleton loading** on all list and card components (grey shimmer animation)
- **Lazy loading** for images (intersection observer — load on scroll into view)
- **Infinite scroll** for feed, search results, order history
- **Optimistic UI**: Like/save actions reflect instantly before server confirmation
- **Pull-to-refresh** on mobile app

### 20.4 Animations & Micro-interactions
- Smooth page transitions (Next.js route animations)
- Post like: heart bounce animation
- Order status: animated stepper with progress
- Story ring: gradient animated border
- Notification bell: shake on new notification
- Cart add: item flies into cart icon (mobile)
- Toast notifications: slide-in from bottom (mobile) / top-right (web)

### 20.5 Accessibility
- WCAG 2.1 AA compliance target
- Keyboard navigable (web)
- Screen reader labels on all interactive elements
- Sufficient colour contrast ratios
- Focus indicators visible

---

## 21. Performance & Scalability

### 21.1 Frontend Performance
- Next.js static generation (SSG) for public pages (home, explore, vendor profiles)
- Server-side rendering (SSR) for personalized pages (feed)
- Image optimization: Next.js `<Image>` component with WebP conversion + CDN
- Code splitting: route-based chunks
- Bundle analysis on every deploy
- Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1

### 21.2 Backend Performance
- MySQL query optimization: proper indexing, avoid N+1 (Eager loading in Laravel)
- Redis caching:
  - User feed (cached per user, invalidated on new post from followed user)
  - Trending data (refreshed every 15 mins)
  - Vendor menu (cached, invalidated on update)
  - Session data
- Rate limiting: per-IP and per-user API rate limits (Laravel rate limiter)
- Database connection pooling
- Queue heavy operations: image processing, email sending, analytics computation, push notifications

### 21.3 Horizontal Scaling
- Stateless Laravel instances (no local file/session storage)
- Session in Redis (shared across instances)
- File uploads go directly to S3/R2 (not through app server)
- Load balancer distributes traffic (round-robin with health checks)
- Queue workers scale independently of web workers
- Database read replicas for analytics and reporting queries

### 21.4 Real-Time Performance
- WebSocket server (Laravel Reverb) runs as separate service
- Channels: per-user private channel, per-order channel, public feed channel
- Fallback to polling for environments that block WebSocket
- Message batching for non-critical notifications

---

## 22. Security

### 22.1 Authentication
- Laravel Sanctum for SPA (web) — cookie-based session tokens
- Laravel Sanctum for mobile API — token-based (Bearer)
- JWT token expiry: 7 days (mobile), refreshed on activity
- Two-Factor Authentication (2FA) via TOTP (Google Authenticator) — optional for users, mandatory for admin
- OAuth login: Google, Apple (Phase 2)
- Rate limit login attempts: 5 attempts → 15 min lockout

### 22.2 Data Security
- All passwords hashed with bcrypt (Laravel default)
- PII data encrypted at rest (AES-256) for sensitive fields (address, phone)
- HTTPS enforced everywhere (SSL via Cloudflare + Let's Encrypt)
- CORS configured: only known origins allowed
- SQL injection prevention: Eloquent ORM + parameterised queries
- XSS prevention: output escaping in Next.js (automatic in JSX)
- CSRF protection: Laravel built-in CSRF tokens
- File upload validation: type, size, virus scan (ClamAV, Phase 2)

### 22.3 API Security
- All endpoints authenticated (except public endpoints: explore, vendor profiles)
- Role-based middleware on every route
- Request validation on every endpoint (Laravel Form Requests)
- API versioning: `/api/v1/` prefix
- Sensitive endpoints (admin, payouts) additionally IP-whitelisted

### 22.4 Privacy
- GDPR-ready: user data export + account deletion
- Data retention policy: deleted accounts data purged after 30-day grace
- Analytics data anonymized before storage
- Admin access to user data is logged (audit trail)

---

## 23. API Design & Health Routes

### 23.1 API Structure
```
Base URL: https://api.foodzone.app/api/v1/

Auth:
  POST /auth/register
  POST /auth/login
  POST /auth/logout
  POST /auth/verify-email
  POST /auth/forgot-password
  POST /auth/reset-password
  POST /auth/refresh-token

Users:
  GET    /users/{username}
  PUT    /users/profile
  POST   /users/{id}/follow
  DELETE /users/{id}/follow
  POST   /users/{id}/block

Posts:
  GET    /feed
  GET    /posts/{id}
  POST   /posts
  PUT    /posts/{id}
  DELETE /posts/{id}
  POST   /posts/{id}/like
  POST   /posts/{id}/comments

Vendors:
  GET    /vendors
  GET    /vendors/{id}
  GET    /vendors/{id}/menu
  POST   /vendors (register)

Orders:
  POST   /orders
  GET    /orders/{id}
  PUT    /orders/{id}/status
  POST   /orders/{id}/rate

Ads:
  POST   /ads/campaigns
  GET    /ads/campaigns/{id}/analytics

Admin:
  GET    /admin/dashboard
  GET    /admin/users
  PUT    /admin/users/{id}/ban
  GET    /admin/vendors
  PUT    /admin/vendors/{id}/approve
```

### 23.2 Health Check Routes
```
GET /health                    → Overall system status (JSON)
GET /health/database           → MySQL connection + query latency
GET /health/cache              → Redis ping + memory usage
GET /health/queue              → Queue worker status + pending jobs
GET /health/websocket          → Reverb server status + active connections
GET /health/storage            → S3/R2 connectivity
GET /health/search             → Meilisearch status
GET /health/mail               → SMTP connectivity test
```

### 23.3 Health Response Format
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": { "status": "up", "latency_ms": 4 },
    "cache": { "status": "up", "memory_used": "256MB" },
    "queue": { "status": "up", "pending_jobs": 12 },
    "websocket": { "status": "up", "connections": 342 }
  }
}
```

---

## 24. Database Schema — Overview

### Core Tables (Key)

```
users                  → id, username, email, password, role, status, verified_at
user_profiles          → user_id, bio, avatar, cover, website, dob, gender
user_addresses         → id, user_id, label, address, city, state, pincode, lat, lng

vendors                → id, user_id, name, slug, description, status, commission_rate
vendor_stores          → vendor_id, logo, banner, address, lat, lng, radius_km
operating_hours        → vendor_id, day, open_time, close_time, is_closed

menu_categories        → id, vendor_id, name, description, sort_order
menu_items             → id, vendor_id, category_id, name, description, price, status
item_variants          → id, item_id, name, price_modifier
item_addons            → id, item_id, name, price
item_images            → id, item_id, url, sort_order

orders                 → id, user_id, vendor_id, status, total, discount, delivery_charge
order_items            → id, order_id, item_id, quantity, unit_price, customizations
order_ratings          → id, order_id, user_id, rating, review, images

posts                  → id, user_id, body, privacy, type, created_at
post_media             → id, post_id, url, type (image/video), sort_order
post_likes             → user_id, post_id
post_comments          → id, post_id, user_id, parent_id, body
post_shares            → id, post_id, user_id, shared_to

stories                → id, user_id, media_url, type, expires_at
story_views            → story_id, viewer_id, viewed_at
story_highlights       → id, user_id, title, cover_url

follows                → follower_id, following_id, created_at
blocks                 → blocker_id, blocked_id

messages               → id, sender_id, receiver_id, body, type, read_at
message_reactions      → id, message_id, user_id, emoji

notifications          → id, user_id, type, data, read_at

violations             → id, user_id, type, evidence, severity, status
violation_actions      → id, violation_id, action_type, performed_by, notes

vouchers               → id, vendor_id, code, type, amount, min_order, max_uses, valid_to
voucher_redemptions    → id, voucher_id, user_id, order_id

ad_campaigns           → id, vendor_id, type, placement, status, budget, start_date, end_date
ad_impressions         → id, campaign_id, user_id, shown_at
ad_clicks              → id, campaign_id, user_id, clicked_at

inventory_items        → id, vendor_id, name, unit, quantity, threshold
inventory_logs         → id, item_id, change, reason, performed_by

delivery_partners      → id, user_id, vehicle_type, status, zone_id, earning_model
deliveries             → id, order_id, partner_id, status, picked_up_at, delivered_at

payments               → id, order_id, user_id, method, amount, gateway_ref, status
refunds                → id, payment_id, amount, reason, status

loyalty_points         → id, user_id, points, lifetime_points, tier

system_health_logs     → id, service, status, latency_ms, logged_at
audit_logs             → id, user_id, action, model, model_id, before, after, ip
```

---

## 25. Mobile App (React Native Expo)

### 25.1 Navigation Structure
```
(tabs)
  ├── index          → Home Feed
  ├── explore        → Explore / Search
  ├── order          → Food Ordering (vendor list)
  ├── inbox          → Notifications + DMs
  └── profile        → Own Profile

(stack)
  ├── vendor/[id]    → Vendor Store Page
  ├── post/[id]      → Single Post
  ├── user/[id]      → User Profile
  ├── cart           → Cart + Checkout
  ├── order/[id]     → Order Tracking
  └── chat/[id]      → DM Conversation
```

### 25.2 Mobile-Specific Features
- Biometric login (Face ID / Fingerprint)
- Haptic feedback on key interactions (like, order placed)
- Background order tracking notifications
- Offline mode: cached feed visible, graceful error on actions
- Deep links: `foodzone://post/123`, `foodzone://vendor/456`
- Share to external apps (WhatsApp, Instagram stories)
- Image picker with built-in cropper and filter
- Location services: auto-detect delivery address
- App-wide pull-to-refresh

---

## 26. DevOps & Deployment

### 26.1 Environments
| Environment | Purpose | Deploy Trigger |
|---|---|---|
| Development | Local development | Manual |
| Staging | QA and testing | PR merge to `develop` |
| Production | Live platform | PR merge to `main` |

### 26.2 CI/CD Pipeline (GitHub Actions)
- On PR: run PHPUnit tests, ESLint, Prettier check
- On merge to develop: deploy to staging, run E2E tests (Playwright)
- On merge to main: deploy to production with zero-downtime (rolling deploy)

### 26.3 Infrastructure
- **App Servers**: 2× Ubuntu 22.04 (Laravel) behind Nginx
- **Database**: MySQL primary + 1 read replica
- **Cache**: Redis (single instance, Sentinel for HA in Phase 2)
- **Queue**: Laravel Horizon on dedicated worker server
- **WebSocket**: Laravel Reverb on dedicated server
- **Storage**: Cloudflare R2 (S3-compatible)
- **CDN**: Cloudflare (global edge)
- **Monitoring**: Laravel Telescope (debug), Sentry (errors), UptimeRobot (uptime)

### 26.4 Backup Strategy
- MySQL: daily automated backups retained for 30 days
- Backups stored in separate S3 bucket (different region)
- Point-in-time recovery enabled
- Test restore quarterly

---

## 27. Future Roadmap

### Phase 2 (3–6 months post-launch)
- [ ] Delivery Partner system (full activation)
- [ ] Live streaming for vendors
- [ ] Reels / short video feed
- [ ] AI-powered feed personalization
- [ ] AI content moderation (auto-flag posts)
- [ ] Group chats
- [ ] Vendor table reservations (dine-in booking)
- [ ] End-to-end encrypted messages

### Phase 3 (6–12 months)
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Voice ordering via mobile
- [ ] FoodZone for Business (bulk corporate ordering)
- [ ] Franchise / cloud kitchen management module
- [ ] Subscription meal plans (weekly meal packages)
- [ ] Augmented Reality menu preview (view food in 3D)
- [ ] Blockchain-based loyalty points (cross-platform)

### Phase 4 (12+ months)
- [ ] Expand to international markets
- [ ] White-label platform for other businesses
- [ ] Open API marketplace for third-party integrations
- [ ] FoodZone Creator Fund (monetization for food content creators)

---

## Appendix: Key Non-Functional Requirements

| Requirement | Target |
|---|---|
| API Response Time (p95) | < 300ms |
| Feed Load Time | < 1.5s |
| Uptime SLA | 99.9% |
| Concurrent Users (launch) | 10,000 |
| Concurrent Users (Phase 2) | 100,000+ |
| Image Upload Max Size | 10MB per image |
| Video Upload Max Size | 100MB |
| Max Images per Post | 10 |
| Order Acceptance Window | 3 minutes (configurable) |
| WebSocket Heartbeat | Every 30 seconds |
| Session Timeout (web) | 7 days (sliding) |
| Password Min Length | 8 characters |
| 2FA Required | Admin only (mandatory) |

---

*Document Version: 1.0.0 | Last Updated: May 2025 | FoodZone Engineering Team*
