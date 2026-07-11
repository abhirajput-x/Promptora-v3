p
# Promptora V2 🚀

AI-Powered Prompt Discovery & Generation Platform

## Tech Stack
- **React 18** - Frontend
- **Supabase** - Auth, Database, Storage
- **Netlify** - Deployment

---

## Setup Guide

### Step 1: Supabase Setup
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → paste `supabase_schema.sql` → Run
3. Then paste `supabase_migration_social.sql` → Run (adds likes/comments/follows/notifications — safe to re-run anytime, including on an existing database)
4. Go to **Authentication → Providers** → Enable Google (add OAuth credentials)
5. Copy your **Project URL** and **Anon Key** from Settings → API

### Step 2: Environment Variables
Create a `.env` file (copy from `.env.example`):
```
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Run Locally
```bash
npm install
npm start
```
App runs at `http://localhost:3000`

### Step 4: Deploy to Netlify
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) → New Site from Git
3. Select your repo
4. Build command: `npm run build`
5. Publish directory: `build`
6. Add environment variables in **Site Settings → Environment Variables**
7. Deploy!

---

## Features
- 🔍 **Search** - Instant search across all prompts
- ❤️ **Likes** - Like/unlike prompts, live counts, duplicate-proof
- 💬 **Comments** - Comment on prompts, edit/delete your own
- 👥 **Follow System** - Follow creators, live follower/following counts
- 🔔 **Notifications** - Get notified on new likes, comments, and followers
- 🔖 **Saves** - Bookmark prompts to your personal Library
- 🔐 **Guest-safe** - Guests can browse/search/read; a sign-in modal gates likes, comments, follows, saves, and publishing
- 👤 **Auth** - Google + Email login via Supabase
- 📱 **Mobile First** - Pinterest-style responsive grid
- 🌙 **Dark Theme** - Cyan accent on pure black

## Folder Structure
```
src/
  components/    # Navbar, PromptCard, PromptDetail, Comments, FollowButton, NotificationBell, AuthModal, SearchBar
  pages/         # Home, Explore, Library, Login, Profile, Creators, CreatorProfile, Notifications
  hooks/         # useAuth
  lib/           # supabase.js
```
