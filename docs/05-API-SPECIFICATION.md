# API Specification
## NexaCRM — AI-Powered WhatsApp CRM SaaS

**Version:** 1.0 | **Date:** August 4, 2026  
**Base URL:** `https://api.nexacrm.io/v1`  
**Protocol:** HTTPS only  
**Format:** JSON (`Content-Type: application/json`)

---

## 1. Global Conventions

### 1.1 Authentication

All endpoints (except auth and webhook) require:

```
Authorization: Bearer <access_token>
X-Workspace-ID: <workspace_uuid>
```

The `access_token` is a short-lived JWT (15 min) obtained from `POST /auth/login`.  
Workspace context is resolved from `X-Workspace-ID` and validated against the user's memberships.

### 1.2 Pagination

All list endpoints support cursor-based pagination:

```json
// Request query params
?limit=25&cursor=<opaque_cursor>

// Response envelope
{
  "data": [...],
  "pagination": {
    "hasNextPage": true,
    "nextCursor": "eyJpZCI6Inh4eHgifQ==",
    "total": 312
  }
}
```

### 1.3 Standard Error Response

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [
    { "field": "phone", "message": "Must be a valid E.164 phone number" }
  ],
  "requestId": "req_01j2k3..."
}
```

| HTTP Status | When Used |
|-------------|-----------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Resource created (POST) |
| 204 | Success, no body (DELETE) |
| 400 | Validation error |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Business rule violation |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### 1.4 Rate Limits

| Scope | Limit |
|-------|-------|
| Global per IP | 100 req / min |
| Auth endpoints | 5 req / 15 min |
| AI endpoints | 30 req / min per workspace |
| Broadcast send | 5 req / min per workspace |
| Webhook receiver | 500 req / min (Meta delivery) |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1722784320
```

---

## 2. Authentication Endpoints

### POST /auth/register
Create a new user account and workspace.

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Chen",
  "email": "sarah@acme.com",
  "password": "Str0ng!Pass#2026",
  "workspaceName": "Acme Corp",
  "timezone": "America/New_York"
}
```

**Response 201:**
```json
{
  "user": {
    "id": "usr_01j2k...",
    "email": "sarah@acme.com",
    "firstName": "Sarah",
    "lastName": "Chen"
  },
  "workspace": {
    "id": "wsp_01j2k...",
    "name": "Acme Corp",
    "slug": "acme-corp"
  },
  "accessToken": "<jwt>",
  "expiresIn": 900
}
```
_Refresh token set as `httpOnly` cookie._

---

### POST /auth/login
```json
// Request
{ "email": "sarah@acme.com", "password": "Str0ng!Pass#2026" }

// Response 200
{
  "accessToken": "<jwt>",
  "expiresIn": 900,
  "user": { "id": "...", "firstName": "Sarah", "email": "sarah@acme.com" },
  "requiresTOTP": false
}
```

---

### POST /auth/login/totp
Submit TOTP code after login when `requiresTOTP: true`.

```json
// Request
{ "tempToken": "<short-lived token from login>", "code": "123456" }

