# 🤝 সহযোগী (Shohojogi) - Community-Driven Social Event Management Platform

[![Live Site](https://img.shields.io/badge/Live%20Demo-Shohojogi-blue?style=for-the-badge&logo=vercel)](https://shohojogi-delta.vercel.app/)
[![Client Repo](https://img.shields.io/badge/GitHub-Client--Repository-24292e?style=for-the-badge&logo=github)](https://github.com/ridumondol/shohojogi-client)
[![Server Repo](https://img.shields.io/badge/GitHub-Server--Repository-181717?style=for-the-badge&logo=github)](https://github.com/ridumondol/shohojogi-server)

**Shohojogi** is a community-driven web application designed to connect local volunteers with social development and community service events. Users can create, discover, manage, and join impactful social service initiatives—such as winter clothing drives, blanket distribution, tree plantation, and cleanliness campaigns—all within a modern and responsive user interface.

---

## 🔗 Quick Links

- **Live Application:** [https://shohojogi-delta.vercel.app/](https://shohojogi-delta.vercel.app/)
- **Client Repository:** [https://github.com/ridumondol/shohojogi-client](https://github.com/ridumondol/shohojogi-client)
- **Server Repository:** [https://github.com/ridumondol/shohojogi-server](https://github.com/ridumondol/shohojogi-server)

---

## ✨ Key Features

- 🔐 **Secure Authentication & JWT Protection:** Full authentication with Email/Password and Google Social Login. Protected routes and sensitive APIs are secured using JSON Web Tokens (JWT).
- 📅 **Dynamic Event Management:** Users can post upcoming social events with details (Title, Type, Description, Date, Location, Image). Validations prevent adding events with past dates.
- 🎯 **Event Discovery & Joining System:** Browse upcoming events in a responsive grid layout. Filter out past events automatically, view full details, and join events with a single click.
- ⚙️ **User Dashboard (Manage & Joined Events):** 
  - **Manage Events:** Allows event creators to update or delete only their created events.
  - **Joined Events:** A dedicated space for volunteers to track all events they have registered to participate in, sorted chronologically.
- 🌓 **Interactive UI & Dark/Light Theme:** Features dynamic theme toggling (Light/Dark mode) for maximum user comfort, sleek toast notifications, loading skeletons, and responsive layouts for mobile, tablet, and desktop devices.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js (App Router) / React
- **Styling:** Tailwind CSS, ShadCN UI / DaisyUI / Hero UI
- **Icons & Notifications:** Lucide Icons, SweetAlert2 / React Hot Toast
- **State & Auth:** JWT Context / Firebase Auth / BetterAuth

### **Backend**
- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Native Driver / Mongoose)
- **Security:** JSON Web Token (JWT), CORS, Environment Variables (`dotenv`)

---

## 🚀 Getting Started Locally

Follow these instructions to run the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB Account](https://www.mongodb.com/) (For database connection)

---

### 1. Client Setup (Frontend)

```bash
# Clone the client repository
git clone https://github.com/ridumondol/shohojogi-client.git

# Navigate to client directory
cd shohojogi-client

# Install dependencies
npm install

# Create a .env.local file in the root directory and add required keys:
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# Add other auth keys here...

# Run the development server
npm run dev
```

The application will be running at `http://localhost:3000`.

---

### 2. Server Setup (Backend)

```bash
# Clone the server repository
git clone https://github.com/ridumondol/shohojogi-server.git

# Navigate to server directory
cd shohojogi-server

# Install dependencies
npm install

# Create a .env file in the root directory and add the following:
PORT=5000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
ACCESS_TOKEN_SECRET=your_jwt_secret_key

# Start the server
npm start
```

The server will be running on `http://localhost:5000`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/events` | Get all upcoming events | ❌ No |
| `GET` | `/events/recent` | Get 6 recent upcoming events | ❌ No |
| `GET` | `/events/:id` | Get details of a single event | ❌ No |
| `POST` | `/events` | Create a new social event | 🔐 Yes |
| `PATCH` | `/events/:id` | Update an event (Owner only) | 🔐 Yes |
| `DELETE` | `/events/:id` | Delete an event (Owner only) | 🔐 Yes |
| `POST` | `/joined-events` | Join an upcoming event | 🔐 Yes |
| `GET` | `/joined-events` | Get all events joined by logged-in user | 🔐 Yes |

---

## 📜 License

This project is created for educational and community service purposes under the [MIT License](LICENSE).
