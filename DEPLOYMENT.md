# 🚀 Deployment Guide — Railway (Backend) + Vercel (Frontend)

---

## STEP 1 — Push to GitHub first

```bash
# Inside your weather-dashboard folder
git init
git add .
git commit -m "initial commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/weather-dashboard.git
git push -u origin main
```

---

## STEP 2 — Deploy Backend on Railway

1. Go to https://railway.app and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your **weather-dashboard** repo
4. Railway will ask which folder — select **`backend`**
5. Wait for first deploy (it will FAIL — that's fine, we need to add env vars first)

### Add Environment Variables in Railway:

Click your service → **Variables** tab → Add these one by one:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Any long random string e.g. `skydash_super_secret_key_2024_xyz` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | (leave blank for now — fill in after Vercel deploy) |
| `OPENAI_API_KEY` | Your OpenAI key (optional) |

6. After adding variables, click **"Deploy"** again
7. Wait ~1 minute — you'll get a URL like:
   ```
   https://weather-dashboard-backend-production.up.railway.app
   ```
8. Test it: open `https://YOUR-RAILWAY-URL/api/health` in browser
   - You should see: `{"status":"ok","timestamp":"..."}`
   - ✅ Backend is live!

---

## STEP 3 — Deploy Frontend on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **"Add New Project"**
3. Import your **weather-dashboard** repo
4. Vercel will ask for settings — set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Under **Environment Variables**, add:
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | Your Railway URL e.g. `https://weather-dashboard-backend-production.up.railway.app` |

   ⚠️ NO trailing slash at the end of the URL

6. Click **"Deploy"**
7. Wait ~2 minutes — you'll get a URL like:
   ```
   https://weather-dashboard-abc123.vercel.app
   ```
8. ✅ Frontend is live!

---

## STEP 4 — Connect them together

Go back to **Railway** → your backend service → **Variables** tab

Update (or add) this variable:
```
FRONTEND_URL = https://weather-dashboard-abc123.vercel.app
```

Click **Redeploy** in Railway.

---

## STEP 5 — Test everything

1. Open your Vercel URL
2. Register a new account
3. Add a city — weather should load
4. Try the AI chat
5. Open `https://YOUR-RAILWAY-URL/api/health` — should return OK

---

## ❗ Common Problems & Fixes

### "Failed to fetch" or CORS error
→ In Railway Variables, make sure `FRONTEND_URL` exactly matches your Vercel URL (no trailing slash)
→ Redeploy Railway after changing it

### Login works but dashboard shows blank
→ Check that `NEXT_PUBLIC_API_URL` in Vercel points to your Railway URL
→ In Vercel: Settings → Environment Variables → redeploy

### MongoDB connection error on Railway
→ In MongoDB Atlas: go to **Network Access** → click **"Add IP Address"** → click **"Allow Access from Anywhere"** (0.0.0.0/0)
→ This is required for Railway's dynamic IPs

### Railway deploy fails with "no start command"
→ Make sure `railway.json` is in the `backend` folder
→ Or in Railway settings, manually set Start Command to: `node src/index.js`

---

## Your Final URLs

After deployment, you'll have:

| | URL |
|---|---|
| 🌐 **Live App** | `https://your-app.vercel.app` |
| 🔧 **API** | `https://your-app.up.railway.app` |
| ❤️ **Health Check** | `https://your-app.up.railway.app/api/health` |
