# 🌾 AgroNet — Frontend Structure & Project Reference

> A React Native (Expo + Expo Router) platform connecting farmers directly to buyers with AI price prediction, GPS logistics tracking, and integrated payments via InterSwitch.

---

## Table of Contents

1. [App Overview](#app-overview)
2. [User Roles](#user-roles)
3. [Navigation Architecture](#navigation-architecture)
4. [Screen Inventory](#screen-inventory)
5. [UI Component Library](#ui-component-library)
6. [Payments — InterSwitch Integration](#payments--interswitch-integration)
7. [Tech Stack](#tech-stack)
8. [Folder Structure](#folder-structure)
9. [MVP Scope](#mvp-scope)

---

## App Overview

AgroNet removes the middleman between farmers and buyers. The app handles:

- **Direct produce marketplace** — farmers list, buyers browse and purchase
- **AI price prediction** — suggests optimal selling prices using weather, season, and market history
- **GPS delivery tracking** — real-time shipment visibility from farm to buyer
- **Weather alerts** — harvest planning and risk alerts for farmers
- **In-app payments** — bank account linking and transfers via InterSwitch

---

## User Roles

The app has **two distinct user types** with different navigation experiences. Role is selected at onboarding and determines which tab set is rendered.

| Role       | Primary Goal                                                    |
| ---------- | --------------------------------------------------------------- |
| **Farmer** | List produce, manage orders, track earnings, view AI insights   |
| **Buyer**  | Browse produce, place orders, track deliveries, manage payments |

---

## Navigation Architecture

```
app/
├── (onboarding)/               ← Stack — shown before auth
│   ├── index.tsx              Welcome / Splash
|   ├── welcome.tsx            Welcome / Hero + CTA
│   ├── role-select.tsx         Choose: Farmer or Buyer
│   ├── sign-up.tsx
│   ├── sign-in.tsx
│   ├── otp-verify.tsx
│   ├── profile-setup.tsx
│   └── bank-link.tsx           InterSwitch setup (shown once, can skip)
│
├── farmer/                   ← Tab layout — only for Farmer role
│   ├── _layout.tsx             Tab bar config
│   ├── index.tsx               Dashboard (Home)
│   ├── listings/
│   │   ├── index.tsx           My Listings
│   │   ├── add.tsx             Add New Listing
│   │   └── [id].tsx            Edit / View Listing
│   ├── orders/
│   │   ├── index.tsx           Incoming Orders
│   │   └── [id].tsx            Order Detail + Dispatch
│   ├── insights.tsx            AI Price + Weather Tab
│   └── profile/
│       ├── index.tsx           Profile
│       └── bank.tsx            Bank Account (InterSwitch)
│
└── buyer/                    ← Tab layout — only for Buyer role
    ├── _layout.tsx             Tab bar config
    ├── index.tsx               Browse / Home
    ├── produce/
    │   └── [id].tsx            Produce Detail
    ├── orders/
    │   ├── index.tsx           My Orders
    │   ├── [id].tsx            Order Detail
    │   └── track/[id].tsx      Live GPS Tracking
    ├── cart.tsx                Cart + Checkout
    └── profile/
        ├── index.tsx           Profile
        └── bank.tsx            Bank Account (InterSwitch)
```

---

## Screen Inventory

### Onboarding (Shared)

| Screen               | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| `WelcomeScreen`      | Splash + hero, CTA to sign up or log in                        |
| `RoleSelectScreen`   | "I'm a Farmer" / "I'm a Buyer" cards                           |
| `SignUpScreen`       | Name, phone/email, password                                    |
| `SignInScreen`       | Login form                                                     |
| `OTPVerifyScreen`    | Phone number verification (6-digit code)                       |
| `ProfileSetupScreen` | Photo, location, farm name farmer or company buyer             |
| `BankLinkScreen`     | InterSwitch account connection — can be skipped and done later |

---

### Farmer Tabs

#### Tab 1: Dashboard (Home)

The farmer's control center. Most important screen.

| Section                | Content                                        |
| ---------------------- | ---------------------------------------------- |
| Header                 | Greeting + notification bell                   |
| Today's Weather Widget | Temp, rain chance, harvest advisory            |
| Earnings Summary       | This week / this month                         |
| Active Listings Count  | Quick number                                   |
| Pending Orders Count   | Quick number with badge                        |
| Quick Actions          | "Add Listing", "View Orders" buttons           |
| Price Alert Banner     | "Tomatoes are trending up — update your price" |

---

#### Tab 2: Listings (My Produce)

**`MyListingsScreen`**

- Filter bar: All / Active / Sold Out / Pending
- `ProduceCard` list with thumbnail, name, price, quantity, status badge
- FAB (floating action button) → Add Listing

**`AddListingScreen` / `EditListingScreen`**

- Image picker (up to 4 photos)
- Produce name + category picker
- Quantity + unit selector (kg, bags, crates, etc.)
- Price input with **AI suggestion chip** → "Suggested: ₦1,200/kg"
- Harvest date picker
- Location (auto-fill from profile, editable)
- Description field
- Submit / Update button

---

#### Tab 3: Orders

**`IncomingOrdersScreen`**

- Tabs: Pending / Confirmed / Dispatched / Completed
- `OrderCard` per order: buyer name, produce, qty, total, status badge
- Swipe-to-confirm or action buttons

**`OrderDetailScreen`**

- Buyer info + contact button
- Order items breakdown
- Payment status chip (Paid / Pending)
- `OrderStatusStepper` — Received → Confirmed → Dispatched → Delivered
- Dispatch button → triggers GPS tracking session

---

#### Tab 4: Insights

**Top half — Price Insights (AI)**

- Dropdown: select produce type
- `PriceInsightCard`: Current avg market price, suggested price, trend direction arrow
- 7-day demand chart (recharts / Victory Native)
- "Why this price?" expandable explanation

**Bottom half — Weather**

- 5-day forecast strip
- Alert cards: Rain alert, Pest risk, Frost warning (if applicable)
- Harvest window recommendation: "Best harvest window: Thu–Sat"

---

#### Tab 5: Profile

**`ProfileScreen` (Farmer)**

- Avatar + farm name + location
- Stats row: Total Sales, Products Listed, Avg Rating
- Menu list:
  - Bank Account → `BankScreen`
  - My Reviews
  - Notification Preferences
  - Help & Support
  - Log Out

**`BankScreen`**

- Linked account card (bank logo, masked account number)
- "Link New Account" button → InterSwitch flow
- Withdrawal history list

---

### Buyer Tabs

#### Tab 1: Home (Browse)

**`BrowseScreen`**

- Search bar (sticky at top)
- Category filter chips: Grains, Vegetables, Fruits, Tubers, Livestock
- "Near You" horizontal scroll of `ProduceCard`
- "Best Prices This Week" section
- Featured Farmers strip

**`ProduceDetailScreen`** (pushed from browse, not a tab)

- Image carousel
- Name, category, price per unit, available quantity
- Farmer info row with rating + "View Profile" link
- Location + estimated delivery
- Add to Cart button
- Similar produce section

**`FarmerProfileScreen`** (pushed, not a tab)

- Farmer avatar, name, location, rating, total sales
- All active listings by this farmer

---

#### Tab 2: Orders

**`MyOrdersScreen`**

- Tabs: Active / Past
- `OrderCard` list: produce image, name, total, status badge, date
- Tap → `OrderDetailScreen`

**`OrderDetailScreen`** (Buyer)

- Order items + quantities + prices
- Total paid breakdown
- `OrderStatusStepper`
- "Track Delivery" button → `TrackingScreen`
- Reorder button (for past orders)

**`TrackingScreen`**

- Full-screen map (Mapbox / Google Maps)
- Driver location pin (updates in real-time)
- Produce origin pin (farm)
- Destination pin buyer
- ETA chip
- Order summary drawer (swipe up)

---

#### Tab 3: Cart

**`CartScreen`**

- List of cart items with quantity controls
- Delivery address selector
- Price breakdown: subtotal, delivery fee, total
- "Proceed to Checkout" button

**`CheckoutScreen`** (pushed from Cart)

- Order summary
- Payment method selector:
  - Linked bank account (InterSwitch)
  - Add new card
- Delivery instructions field
- "Place Order" button → payment flow → success screen

---

#### Tab 4: Profile (Buyer)

- Avatar, name, location
- Menu list:
  - Bank Account → `BankScreen`
  - My Reviews
  - Addresses
  - Notification Preferences
  - Help & Support
  - Log Out

---

## UI Component Library

Split into **core (shared)** and **feature-specific**. Build core first — features depend on them.

### Core Components `/components/ui/`

These are your design system primitives. Build these before anything else.

| Component                 | Props / Notes                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `Button`                  | `variant: primary \| secondary \| outline \| ghost`, `size`, `loading`, `disabled`, `icon` |
| `Input`                   | `label`, `placeholder`, `error`, `icon`, `secureTextEntry`, `keyboardType`                 |
| `Card`                    | Wrapper with shadow + border radius + padding. Accepts `children`.                         |
| `Badge`                   | `label`, `color: green \| yellow \| red \| gray`. For statuses.                            |
| `Tag` / `Chip`            | Selectable filter pill. `selected` boolean state.                                          |
| `Avatar`                  | `uri` (image URL) + `size`. Falls back to initials if no image.                            |
| `Divider`                 | Horizontal line with optional `label` in center                                            |
| `EmptyState`              | Illustration + title + subtitle + optional CTA button                                      |
| `ErrorState`              | Error illustration + retry button                                                          |
| `LoadingSpinner`          | Centered activity indicator with optional `message`                                        |
| `ScreenHeader`            | Title + optional back button + optional right action slot                                  |
| `SearchBar`               | Controlled input with magnifier icon + clear button                                        |
| `BottomSheet`             | Reusable `@gorhom/bottom-sheet` wrapper                                                    |
| `Modal`                   | Centered overlay modal with dismiss                                                        |
| `Toast`                   | Success / error / info snackbar (use `react-native-toast-message`)                         |
| `SectionHeader`           | Bolded section label with optional "See All" right link                                    |
| `KeyboardAvoidingWrapper` | Wraps scroll views in forms                                                                |
| `ImagePickerGrid`         | Up to 4 image slots with add/remove. For listing creation.                                 |
| `OTPInput`                | 6-box OTP entry component                                                                  |

---

### Feature Components `/components/features/`

Built on top of core components. One per feature area.

#### Produce & Marketplace

| Component              | Description                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| `ProduceCard`          | Thumbnail, name, price, farmer name, location, rating. Used in browse + listings. |
| `CategoryChip`         | Scrollable row of category filter chips                                           |
| `PriceTag`             | Formatted price display with unit (`₦1,200 / kg`)                                 |
| `QuantitySelector`     | +/- stepper with min/max validation                                               |
| `ProduceImageCarousel` | Swipeable image gallery with dot indicators                                       |
| `StockBadge`           | "In Stock" / "Low Stock" / "Sold Out"                                             |

#### Orders

| Component             | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `OrderCard`           | Summary card: produce image, buyer/farmer name, total, status badge    |
| `OrderStatusStepper`  | Horizontal step tracker: Received → Confirmed → Dispatched → Delivered |
| `OrderItemRow`        | Single line item: image, name, qty, price                              |
| `DeliveryAddressCard` | Address block with edit button                                         |

#### Payments (InterSwitch)

| Component               | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `LinkedBankCard`        | Shows bank logo, masked account number, "Remove" option   |
| `PaymentMethodSelector` | Radio-style picker between linked accounts / add new      |
| `PaymentSummaryCard`    | Subtotal, fees, total breakdown before confirming payment |
| `WithdrawalHistoryItem` | Date, amount, status for earnings withdrawal list         |

#### Insights & AI

| Component            | Description                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| `PriceInsightCard`   | Current market price, AI suggested price, trend arrow, % change                   |
| `DemandChart`        | Line/bar chart for 7-day demand. Use `victory-native` or `react-native-chart-kit` |
| `WeatherWidget`      | Current temp, condition icon, rain %, harvest advisory text                       |
| `ForecastStrip`      | Horizontal 5-day forecast scroll                                                  |
| `WeatherAlertBanner` | Dismissible banner for rain/pest/frost alerts                                     |
| `InsightExplainer`   | Expandable "Why this price?" accordion                                            |

#### Tracking & Maps

| Component            | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `TrackingMap`        | Full-screen map with farm origin, driver, destination pins |
| `DriverLocationPin`  | Custom animated map marker for driver                      |
| `ETAChip`            | "Arriving in ~45 min" floating chip on map                 |
| `OrderSummaryDrawer` | Bottom sheet on tracking screen with order details         |

#### Farmer Dashboard

| Component             | Description                                         |
| --------------------- | --------------------------------------------------- |
| `EarningsSummaryCard` | Week/month toggle with total earnings               |
| `QuickStatRow`        | Row of 3 mini-stat boxes (listings, orders, rating) |
| `QuickActionBar`      | "Add Listing" and "View Orders" shortcut buttons    |
| `PriceAlertBanner`    | "Tomatoes trending up" type notification strip      |

#### Auth & Profile

| Component           | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `RoleCard`          | Farmer / Buyer selection card with icon and description |
| `ProfileStatRow`    | Horizontal stats: Sales, Listings, Rating               |
| `MenuListItem`      | Settings menu row with icon, label, and chevron         |
| `FarmerRatingStars` | Star display (read-only) with review count              |

---

## Payments — InterSwitch Integration

InterSwitch (specifically **Quickteller** or **Passport** + **WebPay**) handles:

- Bank account verification and linking
- Buyer → Escrow → Farmer payment flow
- Farmer withdrawal to linked bank account

### Where it lives in the app

| Touchpoint            | Location                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| First bank link       | `(onboarding)/bank-link.tsx` — prompted after profile setup, skippable |
| Managing bank account | `farmer/profile/bank.tsx` and `buyer/profile/bank.tsx`                 |
| Paying for an order   | `buyer/cart.tsx` → `CheckoutScreen` → InterSwitch WebPay WebView       |
| Receiving payment     | Backend triggered — farmer sees updated balance on Dashboard           |
| Withdrawing earnings  | `farmer/profile/bank.tsx` — "Withdraw Earnings" button                 |

### Implementation approach

```
BankLinkScreen
  └── Opens InterSwitch Passport OAuth / Account Linking WebView
  └── On success → store tokenized bank reference (never raw account number)
  └── Display as LinkedBankCard

CheckoutScreen
  └── PaymentMethodSelector shows linked bank
  └── "Place Order" → POST to your backend
  └── Backend calls InterSwitch WebPay/DirectPay API
  └── On success callback → order confirmed, GPS tracking starts
```

> ⚠️ Never store raw bank account numbers. Store only the token/reference returned by InterSwitch after account linking.

---

## Tech Stack

| Layer         | Choice                             | Notes                          |
| ------------- | ---------------------------------- | ------------------------------ |
| Framework     | React Native + Expo (SDK 51+)      |                                |
| Router        | Expo Router (file-based)           | v3+ for tab groups             |
| State         | Zustand                            | Simple, minimal boilerplate    |
| Server State  | TanStack Query (React Query)       | Caching, loading, error states |
| Styling       | NativeWind (Tailwind for RN)       |                                |
| Maps          | `react-native-maps` + Google Maps  | or Mapbox SDK                  |
| Bottom Sheet  | `@gorhom/bottom-sheet`             |                                |
| Charts        | `victory-native`                   | or `react-native-chart-kit`    |
| Image Picker  | `expo-image-picker`                |                                |
| Notifications | `expo-notifications`               |                                |
| Payments      | InterSwitch WebPay (WebView)       |                                |
| Auth          | JWT + `expo-secure-store`          |                                |
| Weather       | OpenWeatherMap API                 |                                |
| Backend       | Node.js + Express / Python FastAPI |                                |
| Database      | PostgreSQL                         |                                |
| AI/ML         | Python (scikit-learn, Prophet)     | Separate microservice          |

---

## Folder Structure

```
agronet/
├── app/                        Expo Router screens
│   ├── (onboarding)/
│   ├── farmer/
│   └── buyer/
│
├── components/
│   ├── ui/                     Core design system primitives
│   └── features/               Feature-specific components
│       ├── produce/
│       ├── orders/
│       ├── payments/
│       ├── insights/
│       ├── tracking/
│       └── profile/
│
├── hooks/                      Custom hooks (useWeather, usePricePrediction, etc.)
├── store/                      Zustand stores (authStore, cartStore, etc.)
├── services/                   API calls (productsAPI, ordersAPI, paymentsAPI)
├── utils/                      Helpers (formatCurrency, formatDate, etc.)
├── constants/                  Colors, spacing, categories list
├── types/                      TypeScript interfaces
└── assets/                     Images, icons, fonts
```

---

## MVP Scope

For a working MVP, cut scope to these screens and components only. Everything else is post-MVP.

### ✅ MVP Screens

**Onboarding:** Welcome → Role Select → Sign Up/In → OTP → Profile Setup → Bank Link

**Farmer:** Dashboard · My Listings · Add Listing · Incoming Orders · Order Detail + Dispatch · Profile

**Buyer:** Browse · Produce Detail · Cart · Checkout · My Orders · Order Detail · Profile

### ✅ MVP Components (must build)

`Button`, `Input`, `Card`, `Badge`, `EmptyState`, `LoadingSpinner`, `ScreenHeader`, `SearchBar`, `Toast`, `OTPInput`, `ProduceCard`, `OrderCard`, `OrderStatusStepper`, `PriceTag`, `QuantitySelector`, `LinkedBankCard`, `PaymentSummaryCard`, `WeatherWidget`, `PriceInsightCard`, `MenuListItem`

### ❌ Post-MVP (build after launch)

- Live GPS `TrackingMap` (stub with status updates first)
- `DemandChart` and `ForecastStrip`
- AI `CropPlannerScreen`
- `FarmerRatingStars` + review system
- Blockchain supply chain transparency
- Logistics route optimization

---

> **Build order recommendation:** Core UI components → Auth/Onboarding → Farmer listings flow → Buyer browse + cart flow → Payment integration → Orders + status → Insights (AI + weather) → Tracking
