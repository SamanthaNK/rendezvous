# Rendezvous - Complete Project Documentation for Beginners

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Project Structure Explained](#project-structure-explained)
4. [Backend Deep Dive](#backend-deep-dive)
5. [Frontend Deep Dive](#frontend-deep-dive)
6. [How Frontend & Backend Connect](#how-frontend--backend-connect)
7. [Key Features Implementation](#key-features-implementation)
8. [Development Workflow](#development-workflow)
9. [What's Essential vs Extra](#whats-essential-vs-extra)
10. [Common Patterns & Best Practices](#common-patterns--best-practices)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Final Notes for Beginners](#final-notes-for-beginners)

---

## Project Overview

### What is Rendezvous?

Rendezvous is an event discovery platform specifically designed for Cameroon. It solves the problem of scattered event information across social media by centralizing events in one place with AI-powered search and recommendations.

### Core Problem it Solves

- Events are scattered across WhatsApp, Instagram, Facebook
- Hard to find relevant events based on interests
- No central platform for event organizers
- Difficult to discover events in specific locations

### Three User Types

- **Regular Users** - Discover and attend events
- **Organizers** - Create and manage events
- **Admins** - Moderate content and verify organizers

---

## Architecture & Technology Stack

### Overall Architecture

This is a MERN stack application with AI capabilities:

```
┌─────────────────┐
│  React Frontend │ ──HTTP/HTTPS──→ ┌──────────────────┐
│   (Port 5173)   │                  │  Express Backend │
└─────────────────┘                  │   (Port 5000)    │
                                     └──────────────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        │                     │                     │
                  ┌───────────┐      ┌──────────────┐      ┌──────────────┐
                  │  MongoDB  │      │ Hugging Face │      │  Cloudinary  │
                  │   Atlas   │      │  AI Service  │      │    (Images)  │
                  └───────────┘      └──────────────┘      └──────────────┘
```

### Technology Stack Breakdown

#### Frontend (Client)

- **React 18** - UI library for building components
- **Vite** - Build tool (faster than Create React App)
- **Redux Toolkit** - State management (user auth, search history)
- **React Router v6** - Client-side routing
- **Axios** - HTTP requests to backend
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **React Leaflet** - Map visualization
- **React Hook Form** - Form handling

#### Backend (Server)

- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **MongoDB with Mongoose** - Database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Image storage
- **NodeMailer** - Email service

#### AI & External Services

- **Hugging Face API** - NLP for search parsing and embeddings
- **Sentence Transformers** - Event recommendations
- **Mapbox/Leaflet** - Maps and geocoding

---

## Project Structure Explained

### Root Directory

```
rendezvous/
├── client/           # Frontend React app
├── server/           # Backend Node.js app
├── docs/             # Documentation files
├── package.json      # Root package manager
└── README.md         # Project overview
```

### Why This Structure?

This is a monorepo structure where frontend and backend live in the same repository but run independently. They communicate via HTTP requests.

---

## Backend Deep Dive

### Directory Structure

```
server/
├── config/
│   └── database.js           # MongoDB connection setup
├── controllers/              # Request handlers (business logic)
│   ├── authController.js
│   ├── eventController.js
│   ├── searchController.js
│   └── uploadController.js
├── middleware/               # Request interceptors
│   ├── authMiddleware.js
│   ├── roleCheck.js
│   └── uploadMiddleware.js
├── models/                   # Database schemas
│   ├── eventModel.js
│   ├── userModel.js
│   ├── organizerProfileModel.js
│   ├── reviewModel.js
│   ├── reportModel.js
│   └── verificationRequestModel.js
├── routes/                   # API endpoint definitions
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── searchRoutes.js
│   └── uploadRoutes.js
├── services/                 # External service integrations
│   ├── aiService.js
│   ├── cloudinaryService.js
│   ├── emailService.js
│   └── recommendationService.js
├── utils/                    # Helper functions
│   ├── jwt.js
│   └── emailService.js
├── scripts/                  # Utility scripts
│   └── migrateEmbeddings.js
├── .env                      # Environment variables
├── package.json              # Backend dependencies
└── server.js                 # Entry point
```

### Key Backend Files Explained

#### server.js - The Entry Point

This file starts the Express server and sets up all middleware.

**What it does:**
- Loads environment variables from .env
- Connects to MongoDB database
- Sets up middleware (CORS, JSON parsing, rate limiting)
- Registers API routes
- Handles errors globally
- Starts listening on port 5000

**Key middleware:**
- `cors()` - Allows frontend (port 5173) to make requests
- `express.json()` - Parses JSON request bodies
- `rateLimit()` - Prevents abuse (100 requests per 15 minutes)

#### config/database.js - MongoDB Connection

Establishes connection to MongoDB Atlas (cloud database).

**Important settings:**
- `maxPoolSize: 10` - Maximum 10 concurrent connections
- `socketTimeoutMS: 45000` - Close idle connections after 45s
- Exits process if connection fails

### Controllers - The Business Logic

#### authController.js - Handles user authentication

**register()** - Creates new user account
- Validates input (email format, password length)
- Hashes password with bcrypt
- Generates email verification token
- Sends verification email
- Returns JWT token for immediate login

**login()** - Authenticates existing user
- Finds user by email
- Compares password hash
- Updates last login timestamp
- Returns JWT token

**verifyEmail()** - Confirms email address
- Checks token validity and expiration
- Marks user as verified
- Allows full platform access

**forgotPassword() & resetPassword()** - Password recovery flow

#### eventController.js - Handles event operations (most complex)

**getAllEvents()** - Lists events with filtering
- Supports filters: category, city, date range, price
- Implements pagination (20 events per page)
- Uses `.lean()` for faster reads
- Populates organizer verification status

**getEventById()** - Gets single event details
- Increments view count asynchronously
- Fetches organizer profile
- Finds similar events using embeddings

**createEvent()** - Creates new event (organizers only)
- Validates all required fields
- Generates AI embedding for recommendations
- Uploads images to Cloudinary
- Sets status (draft or published)

**updateEvent()** - Updates existing event
- Checks ownership (only own events)
- Prevents editing past events
- Regenerates embedding if content changes

**saveEvent() / unsaveEvent()** - User bookmarking

**markInterested() / unmarkInterested()** - Interest tracking

**getEventFeed()** - Personalized recommendations (complex)
- Mixes 3 sources: AI recommendations (60%), followed organizers (20%), trending (20%)
- Implements caching (5-minute TTL) for performance
- Falls back to interest-based for new users

#### searchController.js - Natural language search

**naturalLanguageSearch()** - Main search function
- Calls AI service to parse query
- Extracts: category, location, budget, timeframe
- Builds MongoDB filters from parsed data
- Returns results with pagination

#### uploadController.js - Image handling

**uploadEventImages()** - Uploads to Cloudinary
- Validates file types (JPG/PNG only)
- Limits size (5MB max)
- Returns public URLs

### Models - Database Schemas

#### userModel.js - User data structure

```javascript
{
  name: String,                    // Full name
  email: String,                   // Unique, indexed
  password: String,                // Hashed with bcrypt
  interests: [String],             // 3-5 categories
  location: {                      // City and coordinates
    city: String,
    coordinates: {
      type: 'Point',
      coordinates: [lng, lat]
    }
  },
  role: String,                    // 'user', 'organizer', 'admin'
  savedEvents: [ObjectId],         // References to Event
  interestedEvents: [ObjectId],
  followedOrganizers: [ObjectId]
}
```

**Pre-save hooks:**
- Hashes password automatically before saving
- Never stores plain text passwords

**Methods:**
- `comparePassword()` - Verifies login password
- `isOrganizer()` - Checks if user can create events
- `isAdmin()` - Checks admin privileges

#### eventModel.js - Event data structure

```javascript
{
  title: String,                   // Max 100 chars
  description: String,             // Max 2000 chars
  categories: [String],            // From predefined list
  date: Date,                      // Event date/time
  time: String,                    // HH:MM format
  location: {
    venue: String,
    address: String,
    city: String,
    coordinates: {                 // For map display
      type: 'Point',
      coordinates: [lng, lat]
    }
  },
  price: Number,                   // FCFA currency
  isFree: Boolean,                 // Auto-calculated
  images: [String],                // Cloudinary URLs
  organizer: ObjectId,             // References User
  status: String,                  // draft, published, past, cancelled
  embedding: [Number],             // AI vector (384 dimensions)
  metrics: {
    views: Number,
    saves: Number,
    interested: Number
  }
}
```

**Indexes for Performance:**
- Text index on title and description (for keyword search)
- 2dsphere index on location.coordinates (for nearby queries)
- Compound indexes on common filter combinations

#### organizerProfileModel.js - Extended organizer data

- Separate from User model for better organization
- Stores verification status, metrics, analytics
- `updateMetrics()` static method recalculates statistics

### Middleware - Request Interceptors

#### authMiddleware.js - Protects routes

**authenticate()** - Requires valid JWT token
- Extracts token from `Authorization: Bearer <token>` header
- Verifies signature with JWT_SECRET
- Attaches user object to `req.user`
- Checks if account is active and verified

**optionalAuth()** - Doesn't fail if no token
- Used for routes accessible to both logged-in and anonymous users

#### roleCheck.js - Permission checking

- `requireRole()` - Allows only specific roles
- `requireOrganizer()` - Organizers and admins only
- `requireAdmin()` - Admins only

#### uploadMiddleware.js - File upload configuration

- Uses Multer with memory storage
- Validates file types (image/jpeg, image/png)
- Limits size (5MB per file, max 5 files)

### Services - External Integrations

#### aiService.js - AI/NLP operations

This is one of the most complex files. Here's what each function does:

**Query Parsing:**

`parseQuery()` - Extracts structured data from natural language
- Example: "free concerts douala this weekend"
- Extracts: `category="Music & Concerts"`, `location="Douala"`, `budget={isFree: true}`, `timeframe={weekend}`

**Category Extraction:**

`extractCategory()` - Keyword matching
- Looks for keywords like "music", "concert", "festival"
- Maps to predefined categories

**Location Extraction:**

`extractLocation()` - Finds Cameroonian cities
- Searches for city names in query
- Normalizes accents (Yaoundé = Yaounde)

**Budget Extraction:**

`extractBudget()` - Parses price constraints
- Detects "free", "under 5000", "5k", etc.
- Converts to price range filters

**Timeframe Extraction:**

`extractTimeframe()` - Understands time references
- "tonight" → today's date
- "weekend" → next Saturday-Sunday
- "this month" → current month range

**Embeddings (for Recommendations):**

`generateEventEmbedding()` - Creates vector representation
- Calls local AI service (embedding_service.py)
- Returns 384-dimensional vector
- Used for similarity calculations

`findSimilarEvents()` - Calculates similarity
- Uses cosine similarity formula
- Compares event vectors
- Returns top K similar events

#### cloudinaryService.js - Image storage

**uploadImage()** - Uploads single image
- Converts buffer to stream
- Uploads to Cloudinary CDN
- Returns public URL

**uploadMultipleImages()** - Batch upload
- Processes array of files
- Returns array of URLs

**deleteImage() / deleteMultipleImages()** - Cleanup

#### emailService.js - Email notifications

- `sendVerificationEmail()` - Email confirmation link
- `sendPasswordResetEmail()` - Password recovery
- Uses NodeMailer with Gmail SMTP
- HTML templates for better presentation

#### recommendationService.js - Personalized suggestions

This implements a hybrid recommendation algorithm:

**1. Content-Based Filtering (40%):**
- Matches user interests with event categories
- Boosts events in user's city
- Formula: `score = (categoryMatch ? 0.7 : 0) + (cityMatch ? 0.3 : 0)`

**2. Collaborative Filtering (40%):**
- Finds similar users (Jaccard similarity)
- Recommends events they liked
- Formula: `similarity = intersection / union`

**3. Embedding-Based (20%):**
- Compares event embeddings with user's history
- Uses cosine similarity
- Finds semantically similar events

**Final Recommendation:**
- Combines all three scores
- Ensures diversity (max 3 events per category)
- Filters out already saved/interested events
- Sorts by final score

### Routes - API Endpoints

#### authRoutes.js - Authentication endpoints

```javascript
POST   /api/auth/register           // Create account
POST   /api/auth/login              // Get JWT token
POST   /api/auth/logout             // Invalidate session
POST   /api/auth/verify-email       // Confirm email
POST   /api/auth/resend-verification // Resend email
POST   /api/auth/forgot-password    // Request reset link
POST   /api/auth/reset-password     // Set new password
GET    /api/auth/me                 // Get current user
```

#### eventRoutes.js - Event endpoints

```javascript
// Public (no auth required)
GET    /api/events                  // List all events
GET    /api/events/:id              // Single event
GET    /api/events/:id/similar      // Similar events
GET    /api/events/nearby           // By location

// Authenticated users
GET    /api/events/feed             // Personalized feed
POST   /api/events/:id/save         // Bookmark
DELETE /api/events/:id/save         // Remove bookmark
POST   /api/events/:id/interest     // Mark interested
DELETE /api/events/:id/interest     // Unmark
GET    /api/events/user/saved       // User's saved
GET    /api/events/user/interested  // User's interested

// Organizers only
POST   /api/events                  // Create event
PUT    /api/events/:id              // Update event
DELETE /api/events/:id              // Delete event
GET    /api/events/organizer/my-events  // Own events
```

#### searchRoutes.js - Search endpoints

```javascript
GET    /api/search?q=<query>        // Natural language search
GET    /api/search/suggestions      // Popular searches
```

#### uploadRoutes.js - Image endpoints

```javascript
POST   /api/upload/images           // Upload images (organizers)
DELETE /api/upload/images           // Delete images (organizers)
```

### Environment Variables (.env)

**Critical Configuration:**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (NodeMailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# AI Service
AI_SERVICE_URL=http://localhost:5001

# CORS
CLIENT_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # 100 requests per window
```

**Security Notes:**
- Never commit `.env` to Git
- Use different secrets for production
- Email password should be Gmail App Password (not regular password)

---

## Frontend Deep Dive

### Directory Structure

```
client/
├── public/
│   └── patterns/
│       └── toghu-pattern.svg     # Cultural pattern overlay
├── src/
│   ├── components/
│   │   ├── common/               # Reusable UI components
│   │   ├── event/                # Event-specific components
│   │   ├── onboarding/           # Registration steps
│   │   ├── routing/              # Route protection
│   │   └── search/               # Search UI
│   ├── layouts/                  # Page layouts
│   ├── pages/                    # Full page components
│   ├── services/                 # API communication
│   ├── store/                    # Redux state management
│   ├── styles/                   # Global CSS
│   ├── utils/                    # Helper functions
│   ├── App.jsx                   # Root component
│   └── main.jsx                  # Entry point
├── .env                          # Frontend config
├── index.html                    # HTML template
├── package.json                  # Frontend dependencies
├── tailwind.config.js            # Tailwind customization
└── vite.config.js                # Vite build config
```

### Key Frontend Files Explained

#### main.jsx - Entry Point

Renders the root React component into the DOM.

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**What happens here:**
- Imports React library
- Imports root App component
- Imports global styles
- Finds `<div id="root">` in index.html
- Renders App inside it

#### App.jsx - Root Component

Sets up routing, Redux store, and global providers.

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/HomePage';
// ... other imports

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="events/:id" element={<EventDetailsPage />} />
            {/* ... other routes */}
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};
```

**Key Concepts:**
- `<Provider>` - Makes Redux store available everywhere
- `<BrowserRouter>` - Enables client-side routing
- `<Routes>` & `<Route>` - Define URL → Component mapping
- Nested routes share layout (Navbar, Footer)

### Components Directory

#### components/common/ - Reusable UI Components

**Button.jsx - Customizable button**

```javascript
<Button 
  variant="primary"     // primary, secondary, ghost, danger
  size="lg"             // sm, md, lg
  fullWidth             // Expand to container width
  icon={Icon}           // Lucide icon
  iconPosition="left"   // left or right
  onClick={handleClick}
  disabled={loading}
>
  Click Me
</Button>
```

**Props explained:**
- `variant` - Changes color scheme
- `size` - Adjusts padding and font size
- `fullWidth` - Makes button block-level
- `icon` - Adds icon from lucide-react
- `disabled` - Prevents clicks, shows loading state

**Input.jsx - Form input with label and error**

```javascript
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  icon={Mail}
  iconPosition="left"
  error={errors.email?.message}
  {...register('email', { required: true })}
/>
```

**Features:**
- Built-in error display
- Icon support
- Integrates with react-hook-form
- Automatic focus states
- Accessibility (aria attributes)

**Select.jsx - Dropdown with search**

```javascript
<Select
  label="City"
  options={cityOptions}
  value={selectedCity}
  onChange={setSelectedCity}
  multiple              // Allow multiple selection
  placeholder="Choose city"
/>
```

**Advanced features:**
- Search filtering (for >5 options)
- Multiple selection mode
- Keyboard navigation
- Custom styling

**Modal.jsx - Overlay dialog**

```javascript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure?</p>
  <Button onClick={handleConfirm}>Yes</Button>
</Modal>
```

**Behavior:**
- Locks body scroll when open
- Closes on Escape key
- Closes on backdrop click
- Traps focus inside modal

**Spinner.jsx - Loading indicator**

```javascript
<Spinner size="lg" color="teal" />
```

**Skeleton.jsx - Loading placeholder**

```javascript
<SkeletonCard />  // Shimmer effect while loading
```

#### components/event/ - Event-Specific Components

**EventCard.jsx - Event list item**

The most complex component. Shows:
- Event image with fallback
- Category badge
- Title (truncated to 2 lines)
- Date, location, price
- Interested count
- Save and interested buttons

**State management:**

```javascript
const [isSaved, setIsSaved] = useState(event.isSaved);
const [isInterested, setIsInterested] = useState(event.isInterested);
const [interestedCount, setInterestedCount] = useState(event.metrics.interested);
```

**Optimistic updates:**
1. User clicks "Save"
2. UI updates immediately (isSaved = true)
3. API call happens in background
4. If fails, revert state
5. Better UX than waiting for server

**EventGrid.jsx - Grid layout wrapper**

```javascript
<EventGrid 
  events={events}
  loading={loading}
  onSaveToggle={handleSave}
  onInterestedToggle={handleInterested}
/>
```

**Responsibilities:**
- Shows skeleton loaders while loading
- Shows empty state if no events
- Renders EventCard for each event
- Responsive grid (1 col mobile, 2 tablet, 3 desktop)

**FilterSidebar.jsx - Event filtering UI**

Complex component with multiple filter types:
- Categories (single select)
- Cities (single select)
- Date ranges (preset buttons)
- Price ranges (preset buttons)

**Filter state structure:**

```javascript
{
  category: '',
  city: '',
  dateFrom: '',
  dateTo: '',
  dateFilter: 'weekend',  // Preset selection
  isFree: '',
  priceMin: '',
  priceMax: '',
  priceFilter: 'free'     // Preset selection
}
```

**ImageUpload.jsx - Drag-and-drop uploader**

**Features:**
- Drag and drop files
- Click to browse
- Image preview
- Remove uploaded images
- Validation (type, size, count)

**Preview management:**

```javascript
const [images, setImages] = useState([
  { file: File, preview: 'blob:...' }
]);

// Clean up blob URLs on unmount
useEffect(() => {
  return () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
  };
}, [images]);
```

#### components/onboarding/ - Registration Steps

**InterestsStep.jsx - Category selection**

Grid of category cards with icons. User selects 1-5 interests.

**LocationStep.jsx - City selection**

Searchable list of Cameroonian cities.

#### components/routing/ - Route Protection

**ProtectedRoute.jsx - Requires authentication**

```javascript
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};
```

**Usage:**

```javascript
<Route path="/saved" element={
  <ProtectedRoute>
    <SavedEventsPage />
  </ProtectedRoute>
} />
```

**RoleRoute.jsx - Requires specific role**

```javascript
<RoleRoute allowedRoles={['organizer', 'admin']}>
  <CreateEventPage />
</RoleRoute>
```

### Layouts Directory

#### RootLayout.jsx - Main page structure

```javascript
const RootLayout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />  {/* Child routes render here */}
      </main>
      <Footer />
    </>
  );
};
```

Outlet is from React Router - it's where nested routes render.

#### Navbar.jsx - Top navigation

Complex component with:
- Logo and search
- Desktop menu
- Mobile hamburger menu
- User dropdown
- Authentication buttons

**State:**

```javascript
const [isScrolled, setIsScrolled] = useState(false);      // Sticky header
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
const [isSearchOpen, setIsSearchOpen] = useState(false);
```

**Scroll detection:**

```javascript
useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10);
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

#### Footer.jsx - Bottom links

Static component with site map and social links.

#### Container.jsx - Content width wrapper

```javascript
const Container = ({ children }) => {
  return (
    <div className="max-w-screen-xl mx-auto px-5 md:px-10">
      {children}
    </div>
  );
};
```

Ensures consistent max-width across pages.

### Pages Directory

#### HomePage.jsx - Main landing page

Most complex page with multiple sections:
- Hero section with search
- Quick filter pills
- Filter sidebar (toggle)
- Event grid or map view
- Pagination

**State management:**

```javascript
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({...});
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
```

**Data flow:**
1. Component mounts
2. useEffect triggers fetchEvents()
3. API call to /api/events with filters
4. Update state with results
5. Re-render with new events

**Filter changes:**

```javascript
useEffect(() => {
  fetchEvents();
}, [filters]);  // Re-fetch when filters change
```

#### EventDetailsPage.jsx - Single event view

Fetches event by ID from URL params:

```javascript
const { id } = useParams();  // From react-router

useEffect(() => {
  fetchEventDetails();
}, [id]);
```

**Features:**
- Image gallery (if multiple images)
- Event details sidebar
- Save and interested buttons
- Similar events carousel
- Map placeholder

#### CreateEventPage.jsx - Multi-step event creation

Three-step form:
1. Basic info (title, description, categories, images)
2. Date & location
3. Pricing & details

**State:**

```javascript
const [step, setStep] = useState(1);
const [images, setImages] = useState([]);
const [selectedCategories, setSelectedCategories] = useState([]);
const [submitting, setSubmitting] = useState(false);
```

**Form handling with react-hook-form:**

```javascript
const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
```

**Image upload flow:**
1. User selects images
2. Store files in state with preview URLs
3. On submit, upload to backend first
4. Get Cloudinary URLs
5. Include URLs in event data
6. Create event with image URLs

#### LoginPage.jsx & RegisterPage.jsx - Authentication

Use Redux for state management:

```javascript
const dispatch = useDispatch();

const onSubmit = async (data) => {
  const response = await authAPI.login(data);
  dispatch(setCredentials({
    user: response.data.user,
    token: response.data.token
  }));
  navigate('/');
};
```

#### SavedEventsPage.jsx - User's bookmarks

Tabs for:
- Saved events
- Interested events

**State:**

```javascript
const [activeTab, setActiveTab] = useState('saved');
const [events, setEvents] = useState([]);
```

**Tab switching:**

```javascript
useEffect(() => {
  fetchEvents();
}, [activeTab]);  // Re-fetch when tab changes
```

#### SearchResultsPage.jsx - Search results

Reads query from URL:

```javascript
const [searchParams] = useSearchParams();
const query = searchParams.get('q');
```

**Displays:**
- Parsed query parameters (AI interpretation)
- Filter sidebar
- Results grid
- Pagination

### Services Directory

#### api.js - Centralized API calls

Single Axios instance with interceptors:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());  // Token expired
    }
    return Promise.reject(error);
  }
);
```

**Organized by feature:**

```javascript
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  // ...
};

export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  // ...
};
```

**Why this pattern?**
- Single source of truth for API URLs
- Automatic token injection
- Centralized error handling
- Type-safe (with TypeScript)

### Store Directory - Redux State Management

#### store.js - Redux store configuration

```javascript
export const store = configureStore({
  reducer: {
    auth: authReducer,
    search: searchReducer,
    view: viewReducer,
  },
  preloadedState: loadState(),  // Load from localStorage
});

// Save to localStorage on every state change
store.subscribe(() => {
  saveState(store.getState());
});
```

**Persistence:**

```javascript
const loadState = () => {
  try {
    const authState = localStorage.getItem('rendezvous_auth');
    return authState ? JSON.parse(authState) : undefined;
  } catch (err) {
    return undefined;
  }
};
```

#### authSlice.js - Authentication state

```javascript
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});
```

**Usage in components:**

```javascript
// Read state
const user = useSelector(selectCurrentUser);
const isAuthenticated = useSelector(selectIsAuthenticated);

// Update state
const dispatch = useDispatch();
dispatch(setCredentials({ user, token }));
dispatch(logout());
```

#### searchSlice.js - Search history

Stores last 10 searches per user.

#### viewSlice.js - View preference

Remembers if user prefers list or map view.

### Styling System

#### styles/index.css - Global styles

```css
@import url('https://fonts.googleapis.com/css2?family=Syne...');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-body text-base text-gray-700 bg-bright-snow;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading text-ink-black;
  }
}
```

#### tailwind.config.js - Design system

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'lime-cream': '#bde585',
        'dark-amaranth': '#63132b',
        'teal': '#028090',
        'ink-black': '#0b2027',
        'bright-snow': '#fafaf9',
      },
      fontFamily: {
        'logo': ['Syne'],
        'heading': ['Geologica'],
        'body': ['Manrope'],
      },
      // ... more customization
    },
  },
};
```

**Why Tailwind?**
- Utility-first (no need to name classes)
- Purges unused CSS (smaller bundle)
- Consistent spacing/colors
- Responsive prefixes (`md:`, `lg:`)

### Utils Directory

#### dateHelpers.js - Date formatting

```javascript
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  // ...
};

export const isToday = (date) => {
  const eventDate = new Date(date);
  const today = new Date();
  return eventDate.toDateString() === today.toDateString();
};
```

**Usage:**

```javascript
const formattedDate = formatDate(event.date, 'long');
// "Saturday, December 14, 2024"

const isTonightEvent = isToday(event.date);
```

---

## How Frontend & Backend Connect

### The Request-Response Cycle

**Example: User logs in**

**1. Frontend (LoginPage.jsx):**

```javascript
const onSubmit = async (data) => {
  const response = await authAPI.login({
    email: data.email,
    password: data.password
  });
  
  dispatch(setCredentials(response.data.data));
};
```

**2. API Service (api.js):**

```javascript
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
};
```

**3. HTTP Request:**

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**4. Backend Route (authRoutes.js):**

```javascript
router.post('/login', login);
```

**5. Controller (authController.js):**

```javascript
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  const isValid = await user.comparePassword(password);
  
  const token = generateAccessToken(user._id);
  
  res.json({
    success: true,
    data: { user, token }
  });
};
```

**6. HTTP Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**7. Frontend receives response:**

```javascript
// Redux updates state
dispatch(setCredentials({
  user: response.data.data.user,
  token: response.data.data.token
}));

// localStorage persists state
localStorage.setItem('rendezvous_auth', JSON.stringify({
  user,
  token,
  isAuthenticated: true
}));

// Navigate to home
navigate('/');
```

### Authenticated Requests

**All subsequent requests include token:**

**1. Redux interceptor adds token:**

```javascript
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**2. Request header:**

```
GET /api/events/feed
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**3. Backend middleware verifies:**

```javascript
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  req.user = user;
  next();
};
```

**4. Controller accesses user:**

```javascript
export const getEventFeed = async (req, res) => {
  const userId = req.user._id;  // From middleware
  const feed = await generateRecommendations(userId);
  res.json({ success: true, data: feed });
};
```

### Error Handling

**Backend error:**

```javascript
throw new Error('Invalid credentials');
```

**Express error handler:**

```javascript
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message
  });
});
```

**Frontend receives:**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Axios interceptor handles:**

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);
```

