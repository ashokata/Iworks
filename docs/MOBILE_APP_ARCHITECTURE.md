# FieldSmartPro Mobile Application - Architecture & Strategy Document

## Document Information

| Item | Details |
|------|---------|
| **Version** | 1.0 |
| **Date** | December 2024 |
| **Status** | Planning Phase |
| **Target Users** | Field Technicians (Primary), Dispatchers (Secondary) |
| **Target Devices** | iPad, Android Tablets, iOS/Android Phones |

---

## Executive Summary

This document outlines the architectural strategy for building a scalable, offline-capable mobile application for FieldSmartPro field technicians. The app will leverage the existing PostgreSQL database and Express/Lambda API layer while providing a native-quality experience optimized for tablets and mobile devices.

---

## 1. Technology Stack Recommendation

### 1.1 Framework Comparison

| Framework | Pros | Cons | Best For |
|-----------|------|------|----------|
| **React Native** | - Shared codebase with web (React)<br>- Large ecosystem<br>- Hot reload<br>- Native performance | - Bridge overhead<br>- Platform-specific code needed | Cross-platform apps |
| **Flutter** | - Single codebase<br>- Excellent performance<br>- Beautiful UI widgets<br>- Strong typing (Dart) | - Different language (Dart)<br>- Less web code sharing | UI-heavy apps |
| **Expo (React Native)** | - Simplified development<br>- OTA updates<br>- Managed workflow<br>- Easy deployment | - Limited native module access<br>- Larger bundle size | Rapid development |
| **Capacitor + Ionic** | - Web tech (HTML/CSS/JS)<br>- Code sharing with web<br>- Plugin ecosystem | - Not truly native<br>- Performance concerns | Web-first teams |

### 1.2 Recommended Stack: **React Native with Expo**

**Rationale:**
1. **Code Sharing** - Maximum reuse from existing React web app (components, services, types)
2. **Team Expertise** - Already using React/TypeScript in the web app
3. **Expo Benefits** - OTA updates for field technicians, simplified CI/CD
4. **Offline First** - React Native has mature offline libraries
5. **Native Features** - Camera, GPS, push notifications, biometrics

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED TECHNOLOGY STACK                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Framework:     React Native + Expo SDK 50+                             │
│  Language:      TypeScript (100% type safety)                           │
│  State:         Zustand + React Query (TanStack Query)                  │
│  Navigation:    Expo Router (file-based, like Next.js)                  │
│  UI Library:    NativeWind (Tailwind for RN) + Tamagui                  │
│  Offline:       WatermelonDB + React Query persistence                  │
│  Forms:         React Hook Form + Zod                                   │
│  Maps:          react-native-maps + Mapbox                              │
│  Auth:          Expo SecureStore + JWT                                  │
│  Push:          Expo Notifications + Firebase Cloud Messaging           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. High-Level Architecture

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FIELD TECHNICIAN DEVICES                            │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    iPad      │  │   Android    │  │   iPhone     │  │   Android    │         │
│  │   (Pro)      │  │    Tablet    │  │              │  │    Phone     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                │                  │                  │                 │
│         └────────────────┴──────────────────┴──────────────────┘                 │
│                                    │                                             │
│  ┌─────────────────────────────────┴─────────────────────────────────────────┐  │
│  │                     REACT NATIVE + EXPO APPLICATION                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         PRESENTATION LAYER                           │  │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │  │  │
│  │  │  │Dashboard│ │  Jobs   │ │Customers│ │ Schedule│ │  AI Voice   │   │  │  │
│  │  │  │  Screen │ │  List   │ │  List   │ │  View   │ │  Assistant  │   │  │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │  │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │  │  │
│  │  │  │  Job    │ │ Customer│ │ Invoice │ │  Time   │ │   Photo     │   │  │  │
│  │  │  │ Detail  │ │  Detail │ │ Create  │ │ Tracker │ │   Capture   │   │  │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                            │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                           STATE LAYER                                │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │  │  │
│  │  │  │   Zustand   │  │ React Query │  │    WatermelonDB (SQLite)    │  │  │  │
│  │  │  │   (Global)  │  │  (Server)   │  │    (Local Offline DB)       │  │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                            │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                          SERVICE LAYER                               │  │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │  │  │
│  │  │  │ Customer│ │   Job   │ │ Invoice │ │Employee │ │    Sync     │   │  │  │
│  │  │  │ Service │ │ Service │ │ Service │ │ Service │ │   Manager   │   │  │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │  │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │  │  │
│  │  │  │   Auth  │ │  Media  │ │   GPS   │ │  Push   │ │   Offline   │   │  │  │
│  │  │  │ Service │ │ Service │ │ Service │ │ Service │ │   Queue     │   │  │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS / REST + WebSocket
                                        │ JWT Authentication
                                        │ x-tenant-id Header
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 BACKEND LAYER                                    │
│                          (EXISTING INFRASTRUCTURE)                               │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         API GATEWAY / LOAD BALANCER                      │   │
│  │                     (AWS API Gateway or Express on EC2)                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                         │
│  ┌─────────────────────────────────────┴─────────────────────────────────┐     │
│  │                              API LAYER                                 │     │
│  │                      (Express.js / AWS Lambda)                         │     │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │     │
│  │  │ /customers  /jobs  /employees  /invoices  /llm-chat  /media     │  │     │
│  │  └─────────────────────────────────────────────────────────────────┘  │     │
│  └───────────────────────────────────────────────────────────────────────┘     │
│                                        │                                         │
│  ┌─────────────────────────────────────┴─────────────────────────────────┐     │
│  │                           DATABASE LAYER                               │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │     │
│  │  │  PostgreSQL  │  │   AWS S3     │  │  AWS Bedrock │                │     │
│  │  │  (Primary)   │  │  (Media)     │  │   (LLM/AI)   │                │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │     │
│  └───────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Offline-First Architecture

