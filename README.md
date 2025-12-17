# Rendezvous - Event Discovery Platform

An event discovery platform for Cameroon. Find concerts, festivals, workshops, tech talks, nightlife, and more happening near you easily on one platform.

## What This Does

Rendezvous solves a distinct problem: event information is scattered across WhatsApp statuses, Instagram stories, Facebook events, and that one friend who somehow knows about everything. We're bringing it all together with some AI magic to help you actually find fun things to do.

**Core Features:**
- Natural language search that understands "cheap concerts Douala this weekend"
- Personalized event suggestions based on your interests and behavior
- Interactive map because sometimes you need to know exactly how far you're willing to travel for a good time
- Event management dashboard for organizers who want analytics
- Smart event categorization using AI
- Fraud detection because scam events are apparently a thing

## Status:
Project currently under development.

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Redux Toolkit for state management
- React Router v6 for client-side routing
- Axios for API calls
- Mapbox GL JS for maps
- Lucide React for icons
- Recharts for analytics

### Backend
- Node.js 18+
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Nodemailer for emails
- Cloudinary for image storage

### External Services
- Hugging Face API (NLP/AI)
- Mapbox API (maps and geocoding)
- Cloudinary (Image CDN)
- MongoDB Atlas (Database)

## Project Structure

```
rendezvous/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service calls
│   │   ├── store/         # Redux store and slices
│   │   ├── styles/        # Tailwind and global styles
│   │   └── utils/         # Helper functions
│   └── public/            # Static assets
│
├── server/                # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
│
├── docs/                 # Documentation
└── README.md            # You are here
```

## Getting Started

### Prerequisites

- Node.js 18+ installed (check with node --version)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn package manager
- Git
- A sense of adventure

### Installation

**1. Clone the repository**
   ```bash
   git clone https://github.com/SamanthaNK/rendezvous.git
   cd rendezvous
   ```

**2. Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

**3. Set up environment variables**

 Create a .env file in the client and server
 folder of the project:

 **Server (.env)**
 - `MONGODB_URI` - Your MongoDB Atlas connection string
 - `JWT_SECRET` - A random string (mash your keyboard, you'll be fine)
 - `CLOUDINARY_*` - Your Cloudinary credentials
 - `EMAIL_*` - Your email service credentials
 - `HUGGINGFACE_API_KEY` - Your Hugging Face API token
 - `MAPBOX_ACCESS_TOKEN` - Your Mapbox token

 **Client (.env)**
 - `VITE_API_BASE_URL` - Backend URL (http://localhost:5000/api for development)
 - `VITE_MAPBOX_ACCESS_TOKEN` - Same Mapbox token as backend


**4. Run the development servers**

   From the root directory:
   ```bash
   # Run both client and server concurrently
   npm run dev
   ```

   Or run them separately:
   ```bash
   # Terminal 1 - Run backend
   npm run dev:server

   # Terminal 2 - Run frontend
   npm run dev:client
   ```

**5. Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/health (should return JSON with success: true)

## Available Scripts

### Root Directory
- `npm run dev` - Run both client and server concurrently
- `npm run dev:client` - Run only frontend
- `npm run dev:server` - Run only backend
- `npm run build:client` - Build frontend for production
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted

### Client Directory
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Server Directory
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start server in production mode

## API Documentation

The API follows RESTful conventions and returns JSON responses in this format:

```javascript
{
  "success": true,
  "data": { /* your actual data */ },
  "message": "Human-readable message"
}
```

Error responses look like:
```javascript
{
  "success": false,
  "message": "What went wrong",
  "error": "Technical details (only in development mode)"
}
```

Full API documentation is in `postman documentation`

## Deployment

### Frontend (Vercel)
1. Build the client: `cd client && npm run build`
2. Deploy the `client/dist` folder
3. Set environment variables in deployment platform

### Backend (Render/Railway/Heroku)
1. Push to GitHub
2. Connect repository to deployment platform
3. Set environment variables
4. Deploy from `server/` directory

### Database (MongoDB Atlas)
- Already cloud-hosted
- Ensure IP whitelist is configured
- Use connection string in production `.env`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- Samantha Ngong    @SamanthaNK
- Pearly Kusona    @Pearly-Kusona25


## Contact

Found a bug? Have a feature request? Want to tell us our code is bad?

- Open an issue on GitHub
- Email: samanthank38@gmail.com
- Or just fork it and make it better

---

Built as a school project.