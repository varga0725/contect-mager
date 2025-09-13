# ContentMagic

AI-powered social media content generation platform built with React, TypeScript, and Express.js.

## Project Structure

```
├── frontend/          # React + TypeScript frontend
├── backend/           # Express.js + TypeScript backend
└── .kiro/specs/       # Project specifications
```

## Getting Started

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
npm install
npm run dev
```

## Features

- AI-powered content generation (captions, images, videos)
- Multi-platform support (Instagram, TikTok, YouTube, LinkedIn, Twitter)
- Content scheduling and calendar
- Analytics and performance tracking
- Subscription management with usage limits
- Mobile-first responsive design

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- Wouter (routing)
- React Hook Form + Zod

### Backend
- Node.js + Express.js + TypeScript
- PostgreSQL + Drizzle ORM
- Passport.js (authentication)
- Google AI APIs (Gemini, Imagen 3, Veo)
- Stripe (payments)