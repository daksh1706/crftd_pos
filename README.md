# CRFTD Point of Sale (POS)

A modern, production-ready, dark-themed Point of Sale system built with the MERN stack and Supabase. Designed for speed, aesthetics, and robust operational management for QSRs (Quick Service Restaurants).

## Features

- **Modern POS Interface**: Dark theme (Kinetic Hearth) with glassmorphism effects, fast product searching, category filtering, and real-time cart calculations.
- **Build Your Own Engine**: A powerful 5-step custom product builder (Base -> Flavour -> Topping -> Filling -> Syrup) perfect for desserts and highly customizable items.
- **Active Kitchen Orders**: Live ticket tracking system for the kitchen with "Preparing" and "Ready" statuses.
- **Inventory Management**: Real-time stock tracking with low-stock alerts and unit management (L, Kg, Units).
- **Menu & Recipe Manager**: Link raw ingredients to menu items so inventory depletes automatically when an order is placed.
- **Order Ledger & Analytics**: Comprehensive historical transaction viewing with dynamic date filtering (Day/Month/All) and detailed receipt expansion. Includes visual charts for sales trends.
- **WhatsApp & PDF Receipts**: Generate beautiful 80mm thermal-style PDF receipts that can be printed or sent directly to customers via WhatsApp.
- **Authentication & Access Control**: Secure login system. New staff signups are placed in a "Pending" state until an Administrator approves their access request via the built-in dashboard.

## Tech Stack

- **Frontend**: React (Vite), React Router DOM, Recharts (Analytics), jsPDF (Receipt Generation), Lucide React (Icons), QRCode.react
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)

## Getting Started

### Prerequisites
- Node.js (v16+)
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/daksh1706/crftd_pos.git
   cd crftd_pos
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret
   ```

3. **Setup the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Initialize Database**
   Run the SQL commands provided in `supabase_schema.sql` within your Supabase project's SQL Editor to create the necessary tables.

5. **Start Development Servers**
   In the `backend` directory:
   ```bash
   npm run dev
   ```
   In the `frontend` directory:
   ```bash
   npm run dev
   ```

## Authentication Setup
By default, the system restricts access. The following accounts are pre-approved and injected into the system:

**Test/Cashier Account:**
- **Email:** `test@gmail.com`
- **Password:** `user1234`

All other signups will require approval from the Admin.

## License
Proprietary / Closed Source
