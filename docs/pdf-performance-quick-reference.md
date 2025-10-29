# PDF Performance Quick Reference

## 🎯 Quick Diagnosis

### Open Console
Right-click extension → Inspect → Console tab

### Export PDF and Look For:

| Log Entry | What It Means |
|-----------|---------------|
| 🚀 Starting PDF export | Export initiated |
| ⏱️ TOTAL TIME: **XXXms** | **THIS IS YOUR ANSWER** |
| fetch: **XXms (XX%)** | Network + API time |
| blob: XXms | Response processing |
| base64: XXms | Encoding time |

## 🔍 Performance Patterns

### Pattern 1: Fast ✅
```
⏱️ TOTAL TIME: 1200ms
fetch: 900ms (75%)
```
**Result**: Normal, working as expected

### Pattern 2: Cold Start 🥶
```
⏱️ TOTAL TIME: 8500ms
fetch: 8200ms (96%)
```
**Cause**: API container scaling up
**Action**: Wait, next request will be fast

### Pattern 3: Slow Network 🐌
```
⏱️ TOTAL TIME: 5000ms
fetch: 4800ms (96%)
```
**Cause**: Poor connection
**Action**: Check your internet

### Pattern 4: Encoding Problem 🔧
```
⏱️ TOTAL TIME: 3000ms
base64: 2500ms (83%)
```
**Cause**: Browser CPU overload
**Action**: Close tabs, restart browser

## 🏃 Expected Times

| Scenario | Time | Action |
|----------|------|--------|
| Fast path | 0.8-2s | None needed ✅ |
| Normal | 2-4s | None needed ✅ |
| Cold start | 5-10s | Retry for fast result |
| Slow | > 10s | Check network/retry |

## 🚨 Common Issues

### "Request timeout"
- Background script crashed
- **Fix**: Reload extension

### Always > 5s
- Network latency or API location
- **Fix**: Check network, try different time

### First slow, then fast
- Cold start (normal behavior)
- **Fix**: None needed

## 📊 Key Metric

**Look for "fetch" percentage:**
- 70-85% = Normal (network/API is bottleneck)
- > 90% = Network issue or cold start
- < 50% = Browser/encoding issue

## 🛠️ Test Your Connection

```bash
time curl -X HEAD https://cvcl-render.jollydesert-dd44d466.swedencentral.azurecontainerapps.io/render
```

- < 500ms = Good
- 500ms-1s = OK
- > 1s = Slow network

---

**See full guide**: `docs/pdf-performance-diagnostics.md`
