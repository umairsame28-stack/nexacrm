# Functional & Non-Functional Requirements
## NexaCRM — AI-Powered WhatsApp CRM SaaS

**Version:** 1.0 | **Date:** August 4, 2026

---

## PART A — FUNCTIONAL REQUIREMENTS

---

### FR-01: Authentication & Authorization

| ID | Requirement |
|----|-------------|
| FR-01-01 | Users can register with email and password |
| FR-01-02 | Passwords must be hashed using bcrypt (cost factor ≥ 12) |
| FR-01-03 | Login returns a short-lived JWT access token (15 min) and a long-lived refresh token (7 days) |
| FR-01-04 | Refresh tokens are rotated on each use and stored as an httpOnly Secure cookie |
| FR-01-05 | Users can enable TOTP-based 2FA using an authenticator app |
| FR-01-06 | Each user belongs to one or more workspaces with a role per workspace |
| FR-01-07 | RBAC enforces access to every API endpoint and UI route |
| FR-01-08 | Failed login attempts are rate-limited (5 attempts per 15 minutes per IP) |
| FR-01-09 | Users can reset passwords via a time-limited email token (1 hour) |
| FR-01-10 | All authentication events are written to the audit log |
| FR-01-11 | Administrators can revoke any user's active sessions |
| FR-01-12 | Single Sign-On (SSO) via Google OAuth 2.0 (optional, phase 2) |

---

### FR-02: Workspace / Tenant Management

| ID | Requirement |
|----|-------------|
| FR-02-01 | A user can create a workspace (becomes Owner/Administrator) |
| FR-02-02 | Workspace owner can invite users by email with a specified role |
| FR-02-03 | Invited users receive an email with a registration/acceptance link |
| FR-02-04 | Workspace has a name, logo, timezone, currency, and language settings |
| FR-02-05 | A workspace can have custom branding (logo, primary color) |
| FR-02-06 | All data is strictly isolated per workspace — no cross-tenant data leakage |

---

### FR-03: Dashboard

| ID | Requirement |
|----|-------------|
| FR-03-01 | Dashboard displays: total contacts, active conversations, open leads, closed deals |
| FR-03-02 | Revenue cards show current month revenue vs. previous month with percentage change |
| FR-03-03 | Monthly sales chart (bar or line) with configurable time range (7d, 30d, 90d, 1y) |
| FR-03-04 | Conversion rate funnel chart from lead → deal → closed |
| FR-03-05 | Customer growth chart (cumulative contacts over time) |
| FR-03-06 | Team performance table: agent, conversations handled, deals closed, response time |
| FR-03-07 | Activity feed showing the last 20 system events in real time |
| FR-03-08 | Mini calendar widget showing today's tasks and meetings |
| FR-03-09 | Notification bell with unread count badge |
| FR-03-10 | Dashboard data refreshes every 60 seconds or on WebSocket push |

---

### FR-04: Contacts

| ID | Requirement |
|----|-------------|
| FR-04-01 | Create a contact with: name, phone, email, company, tags, labels, custom fields |
| FR-04-02 | Phone number stored in E.164 format; validated on input |
| FR-04-03 | Import contacts from CSV (up to 10,000 rows per import) |
| FR-04-04 | Export contacts to CSV with filter support |
| FR-04-05 | Assign tags and color-coded labels to contacts |
| FR-04-06 | Add private or shared notes to a contact |
| FR-04-07 | Define custom fields per workspace (text, number, date, select, multi-select, boolean) |
| FR-04-08 | Contact timeline shows all interactions: messages, calls, notes, deals, tasks |
| FR-04-09 | Full-text search across name, phone, email, company, and custom fields |
| FR-04-10 | Advanced filter builder: field + operator + value, combinable with AND/OR |
| FR-04-11 | Automatic duplicate detection based on phone number and email |
| FR-04-12 | Merge two duplicate contacts, preserving all related records |
| FR-04-13 | Soft-delete contacts (archive) with restore capability |

---

### FR-05: Lead Management

| ID | Requirement |
|----|-------------|
| FR-05-01 | Create a lead linked to a contact with source, score, and stage |
| FR-05-02 | Define multiple pipelines per workspace |
| FR-05-03 | Each pipeline has customizable stages with names and order |
| FR-05-04 | Kanban board view: leads as cards, draggable between stages |
| FR-05-05 | Lead scoring: manual score entry + rule-based auto-scoring (configurable) |
| FR-05-06 | Assign a lead to a sales agent |
| FR-05-07 | Track lead source: WhatsApp, web form, import, manual, API |
| FR-05-08 | Set follow-up reminders with due date and note |
| FR-05-09 | Filter and sort leads by score, stage, assignee, date, source |
| FR-05-10 | Convert a lead to a deal with one click |
| FR-05-11 | Lead activity log: stage changes, assignments, notes |

