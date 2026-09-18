# WhatsApp Connection Status Indicator

## What I Added

### 1. Backend API Endpoint
**File:** `apps/api/src/modules/settings/settings.controller.ts`

Added new endpoint: `GET /api/v1/settings/whatsapp/status`

Returns:
```json
{
  "connected": true,
  "phoneNumberId": "1162237840315924",
  "configured": true
}
```

- `connected`: Whether WhatsApp credentials are configured
- `phoneNumberId`: The Phone Number ID (if configured)
- `configured`: Same as connected (for compatibility)

### 2. Frontend Query Hook
**File:** `apps/web/src/queries/settings.queries.ts`

Added `useWhatsappStatus()` hook:
- Fetches WhatsApp connection status
- Auto-refreshes every 60 seconds
- Invalidates cache when settings are saved

### 3. Visual Status Indicator in Inbox
**File:** `apps/web/src/app/(dashboard)/inbox/page.tsx`

Added two status banners at the top of conversation list:

#### ❌ Not Connected (Amber/Yellow Banner)
Shows when WhatsApp is **not configured**:
- Warning icon
- "WhatsApp Not Connected" message
- Link to Settings page
- Clear call-to-action

#### ✅ Connected (Green Banner)
Shows when WhatsApp **is configured**:
- WiFi icon (connected)
- "WhatsApp Connected" message
- Shows Phone Number ID
- Green color indicates success

## How It Looks

### When NOT Connected:
```
┌─────────────────────────────────────┐
│ ⚠️ WhatsApp Not Connected           │
│ Configure WhatsApp in settings to   │
│ start receiving messages.           │
│ Go to Settings →                    │
└─────────────────────────────────────┘
```

### When Connected:
```
┌─────────────────────────────────────┐
│ 📶 WhatsApp Connected               │
│ ID: 1162237840315924                │
└─────────────────────────────────────┘
```

## Behavior

1. **On Page Load:**
   - Fetches status immediately
   - Shows appropriate banner

2. **Auto-Refresh:**
   - Checks status every 60 seconds
   - Updates banner automatically

3. **When Settings Change:**
   - Status updates immediately after saving WhatsApp settings
   - No page refresh needed

4. **Click "Go to Settings":**
   - Takes user directly to WhatsApp settings page
   - User can configure credentials

## Testing

1. **Before Configuring WhatsApp:**
   - Open Inbox page
   - Should see amber "Not Connected" banner
   - Click "Go to Settings →"
   - Should navigate to `/settings/whatsapp`

2. **After Saving WhatsApp Settings:**
   - Save Phone Number ID and Access Token
   - Return to Inbox
   - Should see green "Connected" banner
   - Banner shows your Phone Number ID

3. **After Clearing Credentials:**
   - Remove WhatsApp credentials from settings
   - Return to Inbox
   - Should see amber "Not Connected" banner again

## Benefits

✅ **Immediate Visibility:** Users know at a glance if WhatsApp is configured  
✅ **Clear Action:** Direct link to fix the issue  
✅ **Real-time Updates:** Auto-refreshes to stay current  
✅ **Better UX:** No confusion about why inbox is empty  
✅ **Contextual Help:** Appears right where users expect to see messages  

## Files Modified

1. `apps/api/src/modules/settings/settings.controller.ts` - Added status endpoint
2. `apps/web/src/queries/settings.queries.ts` - Added useWhatsappStatus hook
3. `apps/web/src/app/(dashboard)/inbox/page.tsx` - Added status banner UI

## Next Steps

Now when you:
1. Open the Inbox page
2. You'll see a clear indicator showing whether WhatsApp is connected
3. If not connected, you can click directly to settings
4. After configuring, the status updates automatically

The enhanced logging I added earlier will help you debug **why** messages aren't arriving, and this status indicator shows **whether** WhatsApp is configured at all.
