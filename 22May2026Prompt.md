You are continuing development on the **FoodZone** food delivery platform. The project currently has a Laravel 13 backend, Next.js 16 web application, and Expo SDK 55 mobile app.

We have completed the foundation (P1–P3) and multiple vertical features (P4–P11). Now I want you to take the project to **production-grade level** by addressing all pending work, resolving technical debt, and building professional, scalable dashboards.

### 1. High Priority: Professional Dashboards

Build complete, modern, and production-ready dashboards:

- **Admin Dashboard** (Professional & Enterprise Grade)
  - Real-time overview with charts and KPIs
  - Advanced user management with bulk actions
  - Vendor approval workflow with detailed review
  - Order monitoring, disputes, and analytics
  - System health, logs, and activity tracking
  - Clean, responsive, and accessible UI with data tables, filters, and export options

- **Vendor Dashboard** (Business-Ready)
  - Store profile & operating hours management
  - Full menu management with categories, variants, add-ons, and image uploads
  - Order management with live status updates and timeline
  - Revenue analytics, sales reports, and performance insights
  - Review management with reply system
  - Professional and intuitive interface suitable for daily business use

### 2. Resolve Known Limitations & Tech Debt

Please fix or properly implement the following technical limitations:

- Replace database-driven cache, queue, and session with **Redis**
- Integrate **Meilisearch** for fast and relevant search
- Replace polling with **real-time updates** using Laravel Reverb (WebSockets)
- Build a proper **media upload system** (`POST /media`) with support for image optimization and CDN
- Add database-level foreign keys and improve data integrity where possible
- Improve the reorder feature to handle price changes and unavailable items transparently

### 3. Implement Pending Features

Continue development on the remaining backlog items using a full-stack approach (Backend + Web + Mobile):

- Post detail page with threaded comments and sharing
- Image uploads for posts, avatars, vendor banners, and menu items
- Real-time chat / DMs between users and vendors
- Payment gateway integration (Razorpay or Stripe with webhooks and refunds)
- Item variants and add-ons at checkout
- Promo code / Voucher system with proper UX
- Delivery partner role and workflow
- Vendor menu management on mobile
- Detailed order timeline and status history
- Push notifications using Expo + FCM/APNs
- Email verification flow on both web and mobile

### 4. Production-Grade Enhancements (Free Hand)

You have full freedom to introduce modern technologies and best practices to make FoodZone production-ready. Consider adding:

- Proper file storage using **Laravel Filesystem** with S3 or Cloudinary
- Background job processing with **Laravel Queues + Redis**
- Advanced caching strategy (Redis + query caching)
- Comprehensive logging and monitoring setup
- Rate limiting, security headers, and input sanitization
- Role-based access control improvements and audit logs
- Image optimization, resizing, and CDN integration
- Better error handling and structured API responses
- Improved testing coverage (Feature tests, API tests, and frontend tests)
- CI/CD friendly structure and environment configuration

### 5. Development Guidelines

- Maintain consistency with the existing codebase architecture and coding standards.
- Create new phases starting from **P12** onwards with proper documentation (`WORKPHASE-12.md`, etc.).
- Ensure every feature works across Backend, Web, and Mobile.
- Follow clean architecture, proper validation, and professional UI/UX.
- Prioritize scalability, performance, and maintainability.

Please start by proposing a phased roadmap (P12, P13, …) and begin implementation. Give special focus to the **Admin and Vendor Dashboards** in the early phases. Let me know your recommended starting phase and the key files/modules that need to be created or upgraded.