---

### FR-06: Deals

| ID | Requirement |
|----|-------------|
| FR-06-01 | Create a deal with: title, value, currency, expected close date, stage |
| FR-06-02 | Associate a deal with one or more contacts |
| FR-06-03 | Multiple pipelines with independent deal stages |
| FR-06-04 | Kanban board with drag-and-drop deal management |
| FR-06-05 | Revenue forecast: sum of deal values × win probability per stage |
| FR-06-06 | Mark deals as won, lost, or abandoned with a reason |
| FR-06-07 | Attach notes, tasks, and files to a deal |
| FR-06-08 | Deal history log: all changes with user and timestamp |
| FR-06-09 | Deal summary card: value, contact, assignee, stage, probability, close date |

---

### FR-07: WhatsApp Inbox

| ID | Requirement |
|----|-------------|
| FR-07-01 | Two-panel layout: left conversation list, right chat window |
| FR-07-02 | Receive and display inbound WhatsApp messages in real time via webhook |
| FR-07-03 | Send text messages to any contact with a valid WhatsApp number |
| FR-07-04 | Display message delivery status: sent, delivered, read |
| FR-07-05 | Show typing indicator when a human agent is composing |
| FR-07-06 | Send and receive: images, documents (PDF), audio, video, stickers |
| FR-07-07 | In-app image preview with zoom; PDF preview with page navigation |
| FR-07-08 | Emoji picker integrated into the message composer |
| FR-07-09 | Send approved WhatsApp message templates with variable substitution |
| FR-07-10 | Broadcast: send a template message to a filtered contact list |
| FR-07-11 | Quick replies: pre-saved response snippets selectable from the composer |
| FR-07-12 | Schedule a message for future delivery (stored and dispatched by background job) |
| FR-07-13 | Conversation labels (Open, Pending, Resolved, Spam) |
| FR-07-14 | Pin important conversations to the top of the list |
| FR-07-15 | Archive conversations |
| FR-07-16 | Search conversations by contact name, phone, or message content |
| FR-07-17 | Assign a conversation to a specific agent or team |
| FR-07-18 | Internal notes on a conversation (not sent to customer) |
| FR-07-19 | Contact info sidebar within the conversation view |
| FR-07-20 | Unread message badge per conversation |
| FR-07-21 | Webhook endpoint to receive Meta WhatsApp Cloud API events |
| FR-07-22 | Webhook signature verification (X-Hub-Signature-256) |

---

### FR-08: AI Assistant

| ID | Requirement |
|----|-------------|
| FR-08-01 | Summarize a conversation in 2–5 bullet points |
| FR-08-02 | Suggest 3 reply options based on the last message and conversation context |
| FR-08-03 | Write a professional rewrite of an agent-drafted reply |
| FR-08-04 | Translate a message to the agent's preferred language |
| FR-08-05 | Correct grammar and tone of a drafted reply |
| FR-08-06 | Generate a follow-up message template for a given deal stage |
| FR-08-07 | Analyze customer sentiment: positive, neutral, negative, with confidence score |
| FR-08-08 | Qualify a lead based on conversation history: hot, warm, cold |
| FR-08-09 | Auto-suggest tags for a contact based on conversation content |
| FR-08-10 | AI-powered full-text CRM search using semantic similarity |
| FR-08-11 | Generate business insights from dashboard metrics (AI narrative summary) |
| FR-08-12 | AI provider is configurable per workspace: OpenAI, Anthropic, Gemini |
| FR-08-13 | All AI-generated content is clearly labeled with a "AI" badge |
| FR-08-14 | AI usage is logged for billing and audit purposes |

---

### FR-09: Tasks

| ID | Requirement |
|----|-------------|
| FR-09-01 | Create a task with: title, description, due date, priority, assignee |
| FR-09-02 | Link a task to a contact, lead, or deal |
| FR-09-03 | Personal task view (my tasks) and team task view |
| FR-09-04 | Task priorities: low, medium, high, urgent |
| FR-09-05 | Mark tasks as complete |
| FR-09-06 | Reminder notification via email and in-app before due date |
| FR-09-07 | Kanban view: To Do, In Progress, Done |
| FR-09-08 | Calendar view of tasks with due dates |

