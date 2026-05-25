# Vaulto – Smart Coupon Wallet 🎟️

Vaulto is a coupons-wallet application that helps users digitize, organize, and use coupons smarter. It combines OCR-powered coupon capture, personalized recommendations, secure multi-method authentication, and a fully robust Java backend.

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
- **React (Create React App)**
- **Tailwind CSS** (styling approach for responsive UI)
- **Lucide React** (icons)
- **Tesseract.js** (OCR)

### Backend
- **Java 17**
- **Spring Boot 3**
- **Spring Data MongoDB**
- **Spring Security (OAuth2 Client & JWT)**
- **Twilio SDK** (SMS integration)
- **Maven** (build automation)

### Authentication & Security
- **JWT access + refresh tokens** (HMAC-SHA256 signature, 256-bit+ secure keys)
- **Google OAuth 2.0** integrated via Spring Security OAuth2 Client
- **Phone OTP with Twilio SMS flow**
- **HttpOnly auth cookies** for secure token storage

---

## 🗂️ Project Structure

```text
Vaulto/
├── backend/
│   ├── src/main/java/com/vaulto/
│   │   ├── config/           # CORS & general beans
│   │   ├── controllers/      # Auth, Coupon REST API endpoints
│   │   ├── models/           # User, Coupon MongoDB documents
│   │   ├── repositories/     # Spring Data MongoRepositories
│   │   ├── security/         # SecurityConfig, JWT filters, Google OAuthSuccessHandler
│   │   ├── services/         # User, Coupon, & Twilio SMS business logic
│   │   └── VaultoApplication.java # Spring Boot main class (reads .env dynamically)
│   ├── src/main/resources/
│   │   └── application.properties # Default configurations & fallback settings
│   ├── .env                  # Environment credentials
│   ├── pom.xml               # Maven configuration
│   └── mvnw / mvnw.cmd       # Maven wrappers
├── vaulto/                   # Frontend app (React CRA)
│   ├── public/
│   └── src/
│       ├── components/       # UI Components
│       ├── config/           # Dynamic API Base config
│       ├── context/          # Global Contexts
│       ├── styles/           # CSS Layouts
│       └── App.jsx           # Main routing & app entrance
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
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
3. Update your `.env` variables with your active credentials (see below).

#### Backend `.env` configuration
```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/coupons_auth

# JWT keys must be at least 256 bits (32+ characters) long!
JWT_ACCESS_SECRET=your_super_secure_access_secret_key_32_chars_or_more
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_32_chars_or_more
ACCESS_TOKEN_EXPIRES=30m
REFRESH_TOKEN_EXPIRES=30d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_SUCCESS_REDIRECT=http://localhost:3000/dashboard

COOKIE_DOMAIN=localhost
NODE_ENV=development
SESSION_SECRET=your_session_secret

# Phone OTP (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
```

4. Run the Spring Boot backend:
   * **Windows**:
     ```powershell
     ./mvnw spring-boot:run
     ```
   * **macOS/Linux**:
     ```bash
     chmod +x mvnw
     ./mvnw spring-boot:run
     ```

---

### 3) Frontend setup
1. Navigate to the frontend directory:
   ```bash
   cd ../vaulto
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

* Frontend default URL: `http://localhost:3000`

---

## ☁️ AWS Deployment (Free Tier)

Vaulto includes an automated PowerShell script to quickly provision and deploy the application to the AWS Free Tier.

### What it does:
1. **Backend**: Packages the Java app and deploys it to **AWS Elastic Beanstalk** (Java 17, `t2.micro` free tier).
2. **Frontend**: Builds the React production bundle and deploys it to an **AWS S3 Static Website Bucket**.

### Deployment Steps:
1. Ensure the **AWS CLI** is installed on your machine.
2. Authenticate the CLI using your IAM user credentials:
   ```bash
   aws configure
   ```
3. Open a fresh PowerShell window (to ensure AWS CLI is in your PATH).
4. Run the automated deployment script from the project root:
   ```powershell
   .\deploy_aws.ps1
   ```
5. Follow the post-deployment instructions printed by the script (e.g., adding Environment Variables via the Elastic Beanstalk console and updating Google OAuth Authorized URLs).

---

## 🚀 Usage Guide
1. Register with email/password, Google, or phone OTP.
2. Scan/upload/manual-enter coupons.
3. Vaulto extracts metadata via OCR and stores coupons.
4. Browse dashboard/search to find relevant deals.
5. Mark coupons tradable, gift to other users, and monitor expiring coupons.
6. Accessibility fallback: use manual coupon entry whenever OCR/QR workflows are not suitable.

---

## 🔐 Authentication Methods

### 1) Local (Email + Password)
- Register: `POST /auth/register`
- Login: `POST /auth/login`
- Passwords securely hashed server-side

### 2) Google OAuth
- Start: redirect browser to `http://localhost:8080/oauth2/authorization/google`
- Managed through Spring Security OAuth2 Client and secure cookies

### 3) Phone OTP (Twilio)
- Start OTP: `POST /auth/phone/start`
- Verify OTP: `POST /auth/phone/verify`
- OTPs expire and are validated server-side before issuing JWT cookies

---

## 📡 API Endpoints (Key)

### Auth & User
- `POST /auth/register`
- `POST /auth/login`
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
- `GET /coupons/expiring-soon?days=5`
- `DELETE /coupons/:id`

---

## 🛡️ Security Features
- JWT-based auth with short-lived access and long-lived refresh token strategy
- HttpOnly cookie storage for secure JWT storage (prevents XSS attacks)
- Seamless Google OAuth federation via Spring Security
- Secure Twilio SMS OTP verification for multi-factor login

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