### 3.1 Why Offline-First?

Field technicians often work in:
- Basements with no signal
- Rural areas with spotty connectivity
- Underground utilities
- Large buildings with dead zones

### 3.2 Offline Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OFFLINE-FIRST STRATEGY                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    DATA SYNCHRONIZATION                         │    │
│  │                                                                 │    │
│  │  1. INITIAL SYNC (First Login)                                  │    │
│  │     └─ Download: Today's jobs, assigned customers, price book  │    │
│  │                                                                 │    │
│  │  2. INCREMENTAL SYNC (Background)                               │    │
│  │     └─ Every 5 min when online: Check for updates               │    │
│  │     └─ Push local changes to server                             │    │
│  │                                                                 │    │
│  │  3. CONFLICT RESOLUTION                                         │    │
│  │     └─ Server wins for: schedules, assignments                  │    │
│  │     └─ Client wins for: time entries, photos, notes             │    │
│  │     └─ Merge for: job status (with timestamp comparison)        │    │
│  │                                                                 │    │
│  │  4. OFFLINE QUEUE                                               │    │
│  │     └─ Queue mutations when offline                             │    │
│  │     └─ Process queue when back online (FIFO)                    │    │
│  │     └─ Retry failed operations with exponential backoff         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    LOCAL DATABASE SCHEMA                        │    │
│  │                                                                 │    │
│  │  WatermelonDB Tables:                                           │    │
│  │  ├─ jobs (synced subset - today + 7 days)                      │    │
│  │  ├─ customers (synced subset - assigned only)                  │    │
│  │  ├─ services (full price book)                                 │    │
│  │  ├─ materials (full catalog)                                   │    │
│  │  ├─ time_entries (local + synced)                              │    │
│  │  ├─ photos (local paths + upload status)                       │    │
│  │  ├─ signatures (local paths)                                   │    │
│  │  ├─ checklists (job-specific)                                  │    │
│  │  └─ offline_queue (pending operations)                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Sync State Machine