**Component displays:**

```javascript
try {
  await authAPI.login(data);
} catch (error) {
  setError(error.message);  // "Invalid credentials"
}
```

---

## Key Features Implementation

### 1. Natural Language Search

**Flow:**

1. User types: "free concerts douala this weekend"
2. Frontend sends to `/api/search?q=free concerts douala this weekend`
3. Backend (`searchController.js`) calls `aiService.parseQuery()`
4. AI service extracts parameters:

```javascript
{
  category: "Music & Concerts",
  location: "Douala",
  budget: { isFree: true },
  timeframe: { dateFrom: "2024-12-14", dateTo: "2024-12-15" }
}
```

5. Builds MongoDB query:

```javascript
{
  categories: "Music & Concerts",
  "location.city": /Douala/i,
  isFree: true,
  date: { $gte: "2024-12-14", $lte: "2024-12-15" }
}
```

6. Returns matching events
7. Frontend displays with parsed parameters shown

**Fallback:** If AI service fails, uses keyword search:

```javascript
{
  $text: { $search: "free concerts douala weekend" }
}
```

### 2. Event Recommendations

**Algorithm (in recommendationService.js):**

**For new users (cold start):**
- Match user interests with event categories
- Boost events in user's city
- No personalization yet

**For active users:**

**1. Content-based (40%):**
- Interest overlap: user.interests ∩ event.categories
- Location match: user.city === event.location.city

