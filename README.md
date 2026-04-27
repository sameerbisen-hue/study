# StudyShare

A modern, mobile-friendly platform for students to share and access study materials. Built with React, TypeScript, Vite, and Supabase.

## Features

- **Material Sharing**: Upload and download study materials (PDFs, documents, presentations, images, notes)
- **User Profiles**: Customizable user profiles with upload history and statistics
- **Leaderboard**: Track top contributors by uploads, upvotes, and reviews
- **Search & Filter**: Easily find materials by subject, semester, tags, or search queries
- **Reviews & Ratings**: Rate and review materials to help others find quality resources
- **Bookmarking**: Save favorite materials for quick access
- **Admin Panel**: Manage users, content, and reports
- **Mobile Optimized**: Fully responsive design optimized for mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Authentication, Database, Storage)
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sameerbisen-hue/study.git
cd Study
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the database schema:
- Go to your Supabase project's SQL Editor
- Run the SQL from `supabase_schema.sql`

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── layout/      # Layout components (sidebar, header)
│   ├── materials/   # Material-related components
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and Supabase client
├── pages/           # Page components
│   └── admin/       # Admin panel pages
├── services/         # State management and API calls
└── App.tsx          # Main app component
```

## Deployment

This project is configured for Vercel deployment. To deploy:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## License

MIT
