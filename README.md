# Vaulto – Smart Coupon Wallet 🎟️

Vaulto is a coupons-wallet application that helps users digitize, organize, and use coupons smarter. It combines OCR-powered coupon capture, personalized recommendations, and secure multi-method authentication.

## Project Purpose
Vaulto is designed to solve common coupon pain points:
- Losing physical coupons
- Missing expiry dates
- Difficulty finding the right coupon at checkout
- No easy way to gift or trade unused deals

---

## ✨ Features
- 📸 **OCR coupon digitization** for handwritten and printed coupons
- 🤖 **Clustering-based recommendations** for personalized deal discovery
- 🔐 **Multi-auth support**: Email/Password, Google OAuth, Phone OTP
- 🧾 **Coupon lifecycle management**: add, scan, categorize, search, delete
- 🔳 **QR-ready coupon flow** for in-store usage scenarios
- 👤 **User profile & preferences** management
- ⏰ **Expiring coupon alerts** and prioritization
- 🎁 **Coupon gifting/trading** workflows
- 🌙 **Dark mode** and settings customization
- 📱 **Mobile-first responsive UI**

---

## 🧰 Technology Stack

### Frontend
- **React**
- **Vite** (frontend build tool/dev server on the `full-app` branch)
- **Tailwind CSS** (styling approach for full-app UI)
- **Lucide React** (icons)
- **Tesseract.js** (OCR)

### Backend
- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**

### Authentication & Security
- **JWT access + refresh tokens**
- **Google OAuth 2.0** (`passport-google-oauth20`)
- **Phone OTP with Twilio SMS flow**
- **bcrypt password hashing**
- 🔒 HttpOnly auth cookies

---

## 🗂️ Project Structure

```text
Vaulto/
├── backend/
│   ├── config/           # Passport/OAuth config
│   ├── middleware/       # JWT auth middleware
│   ├── models/           # User, Coupon schemas
│   ├── routes/           # auth and coupon APIs
│   ├── utils/            # token helpers
│   ├── .env.example
│   └── server.js
├── vaulto/               # Frontend app
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── styles/
│       └── App.js
└── README.md
```

---

## ⚙️ Setup & Installation

### 1) Clone repository
```bash
git clone https://github.com/diMo2004/Vaulto.git
cd Vaulto
```

### 2) Backend setup
```bash
cd backend
npm install
cp .env.example .env
```

### Backend `.env` configuration
```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/coupons_auth
JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
# jsonwebtoken duration format examples: 15m, 1h, 7d, 30d
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=30d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback
GOOGLE_SUCCESS_REDIRECT=http://localhost:5173/dashboard
GOOGLE_FAILURE_REDIRECT=http://localhost:5173
COOKIE_DOMAIN=localhost
SESSION_SECRET=change_session_secret
NODE_ENV=development

# Phone OTP (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
```

Run backend:
```bash
npm run dev
```

### 3) Frontend setup
```bash
cd ../vaulto
npm install
npm run dev
```

Frontend default URL (Vite): `http://localhost:5173`

---

## 🚀 Usage Guide
1. Register with email/password, Google, or phone OTP.
2. Scan/upload/manual-enter coupons.
3. Vaulto extracts metadata via OCR and stores coupons.
4. Browse dashboard/search to find relevant deals.
5. Mark coupons tradable, gift to other users, and monitor expiring coupons.

---

## 🔐 Authentication Methods

### 1) Local (Email + Password)
- Register: `POST /auth/register`
- Login: `POST /auth/login`
- Passwords hashed using `bcrypt`

### 2) Google OAuth
- Start: `GET /auth/google`
- Callback: `GET /auth/google/callback`
- Managed through Passport strategy and secure cookies

### 3) Phone OTP (Twilio)
- Start OTP: `POST /auth/phone/start`
- Verify OTP: `POST /auth/phone/verify`
- OTPs expire and are validated server-side before issuing JWT cookies

---

## 📡 API Endpoints (Key)

### Auth & User
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/phone/start`
- `POST /auth/phone/verify`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`
- `PUT /auth/me`

### Coupons
- `POST /coupons/add`
- `GET /coupons/all`
- `POST /coupons/:id/use`
- `GET /coupons/tradeable`
- `POST /coupons/gift`
- `POST /coupons/:id/tradable`
- `GET /coupons/expiring-soon?days=3&prioritize=true`
- `DELETE /coupons/:id`

---

## 🗄️ Database Schema Overview

### User Model
- `provider` (`local | google | phone`)
- `email`, `password`
- `phone`
- `googleId`, `avatar`
- `name`, `username`, `dob`, `gender`
- `refreshToken`
- `categoryUsage` (Map for preference signals)
- `preferenceCluster`
- `createdAt`, `updatedAt`

### Coupon Model
- `owner` (User reference)
- `store`, `code`, `discount`, `category`
- `expiry`
- `rawText`, `image`
- `usageCount`, `lastUsedAt`
- gifting/trading fields where enabled (`isTradable`, `tradeNotes`, `giftedFrom`, `giftedTo`, `isGifted`)
- `createdAt`, `updatedAt`

---

## 🛡️ Security Features
- JWT-based auth with short-lived access and long-lived refresh token strategy
- HttpOnly cookie storage for auth tokens
- OAuth flow via Passport for Google identity federation
- Twilio SMS OTP verification for phone login
- Password hashing with bcrypt salt rounds

---

## 🌿 Making `full-app` the Primary Branch
Repository default branch is a GitHub repository setting. To make `full-app` the new primary branch:

1. Open **Settings → Branches → Default branch** in GitHub.
2. Select **`full-app`** as the default branch.
3. (Optional) Protect `full-app` with branch protection rules.
4. (Optional) Retire old `main` after migration validation.

CLI reference for maintainers:
```bash
git fetch origin
git checkout full-app
git pull origin full-app
```

---

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch (`feat/<name>`).
3. Commit focused changes with clear messages.
4. Open a Pull Request with testing notes and screenshots for UI updates.

---

## 📄 License
No `LICENSE` file is currently present in the repository at this time. Until one is added, usage and redistribution are not explicitly granted (effectively all rights reserved).  
Recommended next step: add a standard license file such as `MIT` or `Apache-2.0`.