**2. Collaborative filtering (40%):**
- Find similar users (Jaccard similarity)
- Recommend events they liked
- Formula: `similarity = |A ∩ B| / |A ∪ B|`

**3. Embedding-based (20%):**
- Compare event vectors (cosine similarity)
- Find semantically similar to user's history
- Formula: `cos(θ) = (A · B) / (||A|| × ||B||)`

**Final score:**

```javascript
finalScore = (
  contentScore * 0.4 +
  collaborativeScore * 0.4 +
  embeddingScore * 0.2
);
```

**Diversity:**
- Max 3 events per category
- Prevents filter bubble

### 3. Image Upload

**Flow:**

**1. User selects images in ImageUpload component**

**2. Files stored in state with preview URLs:**

```javascript
const [images, setImages] = useState([
  { file: File, preview: 'blob:...' }
]);
```

**3. On form submit:**

```javascript
const formData = new FormData();
images.forEach(img => {
  formData.append('images', img.file);
});

const response = await uploadAPI.uploadImages(formData);
const urls = response.data.data.urls;
```

**4. Backend (uploadController.js):**

```javascript
export const uploadEventImages = async (req, res) => {
  validateImageFiles(req.files);
  const uploadedImages = await uploadMultipleImages(req.files);
  res.json({ success: true, data: { urls: uploadedImages } });
};
```