```
                    ┌──────────────┐
                    │    IDLE      │
                    └──────┬───────┘
                           │ Timer / Network Change
                           ▼
                    ┌──────────────┐
           ┌────────│   SYNCING    │────────┐
           │        └──────────────┘        │
           │ Error                          │ Success
           ▼                                ▼
    ┌──────────────┐                ┌──────────────┐
    │    ERROR     │                │   SYNCED     │
    └──────┬───────┘                └──────┬───────┘
           │ Retry (backoff)               │
           └──────────────┬────────────────┘
                          ▼
                    ┌──────────────┐
                    │    IDLE      │
                    └──────────────┘
```

---

## 4. Mobile-Specific Features

### 4.1 Core Technician Features

| Feature | Priority | Offline Support | Native APIs |
|---------|----------|-----------------|-------------|
| **Today's Jobs Dashboard** | P0 | ✅ Full | - |
| **Job Detail & Update** | P0 | ✅ Full | - |
| **Customer Lookup** | P0 | ✅ Cached | - |
| **Clock In/Out** | P0 | ✅ Queue | GPS, Time |
| **Photo Capture** | P0 | ✅ Local | Camera |
| **Signature Capture** | P0 | ✅ Local | Touch Canvas |
| **Checklist Completion** | P0 | ✅ Full | - |
| **Invoice Generation** | P1 | ✅ Local | - |
| **Payment Collection** | P1 | ⚠️ Online | Stripe SDK |
| **Navigation to Job** | P1 | ⚠️ Cached | Maps, GPS |
| **Voice AI Assistant** | P2 | ❌ Online | Microphone |
| **Parts Ordering** | P2 | ❌ Online | - |
| **Video Recording** | P3 | ✅ Local | Camera |

### 4.2 Device-Specific Optimizations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      RESPONSIVE LAYOUT STRATEGY                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHONES (< 768px)                                                        │
│  ┌─────────────────────────┐                                            │
│  │ ┌─────────────────────┐ │  - Bottom tab navigation                   │
│  │ │                     │ │  - Single column layouts                   │
│  │ │   Content Area      │ │  - Large touch targets (48px min)          │
│  │ │                     │ │  - Swipe gestures for actions              │
│  │ │                     │ │  - Modal sheets for details                │
│  │ └─────────────────────┘ │                                            │
│  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐    │                                            │
│  │ │  │ │  │ │  │ │  │    │  Bottom tabs                               │
│  │ └──┘ └──┘ └──┘ └──┘    │                                            │
│  └─────────────────────────┘                                            │
│                                                                          │
│  TABLETS (768px - 1024px)                                                │
│  ┌──────────────────────────────────────────┐                           │
│  │ ┌──────┐ ┌─────────────────────────────┐ │  - Sidebar navigation     │
│  │ │      │ │                             │ │  - Two column layouts     │
│  │ │ Nav  │ │    Content Area             │ │  - Split view support     │
│  │ │ Rail │ │                             │ │  - Keyboard shortcuts     │
│  │ │      │ │                             │ │  - Pointer/pencil support │
│  │ └──────┘ └─────────────────────────────┘ │                           │
│  └──────────────────────────────────────────┘                           │
│                                                                          │
│  TABLETS LANDSCAPE (> 1024px)                                            │
│  ┌────────────────────────────────────────────────────────┐             │
│  │ ┌────────┐ ┌──────────────┐ ┌──────────────────────┐  │              │
│  │ │        │ │              │ │                      │  │  - Three     │
│  │ │  Nav   │ │    List      │ │      Detail          │  │    column   │
│  │ │ Drawer │ │    View      │ │      View            │  │  - Master-  │
│  │ │        │ │              │ │                      │  │    detail   │
│  │ └────────┘ └──────────────┘ └──────────────────────┘  │              │
│  └────────────────────────────────────────────────────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Project Structure

