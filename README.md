# Jungle Safari Inventory Management System

A web-based platform with three separate dashboards:

1. Admin Dashboard (Business owner)
2. Sales Dashboard (Salespersons at POS or Online)
3. Inventory Manager Dashboard (Warehouse / Stock management)

## Project Structure

```
jungle-safari-inventory/
├── backend/                  # Node.js + Express backend
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Auth middleware
│   ├── models/               # Mongoose models
│   ├── routes/               # API routes
│   └── server.js             # Entry point
│
└── frontend/                 # React.js frontend
    ├── src/
    │   ├── api/              # API integration
    │   ├── components/       # Reusable components
    │   ├── context/          # Context providers
    │   ├── pages/            # Page components
    │   │   ├── admin/        # Admin dashboard pages
    │   │   ├── sales/        # Sales dashboard pages
    │   │   └── inventory/    # Inventory dashboard pages
    │   └── utils/            # Utility functions
    └── package.json          # Frontend dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:

```
git clone <repository-url>
cd jungle-safari-inventory
```

2. Install backend dependencies:

```
cd backend
npm install
```

3. Install frontend dependencies:

```
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/jungle-safari-inventory
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Running the Application

1. Start the backend server:

```
cd backend
npm run dev
```

2. Start the frontend development server:

```
cd frontend
npm start
```

3. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## User Roles and Access

- **Admin**: Full access to all features, including user management
- **Sales**: Access to sales dashboard and product catalog
- **Inventory**: Access to inventory management and product data

## Features

- Authentication with JWT
- Role-based access control
- Responsive UI with Material UI components
