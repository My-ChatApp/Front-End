# Chat App - Frontend

A modern React TypeScript frontend application for a chat system with authentication and user management.

## Features

- ✅ User Authentication (Login/Register)
- ✅ JWT Token Management
- ✅ Protected Routes
- ✅ User Dashboard
- ✅ Admin Panel
- ✅ Responsive Design
- ✅ Error Handling
- ✅ Loading States

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Alert.tsx
│   ├── LoadingSpinner.tsx
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── context/          # React Context for state management
│   └── AuthContext.tsx
├── pages/            # Page components
│   ├── Dashboard.tsx
│   ├── Home.tsx
│   ├── Layout.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   └── Register.tsx
├── services/         # API services
│   ├── apiService.ts
│   └── authService.ts
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   ├── helpers.ts
│   └── storage.ts
├── styles/           # Global styles
│   └── index.css
├── App.tsx          # Main App component
└── main.tsx         # Entry point
```

## Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **React Router v6** - Routing
- **Axios** - HTTP Client
- **CSS Modules** - Styling

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
cd Front-End
npm install
```

### Environment Setup

Create a `.env.local` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:8080
VITE_API_BASE_PATH=/api/v1
```

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The optimized build will be generated in the `dist` folder.

### Preview Build

```bash
npm run preview
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signin` - Login
- `POST /api/v1/auth/signup` - Register
- `POST /api/v1/auth/validate` - Validate Token

### Public Routes
- `GET /api/v1/welcome` - Welcome message

### Protected Routes (Requires JWT)
- `GET /api/v1/user` - User content
- `GET /api/v1/special` - Special content
- `GET /api/v1/admin` - Admin content

## Authentication Flow

1. User registers/logs in via Login/Register page
2. Backend returns JWT token
3. Token is stored in localStorage
4. Token is included in all subsequent API requests
5. Protected routes check if user is authenticated
6. Unauthenticated users are redirected to login

## Component Documentation

### ProtectedRoute
Wraps routes that require authentication. Redirects unauthenticated users to login page.

### Alert
Displays success/error/warning/info messages with optional close button.

### LoadingSpinner
Shows loading indicator while data is being fetched.

### Navbar
Navigation bar with auth status and logout functionality.

## Hooks

### useAuth
Custom hook to access authentication state and methods:

```typescript
const { 
  user, 
  token, 
  isAuthenticated, 
  isLoading, 
  error,
  login,
  register,
  logout,
  clearError
} = useAuth();
```

## Contributing

Please feel free to submit a Pull Request.

## License

MIT