**5. Cloudinary service:**

```javascript
export const uploadImage = async (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'rendezvous/events' },
      (error, result) => {
        if (error) reject(error);
        resolve({ url: result.secure_url });
      }
    );
    
    Readable.from(buffer).pipe(stream);
  });
};
```

**6. Returns URLs:**

```json
{
  "success": true,
  "data": {
    "urls": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg"
    ]
  }
}
```

**7. Frontend includes URLs in event data:**

```javascript
const eventData = {
  title: "...",
  description: "...",
  images: urls,  // Cloudinary URLs
  // ...
};

await eventsAPI.create(eventData);
```

### 4. Email Verification

**Registration flow:**

**1. User registers → Backend creates user**

**2. Generate verification token:**

```javascript
const token = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto.createHash('sha256')
  .update(token)
  .digest('hex');

user.emailVerificationToken = hashedToken;
user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
await user.save();
```

**3. Send email with link:**

```javascript
const verificationUrl = `${CLIENT_URL}/verify-email?token=${token}`;
await sendVerificationEmail(user.email, user.name, token);
```

**4. User clicks link → Frontend navigates to `/verify-email?token=...`**

**5. VerifyEmailPage component:**

```javascript
const [searchParams] = useSearchParams();
const token = searchParams.get('token');

useEffect(() => {
  const verifyEmail = async () => {
    await authAPI.verifyEmail(token);
    setStatus('success');
  };
  verifyEmail();
}, [token]);
```