---

### FR-10: Calendar

| ID | Requirement |
|----|-------------|
| FR-10-01 | Monthly, weekly, and daily calendar views |
| FR-10-02 | Create events: meetings, follow-up calls, demos |
| FR-10-03 | Link events to contacts, leads, or deals |
| FR-10-04 | Drag-and-drop event rescheduling |
| FR-10-05 | Event reminders (email and in-app) |
| FR-10-06 | Google Calendar two-way sync (optional, phase 2) |

---

### FR-11: Reports & Analytics

| ID | Requirement |
|----|-------------|
| FR-11-01 | Sales report: deals won/lost by period, by agent, by pipeline |
| FR-11-02 | Revenue report: actual vs. forecast with trend line |
| FR-11-03 | Agent performance: conversations handled, response time, deals closed |
| FR-11-04 | Customer growth: new contacts per day/week/month |
| FR-11-05 | Pipeline report: stage distribution, average time in stage, conversion rate |
| FR-11-06 | WhatsApp analytics: messages sent/received, templates used, broadcast reach |
| FR-11-07 | Response time report: average and P95 first response time per agent |
| FR-11-08 | All reports exportable as PDF or CSV |
| FR-11-09 | Date range filter applicable to all reports |

---

### FR-12: Team Management

| ID | Requirement |
|----|-------------|
| FR-12-01 | Create departments and assign users |
| FR-12-02 | Create teams within departments |
| FR-12-03 | Define custom roles with granular permissions (read/write/delete per resource) |
| FR-12-04 | Invite users via email; invitation expires after 48 hours |
| FR-12-05 | Deactivate/reactivate user accounts |
| FR-12-06 | View per-user activity log: logins, record changes, messages sent |
| FR-12-07 | Login history: IP address, user agent, timestamp, success/failure |

---

### FR-13: Notifications

| ID | Requirement |
|----|-------------|
| FR-13-01 | In-app notification bell with unread count |
| FR-13-02 | Real-time in-app notifications via WebSocket |
| FR-13-03 | Email notifications for: new assignment, task due, deal stage change, new message |
| FR-13-04 | Browser push notifications (Web Push API) |
| FR-13-05 | Users can configure which notification types they receive per channel |
| FR-13-06 | Notification history accessible for 30 days |

---

### FR-14: Settings

| ID | Requirement |
|----|-------------|
| FR-14-01 | Company profile: name, logo, address, timezone, currency, language |
| FR-14-02 | Custom branding: primary color, logo (reflected in UI) |
| FR-14-03 | Dark mode / light mode toggle with system preference detection |
| FR-14-04 | WhatsApp integration settings: phone number ID, access token, webhook URL |
| FR-14-05 | AI provider settings: provider selection, API key, model preference |
| FR-14-06 | SMTP configuration for outbound email |
| FR-14-07 | API key management: generate, rotate, and revoke API keys |
| FR-14-08 | Audit log viewer: filterable by user, action, resource, and date range |
| FR-14-09 | Data export: full workspace data export as JSON/ZIP |
| FR-14-10 | Security settings: enforce 2FA, session timeout, IP whitelist |

---

## PART B — NON-FUNCTIONAL REQUIREMENTS

---

### NFR-01: Performance

| ID | Requirement |
|----|-------------|
| NFR-01-01 | API response time ≤ 200 ms at P95 under normal load |
| NFR-01-02 | Dashboard loads (Time to Interactive) ≤ 2 seconds on a 10 Mbps connection |
| NFR-01-03 | WhatsApp message delivery latency from webhook receipt to UI display ≤ 500 ms |
| NFR-01-04 | System supports 500 concurrent WebSocket connections per server instance |
| NFR-01-05 | Bulk CSV import of 10,000 contacts completes within 60 seconds |
| NFR-01-06 | Database queries must use indexes; N+1 queries are prohibited |

---

### NFR-02: Scalability

| ID | Requirement |
|----|-------------|
| NFR-02-01 | Backend services are stateless and horizontally scalable |
| NFR-02-02 | Redis is used for session storage, caching, and pub/sub to support multi-instance deployments |
| NFR-02-03 | Background jobs (message scheduling, broadcasts, CSV processing) run in a dedicated Bull queue backed by Redis |
| NFR-02-04 | Media files are stored in object storage (S3), not on local disk |
| NFR-02-05 | Database connection pooling via PgBouncer or Prisma connection pool |

