# 🏥 Slotify - Smart Appointment Scheduling System

> **A robust, full-stack appointment booking platform for Doctors and Patients.**  
> *Built for Hackathon 2026* 🏆

![Status](https://img.shields.io/badge/Status-Live-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Auth](https://img.shields.io/badge/Auth-Google_OAuth-red)

## 🌐 Live Demo
👉 **[View Live Project on Render](https://slotify-go.onrender.com)**

---

## 🚀 Key Features

### 👤 User Roles & Authentication
-   **Google OAuth Integration**: One-click secure login/signup.
-   **Dual Roles**:
    -   **Patients**: Browse doctors, book slots, view history.
    -   **Doctors**: Manage availability, view upcoming appointments.
    -   **Admin**: Overview of all system bookings.

### 📅 Smart Scheduling
-   **Real-Time Availability**: Prevents double-booking with atomic transactions.
-   **CRUD Operations**: Book, Reschedule, and Cancel appointments seamlessly.
-   **Waitlist System**: (Bonus) Users can join waitlists for full slots.

### 🔔 Reliable Notifications (Mock API)
-   Implemented a **Mock Email System** that logs formatted HTML emails to the server console.
-   **Why Mock?** ensures 100% demo reliability without ISP blocking or SMTP timeouts.
-   **Proof:** Check Server Logs to verify "Sent" emails instantly.

### 💾 Data Persistence
-   **Production Database**: Deployed with **PostgreSQL** on Render.
-   **Data Safety**: User accounts and bookings survive server restarts (unlike SQLite).

---

## 🛠️ Tech Stack

-   **Backend**: Node.js, Express.js
-   **Database**: PostgreSQL (Production), SQLite (Local Dev)
-   **ORM**: Sequelize
-   **Auth**: Passport.js (Google Strategy), JWT
-   **Validation**: Express-Validator
-   **Security**: Bcrypt, Helmet, CORS
-   **Deployment**: Render (Web Service + Managed Postgres)

---

## ⚙️ Local Setup Guide

Follow these steps to run the project locally on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/slotify.git
cd slotify
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
PORT=5000
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=your_super_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=http://localhost:5000/auth/google/callback
EMAIL_USER=mock_user
EMAIL_PASS=mock_pass
```

### 4. Run the Server
```bash
# Start backend
npm start
```
*App will allow running at `http://localhost:5000`*

---

## 🧪 Testing

### ✅ Verify Email Logic
Since we use a Mock Email System, you can test emails without sending real ones:
```bash
# Run the test script
node testEmail.js
```
*Output will show the formatted HTML email in your terminal.*

### 🌍 Verify Live Deployment
To check if the Render production server is responsive:
```bash
# Pings the live API from your local terminal
node testRender.js
```

---

## 📂 Project Structure

```
├── config/             # Database & Passport config
├── controllers/        # Business logic (Auth, Appointments, Slots)
├── middleware/         # Auth verification & Error handling
├── models/             # Sequelize Schemas (User, Appointment, Slot)
├── routes/             # API Endpoints
├── utils/
│   └── sendEmail.js    # Mock Email Utility (Console Logger)
├── validators/         # Input validation rules
├── public/             # Frontend assets (HTML/CSS/JS)
└── server.js           # Entry point
```

---

## 🏆 Hackathon Compliance

| Requirement | Status | Implementation |
| :--- | :--- | :--- |
| **User Auth** | ✅ | JWT + Google OAuth |
| **Booking Flow** | ✅ | Complete CRUD + Concurrency Lock |
| **Notifications** | ✅ | Mock API (Reliable Logging) |
| **Persistence** | ✅ | PostgreSQL (Render Managed DB) |
| **Security** | ✅ | PW Hashing, Input Validation |

---

Made with ❤️ by **Goventhan**.