**6. Backend verification:**

```javascript
export const verifyEmail = async (req, res) => {
  const { token } = req.body;
  const hashedToken = hashToken(token);
  
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
  
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();
  
  res.json({ success: true });
};
```

### 5. Personalized Feed

**Implementation in eventController.js:**

**Page 1 - Mixed feed:**

```javascript
// 60% AI recommendations
const recommendedEvents = await getPersonalizedFeed(userId, 1, 7);

// 20% from followed organizers
const followedEvents = await Event.find({
  organizer: { $in: user.followedOrganizers },
  status: 'published',
  date: { $gte: new Date() }
}).limit(3);

// 20% trending
const trendingEvents = await Event.aggregate([
  {
    $addFields: {
      engagementScore: {
        $add: [
          { $multiply: ['$metrics.saves', 2] },
          '$metrics.interested'
        ]
      }
    }
  },
  { $sort: { engagementScore: -1 } },
  { $limit: 3 }
]);

// Mix and return
const mixedFeed = mixFeedEvents(
  recommendedEvents,
  followedEvents,
  trendingEvents
);
```

**Subsequent pages:**
- Pure AI recommendations
- No mixing (for consistency)

**Caching:**

```javascript
const feedCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;  // 5 minutes

const cacheKey = `${userId}-${page}-${limit}`;
if (feedCache.has(cacheKey)) {
  const cached = feedCache.get(cacheKey);
  if (Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
}

// Generate fresh feed
const feed = await generateFeed(userId);
feedCache.set(cacheKey, {
  data: feed,
  timestamp: Date.now()
});
```

