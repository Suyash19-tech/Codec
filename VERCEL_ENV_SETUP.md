# Vercel Environment Variable Setup

## Critical Issue:
Axios is trying to make requests to the Vercel domain instead of the Render backend because `VITE_API_URL` is not set in Vercel.

## Solution:

### 1. Set Environment Variable in Vercel Dashboard

Go to your Vercel project:
1. Open https://vercel.com/dashboard
2. Select your project (codec)
3. Go to **Settings** → **Environment Variables**
4. Add the following:

```
Name: VITE_API_URL
Value: https://codec-a4aw.onrender.com
Environment: Production, Preview, Development (select all)
```

5. Click **Save**
6. **Redeploy** your application

### 2. Verify Environment Variable

After redeploying, you can verify by:

**Option A: Check Browser Console**
- Open your Vercel app
- Open browser console (F12)
- Look for: `🔗 API Base URL: https://codec-a4aw.onrender.com`

**Option B: Enable Debug Info**
- Open browser console
- Type: `localStorage.setItem('show_debug', 'true')`
- Refresh page
- You'll see a debug panel in bottom-right corner showing the API URL

**Option C: Check Network Tab**
- Open browser DevTools → Network tab
- Try to login
- Look at the request URL
- Should be: `https://codec-a4aw.onrender.com/api/auth/login`
- NOT: `https://codec-azure.vercel.app/api/auth/login`

---

## Why This Happens:

### Local Development:
- `.env` file is read by Vite
- `VITE_API_URL` is available
- Works fine

### Vercel Production:
- `.env` file is NOT deployed (in .gitignore)
- Environment variables must be set in Vercel dashboard
- Without it, `import.meta.env.VITE_API_URL` is `undefined`
- Falls back to `http://localhost:5001` (which doesn't work in production)

---

## Updated Axios Config:

```javascript
// client/src/api/axios.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Log in development
if (import.meta.env.DEV) {
    console.log('🔗 API Base URL:', API_URL);
}

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor with logging
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('codec_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
});

// Response interceptor with logging
apiClient.interceptors.response.use(
    (response) => {
        if (import.meta.env.DEV) {
            console.log(`📥 ${response.status} ${response.config.url}`);
        }
        return response;
    },
    (error) => {
        if (import.meta.env.DEV) {
            console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`);
        }
        
        if (error.response?.status === 401) {
            localStorage.clear();
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
```

---

## Example Component Usage:

All components are already using the correct pattern:

```javascript
// ✅ CORRECT - Uses apiClient with /api prefix
import apiClient from '../api/axios';

const { data } = await apiClient.post('/api/auth/login', { email, password });
const { data } = await apiClient.get('/api/notifications');
const { data } = await apiClient.delete(`/api/documents/${id}`);
```

The baseURL (`https://codec-a4aw.onrender.com`) + path (`/api/auth/login`) = Full URL

---

## Debugging Steps:

### If requests still go to Vercel:

1. **Check Vercel Environment Variables**
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Verify `VITE_API_URL` is set
   - Make sure it's enabled for Production

2. **Redeploy**
   - After adding env var, you MUST redeploy
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

3. **Check Browser Console**
   - Should see: `🔗 API Base URL: https://codec-a4aw.onrender.com`
   - If you see `http://localhost:5001`, env var is not set

4. **Check Network Tab**
   - All API requests should go to `codec-a4aw.onrender.com`
   - NOT to `codec-azure.vercel.app`

5. **Enable Debug Panel**
   ```javascript
   localStorage.setItem('show_debug', 'true')
   ```
   - Refresh page
   - Check bottom-right corner
   - Should show correct API URL

---

## Common Mistakes:

### ❌ Wrong: Missing VITE_ prefix
```
API_URL=https://codec-a4aw.onrender.com  // Won't work!
```

### ✅ Correct: With VITE_ prefix
```
VITE_API_URL=https://codec-a4aw.onrender.com  // Works!
```

### ❌ Wrong: Not redeploying after adding env var
- Adding env var doesn't automatically redeploy
- You must manually redeploy

### ❌ Wrong: Only setting for Production
- Set for all environments (Production, Preview, Development)

---

## Testing Checklist:

After setting up:

- [ ] Environment variable added in Vercel
- [ ] Redeployed application
- [ ] Browser console shows correct API URL
- [ ] Network tab shows requests to Render
- [ ] Login works
- [ ] No CORS errors
- [ ] Data loads (notifications, documents, etc.)

---

## Summary:

The issue is NOT with the code - it's with Vercel configuration.

**Action Required**:
1. Go to Vercel dashboard
2. Add `VITE_API_URL=https://codec-a4aw.onrender.com`
3. Redeploy
4. Test

That's it! The axios config is already correct.
