# ╔══════════════════════════════════════════════════════════════╗
# ║         SHRINGAR JEWELRY — FULL SYSTEM ARCHITECTURE          ║
# ╚══════════════════════════════════════════════════════════════╝

## SYSTEM OVERVIEW
┌─────────────────────────────────────────────────────────────────┐
│                    SHRINGAR JEWELRY PLATFORM                    │
├──────────────────┬───────────────────┬──────────────────────────┤
│   USER APP       │   ADMIN PANEL     │      BACKEND API         │
│  (React Native)  │     (React)       │   (Node.js/Express)      │
│  Port: 8081      │   Port: 3001      │      Port: 5000          │
└──────┬───────────┴────────┬──────────┴───────────┬──────────────┘
       │                    │                       │
       └────────────────────┼───────────────────────┘
                            │  REST API (HTTPS)
                            ▼
              ┌─────────────────────────┐
              │      MongoDB Atlas      │
              │    (Cloud Database)     │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌──────────┐      ┌──────────┐      ┌──────────────┐
  │Cloudinary│      │ Razorpay │      │  Nodemailer  │
  │(Images)  │      │(Payments)│      │   (Email)    │
  └──────────┘      └──────────┘      └──────────────┘

## FOLDER STRUCTURE
shringar-jewelry/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── config/
│   │   │   ├── cloudinary.js   # Image upload config
│   │   │   └── razorpay.js     # Payment gateway config
│   │   ├── controllers/        # Business logic
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── cartController.js
│   │   │   ├── orderController.js
│   │   │   ├── paymentController.js
│   │   │   ├── categoryController.js
│   │   │   ├── reviewController.js
│   │   │   └── adminController.js
│   │   ├── models/             # MongoDB Schemas
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js
│   │   │   ├── Cart.js
│   │   │   ├── Order.js
│   │   │   ├── Review.js
│   │   │   └── Coupon.js
│   │   ├── routes/             # API Routes
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── categories.js
│   │   │   ├── cart.js
│   │   │   ├── orders.js
│   │   │   ├── payments.js
│   │   │   ├── reviews.js
│   │   │   ├── users.js
│   │   │   └── admin.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT protect + restrictTo
│   │   │   ├── errorHandler.js # Global error handler
│   │   │   └── validate.js     # express-validator wrapper
│   │   └── utils/
│   │       ├── AppError.js     # Custom error class
│   │       ├── apiFeatures.js  # Filter/Sort/Paginate
│   │       ├── jwt.js          # Token generation/verify
│   │       ├── email.js        # Nodemailer templates
│   │       └── logger.js       # Winston logger
│   ├── .env.example
│   └── package.json
│
├── admin-panel/                # React Admin Dashboard
│   ├── src/
│   │   ├── App.jsx             # Routes + layout
│   │   ├── services/api.js     # Axios instance + all API calls
│   │   ├── store/              # Redux Toolkit
│   │   │   └── slices/         # auth, products, orders slices
│   │   ├── pages/
│   │   │   ├── auth/Login.jsx
│   │   │   ├── dashboard/Dashboard.jsx
│   │   │   ├── products/       # List, Add, Edit
│   │   │   ├── orders/         # List, Detail, Update
│   │   │   ├── categories/     # List, Add, Edit
│   │   │   ├── users/          # List, Detail
│   │   │   └── coupons/        # List, Add, Edit
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Header, Layout
│   │   │   └── common/         # Table, Modal, Charts
│   │   └── utils/              # formatCurrency, formatDate
│   ├── .env.example
│   └── package.json
│
└── user-app/                   # React Native App
    ├── src/
    │   ├── navigation/
    │   │   ├── AppNavigator.jsx  # Root navigation
    │   │   ├── AuthNavigator.jsx # Login/Register stack
    │   │   └── MainNavigator.jsx # Tab + Stack nav
    │   ├── screens/
    │   │   ├── auth/             # Login, Register, ForgotPassword
    │   │   ├── home/             # Home, Search, ProductDetail
    │   │   ├── cart/             # Cart, Checkout, PaymentScreen
    │   │   ├── orders/           # OrderList, OrderDetail
    │   │   └── profile/          # Profile, Addresses, Wishlist
    │   ├── services/
    │   │   ├── api.js            # Axios instance
    │   │   └── storage.js        # AsyncStorage helpers
    │   ├── store/                # Redux Toolkit
    │   │   └── slices/           # auth, cart, products
    │   ├── components/           # Reusable UI components
    │   └── utils/                # helpers, constants
    ├── .env.example
    └── package.json