---

## Development Workflow

### Setting Up the Project

**1. Clone repository:**

```bash
git clone https://github.com/SamanthaNK/rendezvous.git
cd rendezvous
```

**2. Install dependencies:**

```bash
npm install              # Root dependencies
cd client && npm install # Frontend
cd ../server && npm install # Backend
```

**3. Configure environment variables:**

**Backend (.env):**

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
CLOUDINARY_CLOUD_NAME=...
EMAIL_USER=...
EMAIL_PASSWORD=...
```

**Frontend (.env):**

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**4. Start development servers:**

**Terminal 1 - Backend:**

```bash
cd server
npm run dev  # Runs nodemon
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev  # Runs Vite
```

**Terminal 3 - AI Service (optional):**

```bash
cd server
python embedding_service.py
```

### Development URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- AI Service: http://localhost:5001

### Making Changes

**Backend changes:**
1. Edit controller/model/route file
2. Nodemon auto-restarts server
3. Test endpoint in Postman or frontend

**Frontend changes:**
1. Edit component file
2. Vite hot-reloads (instant update)
3. Check browser console for errors

### Testing API Endpoints

**Using Postman:**
1. Create new request
2. Set method (GET, POST, etc.)
3. Enter URL: `http://localhost:5000/api/events`
4. Add headers if needed: `Authorization: Bearer <token>`
5. Add body for POST/PUT (JSON format)
6. Send and inspect response

