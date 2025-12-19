# AI Coding Agent Instructions for Rendezvous

## Project Overview
Rendezvous is a full-stack event discovery platform for Cameroon, built with React/Vite frontend and Node.js/Express backend. The app aggregates events from scattered sources using AI-powered search and categorization.

## Architecture
- **Frontend**: React 18 + Vite, Redux Toolkit for state, Tailwind CSS with custom design system
- **Backend**: Express.js API with MongoDB/Mongoose, JWT auth, external integrations (Hugging Face, Mapbox, Cloudinary)
- **Data Flow**: Client → Axios API calls → Server → MongoDB/External APIs → JSON responses
- **Response Format**: All API responses follow `{success: boolean, data: any, message: string}` structure
- **Error Handling**: Errors return `{success: false, message: string, error?: string}` (error only in dev mode)

## Key Conventions
- **Styling**: Use custom Tailwind classes like `btn-base`, `input-base`, `card-base` from [client/src/styles/index.css](client/src/styles/index.css)
- **Colors**: Primary palette: `lime-cream`, `dark-amaranth`, `teal`, `ink-black`, `bright-snow` (see [client/tailwind.config.js](client/tailwind.config.js))
- **Fonts**: `font-logo` (Syne), `font-heading` (Geologica), `font-body` (Manrope)
- **API Routes**: RESTful, prefixed with `/api` (configured in server routes)
- **Environment**: Separate `.env` files for client/server, client vars prefixed with `VITE_`

## Development Workflows
- **Start Development**: `npm run dev` (runs client + server concurrently using concurrently)
- **Build**: `npm run build:client` for production frontend
- **Format Code**: `npm run format` (Prettier across all JS/JSX/JSON/MD files)
- **Health Check**: Backend at `http://localhost:5000/health` returns `{success: true, ...}`

## Integration Patterns
- **External APIs**: Hugging Face for NLP, Mapbox for maps/geocoding, Cloudinary for images
- **File Uploads**: Server handles multipart with multer, stores in `server/uploads/`
- **Authentication**: JWT tokens, bcrypt for passwords
- **Email**: Nodemailer for notifications

## File Structure Expectations
- **Client Components**: Place in `client/src/components/`, pages in `client/src/pages/`
- **Server Logic**: Models in `server/models/`, routes in `server/routes/`, services in `server/services/`
- **State Management**: Redux slices in `client/src/store/`
- **Utils**: Helper functions in `client/src/utils/` and `server/utils/`

## Deployment
- **Frontend**: Vercel (build `client/dist`)
- **Backend**: Render/Railway/Heroku (from `server/` directory)
- **Database**: MongoDB Atlas (connection string in env)

Focus on AI features like natural language search and event categorization when implementing core functionality.</content>
<parameter name="filePath">c:\Users\HP\Desktop\Event Tracker\rendezvous\.github\copilot-instructions.md