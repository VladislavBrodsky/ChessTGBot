# ✅ Post-Deployment Verification Checklist

Use this checklist after deploying the fixes to production.

---

## 🔍 Immediate Checks (First 5 minutes)

- [ ] **Server Started Successfully**
  - Check logs for: `Uvicorn running on http://0.0.0.0:8080`
  - Check logs for: `Application startup complete`

- [ ] **Database Connected**
  - Check logs for: `Database Schema Sync: Premium columns verified`
  - No database connection errors

- [ ] **Bot Started Without Conflicts**
  - Look for: `Cleared any existing webhooks`
  - Look for: `✅ Telegram Bot Started Successfully with Polling`
  - **NOT seeing**: `⚠️ Bot Conflict` or `telegram.error.Conflict`

---

## 🌐 HTTP Endpoint Tests

Test these in your browser or with curl:

### HEAD Request Tests
```bash
# All should return 200 OK (not 405)
curl -I https://your-domain.railway.app/
curl -I https://your-domain.railway.app/health
curl -I https://your-domain.railway.app/version
curl -I https://your-domain.railway.app/game
curl -I https://your-domain.railway.app/membership
curl -I https://your-domain.railway.app/settings
curl -I https://your-domain.railway.app/academy
```

- [ ] All HEAD requests return **200 OK** (no 405 errors)

### GET Request Tests
```bash
# Should return JSON
curl https://your-domain.railway.app/health
curl https://your-domain.railway.app/version
```

- [ ] `/health` returns: `{"status": "ok", "version": "..."}`
- [ ] `/version` returns: `{"version": "...", "status": "deployed"}`

---

## 🤖 Telegram Bot Tests

- [ ] Send `/start` to your bot → Should receive welcome message
- [ ] Click "Play Chess ♟️" button → Web app opens
- [ ] Bot responds to commands (no timeout errors)
- [ ] No duplicate messages received

---

## 📊 Log Monitoring (30 minutes)

After 30 minutes of operation, check your logs:

### ❌ Should NOT see any of these:
- [ ] No `405 Method Not Allowed` errors
- [ ] No `telegram.error.Conflict` errors
- [ ] No `⚠️ Bot Conflict` warnings
- [ ] No `Exception happened while polling for updates`

### ✅ Should see normal operations:
- [ ] User requests: `GET /api/v1/users/... → 200 OK`
- [ ] WebSocket connections: `connection open`
- [ ] Static file serving: `GET /_next/... → 200 OK`

---

## 🔄 Restart Test

Test that data persists across restarts:

1. **Before Restart**:
   - [ ] Note your current ELO/stats
   - [ ] Note active games

2. **Trigger Restart** (push a dummy commit or restart manually)

3. **After Restart**:
   - [ ] Bot starts cleanly (check for webhook cleanup message)
   - [ ] Your ELO/stats are the same
   - [ ] No conflicts or errors
   - [ ] Can send `/start` successfully

---

## 🎯 Success Criteria

✅ **ALL GOOD** if:
- All HEAD requests return 200 OK
- Bot starts without conflicts
- No 405 errors in logs
- Bot responds to `/start`
- Data persists across restarts
- WebSocket connections work
- User stats are saved and retrieved

❌ **ISSUE** if you see:
- 405 Method Not Allowed errors
- Telegram Conflict errors  
- Bot timeout or no response
- Database connection errors

---

## 📝 Notes

**When to check logs**: 
- Immediately after deployment
- After 30 minutes
- After first user interaction
- After any restart

**Where to find logs**:
- Railway: Project → Deployments → View Logs
- Heroku: `heroku logs --tail`
- Local: Terminal output

**Need help?**
If any checks fail, provide:
1. The specific error message
2. Timestamp of the error
3. What you were doing when it occurred
