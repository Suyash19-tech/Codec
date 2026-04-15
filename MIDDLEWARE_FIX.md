# Middleware Export/Import Fix ✅

## Problem:
```
TypeError: argument handler must be a function
at routes/authRoutes.js:18
```

## Root Cause:
The `authMiddleware.js` was exporting as a **default export**, but `authRoutes.js` was trying to import it as a **named export** `{ protect }`.

### Before (Broken):
```javascript
// server/middleware/authMiddleware.js
module.exports = (req, res, next) => { ... };

// server/routes/authRoutes.js
const { protect } = require('../middleware/authMiddleware'); // ❌ undefined!
```

## Solution:
Changed to **named export** and updated all route files.

### After (Fixed):
```javascript
// server/middleware/authMiddleware.js
const protect = (req, res, next) => { ... };
module.exports = { protect }; // ✅ Named export

// server/routes/authRoutes.js
const { protect } = require('../middleware/authMiddleware'); // ✅ Works!
```

---

## Files Updated:

### 1. Middleware File ✅
**File**: `server/middleware/authMiddleware.js`

**Changes**:
- Converted to named export: `module.exports = { protect }`
- Added more user data to `req.user`: `{ id, email, role }`
- Named the function `protect` for clarity

```javascript
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = { protect };
```

---

### 2. Route Files Updated ✅

All route files updated to use `{ protect }` import:

#### authRoutes.js ✅
```javascript
const { protect } = require('../middleware/authMiddleware');
router.get('/me', protect, getCurrentUser);
```

#### documentRoutes.js ✅
```javascript
const { protect } = require('../middleware/authMiddleware');
router.get('/search', protect, searchDocuments);
router.get('/shared', protect, getSharedDocuments);
// ... all other routes
```

#### notificationRoutes.js ✅
```javascript
const { protect } = require('../middleware/authMiddleware');
router.get('/', protect, getMyNotifications);
router.patch('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);
```

#### messageRoutes.js ✅
```javascript
const { protect } = require('../middleware/authMiddleware');
router.post('/:docId', protect, sendPrivateMessage);
router.get('/:docId/:peerId', protect, getPrivateMessages);
```

#### userRoutes.js ✅
```javascript
const { protect } = require('../middleware/authMiddleware');
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
```

#### folderRoutes.js ✅
```javascript
const { protect } = require('../middleware/authMiddleware');
router.use(protect); // Applied to all routes
```

#### groupRoutes.js ✅
```javascript
const { protect } = require('../middleware/authMiddleware');
router.post('/', protect, createGroup);
router.get('/', protect, getMyGroups);
// ... all other routes
```

---

### 3. Admin Middleware (No Change Needed) ✅
**File**: `server/middleware/adminMiddleware.js`

This file already uses default export correctly and doesn't need changes:
```javascript
module.exports = adminMiddleware; // ✅ Correct
```

**File**: `server/routes/adminRoutes.js`
```javascript
const adminMiddleware = require('../middleware/adminMiddleware'); // ✅ Correct
```

---

## Summary of Changes:

### Files Modified:
1. ✅ `server/middleware/authMiddleware.js` - Changed to named export
2. ✅ `server/routes/authRoutes.js` - Updated import
3. ✅ `server/routes/documentRoutes.js` - Updated import
4. ✅ `server/routes/notificationRoutes.js` - Updated import
5. ✅ `server/routes/messageRoutes.js` - Updated import
6. ✅ `server/routes/userRoutes.js` - Updated import
7. ✅ `server/routes/folderRoutes.js` - Updated import
8. ✅ `server/routes/groupRoutes.js` - Updated import

### Total Routes Fixed: 8 files

---

## Testing:

### Local Test:
```bash
cd server
npm start
```

**Expected Output**:
```
🚀 Server is running on port 5001
🌍 Environment: development
📁 Server Root: /path/to/server
✅ File Uploads: /path/to/server/uploads
🔐 CORS Origins: https://codec-azure.vercel.app, http://localhost:5173
💾 MongoDB: Connected
```

**No Errors**: Server should start without any "TypeError: argument handler must be a function"

### Render Test:
1. Wait for Render to deploy (~2 minutes)
2. Check Render logs for startup messages
3. Test health endpoint: `curl https://your-app.onrender.com/health`
4. Test auth endpoint: `curl https://your-app.onrender.com/api/auth/me` (should return 401)

---

## Why This Happened:

When we added the `/api/auth/me` endpoint, we imported the middleware as:
```javascript
const { protect } = require('../middleware/authMiddleware');
```

But the middleware was exported as:
```javascript
module.exports = (req, res, next) => { ... };
```

This made `protect` undefined, causing the error:
```
TypeError: argument handler must be a function
```

---

## Prevention:

To avoid this in the future:
1. Always use named exports for middleware: `module.exports = { middlewareName }`
2. Or always use default exports: `module.exports = middleware`
3. Be consistent across all files
4. Test locally before pushing to production

---

## Status:

✅ All middleware exports/imports fixed
✅ All route files updated
✅ Server should start without errors
✅ Render deployment should succeed

**Next**: Wait for Render to deploy and test the endpoints!
