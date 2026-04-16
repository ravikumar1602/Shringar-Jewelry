# ╔══════════════════════════════════════════════════════════════╗
# ║        SHRINGAR JEWELRY - COMPLETE SETUP & DEPLOYMENT        ║
# ╚══════════════════════════════════════════════════════════════╝

## PRE-REQUISITES
- Node.js >= 18.0.0
- MongoDB Atlas account (free)
- Cloudinary account (free)
- Razorpay account (test mode)
- React Native CLI setup (Android Studio / Xcode)

═══════════════════════════════════════════════
## STEP 1 — BACKEND SETUP
═══════════════════════════════════════════════

cd shringar-jewelry/backend

# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Fill in your .env:
#
#   MONGODB_URI      = Get from MongoDB Atlas → Connect → Drivers
#   JWT_SECRET       = Any random 32+ char string
#   JWT_REFRESH_SECRET = Another random 32+ char string
#   CLOUDINARY_*     = From Cloudinary Dashboard
#   RAZORPAY_*       = From Razorpay Dashboard → Settings → API Keys
#   SMTP_*           = Gmail App Password (Enable 2FA → App Passwords)

# 4. Create first admin user (run this once)
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/models/User');
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@shringar.com',
    password: 'Admin@1234',
    role: 'admin'
  });
  console.log('Admin created:', admin.email);
  process.exit(0);
}
createAdmin().catch(console.error);
"

# 5. Start backend
npm run dev        # Development
npm start          # Production

# Backend runs at: http://localhost:5000
# Health check:    http://localhost:5000/health


═══════════════════════════════════════════════
## STEP 2 — ADMIN PANEL SETUP
═══════════════════════════════════════════════

cd shringar-jewelry/admin-panel

# 1. Install dependencies
npm install

# 2. Create .env
cp .env.example .env
# Set: REACT_APP_API_URL=http://localhost:5000/api/v1

# 3. Start admin panel
npm start

# Admin panel opens at: http://localhost:3001
# Login with: admin@shringar.com / Admin@1234


═══════════════════════════════════════════════
## STEP 3 — USER APP SETUP (React Native)
═══════════════════════════════════════════════

cd shringar-jewelry/user-app

# 1. Install dependencies
npm install

# 2. iOS only - install pods
cd ios && pod install && cd ..

# 3. Create .env
cp .env.example .env
# Android Emulator: API_URL=http://10.0.2.2:5000/api/v1
# iOS Simulator:    API_URL=http://localhost:5000/api/v1
# Real Device:      API_URL=http://YOUR_PC_IP:5000/api/v1

# 4. Link Razorpay (required for payments)
npm install react-native-razorpay
npx react-native link react-native-razorpay

# 5. Android: Add to android/app/build.gradle
#    implementation 'com.razorpay:checkout:1.6.26'

# 6. Run the app
npx react-native run-android    # Android
npx react-native run-ios        # iOS


═══════════════════════════════════════════════
## STEP 4 — RAZORPAY SETUP (Payments)
═══════════════════════════════════════════════

1. Go to https://dashboard.razorpay.com
2. Register → Test Mode
3. Settings → API Keys → Generate Key
4. Copy Key ID → RAZORPAY_KEY_ID in backend .env
5. Copy Key Secret → RAZORPAY_KEY_SECRET in backend .env

For Webhook (optional but recommended):
1. Razorpay Dashboard → Webhooks → Add New Webhook
2. URL: https://your-backend.com/api/v1/payments/webhook
3. Events: payment.captured, payment.failed
4. Copy Webhook Secret → RAZORPAY_WEBHOOK_SECRET in .env


═══════════════════════════════════════════════
## STEP 5 — CLOUDINARY SETUP (Images)
═══════════════════════════════════════════════

1. Go to https://cloudinary.com → Sign Up (free)
2. Dashboard → Copy Cloud Name, API Key, API Secret
3. Paste in backend .env:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret


═══════════════════════════════════════════════
## STEP 6 — MONGODB ATLAS SETUP
═══════════════════════════════════════════════

1. Go to https://mongodb.com/atlas → Sign Up (free)
2. Create a cluster (M0 - Free tier)
3. Database Access → Add User (username + password)
4. Network Access → Add IP (0.0.0.0/0 for all IPs)
5. Connect → Drivers → Copy connection string
6. Paste in .env: MONGODB_URI=mongodb+srv://...


═══════════════════════════════════════════════
## DEPLOYMENT
═══════════════════════════════════════════════

### Backend → Render.com (Free)
1. Push to GitHub
2. render.com → New Web Service → Connect repo
3. Build: npm install
4. Start: node src/server.js
5. Add all .env variables in Render dashboard
6. Deploy!

### Admin Panel → Netlify/Vercel (Free)
1. Build: cd admin-panel && npm run build
2. netlify.com → Sites → Drag & drop build/ folder
   OR
   vercel.com → Import from GitHub

### User App → Android APK
cd user-app/android
./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/

### Play Store submission:
1. Generate keystore:
   keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

2. Build signed APK:
   cd android && ./gradlew bundleRelease

3. Upload .aab to Play Console


═══════════════════════════════════════════════
## API QUICK REFERENCE
═══════════════════════════════════════════════

Base URL: http://localhost:5000/api/v1

AUTH:
  POST /auth/register       → Register
  POST /auth/login          → Login (returns accessToken + refreshToken)
  POST /auth/admin/login    → Admin login
  GET  /auth/me             → Get profile (Bearer token required)

PRODUCTS:
  GET  /products            → List (query: page, limit, search, sort, category)
  GET  /products/featured   → Featured products
  GET  /products/:id        → Single product

CART:
  GET  /cart                → Get cart
  POST /cart/add            → { productId, quantity }
  POST /cart/coupon         → { code }

ORDERS:
  POST /orders              → { shippingAddressId, paymentMethod }
  GET  /orders              → My orders
  GET  /orders/:id          → Order detail

PAYMENTS:
  POST /payments/create-order → { orderId }
  POST /payments/verify       → { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }


═══════════════════════════════════════════════
## TESTING CREDENTIALS
═══════════════════════════════════════════════

Admin:
  Email: admin@shringar.com
  Password: Admin@1234

Razorpay Test Cards:
  Card: 4111 1111 1111 1111
  Expiry: Any future date
  CVV: Any 3 digits
  OTP: 1234 (for 3D Secure)

UPI Test: success@razorpay


═══════════════════════════════════════════════
## TECH STACK SUMMARY
═══════════════════════════════════════════════

Backend:      Node.js + Express + MongoDB + JWT + Razorpay + Cloudinary
Admin Panel:  React + Redux Toolkit + React Router + Chart.js
User App:     React Native + Redux Toolkit + React Navigation + Razorpay

Security:     Helmet, Rate Limiting, CORS, Mongo Sanitize, XSS Clean, HPP
Auth:         JWT Access Token (7d) + Refresh Token (30d) + bcrypt (salt 12)
Payments:     Razorpay (UPI/Cards/NetBanking) + COD
Images:       Cloudinary (auto resize + optimization)
Email:        Nodemailer (Gmail SMTP)
Logging:      Winston (dev console + prod file logs)