```
apps/mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Dashboard/Today
│   │   ├── jobs/
│   │   │   ├── index.tsx         # Jobs list
│   │   │   └── [id].tsx          # Job detail
│   │   ├── customers/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── schedule.tsx          # Weekly schedule
│   │   └── profile.tsx           # Settings & profile
│   ├── job/                      # Job workflow screens
│   │   ├── [id]/
│   │   │   ├── checklist.tsx
│   │   │   ├── photos.tsx
│   │   │   ├── invoice.tsx
│   │   │   └── signature.tsx
│   └── _layout.tsx               # Root layout
│
├── components/                    # Shared components
│   ├── ui/                        # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── jobs/                      # Job-specific components
│   │   ├── JobCard.tsx
│   │   ├── JobStatusBadge.tsx
│   │   └── JobTimeline.tsx
│   ├── customers/
│   ├── common/
│   │   ├── SyncIndicator.tsx
│   │   ├── OfflineBanner.tsx
│   │   └── LoadingScreen.tsx
│   └── forms/
│       ├── SignatureCanvas.tsx
│       ├── PhotoCapture.tsx
│       └── ChecklistForm.tsx
│
├── services/                      # API & business logic
│   ├── api/                       # API clients (shared with web)
│   │   ├── client.ts
│   │   ├── customerService.ts
│   │   ├── jobService.ts
│   │   └── ...
│   ├── offline/                   # Offline-specific
│   │   ├── syncManager.ts
│   │   ├── offlineQueue.ts
│   │   └── conflictResolver.ts
│   └── native/                    # Native feature wrappers
│       ├── camera.ts
│       ├── location.ts
│       ├── notifications.ts
│       └── biometrics.ts
│
├── db/                            # WatermelonDB setup
│   ├── schema.ts                  # Database schema
│   ├── models/                    # Model definitions
│   │   ├── Job.ts
│   │   ├── Customer.ts
│   │   └── ...
│   └── sync.ts                    # Sync adapter
│
├── stores/                        # Zustand stores
│   ├── authStore.ts
│   ├── syncStore.ts
│   └── settingsStore.ts
│
├── hooks/                         # Custom hooks
│   ├── useJobs.ts
│   ├── useCustomer.ts
│   ├── useOfflineStatus.ts
│   └── useLocation.ts
│
├── utils/                         # Utilities
│   ├── formatting.ts
│   ├── validation.ts
│   └── permissions.ts
│
├── constants/                     # App constants
│   ├── colors.ts
│   ├── dimensions.ts
│   └── config.ts
│
├── assets/                        # Static assets
│   ├── fonts/
│   ├── images/
│   └── icons/
│
├── app.json                       # Expo config
├── eas.json                       # EAS Build config
├── package.json
└── tsconfig.json
```

---

## 6. Shared Code Strategy

### 6.1 Code Sharing with Web App

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CODE SHARING STRATEGY                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  packages/shared/                    (New shared package)               │
│  ├── types/                          ← Move from apps/web/src/types     │
│  │   ├── database.types.ts                                              │
│  │   ├── api.types.ts                                                   │
│  │   └── index.ts                                                       │
│  ├── utils/                          ← Shared utilities                 │
│  │   ├── formatting.ts                                                  │
│  │   ├── validation.ts                                                  │
│  │   └── dates.ts                                                       │
│  ├── constants/                      ← Shared constants                 │
│  │   ├── jobStatuses.ts                                                 │
│  │   └── roles.ts                                                       │
│  └── schemas/                        ← Zod validation schemas           │
│      ├── customer.schema.ts                                             │
│      └── job.schema.ts                                                  │
│                                                                          │
│  SHARING PATTERN:                                                        │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │    apps/web      │    │  packages/shared │    │   apps/mobile    │   │
│  │  (Next.js)       │◄───┤    (Types,       │───►│  (React Native)  │   │
│  │                  │    │    Utils,        │    │                  │   │
│  │                  │    │    Schemas)      │    │                  │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 What to Share vs. What's Platform-Specific

