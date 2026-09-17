/* ==========================================================================
   CULTURA FIESTA 1.0 — Supabase Configuration File
   MPSC Cultural Club
   ==========================================================================
   INSTRUCTIONS:
   1. Fill in your Supabase Project URL and Anon Key below.
   2. Upload this file to your hosting server alongside index.html.
   3. This file is loaded automatically — no admin panel entry needed.
   4. NEVER commit this file to GitHub (it is in .gitignore).

   To get your keys:
     → Login at https://supabase.com
     → Go to your Project → Settings → API
     → Copy "Project URL" and "anon public" key
   ========================================================================== */

window.CULTURA_CONFIG = {
  supabaseUrl: 'https://imdxvceivzpkqgkatpbq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZHh2Y2Vpdnpwa3Fna2F0cGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MzE0MzcsImV4cCI6MjEwNDAwNzQzN30.KD3C14NxyChfFoeIlt0WQctkTeYKhX9WhtCJcAbu1wA',
  bkashNumber: '+8801339490923',

  // --------------------------------------------------------------------------
  // CLUB MODERATORS & CO-MODERATORS CONFIGURATION
  // Edit names, roles, wings (BVB / EVB / BVG / EVG), and photo paths below!
  // --------------------------------------------------------------------------
  moderators: [
    {
      name: 'Rahana Husne Akhter',
      role: 'Club Moderator',
      wing: 'BVB',
      image: 'moderators/1.jpg',
      isChief: true
    },
    {
      name: 'Md. Naimur Rahman',
      role: 'Club Co-Moderator',
      wing: 'EVB',
      image: 'moderators/2.jpg',
      isChief: false
    },
    {
      name: 'Sanjida Chowdhury Rupa',
      role: 'Club Co-Moderator',
      wing: 'BVG',
      image: 'moderators/3.jpg',
      isChief: false
    },
    {
      name: 'Co-Moderator Name 3',
      role: 'Club Co-Moderator',
      wing: 'EVG',
      image: 'moderators/4.jpg',
      isChief: false
    }
  ]
};
