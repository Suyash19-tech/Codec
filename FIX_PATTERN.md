# API Client Migration Pattern

## Step 1: Add Import
```javascript
import apiClient from '../api/axios'
```

## Step 2: Replace fetch() patterns

### Pattern 1: GET Request
**Before:**
```javascript
const token = localStorage.getItem('codec_token')
const res = await fetch('/api/notifications', {
  headers: { Authorization: 'Bearer ' + token }
})
const data = await res.json()
```

**After:**
```javascript
const { data } = await apiClient.get('/api/notifications')
```

### Pattern 2: POST Request
**Before:**
```javascript
const token = localStorage.getItem('codec_token')
const res = await fetch('/api/documents/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  },
  body: JSON.stringify({ title, description })
})
const data = await res.json()
```

**After:**
```javascript
const { data } = await apiClient.post('/api/documents/upload', {
  title,
  description
})
```

### Pattern 3: DELETE Request
**Before:**
```javascript
const token = localStorage.getItem('codec_token')
const res = await fetch(`/api/documents/${id}`, {
  method: 'DELETE',
  headers: { Authorization: 'Bearer ' + token }
})
```

**After:**
```javascript
await apiClient.delete(`/api/documents/${id}`)
```

### Pattern 4: PATCH/PUT Request
**Before:**
```javascript
const token = localStorage.getItem('codec_token')
const res = await fetch(`/api/documents/${id}/privacy`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  },
  body: JSON.stringify({ privacy: 'public' })
})
```

**After:**
```javascript
await apiClient.patch(`/api/documents/${id}/privacy`, { privacy: 'public' })
```

### Pattern 5: Error Handling
**Before:**
```javascript
if (!res.ok) {
  const data = await res.json()
  throw new Error(data.message || 'Failed')
}
```

**After:**
```javascript
try {
  const { data } = await apiClient.post('/api/endpoint')
} catch (err) {
  const errorMsg = err.response?.data?.message || err.message || 'Failed'
  alert(errorMsg)
}
```

## Benefits:
1. No manual token management
2. Automatic baseURL handling (works in dev and production)
3. Automatic 401 handling and redirect
4. Cleaner, more maintainable code
5. Consistent error handling