| Category | Share? | Reason |
|----------|--------|--------|
| TypeScript Types | ✅ Yes | Same API, same types |
| Zod Schemas | ✅ Yes | Validation logic identical |
| API Service Logic | ⚠️ Partial | Same endpoints, different fetch |
| Date/Number Formatting | ✅ Yes | Business logic identical |
| UI Components | ❌ No | React DOM vs React Native |
| Navigation | ❌ No | Next.js vs Expo Router |
| State Management | ⚠️ Partial | Zustand stores can be similar |
| Offline Logic | ❌ No | Mobile-specific |

---

## 7. Backend API Requirements

### 7.1 New Endpoints Needed for Mobile

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/mobile/sync` | POST | Delta sync for offline data | P0 |
| `/mobile/bootstrap` | GET | Initial app data load | P0 |
| `/jobs/:id/clock-in` | POST | Start job timer | P0 |
| `/jobs/:id/clock-out` | POST | End job timer | P0 |
| `/jobs/:id/photos` | POST | Upload job photos | P0 |
| `/jobs/:id/signature` | POST | Upload signature | P0 |
| `/jobs/:id/complete` | POST | Complete job with summary | P0 |
| `/technician/today` | GET | Today's schedule | P0 |
| `/technician/location` | POST | Update tech location | P1 |
| `/push/register` | POST | Register push token | P1 |
| `/media/upload` | POST | S3 presigned URL for uploads | P0 |

### 7.2 Webhook/Push Events

| Event | Trigger | Data |
|-------|---------|------|
| `job.assigned` | New job assigned | Job details |
| `job.updated` | Job details changed | Changed fields |
| `job.cancelled` | Job cancelled | Job ID, reason |
| `schedule.changed` | Schedule modified | New schedule |
| `message.received` | New message | Message content |

---

## 8. Security Considerations

### 8.1 Authentication Flow

```
┌───────────────┐                    ┌───────────────┐                    ┌───────────────┐
│   Mobile App  │                    │   API Server  │                    │   Database    │
└───────┬───────┘                    └───────┬───────┘                    └───────┬───────┘
        │                                    │                                    │
        │  1. Login (email, password)        │                                    │
        │───────────────────────────────────>│                                    │
        │                                    │  2. Verify credentials              │
        │                                    │───────────────────────────────────>│
        │                                    │                                    │
        │                                    │  3. User data                       │
        │                                    │<───────────────────────────────────│
        │  4. JWT (access + refresh)         │                                    │
        │<───────────────────────────────────│                                    │
        │                                    │                                    │
        │  5. Store in SecureStore           │                                    │
        │  (Keychain/Keystore)               │                                    │
        │                                    │                                    │
        │  6. API Request + Bearer Token     │                                    │
        │───────────────────────────────────>│                                    │
        │                                    │                                    │