// Response 200 — same as login response
```

---

### POST /auth/refresh
Exchange refresh token (from cookie) for a new access token.

```json
// Response 200
{ "accessToken": "<new_jwt>", "expiresIn": 900 }
```

---

### POST /auth/logout
Revoke current refresh token.

`204 No Content`

---

### POST /auth/forgot-password
```json
{ "email": "sarah@acme.com" }
// Response 200 — always succeeds (security: no email enumeration)
{ "message": "If this email exists, a reset link was sent." }
```

---

### POST /auth/reset-password
```json
{ "token": "<reset_token_from_email>", "password": "NewStr0ng!Pass" }
// Response 200
{ "message": "Password reset successfully." }
```

---

### GET /auth/me
Returns the authenticated user's profile and workspace memberships.

```json
// Response 200
{
  "id": "usr_01j2k...",
  "email": "sarah@acme.com",
  "firstName": "Sarah",
  "lastName": "Chen",
  "avatarUrl": null,
  "totpEnabled": false,
  "workspaces": [
    { "id": "wsp_...", "name": "Acme Corp", "role": "ADMINISTRATOR" }
  ]
}
```

---

### POST /auth/2fa/enable
```json
// Request — empty body, returns TOTP setup info
// Response 200
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/NexaCRM:sarah@acme.com?secret=..."
}
```

### POST /auth/2fa/confirm
```json
{ "code": "654321" }
// Response 200
{ "recoveryCodes": ["abc12-def34", "ghi56-jkl78", ...] }
```

### DELETE /auth/2fa/disable
```json
{ "code": "123456" }
// Response 204
```


---

## 3. Workspace Endpoints

### GET /workspaces/:id
Get workspace details.

**Response 200:**
```json
{
  "id": "wsp_01j2k...",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "logoUrl": "https://...",
  "primaryColor": "#6366f1",
  "timezone": "America/New_York",
  "currency": "USD",
  "language": "en",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

### PATCH /workspaces/:id
Update workspace profile. **Requires:** `ADMINISTRATOR`

```json
// Request
{
  "name": "Acme Corp",
  "timezone": "Europe/London",
  "currency": "GBP",
  "primaryColor": "#7c3aed"
}
```

### POST /workspaces/:id/logo
Upload workspace logo. `multipart/form-data`, field `file`.  
**Response 200:** `{ "logoUrl": "https://..." }`

---

## 4. Team Management Endpoints

### GET /workspaces/:id/members
List workspace members with roles.

**Query params:** `?role=SALES_AGENT&search=john&limit=25&cursor=`

**Response 200:**
```json
{
  "data": [
    {
      "id": "mbr_...",
      "userId": "usr_...",
      "role": "SALES_AGENT",
      "isActive": true,
      "joinedAt": "2026-02-01T00:00:00Z",
      "user": { "firstName": "John", "lastName": "Doe", "email": "john@acme.com", "avatarUrl": null }
    }
  ],
  "pagination": { "hasNextPage": false, "total": 12 }
}
```

### POST /workspaces/:id/invitations
Invite a user by email. **Requires:** `MANAGER` or above.

```json
// Request
{ "email": "newagent@acme.com", "role": "SALES_AGENT" }
// Response 201
{ "id": "inv_...", "email": "...", "role": "SALES_AGENT", "expiresAt": "2026-08-06T..." }
```

### DELETE /workspaces/:id/members/:memberId
Remove a member from the workspace. **Requires:** `ADMINISTRATOR`  
`204 No Content`

### PATCH /workspaces/:id/members/:memberId
Update member role or active status. **Requires:** `ADMINISTRATOR`

```json
{ "role": "MANAGER", "isActive": true }
```

### GET /workspaces/:id/departments
List departments. `200` with array.

### POST /workspaces/:id/departments
```json
{ "name": "Sales", "description": "Outbound sales team" }
```

### POST /workspaces/:id/teams
```json
{ "name": "LATAM Team", "departmentId": "dept_...", "description": "..." }
```

### POST /workspaces/:id/teams/:teamId/members
```json
{ "memberId": "mbr_..." }
```

---

## 5. Contacts Endpoints

### GET /contacts
List contacts with filtering and search.

**Query params:**
```
?search=john
&tags=vip,enterprise
&status=ACTIVE
&assignedTo=usr_...
&limit=25
&cursor=
&sortBy=createdAt
&sortOrder=desc
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "cnt_...",
      "firstName": "John",
      "lastName": "Smith",
      "phone": "+14155552671",
      "email": "john@company.com",
      "company": "TechCorp",
      "status": "ACTIVE",
      "tags": [{ "id": "tag_...", "name": "VIP", "color": "#f59e0b" }],
      "createdAt": "2026-03-01T00:00:00Z",
      "updatedAt": "2026-07-20T14:30:00Z"
    }
  ],
  "pagination": { "hasNextPage": true, "nextCursor": "...", "total": 1432 }
}
```

### POST /contacts
```json
// Request
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+14155552671",
  "email": "john@company.com",
  "company": "TechCorp",
  "jobTitle": "CTO",
  "source": "MANUAL",
  "tagIds": ["tag_..."],
  "customFields": { "industry": "SaaS", "mrr": 5000 }
}
// Response 201 — full contact object
```

### GET /contacts/:id
Get contact detail with timeline, notes, deals, and leads.

### PATCH /contacts/:id
Partial update. Any field from POST body is accepted.

### DELETE /contacts/:id
Soft-delete (sets `deletedAt`).  
`204 No Content`

### POST /contacts/:id/restore
Restore a soft-deleted contact.  
`200` with contact object.

### GET /contacts/:id/timeline
Paginated contact activity timeline.

**Response 200:**
```json
{
  "data": [
    {
      "id": "tle_...",
      "eventType": "message_sent",
      "title": "WhatsApp message sent",
      "description": "Hello, following up on your inquiry...",
      "actorId": "usr_...",
      "createdAt": "2026-07-22T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### POST /contacts/:id/notes
```json
{ "content": "Called customer, interested in Pro plan.", "isPrivate": false }
// Response 201
```

### GET /contacts/:id/notes
### PATCH /contacts/:id/notes/:noteId
### DELETE /contacts/:id/notes/:noteId

### POST /contacts/import
`multipart/form-data`, field `file` (CSV).  
Max 10,000 rows. Returns a job ID for progress polling.

```json
// Response 202 Accepted
{ "jobId": "job_...", "status": "PROCESSING", "totalRows": 4523 }
```

### GET /contacts/import/:jobId
Poll import status.

```json
{ "jobId": "...", "status": "DONE", "imported": 4500, "skipped": 23, "errors": [] }
```

### POST /contacts/export
Export contacts to CSV with optional filter criteria.

```json
// Request
{ "filter": { "tags": ["vip"], "status": "ACTIVE" } }
// Response 202
{ "jobId": "...", "downloadUrl": null }
// Poll GET /contacts/export/:jobId → downloadUrl becomes a pre-signed S3 URL
```

### POST /contacts/merge
```json
{ "primaryId": "cnt_aaa", "duplicateId": "cnt_bbb" }
// Response 200 — merged contact
```

### GET /contacts/duplicates
Returns pairs of suspected duplicates.

```json
{
  "data": [
    { "contact1": { ... }, "contact2": { ... }, "confidence": 0.95, "matchedOn": ["phone"] }
  ]
}
```


---

## 6. Leads Endpoints

### GET /pipelines
List all lead pipelines in the workspace.

### POST /pipelines
```json
{ "name": "Inbound Sales", "isDefault": false }
```

### GET /pipelines/:id/stages
### POST /pipelines/:id/stages
```json
{ "name": "Negotiation", "color": "#f59e0b", "sortOrder": 4, "probability": 70 }
```

### PATCH /pipelines/:id/stages/:stageId
### DELETE /pipelines/:id/stages/:stageId
### POST /pipelines/:id/stages/reorder
```json
{ "stageIds": ["stage_1", "stage_3", "stage_2"] }
```

### GET /leads
**Query params:** `?pipelineId=&stageId=&assignedTo=&status=&minScore=&maxScore=&search=&limit=25&cursor=`

**Response 200:**
```json
{
  "data": [
    {
      "id": "led_...",
      "title": "Enterprise Demo Request",
      "score": 82,
      "status": "NEW",
      "source": "WHATSAPP",
      "stageId": "stg_...",
      "stageName": "Qualified",
      "assignedTo": { "id": "usr_...", "firstName": "Jane" },
      "contact": { "id": "cnt_...", "firstName": "John", "phone": "+1..." },
      "followUpAt": "2026-08-10T09:00:00Z",
      "createdAt": "2026-08-01T..."
    }
  ],
  "pagination": { ... }
}
```

### GET /leads/kanban
Returns leads grouped by stage for Kanban rendering.

```json
{
  "stages": [
    {
      "id": "stg_...",
      "name": "New",
      "sortOrder": 0,
      "color": "#6366f1",
      "leads": [ { ... }, { ... } ],
      "totalCount": 24
    }
  ]
}
```

### POST /leads
```json
{
  "contactId": "cnt_...",
  "pipelineId": "pip_...",
  "stageId": "stg_...",
  "title": "Enterprise Demo Request",
  "score": 80,
  "source": "WHATSAPP",
  "assignedToId": "usr_...",
  "followUpAt": "2026-08-10T09:00:00Z",
  "followUpNote": "Call about pricing"
}
```

### GET /leads/:id
### PATCH /leads/:id
### DELETE /leads/:id

### PATCH /leads/:id/stage
Move lead to a different stage (recorded in history).

```json
{ "stageId": "stg_..." }
```

### POST /leads/:id/convert
Convert lead to deal.

```json
{ "dealPipelineId": "dpip_...", "dealStageId": "dstg_...", "dealValue": 12000 }
// Response 201 — newly created Deal
```

### GET /leads/:id/history
Paginated lead stage/assignment history.

---

## 7. Deals Endpoints

### GET /deal-pipelines
### POST /deal-pipelines
```json
{ "name": "Enterprise", "currency": "USD", "isDefault": false }
```

### GET /deal-pipelines/:id/stages
### POST /deal-pipelines/:id/stages
```json
{ "name": "Contract Sent", "sortOrder": 3, "probability": 80, "isWon": false, "isLost": false }
```

### GET /deals
**Query params:** `?pipelineId=&stageId=&status=&assignedTo=&minValue=&maxValue=&search=&limit=&cursor=`

### GET /deals/kanban
Same structure as leads/kanban but for deals.

### GET /deals/forecast
Revenue forecast by pipeline.

```json
{
  "pipeline": "Enterprise",
  "stages": [
    { "name": "Proposal", "probability": 60, "totalValue": 85000, "weightedValue": 51000, "dealCount": 7 }
  ],
  "totalWeighted": 234000,
  "totalPipeline": 510000
}
```

### POST /deals
```json
{
  "pipelineId": "dpip_...",
  "stageId": "dstg_...",
  "title": "Acme Corp — Enterprise Plan",
  "value": 24000,
  "currency": "USD",
  "probability": 70,
  "expectedCloseDate": "2026-09-30",
  "assignedToId": "usr_...",
  "contactIds": ["cnt_..."]
}
```

### GET /deals/:id
### PATCH /deals/:id
### DELETE /deals/:id

### POST /deals/:id/won
```json
{ "closedAt": "2026-08-04" }
```

### POST /deals/:id/lost
```json
{ "lostReason": "Budget constraints" }
```

### GET /deals/:id/history
### POST /deals/:id/notes
```json
{ "content": "Customer signed NDA." }
```
### GET /deals/:id/notes


---

## 8. WhatsApp Inbox Endpoints

### GET /conversations
List conversations for the inbox.

**Query params:** `?status=OPEN&assignedTo=me&search=&label=&isPinned=&limit=25&cursor=`

**Response 200:**
```json
{
  "data": [
    {
      "id": "conv_...",
      "status": "OPEN",
      "isPinned": false,
      "unreadCount": 3,
      "lastMessageAt": "2026-08-04T14:22:00Z",
      "lastMessageText": "Yes, I'm interested in the Pro plan",
      "contact": {
        "id": "cnt_...",
        "firstName": "Maria",
        "lastName": "Garcia",
        "phone": "+5511999998888",
        "avatarUrl": null
      },
      "assignedTo": { "id": "usr_...", "firstName": "Jane" },
      "labels": [{ "id": "lbl_...", "name": "Hot Lead", "color": "#ef4444" }]
    }
  ],
  "pagination": { "hasNextPage": true, "nextCursor": "...", "total": 87 }
}
```

### GET /conversations/:id
Full conversation detail with contact sidebar info.

### PATCH /conversations/:id
Update status, assignment, pin state.

```json
{
  "status": "RESOLVED",
  "assignedToId": "usr_...",
  "isPinned": true,
  "isArchived": false
}
```

### POST /conversations/:id/labels
```json
{ "labelId": "lbl_..." }
```
### DELETE /conversations/:id/labels/:labelId

### GET /conversations/:id/messages
Paginated message history (newest first).

**Query params:** `?limit=50&cursor=`

**Response 200:**
```json
{
  "data": [
    {
      "id": "msg_...",
      "direction": "INBOUND",
      "type": "TEXT",
      "status": "READ",
      "body": "Hello, I saw your ad on Instagram.",
      "senderId": null,
      "whatsappMsgId": "wamid.xxx",
      "replyTo": null,
      "createdAt": "2026-08-04T14:00:00Z",
      "readAt": "2026-08-04T14:01:00Z"
    },
    {
      "id": "msg_...",
      "direction": "OUTBOUND",
      "type": "TEXT",
      "status": "DELIVERED",
      "body": "Hi Maria! Thanks for reaching out. How can I help you today?",
      "senderId": "usr_...",
      "createdAt": "2026-08-04T14:05:00Z",
      "deliveredAt": "2026-08-04T14:05:02Z"
    }
  ],
  "pagination": { "hasNextPage": true, "nextCursor": "..." }
}
```

### POST /conversations/:id/messages
Send a message.

**Text message:**
```json
{ "type": "TEXT", "body": "Thanks for your message!" }
```

**Template message:**
```json
{
  "type": "TEMPLATE",
  "templateName": "order_confirmation",
  "templateVars": { "1": "John", "2": "ORD-1234", "3": "$49.99" }
}
```

**Media message:**
```json
{
  "type": "IMAGE",
  "mediaKey": "uploads/wsp_123/img_abc.jpg",
  "mediaCaption": "Check out our latest catalog!"
}
```

**Response 201:**
```json
{
  "id": "msg_...",
  "whatsappMsgId": "wamid.xxx",
  "status": "SENT",
  "createdAt": "..."
}
```

### POST /conversations/:id/messages/schedule
```json
{
  "type": "TEXT",
  "body": "Following up on our conversation yesterday.",
  "scheduledAt": "2026-08-05T09:00:00Z"
}
// Response 201 — message with status: SCHEDULED
```

### DELETE /conversations/:id/messages/:messageId/schedule
Cancel a scheduled message.

### POST /conversations/:id/internal-notes
```json
{ "content": "Customer seems close to converting. Handle with care." }
// Response 201
```

### GET /conversations/:id/internal-notes

### POST /conversations/:id/read
Mark all messages as read (updates `unreadCount` to 0).  
`204 No Content`

### GET /quick-replies
### POST /quick-replies
```json
{ "title": "Pricing Info", "content": "Our plans start at $49/month...", "shortcut": "/pricing" }
```
### PATCH /quick-replies/:id
### DELETE /quick-replies/:id

### GET /message-templates
### POST /message-templates
### GET /message-templates/:id
### PATCH /message-templates/:id
### DELETE /message-templates/:id
### POST /message-templates/sync
Sync approved templates from Meta API.  
`202 Accepted` → `{ "synced": 12, "new": 2, "updated": 1 }`

### GET /broadcasts
### POST /broadcasts
```json
{
  "name": "August Promotion",
  "templateId": "tpl_...",
  "templateVars": { "1": "{{firstName}}" },
  "filterCriteria": { "tags": ["existing_customer"] },
  "scheduledAt": "2026-08-05T10:00:00Z"
}
```
### GET /broadcasts/:id
### POST /broadcasts/:id/send
Immediately dispatch (ignores scheduledAt).  
`202 Accepted`

### DELETE /broadcasts/:id
Cancel a scheduled broadcast.


---

## 9. AI Assistant Endpoints

All AI endpoints require the workspace to have a configured AI provider (`aiProvider` + `aiApiKey` in settings).

### POST /ai/suggest-reply
```json
// Request
{ "conversationId": "conv_..." }

// Response 200
{
  "suggestions": [
    "Thanks for your patience! I'll check that order status right away.",
    "I completely understand your concern. Let me escalate this to our team.",
    "Could you share your order number so I can look into this faster?"
  ],
  "model": "gpt-4o",
  "tokensUsed": 312
}
```

### POST /ai/summarize-conversation
```json
// Request
{ "conversationId": "conv_..." }

// Response 200
{
  "summary": [
    "Customer Maria Garcia reached out about a delayed order (#ORD-1234).",
    "She is frustrated after waiting 2 weeks beyond the expected delivery date.",
    "Agent offered a 10% discount coupon; customer has not yet responded.",
    "Follow-up recommended within 24 hours."
  ],
  "sentiment": "NEGATIVE",
  "sentimentScore": -0.72
}
```

### POST /ai/rewrite
```json
// Request
{ "text": "hey did u get my message?", "tone": "professional" }

// Response 200
{ "rewritten": "I wanted to follow up to ensure my previous message reached you. Please let me know if you have any questions." }
```

### POST /ai/translate
```json
{ "text": "Preciso de ajuda com o meu pedido.", "targetLanguage": "en" }
// Response 200
{ "translated": "I need help with my order.", "detectedLanguage": "pt" }
```

### POST /ai/correct-grammar
```json
{ "text": "i will sent you the document tommorrow" }
// Response 200
{ "corrected": "I will send you the document tomorrow." }
```

### POST /ai/qualify-lead
```json
{ "leadId": "led_..." }
// Response 200
{
  "qualification": "HOT",
  "score": 88,
  "reasoning": "Contact expressed urgent need, has budget authority, and requested a demo within the next week.",
  "suggestedNextAction": "Schedule a product demo within 48 hours"
}
```

### POST /ai/sentiment-analysis
```json
{ "conversationId": "conv_..." }
// Response 200
{
  "sentiment": "POSITIVE",
  "score": 0.84,
  "emotions": ["satisfied", "curious"],
  "summary": "Customer appears satisfied with the support received and is exploring an upgrade."
}
```

### POST /ai/suggest-tags
```json
{ "contactId": "cnt_..." }
// Response 200
{ "suggestedTags": ["enterprise", "high-value", "decision-maker"] }
```

### POST /ai/generate-followup
```json
{ "dealId": "deal_...", "context": "Customer went quiet after the demo call." }
// Response 200
{ "message": "Hi [Name], I hope you had a chance to review the demo recording I sent over. I'd love to answer any questions you might have..." }
```

### POST /ai/search
Semantic search across all CRM data.

```json
{ "query": "customers who complained about shipping delays in July", "limit": 10 }
// Response 200
{
  "results": [
    { "type": "conversation", "id": "conv_...", "title": "Maria Garcia — Shipping delay issue", "relevanceScore": 0.94 },
    { "type": "contact", "id": "cnt_...", "title": "Carlos Silva", "relevanceScore": 0.89 }
  ]
}
```

### POST /ai/insights
Generate AI narrative from dashboard metrics.

```json
{ "period": "last_30_days" }
// Response 200
{
  "insights": [
    "Revenue is up 18% compared to the previous period, driven primarily by enterprise deals closing in Q3.",
    "Average response time improved from 4.2 hours to 2.8 hours — your team is getting faster.",
    "3 high-value leads from the 'Enterprise Demo Request' pipeline have gone cold. Consider re-engagement campaigns."
  ]
}
```

---

## 10. Tasks Endpoints

### GET /tasks
**Query params:** `?assignedTo=me&status=TODO&priority=HIGH&contactId=&dealId=&dueFrom=&dueTo=&limit=25&cursor=`

**Response 200:**
```json
{
  "data": [
    {
      "id": "tsk_...",
      "title": "Follow up call with Maria",
      "priority": "HIGH",
      "status": "TODO",
      "dueAt": "2026-08-05T15:00:00Z",
      "assignedTo": { "id": "usr_...", "firstName": "Jane" },
      "contact": { "id": "cnt_...", "firstName": "Maria" },
      "deal": { "id": "deal_...", "title": "Acme Enterprise Plan" }
    }
  ],
  "pagination": { ... }
}
```

### POST /tasks
```json
{
  "title": "Send proposal to Maria",
  "description": "Include pricing for 50-seat plan",
  "priority": "HIGH",
  "status": "TODO",
  "dueAt": "2026-08-05T15:00:00Z",
  "assignedToId": "usr_...",
  "contactId": "cnt_...",
  "dealId": "deal_...",
  "remindAt": "2026-08-05T14:30:00Z"
}
```

### GET /tasks/:id
### PATCH /tasks/:id
### DELETE /tasks/:id

### POST /tasks/:id/complete
`200` → `{ "completedAt": "2026-08-04T16:00:00Z" }`

---

## 11. Calendar Endpoints

### GET /calendar/events
**Query params:** `?from=2026-08-01&to=2026-08-31&assignedTo=me`

**Response 200:**
```json
{
  "data": [
    {
      "id": "evt_...",
      "title": "Product Demo — Acme Corp",
      "startAt": "2026-08-05T14:00:00Z",
      "endAt": "2026-08-05T15:00:00Z",
      "allDay": false,
      "color": "#6366f1",
      "contact": { "id": "cnt_...", "firstName": "John" },
      "attendees": [{ "id": "usr_...", "firstName": "Jane" }]
    }
  ]
}
```

### POST /calendar/events
```json
{
  "title": "Product Demo — Acme Corp",
  "startAt": "2026-08-05T14:00:00Z",
  "endAt": "2026-08-05T15:00:00Z",
  "allDay": false,
  "description": "Zoom call to demo the enterprise features",
  "contactId": "cnt_...",
  "dealId": "deal_...",
  "attendeeIds": ["usr_aaa", "usr_bbb"],
  "remindAt": "2026-08-05T13:30:00Z"
}
```

### GET /calendar/events/:id
### PATCH /calendar/events/:id
### DELETE /calendar/events/:id


---

## 12. Reports Endpoints

All report endpoints support `?from=2026-01-01&to=2026-08-04` date range filters.

### GET /reports/sales
```json
// Response 200
{
  "period": { "from": "2026-07-01", "to": "2026-07-31" },
  "totalDeals": 48,
  "wonDeals": 22,
  "lostDeals": 14,
  "totalRevenue": 284000,
  "avgDealValue": 12909,
  "winRate": 45.8,
  "byAgent": [
    { "agentId": "usr_...", "name": "Jane Doe", "won": 8, "lost": 4, "revenue": 98000 }
  ],
  "byPipeline": [ ... ],
  "trend": [
    { "date": "2026-07-01", "revenue": 9200, "deals": 2 }
  ]
}
```

### GET /reports/revenue
Monthly revenue breakdown with forecast.

### GET /reports/agent-performance
```json
// Response 200
{
  "data": [
    {
      "agentId": "usr_...",
      "name": "Jane Doe",
      "conversationsHandled": 84,
      "avgResponseTimeMinutes": 12.4,
      "dealsClosedWon": 8,
      "revenueGenerated": 98000,
      "tasksCompleted": 36,
      "customerSatisfaction": null
    }
  ]
}
```

### GET /reports/customer-growth
Returns new contact count per day/week/month and cumulative total.

### GET /reports/pipeline
Stage distribution, avg time in stage, and conversion rates per pipeline.

### GET /reports/whatsapp
```json
// Response 200
{
  "messagesSent": 4820,
  "messagesReceived": 6310,
  "avgFirstResponseMinutes": 8.2,
  "p95FirstResponseMinutes": 34.7,
  "templatesUsed": [
    { "templateName": "welcome_message", "sent": 340, "delivered": 338, "read": 290 }
  ],
  "broadcastsDelivered": 12,
  "broadcastReach": 8400
}
```

### GET /reports/response-time
P50/P75/P95 first response time by agent and by day.

### POST /reports/export
Export any report as PDF or CSV.

```json
{ "report": "sales", "format": "pdf", "from": "2026-07-01", "to": "2026-07-31" }
// Response 202 → poll GET /reports/export/:jobId for downloadUrl
```

---

## 13. Notifications Endpoints

### GET /notifications
**Query params:** `?isRead=false&limit=25&cursor=`

### POST /notifications/read-all
Mark all notifications as read.  
`204 No Content`

### PATCH /notifications/:id/read
`204 No Content`

### GET /notifications/preferences
Returns per-type, per-channel preferences.

### PATCH /notifications/preferences
```json
{
  "preferences": [
    { "type": "NEW_MESSAGE", "channel": "EMAIL", "isEnabled": false },
    { "type": "TASK_DUE", "channel": "PUSH", "isEnabled": true }
  ]
}
```

---

## 14. Settings Endpoints

### GET /settings
Returns full workspace settings (sensitive fields masked: `"***"`).

### PATCH /settings/profile
```json
{ "name": "Acme Corp", "timezone": "US/Pacific", "currency": "USD", "language": "en" }
```

### PATCH /settings/whatsapp
```json
{
  "wabPhoneNumberId": "123456789",
  "wabAccessToken": "EAAxxxxxxxx",
  "wabWebhookSecret": "my-webhook-secret"
}
```

### POST /settings/whatsapp/test
Test WhatsApp API connectivity.  
`200` → `{ "connected": true, "phoneNumber": "+1415555xxxx", "displayName": "Acme Corp" }`

### PATCH /settings/ai
```json
{ "aiProvider": "OPENAI", "aiApiKey": "sk-...", "aiModel": "gpt-4o" }
```

### POST /settings/ai/test
Test AI provider connectivity.  
`200` → `{ "connected": true, "model": "gpt-4o" }`

### PATCH /settings/smtp
```json
{
  "smtpHost": "smtp.resend.com",
  "smtpPort": 587,
  "smtpUser": "resend",
  "smtpPassword": "re_...",
  "smtpFromEmail": "noreply@acme.com",
  "smtpFromName": "Acme CRM"
}
```

### POST /settings/smtp/test
Send a test email to the authenticated user's email address.

### PATCH /settings/security
```json
{ "enforce2FA": true, "sessionTimeoutMins": 480, "ipWhitelist": ["203.0.113.0/24"] }
```

### GET /settings/api-keys
### POST /settings/api-keys
```json
{ "name": "Zapier Integration", "expiresAt": null }
// Response 201 — ONLY time the full key is returned
{ "id": "key_...", "name": "Zapier Integration", "key": "nexacrm_sk_live_xxxx", "keyPrefix": "nexacrm_" }
```
### DELETE /settings/api-keys/:id
Revoke an API key.

### GET /settings/audit-logs
**Query params:** `?userId=&action=&resource=&from=&to=&limit=25&cursor=`

---

## 15. Storage Endpoints

### POST /storage/presign
Request a pre-signed S3 upload URL.

```json
{ "fileName": "catalog.pdf", "mimeType": "application/pdf", "size": 2048576 }
// Response 200
{
  "uploadUrl": "https://s3.amazonaws.com/nexacrm/uploads/wsp_xxx/...",
  "fileKey": "uploads/wsp_xxx/2026/08/04/abc123-catalog.pdf",
  "expiresAt": "2026-08-04T15:05:00Z"
}
```

### GET /storage/url/:fileKey
Returns a temporary pre-signed GET URL (redirects to S3).  
`302 Redirect` to pre-signed URL.

---

## 16. Webhook Endpoints

### GET /webhooks/whatsapp
Meta verification handshake.

**Query params:** `?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>`  
**Response 200:** Returns the `hub.challenge` value as plain text.

### POST /webhooks/whatsapp
Receive inbound WhatsApp events (messages, status updates, etc.).

- Validates `X-Hub-Signature-256` header
- Responds `200 OK` immediately (async processing via queue)
- Any non-200 response causes Meta to retry delivery

**Supported event types processed:**
- `messages` (text, image, audio, video, document, sticker, location, interactive)
- `statuses` (sent, delivered, read, failed)
- `errors`

---

## 17. WebSocket Events (Socket.IO)

**Connection:**  
`wss://api.nexacrm.io?token=<access_token>`

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `typing:start` | `{ conversationId }` | Agent starts typing |
| `typing:stop` | `{ conversationId }` | Agent stops typing |
| `conversation:join` | `{ conversationId }` | Subscribe to a conversation |
| `conversation:leave` | `{ conversationId }` | Unsubscribe |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | Full message object | New inbound or outbound message |
| `message:status` | `{ id, status, deliveredAt, readAt }` | Delivery status update |
| `typing:start` | `{ conversationId, userId }` | Remote user is typing |
| `typing:stop` | `{ conversationId, userId }` | Remote user stopped typing |
| `conversation:updated` | Updated conversation object | Status/assignment change |
| `notification:new` | Notification object | New notification for user |
| `deal:updated` | `{ dealId, stageId }` | Deal moved on Kanban |
| `lead:updated` | `{ leadId, stageId }` | Lead moved on Kanban |

---

## 18. Custom Fields Endpoints

### GET /custom-fields?entityType=contact
### POST /custom-fields
```json
{
  "entityType": "contact",
  "name": "Monthly Recurring Revenue",
  "key": "mrr",
  "type": "NUMBER",
  "isRequired": false
}
```
### PATCH /custom-fields/:id
### DELETE /custom-fields/:id
### POST /custom-fields/reorder
```json
{ "fieldIds": ["fld_1", "fld_3", "fld_2"] }
```

---

## 19. Tags & Labels Endpoints

### GET /tags
### POST /tags
```json
{ "name": "VIP", "color": "#f59e0b" }
```
### PATCH /tags/:id
### DELETE /tags/:id

### GET /labels
### POST /labels
```json
{ "name": "Hot Lead", "color": "#ef4444" }
```
### PATCH /labels/:id
### DELETE /labels/:id

---

## 20. Dashboard Endpoint

### GET /dashboard
Returns all KPI data in a single request.

```json
// Response 200
{
  "kpis": {
    "totalContacts": 4823,
    "activeConversations": 142,
    "openLeads": 312,
    "closedDealsThisMonth": 22,
    "revenueThisMonth": 284000,
    "revenuePrevMonth": 240500,
    "revenueChange": 18.1,
    "conversionRate": 45.8
  },
  "salesTrend": [
    { "date": "2026-07-28", "revenue": 14200, "deals": 3 }
  ],
  "customerGrowth": [
    { "date": "2026-07-28", "newContacts": 18, "cumulative": 4805 }
  ],
  "teamPerformance": [
    {
      "agentId": "usr_...", "name": "Jane Doe",
      "conversations": 84, "dealsWon": 8, "avgResponseMins": 12.4
    }
  ],
  "activityFeed": [
    { "type": "deal_won", "actor": "Jane Doe", "target": "Acme Corp", "at": "2026-08-04T14:00:00Z" }
  ],
  "upcomingTasks": [ ... ],
  "todayEvents": [ ... ]
}
```
