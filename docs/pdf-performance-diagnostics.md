# PDF Performance Diagnostics Guide

## Overview
This document helps diagnose variable PDF rendering times in the cover letter generator.

## Performance Monitoring Added

The codebase now includes comprehensive performance tracking at every stage:

### 1. Frontend Layer (`CoverLetterGenerationMerged.tsx`)
- **Preparation time**: Content assembly and validation
- **PDF generation time**: Call to PDF service
- **Download time**: Browser download trigger
- **Total export time**: End-to-end measurement

### 2. Service Layer (`export.ts`)
- **Message passing time**: Communication with background script
- **Retry attempts**: Logging of each attempt and failures
- **Request validation**: Pre-flight checks

### 3. Background Script (`background.ts`)
- **Fetch duration**: Network request to PDF API (most critical)
- **Blob conversion**: Response to blob conversion time
- **Base64 encoding**: Blob to base64 string conversion
- **Payload size**: Request and response sizes
- **Full timing breakdown**: Percentage breakdown of each phase

## How to Diagnose Performance Issues

### Step 1: Open Browser Developer Tools
1. Right-click the extension icon → Inspect
2. Go to the **Console** tab
3. Keep this open while exporting PDFs

### Step 2: Export a Cover Letter
Click "Export to PDF" and observe the console logs

### Step 3: Analyze the Logs

Look for these key log entries with emojis for easy identification:

#### Fast Export (< 2 seconds)
```
🚀 Starting PDF export at...
📄 Content sizes: { opening: 450, aboutMe: 380, ... }
📤 Sending message to background script...
📥 Received response from background in XXms
✅ PDF service returned in XXms
💾 Downloading PDF: filename
🎉 TOTAL EXPORT TIME: XXXms
```

#### Slow Export (> 5 seconds)
```
🚀 Starting PDF export at...
[... long delay here ...]
📥 Received response from background in XXXXms  <- HIGH NUMBER
```

### Common Bottlenecks

#### 1. **Network Latency** (Most Common)
- **Symptom**: High `fetchDuration` in background logs
- **Cause**: 
  - Distance to Azure Container Apps (Sweden Central)
  - Network congestion
  - ISP issues
  - DNS resolution delays
- **Solution**: 
  - Check your network connection
  - Try from different network (wifi vs cellular)
  - Consider VPN if consistently slow

#### 2. **API Cold Start**
- **Symptom**: First request takes 5-10s, subsequent requests < 2s
- **Cause**: Azure Container Apps instance is scaling up from zero
- **Pattern**: 
  - Morning: Slow (container was scaled down overnight)
  - After first request: Fast (container is warm)
  - After 30min inactivity: Slow again
- **Solution**: This is expected behavior; retry if slow

#### 3. **Large Content**
- **Symptom**: Consistent slowness regardless of time
- **Cause**: Very long cover letter sections
- **Check**: Look for `Content sizes: total: XXXX` in logs
- **Typical**: 1500-3000 chars is normal
- **Large**: > 5000 chars may cause slower rendering
- **Solution**: Trim unnecessary details

#### 4. **Base64 Conversion Overhead**
- **Symptom**: High `base64Duration` in background logs
- **Cause**: Large PDF files (> 200KB)
- **Less common**: Usually takes < 100ms
- **Solution**: This is CPU-bound; clear browser cache/restart if persists

#### 5. **Message Passing Timeout**
- **Symptom**: "Request timeout: Background script did not respond"
- **Cause**: Background script crashed or message queue blocked
- **Solution**: Reload extension (right-click icon → Reload extension)

## Performance Baselines

### Expected Timings
- **Fast path** (warm API, good network): 800ms - 2s
- **Normal path** (warm API, average network): 2s - 4s
- **Cold start** (API scaling up): 5s - 10s
- **Slow network**: 4s - 8s

### Breakdown Percentages (Normal Case)
- **Network fetch**: 70-85% (API processing + network)
- **Blob conversion**: 5-10%
- **Base64 encoding**: 10-20%
- **Other overhead**: < 5%

## Diagnostic Commands