**Using Browser DevTools:**
1. Open Network tab
2. Perform action in app
3. Find request in list
4. Inspect headers, payload, response

### Common Development Tasks

**Add new API endpoint:**
1. Create controller function in `controllers/`
2. Add route in `routes/`
3. Test with Postman
4. Add API call in `services/api.js` (frontend)
5. Use in component

**Add new page:**
1. Create component in `pages/`
2. Add route in `App.jsx`
3. Link to it from navigation/buttons
4. Test routing

**Add new Redux state:**
1. Create slice in `store/`
2. Add to store configuration
3. Use selectors in components
4. Dispatch actions to update

---

## What's Essential vs Extra

### Essential (Must Have for MVP)

**Backend:**
- `server.js` - Entry point
- `config/database.js` - DB connection
- Authentication controllers & routes
- Event controllers & routes
- Search controller & routes
- User, Event, OrganizerProfile models
- Auth middleware
- JWT utilities
- Email service (basic)
- AI service (with fallback)

**Frontend:**
- `main.jsx` & `App.jsx` - Bootstrap
- Auth pages (Login, Register, Verify)
- HomePage with event grid
- EventDetailsPage
- CreateEventPage (basic, single-step)
- Common components (Button, Input, Modal)
- EventCard component
- API service
- Auth Redux slice
- Basic styling

### Extra (Nice to Have / Post-MVP)

**Backend:**
- Review model & routes (rating system)
- Report model & routes (content moderation)
- Verification request model (organizer verification)
- Advanced analytics
- WebSocket support (real-time notifications)
- Social login integration
- Poster OCR upload
- Link import scraping

**Frontend:**
- Multi-step event creation wizard
- Advanced filtering UI
- Map view (Leaflet integration)
- Image gallery/carousel
- Skeleton loaders
- Search history
- View preference persistence
- Recommendation explanations
- Social sharing
- Calendar export

### Can Be Removed Without Breaking Core

**If tight on time:**
1. **Reviews** - Remove entire review system
2. **Reports** - Remove flagging/moderation
3. **Verification** - Remove organizer verification
4. **Map view** - Show list only
5. **Image gallery** - Show first image only
6. **Advanced filters** - Keep basic search only
7. **Recommendations** - Show all events sorted by date
8. **Email verification** - Allow immediate login (security risk!)

**Simplify these:**
1. **Event creation** - Single-step form instead of wizard
2. **Search** - Keyword only, skip AI parsing
3. **Styling** - Basic Tailwind, no animations
4. **Mobile** - Desktop-first, basic responsive

---

## Common Patterns & Best Practices

### Backend Patterns

**1. Controller Structure**

```javascript
export const controllerFunction = async (req, res) => {
  try {
    // 1. Validate input
    if (!req.body.field) {
      return res.status(400).json({
        success: false,
        message: 'Field is required'
      });
    }
    
    // 2. Perform operation
    const result = await Model.create(req.body);
    
    // 3. Return success
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    // 4. Handle errors
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Operation failed',
      error: error.message
    });
  }
};
```

**2. Database Queries**

```javascript
// Use .lean() for read-only
const events = await Event.find({ status: 'published' })
  .select('title date location')  // Only needed fields
  .populate('organizer', 'name')  // Limited populate
  .lean();  // Plain object (faster)

// Use .exec() for writes
const event = await Event.findByIdAndUpdate(id, data)
  .exec();  // Returns full document

// Always paginate
const skip = (page - 1) * limit;
const events = await Event.find()
  .limit(limit)
  .skip(skip);
```

**3. Error Handling**

```javascript
// Specific error types
if (err.name === 'ValidationError') {
  // Handle validation
}
if (err.code === 11000) {
  // Handle duplicate key
}
if (err.name === 'CastError') {
  // Handle invalid ID
}
```

### Frontend Patterns

**1. Component Structure**

```javascript
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const Component = ({ prop1, prop2 }) => {
  // 1. Hooks (always at top)
  const [state, setState] = useState(initialValue);
  
  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 3. Event handlers
  const handleClick = () => {
    setState(newValue);
  };
  
  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 5. PropTypes
Component.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func,
};

export default Component;
```