## API ENDPOINTS

### AUTH
POST   /api/v1/auth/register        → Register user
POST   /api/v1/auth/login           → Login (JWT)
POST   /api/v1/auth/admin/login     → Admin login
POST   /api/v1/auth/refresh-token   → Refresh JWT
POST   /api/v1/auth/forgot-password → Send reset email
PATCH  /api/v1/auth/reset-password/:token
GET    /api/v1/auth/me              → Get current user
PATCH  /api/v1/auth/update-profile
PATCH  /api/v1/auth/change-password
POST   /api/v1/auth/addresses       → Add address
POST   /api/v1/auth/wishlist/:id    → Toggle wishlist

### PRODUCTS
GET    /api/v1/products             → List (filter/sort/paginate)
GET    /api/v1/products/featured    → Featured products
GET    /api/v1/products/:id         → Single product
GET    /api/v1/products/:id/related → Related products
POST   /api/v1/products             → Create [ADMIN]
PUT    /api/v1/products/:id         → Update [ADMIN]
DELETE /api/v1/products/:id         → Delete [ADMIN]
PATCH  /api/v1/products/:id/inventory → Update stock [ADMIN]

### CART
GET    /api/v1/cart                 → Get cart
POST   /api/v1/cart/add             → Add item
PATCH  /api/v1/cart/items/:id       → Update quantity
DELETE /api/v1/cart/items/:id       → Remove item
POST   /api/v1/cart/coupon          → Apply coupon
DELETE /api/v1/cart/coupon          → Remove coupon

### ORDERS
POST   /api/v1/orders               → Place order
GET    /api/v1/orders               → My orders
GET    /api/v1/orders/:id           → Order detail
PATCH  /api/v1/orders/:id/cancel    → Cancel order
POST   /api/v1/orders/:id/return    → Return request
GET    /api/v1/orders/admin/all     → All orders [ADMIN]
PATCH  /api/v1/orders/admin/:id     → Update order [ADMIN]

### PAYMENTS
POST   /api/v1/payments/create-order → Create Razorpay order
POST   /api/v1/payments/verify       → Verify payment signature
POST   /api/v1/payments/webhook      → Razorpay webhook
POST   /api/v1/payments/refund/:id   → Refund [ADMIN]

### ADMIN
GET    /api/v1/admin/dashboard          → Analytics
GET    /api/v1/admin/analytics/sales    → Sales charts
GET    /api/v1/admin/analytics/inventory
GET    /api/v1/admin/users              → All users
PATCH  /api/v1/admin/users/:id          → Update user
CRUD   /api/v1/admin/coupons            → Coupon management

## SECURITY LAYERS
1. Helmet       → HTTP security headers
2. Rate Limiting → 100 req/15min (auth: 20/15min)
3. CORS         → Whitelist only
4. Mongo Sanitize → NoSQL injection prevention
5. XSS Clean    → Cross-site scripting prevention
6. HPP          → HTTP parameter pollution
7. JWT          → Access + Refresh token pair
8. bcrypt       → Password hashing (salt: 12)
9. Account Lock → 5 failed attempts = 2hr lock
10. Input Validation → express-validator on all routes

## PAYMENT FLOW (Razorpay)
User Checkout
    │
    ▼
POST /orders (create order in DB, status=pending)
    │
    ▼
POST /payments/create-order (create Razorpay order)
    │
    ▼
Razorpay Payment Sheet (in app/web)
    │
    ▼
POST /payments/verify (verify signature server-side)
    │
    ▼
Order status = confirmed, Payment status = paid
    │
    ▼
Email confirmation sent
    │
    ▼
COD: Order status = confirmed directly (no payment needed)

## DATA MODELS
Users      → name, email, password(hashed), role, addresses[], wishlist[]
Products   → name, price, images[], category, variants[], stock, material
Categories → name, slug, image, parent(for subcategories)
Cart       → user, items[{product, qty, price}], coupon
Orders     → user, items[], shippingAddress, payment, status, tracking[]
Reviews    → product, user, rating, comment, verifiedPurchase
Coupons    → code, type(%), value, minOrder, usageLimit, expiry
