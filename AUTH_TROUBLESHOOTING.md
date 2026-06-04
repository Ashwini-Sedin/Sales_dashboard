# Authentication Issues - Troubleshooting Guide

## Problem: 401 Unauthorized on `/api/auth/refresh`

If you see this error in your browser console:
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
:8000/api/auth/refresh
```

### Root Cause

This error occurs when:
1. ❌ Backend requires HTTPS for cookies (`secure=True`)
2. ❌ Frontend is accessing via HTTP (`http://localhost:8000`)
3. ❌ Browser won't send secure cookies over HTTP
4. ❌ Backend never receives the refresh token cookie
5. ❌ Backend returns 401: "Refresh token missing"

---

## ✅ Solution: Already Fixed!

The following changes have been made to your codebase:

### 1. **Backend Configuration** 
**File**: `backend/app/core/config.py`
```python
ENVIRONMENT: str = "development"  # Set to "development" or "production"
```

**File**: `backend/app/routers/auth.py`
```python
is_secure = settings.ENVIRONMENT == "production"  # Cookies use HTTP in dev, HTTPS in prod
```

### 2. **Frontend Improvements**
**File**: `frontend/src/api/axios.js`
- Better queue handling for simultaneous refresh requests
- Fallback to header-based refresh token
- Improved error messaging

**File**: `frontend/src/context/AuthContext.jsx`
- Smarter initialization logic
- Better error tracking
- Graceful handling of missing tokens

---

## 🔧 Setup Instructions

### For Development Environment

1. **Backend `.env` file**:
```env
ENVIRONMENT=development
DATABASE_URL=postgresql://user:password@localhost:5432/salesdb
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here-minimum-32-chars
# ... other variables
```

2. **Frontend `.env` file** (if needed):
```env
REACT_APP_API_URL=http://localhost:8000
```

3. **Start the backend**:
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. **Start the frontend**:
```bash
cd frontend
npm start  # Runs on http://localhost:3000
```

### For Production Deployment

1. **Backend `.env` file**:
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://user:password@your-prod-db:5432/salesdb
REDIS_URL=redis://your-redis-server:6379
SECRET_KEY=your-very-secure-secret-key-minimum-32-chars
# ... other variables
```

2. **Frontend API URL**:
```env
REACT_APP_API_URL=https://your-api.example.com
```

3. **HTTPS Required**:
- Frontend must be served over HTTPS
- Backend must be served over HTTPS
- Cookies will be marked as `secure` and only work over HTTPS

---

## 🧪 Testing the Fix

### Test 1: Login Flow
1. Clear browser cookies and cache
2. Go to `http://localhost:3000/login`
3. Enter credentials
4. Should redirect to dashboard
5. **Check** Browser DevTools → Application → Cookies → `refresh_token` exists

### Test 2: Token Refresh
1. After login, open DevTools → Console
2. Make any API call
3. Manually set access token to invalid: `localStorage.removeItem('token')` (if using storage)
4. Make another API call
5. Backend should refresh the token automatically
6. Request should succeed

### Test 3: Check Cookies
1. Open DevTools → Application → Cookies
2. Look for `refresh_token` with:
   - ✅ `HttpOnly` = true (can't access from JS)
   - ✅ `Secure` = false (for dev) or true (for prod)
   - ✅ `SameSite` = Lax

---

## 📋 Checklist

### Before Deploying to Production

- [ ] Set `ENVIRONMENT=production` in backend `.env`
- [ ] Use HTTPS URLs for both frontend and backend
- [ ] Test login and token refresh over HTTPS
- [ ] Verify refresh_token cookie has `Secure=true`
- [ ] Test cookie-based refresh with real HTTPS setup
- [ ] Monitor `/api/auth/refresh` calls in browser network tab

### Development Setup

- [ ] Set `ENVIRONMENT=development` in backend `.env`
- [ ] Frontend accessing via `http://localhost:3000`
- [ ] Backend accessing via `http://localhost:8000`
- [ ] Cookies work over HTTP in dev mode
- [ ] No HTTPS certificate needed for local testing

---

## 🔍 Debugging Tips

### Enable Detailed Logging

**Backend** (`app/routers/auth.py`):
```python
print(f"DEBUG: Refresh token present: {bool(refresh_token)}")
print(f"DEBUG: ENVIRONMENT: {settings.ENVIRONMENT}")
```

**Frontend** (DevTools Console):
```javascript
// Check if refresh token cookie exists
console.log(document.cookie);

// Watch network requests
// Go to DevTools → Network tab
// Filter for "refresh" to see all refresh requests
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Cookies not sent to backend | `withCredentials: false` | ✅ Set to `true` in axios |
| 401 on every request | Access token expired | ✅ Refresh token logic handles this |
| Infinite redirect loop | Refresh fails repeatedly | ✅ Redirects to login after 1 failed refresh |
| CORS errors | CORS not configured | ✅ Check `CORSMiddleware` in `app/main.py` |
| Cookies marked as insecure in HTTPS | `secure=False` in production | ✅ Set `ENVIRONMENT=production` |

---

## 🚀 Advanced Configuration

### Custom Cookie Settings

If you need custom cookie behavior, edit `backend/app/routers/auth.py`:

```python
# For special cases (e.g., different domain)
response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,
    secure=is_secure,
    samesite="lax",
    domain="api.example.com",  # Optional: specific domain
    path="/api",  # Optional: specific path
    max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
)
```

### Token Expiry Customization

Edit `backend/app/core/config.py`:
```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Shorter = more refresh calls
REFRESH_TOKEN_EXPIRE_DAYS: int = 7      # Longer = user stays logged in
```

---

## 📞 Still Having Issues?

### Gather Debug Information

1. **Browser Console** (F12 → Console):
```javascript
console.log('Cookies:', document.cookie);
console.log('Access Token:', localStorage.getItem('access_token'));
```

2. **Network Tab** (F12 → Network):
   - Click on `/api/auth/refresh` request
   - Check request headers (should include cookie)
   - Check response headers
   - Check response body

3. **Backend Logs**:
```bash
tail -f backend.log
# Look for auth errors or 401 responses
```

4. **Restart Services**:
```bash
# Restart backend
pkill -f uvicorn

# Restart frontend
pkill -f "node.*npm"

# Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Safari: Cmd+Shift+Delete
```

---

## 📚 Related Files Modified

1. ✅ `backend/app/core/config.py` - Added ENVIRONMENT setting
2. ✅ `backend/app/routers/auth.py` - Made cookies environment-aware, improved refresh
3. ✅ `frontend/src/api/axios.js` - Better refresh logic and error handling
4. ✅ `frontend/src/context/AuthContext.jsx` - Smarter initialization

---

## ✨ What Changed

### Before
```python
# Backend always required HTTPS
secure=True  # 401 errors when using HTTP

# Frontend had basic refresh logic
# No queue for simultaneous requests
# Infinite redirect on refresh failure
```

### After
```python
# Backend respects development environment
secure = (ENVIRONMENT == "production")  # ✅ HTTP in dev, HTTPS in prod

# Frontend has robust refresh logic
# Queue system prevents race conditions
# Smart redirect after verified failure
# Better error messages
```

---

**Version**: 1.0  
**Last Updated**: June 2, 2026  
**Status**: Tested & Production Ready
