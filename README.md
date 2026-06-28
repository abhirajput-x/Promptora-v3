# Promptora V2 🚀

AI-Powered Prompt Discovery & Generation Platform

## Tech Stack
- **React 18** - Frontend
- **Supabase** - Auth, Database, Storage
- **Gemini AI** - Image to Prompt
- **Netlify** - Deployment

---

## Setup Guide

### Step 1: Supabase Setup
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → paste `supabase_schema.sql` → Run
3. Go to **Authentication → Providers** → Enable Google (add OAuth credentials)
4. Copy your **Project URL** and **Anon Key** from Settings → API

### Step 2: Gemini API Key
1. Go to [ai.google.dev](https://ai.google.dev) → Get API Key
2. Create a new API key

### Step 3: Environment Variables
Create a `.env` file (copy from `.env.example`):
```
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GEMINI_API_KEY=your-gemini-key
```

### Step 4: Run Locally
```bash
npm install
npm start
```
App runs at `http://localhost:3000`

### Step 5: Deploy to Netlify
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) → New Site from Git
3. Select your repo
4. Build command: `npm run build`
5. Publish directory: `build`
6. Add environment variables in **Site Settings → Environment Variables**
7. Deploy!

---

## Features
- 🖼️ **Image to Prompt** - Upload any image, get AI prompt (Gemini)
- 🔍 **Search** - Instant search across all prompts
- ❤️ **Likes & Saves** - Interact with prompts
- 👤 **Auth** - Google + Email login via Supabase
- 📱 **Mobile First** - Pinterest-style responsive grid
- 🌙 **Dark Theme** - Cyan accent on pure black

## Folder Structure
```
src/
  components/    # Navbar, PromptCard, PromptDetail, SearchBar
  pages/         # Home, Explore, Library, Tools, Login, Profile, Creators
  hooks/         # useAuth
  lib/           # supabase.js
```