**2. Data Fetching**

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.getData();
      setData(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

**3. Form Handling**

```javascript
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState: { errors } } = useForm();

const onSubmit = async (data) => {
  try {
    await api.submit(data);
  } catch (error) {
    console.error(error);
  }
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input
      {...register('field', {
        required: 'Field is required',
        minLength: { value: 3, message: 'Too short' }
      })}
    />
    {errors.field && <p>{errors.field.message}</p>}
    <button type="submit">Submit</button>
  </form>
);
```

**4. Redux Usage**

```javascript
// Read state
const user = useSelector(state => state.auth.user);
const isAuthenticated = useSelector(selectIsAuthenticated);

// Update state
const dispatch = useDispatch();
dispatch(actionCreator(payload));
```

### Common Pitfalls to Avoid

**Backend:**

**1. Forgetting to hash passwords**

```javascript
// WRONG
user.password = req.body.password;

// RIGHT
user.password = await bcrypt.hash(req.body.password, 10);
```

**2. Not validating input**

```javascript
// WRONG
const event = await Event.create(req.body);

// RIGHT
if (!req.body.title || !req.body.date) {
  return res.status(400).json({ message: 'Missing fields' });
}
```

**3. Exposing sensitive data**

```javascript
// WRONG
const user = await User.findById(id);
res.json(user);  // Includes password hash!

// RIGHT
const user = await User.findById(id).select('-password');
```

**Frontend:**

**1. Infinite loops**

```javascript
// WRONG
useEffect(() => {
  fetchData();
}, [fetchData]);  // fetchData recreated every render

// RIGHT
useEffect(() => {
  fetchData();
}, []);  // Empty deps = run once
```

**2. Not handling loading states**

```javascript
// WRONG
return <div>{data.map(item => ...)}</div>;  // Crashes if loading

// RIGHT
if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <div>{data.map(item => ...)}</div>;
```

**3. Direct state mutation**

```javascript
// WRONG
state.items.push(newItem);
setState(state);

// RIGHT
setState([...state.items, newItem]);
```

---

## Troubleshooting Guide

### Backend Issues

**MongoDB Connection Fails**

Error: `Failed to connect to MongoDB`

**Solutions:**
1. Check MONGODB_URI in `.env`
2. Whitelist IP in MongoDB Atlas
3. Check internet connection
4. Verify credentials

**JWT Token Invalid**

Error: `Invalid token`

**Solutions:**
1. Check JWT_SECRET matches between `.env` and code
2. Token might be expired (check JWT_EXPIRE)
3. Clear localStorage and re-login
4. Ensure token format: "Bearer <token>"

**Cloudinary Upload Fails**

Error: `Failed to upload images`

**Solutions:**
1. Check Cloudinary credentials in `.env`
2. Verify file size (<5MB)
3. Check file type (JPG/PNG only)
4. Check Cloudinary quota

**AI Service Unreachable**

Error: `ECONNREFUSED 127.0.0.1:5001`

**Solutions:**
1. Start AI service: `python embedding_service.py`
2. Check AI_SERVICE_URL in `.env`
3. Fallback should work (keyword search)

### Frontend Issues

**API Calls Fail (CORS)**

Error: `CORS policy: No 'Access-Control-Allow-Origin'`

**Solutions:**
1. Check backend CORS configuration
2. Verify CLIENT_URL in backend `.env`
3. Check API_BASE_URL in frontend `.env`

**Component Not Re-rendering**

State updated but UI not changing

**Solutions:**
1. Check if mutating state directly
2. Use spread operator: `[...arr]`, `{...obj}`
3. Verify useEffect dependencies

**Images Not Loading**

Broken image icon displayed

**Solutions:**
1. Check image URL in network tab
2. Verify Cloudinary upload succeeded
3. Check CORS headers for images
4. Add fallback image

**Redirect Loop**

Browser says "too many redirects"

**Solutions:**
1. Check protected route logic
2. Verify authentication state
3. Clear localStorage
4. Check for circular redirects

### Development Environment

**Port Already in Use**

Error: `Port 5000 already in use`

**Solutions:**

```bash
# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Dependencies Won't Install**

Error: `npm ERR! peer dependency`

**Solutions:**

```bash
# Clear cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install

# Use legacy peer deps
npm install --legacy-peer-deps
```

---

## Final Notes for Beginners

### Learning Path

**Week 1-2: Understand the Stack**
1. Learn JavaScript basics (async/await, promises)
2. Understand React fundamentals (components, hooks, state)
3. Learn Express basics (routes, middleware, controllers)
4. Understand MongoDB queries

**Week 3-4: Explore the Codebase**
1. Read through models (understand data structure)
2. Follow a single feature end-to-end (login flow)
3. Trace API calls from frontend to backend
4. Modify small features (change button text, add field)

**Week 5-6: Build Features**
1. Add new API endpoint
2. Create new component
3. Implement new page
4. Fix bugs

### Key Concepts to Master

**Backend:**
- Middleware chain (how requests flow)
- Mongoose models and schemas
- JWT authentication flow
- Async/await error handling
- MongoDB aggregation pipeline

**Frontend:**
- React component lifecycle
- Hooks (useState, useEffect, useContext)
- Redux state management
- React Router navigation
- Form handling with react-hook-form

**Full Stack:**
- HTTP methods (GET, POST, PUT, DELETE)
- REST API design
- Authentication vs Authorization
- State management (client vs server)
- Error handling patterns

### Resources

**Official Docs:**
- React: https://react.dev
- Express: https://expressjs.com
- MongoDB: https://docs.mongodb.com
- Redux Toolkit: https://redux-toolkit.js.org
- Tailwind CSS: https://tailwindcss.com

**This Project:**
- SRS Document: Full feature specifications
- Design System: UI guidelines and components
- API Reference: All endpoints documented

### Next Steps

**Immediate:**
1. Set up development environment
2. Run the project locally
3. Create a test account
4. Create a test event
5. Explore all features

**Short Term:**
1. Fix a small bug
2. Add a new field to event model
3. Create a new component
4. Implement a missing feature

**Long Term:**
1. Add mobile app (React Native)
2. Implement real-time notifications (WebSockets)
3. Add payment integration
4. Build analytics dashboard
5. Deploy to production

---