### Check Network to API
```bash
# Test latency to PDF service
time curl -X HEAD https://cvcl-render.jollydesert-dd44d466.swedencentral.azurecontainerapps.io/render

# Full test with dummy data
time curl -X POST \
  https://cvcl-render.jollydesert-dd44d466.swedencentral.azurecontainerapps.io/render \
  -H 'Content-Type: application/json' \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "position": "Software Engineer",
    "addressee": "Hiring Manager",
    "opening": "Test opening",
    "about_me": "Test about me",
    "why_me": "Test why me",
    "why_company": "Test why company"
  }' \
  --output test.pdf
```

### Expected Results
- **HEAD request**: < 500ms (just to check connectivity)
- **POST request**: 1-3s on warm API, 5-10s on cold start

## What the Logs Tell You

### Example Log Analysis

#### Case 1: Network is the bottleneck
```
⏱️ TOTAL TIME: 3245.67ms
📊 Performance breakdown:
  fetch: 2800.45ms (86.3%)      <- MOST TIME HERE
  blob: 145.12ms (4.5%)
  base64: 300.10ms (9.2%)
```
**Diagnosis**: Network/API processing is slow (86%)
**Action**: Check network connection or wait for API warmup

#### Case 2: Everything is fast
```
⏱️ TOTAL TIME: 1123.45ms
📊 Performance breakdown:
  fetch: 850.23ms (75.7%)
  blob: 123.45ms (11.0%)
  base64: 149.77ms (13.3%)
```
**Diagnosis**: Normal performance, all phases balanced
**Action**: None, system working optimally

#### Case 3: Base64 conversion is slow
```
⏱️ TOTAL TIME: 2845.67ms
📊 Performance breakdown:
  fetch: 1200.34ms (42.2%)
  blob: 145.23ms (5.1%)
  base64: 1500.10ms (52.7%)     <- SUSPICIOUS
```
**Diagnosis**: CPU-bound operation taking too long
**Action**: Check browser performance, close other tabs, restart browser

## Troubleshooting Steps

### If Consistently Slow (> 5s every time)
1. **Check logs for pattern**: Is it always `fetchDuration` that's high?
2. **Test network**: Run the curl command above
3. **Check geographic location**: Are you far from Sweden Central?
4. **Try different time**: API might be under load

### If Intermittently Slow
1. **First request slow, then fast**: Cold start issue (expected)
2. **Random slowness**: Network congestion (check ISP)
3. **Slow after browser restart**: Extension initialization delay

### If Never Works
1. **Check console for errors**: Red error messages indicate hard failures
2. **Check manifest permissions**: Ensure extension has network permissions
3. **Check CORS**: Background script should handle this, but verify in Network tab
4. **Reload extension**: Right-click icon → Reload extension

## Optimization Opportunities

### Short-term (Already Implemented)
- ✅ Retry logic with exponential backoff
- ✅ Comprehensive performance logging
- ✅ Timeout handling (30s)

### Medium-term (Future Improvements)
- 🔲 Add loading indicator with estimated time
- 🔲 Cache API health status to predict cold starts
- 🔲 Add "Test PDF Service" button in settings
- 🔲 Progressive loading: "Generating... (2s)" "Downloading... (3s)"

### Long-term (Architecture Changes)
- 🔲 Use CDN/edge functions closer to users
- 🔲 Client-side PDF generation (eliminate API call)
- 🔲 Compression for large payloads
- 🔲 WebSocket for real-time progress updates

## Key Metrics to Watch

When you export a PDF, look for these in the console:

1. **📊 Performance breakdown** - Shows where time is spent
2. **⏱️ TOTAL TIME** - Overall duration
3. **📦 PDF size** - Response payload size
4. **🚀/✅/❌ Status emojis** - Quick visual status indicators

## Questions to Ask

When reporting a slow export:
1. What was the total time? (look for "TOTAL TIME")
2. What was the fetch duration? (look for "fetchDuration")
3. Is this the first export after opening the extension? (cold start)
4. What's your location? (distance from Sweden Central)
5. Is your network connection stable?
6. Does it happen consistently or randomly?

## Summary

**The main cause of variable performance is network latency and API cold starts.** The comprehensive logging added will help identify exactly where the bottleneck is in each export operation.

Use the emojis in the logs to quickly scan for issues:
- 🚀 = Starting operation
- ⏱️ = Timing measurement
- ✅ = Success
- ❌ = Error
- 📊 = Performance data
- 📦 = Size data
- 💾 = Download action