---

### NFR-03: Reliability & Availability

| ID | Requirement |
|----|-------------|
| NFR-03-01 | Target uptime: 99.9% (excluding planned maintenance) |
| NFR-03-02 | Webhook receiver handles Meta delivery retries idempotently using message ID |
| NFR-03-03 | Database automated daily backups with 7-day retention |
| NFR-03-04 | Circuit breakers applied to external API calls (WhatsApp, AI providers) |
| NFR-03-05 | Graceful degradation: if AI provider is unavailable, features fail silently with a user-visible notice |

---

### NFR-04: Security

| ID | Requirement |
|----|-------------|
| NFR-04-01 | All traffic served over HTTPS/TLS 1.2+ |
| NFR-04-02 | Passwords hashed with bcrypt (cost ≥ 12) |
| NFR-04-03 | JWTs signed with RS256 (asymmetric key pair) |
| NFR-04-04 | Refresh tokens stored as httpOnly, Secure, SameSite=Strict cookies |
| NFR-04-05 | All API inputs validated and sanitized (class-validator, zod) |
| NFR-04-06 | Parameterized queries enforced via Prisma ORM (no raw SQL interpolation) |
| NFR-04-07 | Rate limiting: global 100 req/min per IP; auth endpoints 5 req/15 min per IP |
| NFR-04-08 | CORS restricted to known frontend origins |
| NFR-04-09 | Webhook payloads verified with X-Hub-Signature-256 HMAC |
| NFR-04-10 | Tenant isolation: every DB query scoped by workspace_id at the repository layer |
| NFR-04-11 | Secrets managed via environment variables; never committed to VCS |
| NFR-04-12 | Content Security Policy (CSP) headers set on all frontend responses |
| NFR-04-13 | Media files served via pre-signed S3 URLs with 1-hour expiry |
| NFR-04-14 | Audit log is append-only; no update or delete operations on audit records |

---

### NFR-05: Maintainability

| ID | Requirement |
|----|-------------|
| NFR-05-01 | Backend follows Clean Architecture: domain → application → infrastructure → presentation |
| NFR-05-02 | Frontend follows feature-based folder structure with shared UI component library |
| NFR-05-03 | All public functions and classes have JSDoc/TSDoc documentation |
| NFR-05-04 | Code coverage target: ≥ 80% for backend unit tests |
| NFR-05-05 | ESLint and Prettier enforced via pre-commit hooks |
| NFR-05-06 | All database schema changes managed via Prisma migrations (versioned, reversible) |

---

### NFR-06: Observability

| ID | Requirement |
|----|-------------|
| NFR-06-01 | Structured JSON logging using Winston (backend) and Pino |
| NFR-06-02 | Log levels: error, warn, info, debug — configurable per environment |
| NFR-06-03 | Request/response logging middleware with correlation IDs |
| NFR-06-04 | Health check endpoint: GET /health returning service status |
| NFR-06-05 | Metrics exposed in Prometheus format at /metrics (phase 2) |
| NFR-06-06 | Error tracking integration ready (Sentry-compatible interface) |

---

### NFR-07: Usability

| ID | Requirement |
|----|-------------|
| NFR-07-01 | UI is fully responsive from 375px (mobile) to 2560px (ultrawide) |
| NFR-07-02 | Dark mode and light mode supported; follows OS preference by default |
| NFR-07-03 | All interactive elements have accessible labels (ARIA) |
| NFR-07-04 | Color contrast ratios meet WCAG 2.1 AA |
| NFR-07-05 | Keyboard navigation supported throughout the application |
| NFR-07-06 | Loading skeletons shown during all async data fetches |
| NFR-07-07 | Empty states shown with helpful call-to-action when no data exists |
| NFR-07-08 | Toast notifications for all user-triggered success, warning, and error events |
| NFR-07-09 | Forms show inline validation errors immediately on blur |

---

### NFR-08: Compliance

| ID | Requirement |
|----|-------------|
| NFR-08-01 | WhatsApp messaging complies with Meta Business Policy |
| NFR-08-02 | Data handling policy describes retention, deletion, and export capabilities |
| NFR-08-03 | GDPR-ready: support right-to-erasure (delete contact + all related data) |
| NFR-08-04 | AI-generated content is clearly labeled to end users |
