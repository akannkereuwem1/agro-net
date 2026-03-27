# AgroNet: The Marketplace That Puts Farmers First

> Built for Mama Emeka in Eket. Built for every farmer in every state who grows the food that feeds Nigeria and deserves to be paid fairly for it.

---

## The Problem We're Solving

Agriculture is the backbone of Nigeria. It contributes roughly **25% of GDP**, employs more than **35% of the workforce**, and smallholder farmers produce an estimated **80% of the food consumed locally** ([UNDP, 2021](https://climatepromise.undp.org/news-and-stories/smallholder-farmers-nigeria-learn-new-methods-cope-shocks-drive-food-insecurity)). Women make up about **70% of agro-processors** in the country ([Rome Business School Nigeria / TechEconomy, 2024](https://techeconomy.ng/weak-supply-chains-waste-40-of-nigerias-farm-produce/)).

And yet, the system is rigged against them.

### The Middleman Problem

When a farmer in Eket, Akwa Ibom harvests a bulk load of cassava, she doesn't set the price. She has no market information, no direct access to buyers, and no leverage. She loads her produce onto a truck and sells to whoever shows up. Usually that's a middleman who knows exactly what the market will pay and offers her a fraction of it.

> *"The producer does the hard work but earns the least, while the middleman takes the highest margin. A situation that ultimately drives up prices and creates artificial scarcity."*
> Nigerian Federal Government official, [Science Nigeria, 2025](https://sciencenigeria.com/fg-deepens-livestock-reforms-addresses-middlemen-bottlenecks/)

Middlemen contribute to **price fluctuations, artificial scarcity, and unfair trade practices** that systematically impoverish rural farmers ([Nairametrics, 2023](https://nairametrics.com/2023/06/20/how-middlemen-affect-nigerias-agriculture-ecosystem/)). Research published in Springer confirms that intermediaries drive a price wedge between farmers and consumers, with farmers consistently on the losing end ([Springer, 2021](https://link.springer.com/10.1007/978-3-030-68127-2_170-1)).

### The Waste Problem

Weak supply chains waste an estimated **40% of Nigeria's farm produce**, costing the agricultural sector roughly **$3 billion annually** ([TechEconomy, 2024](https://techeconomy.ng/weak-supply-chains-waste-40-of-nigerias-farm-produce/)). A farmer who can't find a buyer fast enough watches her harvest rot. A buyer who can't find fresh produce at a fair price pays inflated market prices to a middleman who hoarded it.

Both sides lose. The middleman wins.

### The Scale of the Opportunity

Nigeria has **40 million farming households** and over **73 million hectares of arable land**, less than half of which is currently cultivated ([Techpoint Africa, 2025](https://techpoint.africa/insight/5-agritech-nigeria/)). Agriculture accounts for **48% of household income nationally**, rising to **60.9% in rural areas** ([TechGeography, 2025](https://techgeography.substack.com/p/winich-building-for-nigerias-40-million)). The global agritech market is projected to grow from **$8.15 billion in 2024 to $34.8 billion by 2034** ([Allied Market Research](https://www.alliedmarketresearch.com/agritech-market-A128653)).

The problem is real. The market is massive. The technology exists. **AgroNet is the solution.**

---

## What AgroNet Does

AgroNet is a full-stack mobile marketplace that connects farmers directly to buyers, cutting out the middleman entirely.

**For farmers:** List produce, get AI-suggested fair prices, manage orders, and receive payment directly. All from a phone.

**For buyers:** Browse fresh produce from verified farmers, place orders, and pay securely. Know exactly where your food comes from.

**For Nigeria:** A transparent, digital agricultural supply chain that works for the people who grow the food.

---

## Meet the Users

### Mama Emeka: Cassava Farmer, Eket, Akwa Ibom

Akwa Ibom is one of Nigeria's key cassava-producing states, with farming deeply embedded in the local economy ([Premium Times, 2021](https://www.premiumtimesng.com/promoted/462909-agriculture-proves-to-be-pathway-to-sustainable-development-of-akwa-ibom.html)). Cassava feeds over **60 million people in Nigeria** and is the country's most important staple crop.

Mama Emeka plants cassava every season. When harvest comes, she faces the same problem every time. She has to physically go to the market, negotiate with traders who already know the going rate, and accept whatever price she's offered or watch her produce spoil.

**With AgroNet, her flow looks like this:**

1. She opens the app on her phone.
2. She takes a photo of her cassava. If she's unsure of the exact variety or crop classification, the **AI image recognition feature** (powered by Google Vision) identifies it for her.
3. The **AI price prediction engine** (powered by TensorFlow) suggests a fair market price based on current demand, season, and location.
4. She posts her listing with quantity, location, and price. It takes under 2 minutes.
5. Buyers across Akwa Ibom, Lagos, Abuja, anywhere, can see her listing and place an order.
6. She accepts the order, gets paid directly via **Interswitch**, and arranges handoff.
7. No middleman. No market trip. No exploitation.

If she's offline when she creates the listing, because rural connectivity isn't always reliable, the app **queues the action and syncs automatically** when her network returns.

### Chukwuemeka: Commercial Buyer, Port Harcourt

Chukwuemeka runs a small food processing business. He needs consistent supply of fresh cassava at predictable prices. Today he relies on market traders who inflate prices and can't guarantee freshness or quantity.

**With AgroNet:**

1. He opens the marketplace and filters by crop type, location, and price range.
2. He finds Mama Emeka's listing: fresh cassava, Eket, available now.
3. He places an order directly, pays via Interswitch, and coordinates pickup.
4. He gets fresh produce at a fair price. She gets paid what her work is worth.

---

## Why This Matters Beyond Eket

AgroNet isn't just for one farmer in one state. The problem it solves exists **in every state in Nigeria** and across the continent.

- The yam farmer in Benue
- The tomato grower in Kano
- The cocoa producer in Ondo
- The rice farmer in Kebbi
- The commercial agribusiness in Lagos that needs reliable sourcing

Every one of them faces the same broken supply chain. Every one of them is a potential AgroNet user.

The platform scales because the problem scales. As more farmers list and more buyers transact, the marketplace becomes more valuable for everyone. A network effect that compounds with every new state, every new crop type, every new user.

---

## Technical Approach

AgroNet is a full-stack mobile platform with two tightly integrated layers.

### Mobile App: React Native + Expo

Built with **Expo SDK 54** and **Expo Router** (file-based navigation), the app delivers two completely separate role-based experiences from a single codebase:

- **Farmer app:** dashboard, listings management, order handling, AI price insights, profile
- **Buyer app:** marketplace browse, cart, checkout, order management, profile

| Decision | Rationale |
|---|---|
| Expo Router with role-scoped tab groups | `(farmer)/` and `(buyer)/` deliver entirely different UX from one codebase |
| NativeWind (Tailwind for React Native) | Utility-first styling, consistent design tokens, dark mode support |
| Zustand + AsyncStorage persistence | Lightweight global state for auth and cart, survives app restarts |
| Axios + JWT interceptors | Automatic token attachment on every request, 401 handling in one place |
| Offline queue + auto-sync | Actions queued in AsyncStorage when offline, flushed automatically on reconnect |
| React Native New Architecture | Enabled, eliminates the JS bridge for improved performance |

### Backend API: Django REST Framework

A strict mobile backend API. Every response is JSON, no HTML templates.

```
API Views  ->  Service Layer  ->  Models (PostgreSQL)
```

- Views handle HTTP only. Zero business logic.
- Services own all workflows, state transitions, and external integrations.
- Models represent data only.

| Decision | Rationale |
|---|---|
| DRF + drf-spectacular | Auto-generated OpenAPI/Swagger docs, mobile-friendly serialization |
| JWT (simplejwt) | Stateless, mobile-native. 60-min access / 1-day refresh tokens |
| Role-based permissions | `farmer` and `buyer` enforced at the permission layer |
| Atomic order state machine | `pending -> confirmed -> paid -> completed` enforced with DB transactions |
| Property-based testing (Hypothesis) | Correctness properties verified across hundreds of generated inputs |
| Cloudinary | CDN-backed image storage, offloads media from the app server |
| UUID primary keys | Safe for mobile clients, no sequential ID enumeration |

### External Integrations

| Service | Purpose |
|---|---|
| Interswitch | Direct payment from buyer to farmer, no intermediary |
| Google Vision API | Produce image classification, helps farmers identify their own crops |
| TensorFlow | AI price prediction, fair market pricing based on real data |
| OneSignal | Push notifications for order updates and price alerts |
| Cloudinary | Image storage and CDN delivery |

---

## Getting Started

### Prerequisites

- **Backend:** Python 3.11+, PostgreSQL, [`uv`](https://docs.astral.sh/uv/)
- **Frontend:** Node.js 18+, npm
- **Mobile:** Android emulator / iOS simulator, or [Expo Go](https://expo.dev/go)

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/akannkereuwem1/demo-hack.git
cd demo-hack

# 2. Activate the virtual environment (Windows)
C:\Users\WELCOME\Desktop\workspace\demo-hack-env\Scripts\activate

# 3. Install Python dependencies
uv add -r requirements.txt

# 4. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# 5. Apply migrations and start
cd backend
python manage.py migrate
python manage.py runserver
```

Backend: `http://127.0.0.1:8000/api/`
Swagger UI: `http://127.0.0.1:8000/api/docs/`

**Required environment variables (`backend/.env`):**

```env
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:password@localhost:5432/agronet
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
GOOGLE_VISION_API_KEY=your-key
INTERSWITCH_CLIENT_ID=your-client-id
INTERSWITCH_CLIENT_SECRET=your-client-secret
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set the API base URL. Use your machine's local IP, not localhost.
# Expo runs on a physical device or emulator that can't reach 127.0.0.1
echo "EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api" > .env

# Start the Expo dev server
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

---

## Project Structure

```
agronet/
├── backend/
│   ├── apps/
│   │   ├── users/       # Custom User model, JWT auth, RBAC (farmer/buyer)
│   │   ├── products/    # Produce listings, image upload, search & filters
│   │   ├── orders/      # Offer negotiation, order lifecycle state machine
│   │   ├── payments/    # Interswitch integration
│   │   └── ai/          # TensorFlow price prediction, Google Vision classification
│   ├── config/          # Django settings, root URLs, WSGI/ASGI
│   ├── tests/           # Integration & property-based tests
│   └── utils/           # Custom exception handler, shared utilities
│
├── frontend/
│   ├── app/
│   │   ├── (onboarding)/  # Welcome, role select, sign up/in, OTP, profile setup, bank link
│   │   ├── (farmer)/      # Farmer tabs: dashboard, listings, orders, insights, profile
│   │   ├── (buyer)/       # Buyer tabs: market, cart, orders, profile
│   │   └── (stack)/       # Shared stack screens: produce detail, order detail
│   ├── components/ui/     # Design system: Button, Badge, TextInputField, BackButton
│   ├── lib/               # API services: auth, products, orders, payments, offline sync
│   ├── store/             # Zustand stores: authStore, cartStore
│   └── hooks/             # Custom hooks: useForm, useColorScheme
│
└── docs/                  # Per-feature implementation plans and walkthroughs
```

---

## API Reference

All endpoints require `Authorization: Bearer <token>` unless marked Public.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register/` | Public | Register as farmer or buyer |
| POST | `/api/users/login/` | Public | Obtain JWT access + refresh tokens |
| POST | `/api/users/token/refresh/` | Public | Refresh access token |
| GET | `/api/users/profile/` | JWT | Get authenticated user profile |

```bash
# Register as a farmer
curl -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "mama.emeka@example.com", "password": "pass1234", "full_name": "Mama Emeka", "role": "farmer"}'
```

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products/` | JWT | Browse listings. Supports `?search=`, `?crop_type=`, `?location=`, `?min_price=`, `?max_price=` |
| POST | `/api/products/` | JWT (Farmer) | Create a produce listing |
| GET | `/api/products/my/` | JWT (Farmer) | List the farmer's own products |
| GET | `/api/products/{id}/` | JWT | Product detail |
| PATCH | `/api/products/{id}/` | JWT (Owner) | Update listing |
| DELETE | `/api/products/{id}/` | JWT (Owner) | Remove listing |
| POST | `/api/products/{id}/image/` | JWT (Owner) | Upload product image |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders/` | JWT (Buyer) | Place an order |
| GET | `/api/orders/` | JWT | List own orders, scoped by role. Supports `?status=` filter |
| GET | `/api/orders/{id}/` | JWT | Order detail |
| PATCH | `/api/orders/{id}/confirm/` | JWT (Farmer) | Confirm a pending order |
| PATCH | `/api/orders/{id}/decline/` | JWT (Farmer) | Decline a pending order |
| PATCH | `/api/orders/{id}/complete/` | JWT (Farmer) | Mark a paid order as completed |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/initiate/` | JWT (Buyer) | Initiate Interswitch payment |
| POST | `/api/payments/verify/` | JWT | Verify payment by transaction reference |
| POST | `/api/payments/webhook/` | Public (signed) | Interswitch payment webhook |

### AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/predict-price/` | JWT | Get AI-suggested fair price for a crop |
| POST | `/api/ai/classify-image/` | JWT | Identify produce from a photo (Google Vision) |

---

## Results & Evaluation

### Running Tests

```bash
cd backend
pytest --tb=short
```

### Property-Based Testing

The farmer product listing feature ships with 8 machine-verified correctness properties using [Hypothesis](https://hypothesis.readthedocs.io/):

| Property | Guarantee |
|---|---|
| P1 | Farmer only receives their own products |
| P2 | Complete data isolation between any two distinct farmers |
| P3 | Both available and unavailable products are always returned |
| P4 | Results are always ordered newest-first |
| P5 | Every response object contains all required serializer fields |
| P6 | Page size never exceeds 20 items |
| P7 | Full pagination traversal yields every product exactly once, no duplicates |
| P8 | Any buyer receives HTTP 403, no exceptions |

### Order State Machine

Enforced atomically at the service layer with database transactions:

```
pending --> confirmed --> paid --> completed
   |
   +--> declined
```

Any invalid transition attempt returns HTTP 400 without touching the database.

### Offline Resilience

The mobile app queues failed actions (create listing, place order) in AsyncStorage when offline. On reconnect, `syncService.flushQueue()` replays them in sequence with no user action required. This matters enormously for rural farmers with intermittent connectivity.

---

## Demo & Access

- **Swagger UI:** `http://127.0.0.1:8000/api/docs/` (dark mode enabled)
- **ReDoc:** `http://127.0.0.1:8000/api/redoc/`

Sample credentials (after running `python scripts/generate_dummy_model.py` from `backend/`):

```
Farmer:  farmer@agronet.demo / demo1234
Buyer:   buyer@agronet.demo  / demo1234
```

---

## The Vision: Every State, Every Farmer

AgroNet starts with the smallholder. The Mama Emekas who grow Nigeria's food and deserve to be paid for it. But the platform is built to scale:

- **State by state:** every agricultural zone in Nigeria has the same broken supply chain problem
- **Crop by crop:** cassava, yam, tomatoes, rice, cocoa, palm oil. The AI and listing system handles any produce.
- **Scale by scale:** from a single farmer with a half-hectare plot to a commercial agribusiness sourcing at volume
- **Role by role:** farmers, buyers, processors, cooperatives. Anyone in the agricultural value chain.

The agricultural sector has been overlooked by technology for too long. AgroNet is a direct answer to that gap, built in Nigeria, for Nigeria, with the ambition to expand across the continent where the same problem exists at the same scale.

---

## Future Work

**Current limitations:**
- Live GPS delivery tracking is stubbed. Order status updates only, no real-time map.
- Interswitch is the only payment provider. No fallback gateway.
- AI price prediction requires a pre-trained TensorFlow model at deploy time.
- Demand charts and weather forecast strip are post-MVP.

**Realistic next steps:**
- Real-time GPS tracking with `react-native-maps` and WebSocket location updates
- Cooperative accounts so farmer groups can list and receive payments collectively
- Wallet and escrow system for safer fund holding between order and delivery
- Expand payment providers (Paystack, Flutterwave) as fallbacks
- Admin dashboard for platform moderation, dispute resolution, and analytics
- Rate limiting and API throttling for production hardening
- Celery and Redis for async webhook processing and push notification delivery
- Multi-language support (Yoruba, Igbo, Hausa) for farmers who don't use English as a first language

---

## Conclusion

Nigeria's agricultural sector feeds a nation of over 200 million people. The farmers who make that possible, smallholders, women, rural producers, have been systematically undervalued by a supply chain that was never designed to serve them.

AgroNet changes that. It gives every farmer a direct line to every buyer. It gives every buyer access to fresh, traceable produce at fair prices. And it does it with the technical rigour of a layered architecture, formal correctness properties, atomic state machines, and offline resilience, to be trusted at scale.

The agriculture sector is not overlooked because the problem is small. It's overlooked because the solution seemed hard. AgroNet makes it simple.

---

## Documentation

Per-feature implementation plans and walkthroughs live in `docs/`:

- [Database Configuration](docs/issue-4-configure-postgresql/)
- [Project Structure](docs/issue-5-project-structure/)
- [Logging Setup](docs/issue-7-setup-logging/)
- [Deployment (Railway/Fly.io)](docs/issue-8-deployment/)
- [Mobile Backend Refactoring](docs/issue-18-refactoring/)
- [Authentication System](docs/issue-20-authentication/)
- [AI Price Prediction](docs/ai-price-prediction/)
- [Payment Processing](docs/payment-processing/)
- [Product Listing](docs/Product-Listing/)

---

## Team

| Name | Role | GitHub |
|---|---|---|
| Akan Nkereuwem | Backend Developer | [@akannkereuwem1](https://github.com/akannkereuwem1) |
| Treasure Ani-Joseph | Frontend Developer | [@Treasure-cd](https://github.com/Treasure-cd) |