```

### 8.2 Security Measures

| Measure | Implementation |
|---------|----------------|
| **Token Storage** | Expo SecureStore (uses iOS Keychain / Android Keystore) |
| **Token Refresh** | Silent refresh before expiry |
| **Biometric Login** | Optional FaceID/TouchID for quick access |
| **Certificate Pinning** | Pin SSL certificates for API |
| **Data at Rest** | SQLCipher for local database encryption |
| **Session Timeout** | Auto-logout after 30 min inactivity |
| **Remote Wipe** | Ability to clear app data remotely |

---

## 9. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cold Start** | < 2 seconds | Time to interactive |
| **Job List Load** | < 500ms | With 50 jobs |
| **Photo Capture** | < 1 second | Shutter to preview |
| **Sync Time** | < 5 seconds | 100 record delta |
| **App Size** | < 50 MB | Initial download |
| **Memory Usage** | < 200 MB | During normal use |
| **Battery** | < 5%/hour | Active use |
| **Offline Mode** | 100% | Core features work |

---

## 10. Development Phases

### Phase 1: Foundation (4 weeks)
- [ ] Project setup with Expo
- [ ] Authentication flow
- [ ] Navigation structure
- [ ] Base UI components
- [ ] API client setup
- [ ] Basic job list view

### Phase 2: Core Features (6 weeks)
- [ ] Job detail screen
- [ ] Job status updates
- [ ] Customer lookup
- [ ] Photo capture
- [ ] Signature capture
- [ ] Checklist completion
- [ ] Clock in/out

### Phase 3: Offline Support (4 weeks)
- [ ] WatermelonDB setup
- [ ] Sync manager
- [ ] Offline queue
- [ ] Conflict resolution
- [ ] Background sync

### Phase 4: Enhanced Features (4 weeks)
- [ ] Invoice generation
- [ ] Payment collection
- [ ] Navigation integration
- [ ] Push notifications
- [ ] Voice AI assistant

### Phase 5: Polish & Launch (2 weeks)
- [ ] Performance optimization
- [ ] UI polish
- [ ] Testing & QA
- [ ] App store submission
- [ ] Documentation

---

## 11. Testing Strategy

| Test Type | Tools | Coverage Target |
|-----------|-------|-----------------|
| **Unit Tests** | Jest + React Native Testing Library | 80% |
| **Integration Tests** | Detox | Critical paths |
| **E2E Tests** | Maestro | Happy paths |
| **Performance Tests** | Flashlight | All screens |
| **Offline Tests** | Manual + Automated | All offline features |

---

## 12. CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CI/CD PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────────┐│
│  │  Push   │───>│  Lint   │───>│  Test   │───>│  Build  │───>│ Deploy ││
│  │         │    │  +Type  │    │         │    │  (EAS)  │    │        ││
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────────┘│
│                                                                          │
│  ENVIRONMENTS:                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Development  →  PR Preview  →  Staging  →  Production          │   │
│  │  (local)         (EAS Update)   (TestFlight/   (App Store/      │   │
│  │                                  Play Console)  Play Store)      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  OTA UPDATES (Expo Updates):                                             │
│  - JavaScript bundle updates without app store review                    │
│  - Rollback capability                                                   │
│  - Gradual rollout support                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Estimated Effort

| Phase | Duration | Team |
|-------|----------|------|
| Phase 1: Foundation | 4 weeks | 2 developers |
| Phase 2: Core Features | 6 weeks | 2-3 developers |
| Phase 3: Offline Support | 4 weeks | 2 developers |
| Phase 4: Enhanced Features | 4 weeks | 2 developers |
| Phase 5: Polish & Launch | 2 weeks | 2 developers + QA |
| **Total** | **20 weeks** | - |

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Offline complexity | High | Start simple, iterate |
| Platform-specific bugs | Medium | Extensive device testing |
| Performance on older devices | Medium | Set minimum device requirements |
| App store rejection | High | Follow guidelines strictly |
| Sync conflicts | Medium | Clear conflict resolution rules |
| Large photo uploads | Medium | Compress + background upload |

---

## 15. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React Native + Expo | Code sharing, team expertise |
| Offline DB | WatermelonDB | Performance, sync support |
| State | Zustand + React Query | Lightweight, powerful |
| Navigation | Expo Router | File-based, familiar |
| UI | NativeWind | Tailwind syntax, fast |
| Auth Storage | Expo SecureStore | Native secure storage |
| CI/CD | EAS Build | Integrated with Expo |

---

## Next Steps

1. **Review this document** with stakeholders
2. **Approve technology choices**
3. **Set up project structure** (Phase 1, Week 1)
4. **Create shared package** for types/utils
5. **Begin development** with authentication flow

---

*Document prepared for FieldSmartPro Mobile Application development planning.*

