# Software Requirements Specification (SRS)
## AI-Powered WhatsApp CRM — SaaS Platform

**Document Version:** 1.0  
**Date:** August 4, 2026  
**Status:** Approved for Development

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification describes the functional and non-functional requirements for an AI-Powered WhatsApp CRM SaaS platform. The system enables businesses to manage customer relationships, sales pipelines, and team communications through an integrated WhatsApp messaging interface enhanced with artificial intelligence capabilities.

### 1.2 Scope

The platform — referred to throughout this document as **NexaCRM** — is a multi-tenant SaaS application that provides:

- A unified customer relationship management workspace
- Real-time WhatsApp Cloud API messaging integrated into a native chat interface
- AI-assisted conversation management, lead qualification, and response generation
- Sales pipeline and deal management with Kanban-style boards
- Team collaboration with role-based access control
- Reporting, analytics, and business intelligence dashboards

The system targets small-to-medium businesses (SMBs) and enterprise sales and support teams that rely heavily on WhatsApp for customer communication.

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| CRM | Customer Relationship Management |
| SaaS | Software as a Service |
| WABA | WhatsApp Business Account |
| WAC API | WhatsApp Cloud API (Meta) |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| 2FA | Two-Factor Authentication |
| ORM | Object-Relational Mapping |
| MTE | Multi-Tenant Environment |
| WS | WebSocket |
| CDN | Content Delivery Network |

### 1.4 References

- Meta WhatsApp Cloud API Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
- NestJS Documentation: https://docs.nestjs.com
- Next.js Documentation: https://nextjs.org/docs
- Prisma ORM Documentation: https://www.prisma.io/docs

### 1.5 Overview

This SRS is organized as follows:

- Section 2: Overall product description and context
- Section 3: Functional requirements per module
- Section 4: Non-functional requirements
- Section 5: External interface requirements
- Section 6: System constraints

---

## 2. Overall Description

### 2.1 Product Perspective

NexaCRM is a standalone, cloud-native SaaS product. It operates as a multi-tenant system where each tenant (organization) has fully isolated data. The system integrates with:

- Meta WhatsApp Cloud API for messaging
- AWS S3 (or compatible) for media storage
- SMTP providers for email notifications
- AI providers (OpenAI, Anthropic, Gemini) via a modular adapter interface
- Google Calendar for scheduling (optional)

### 2.2 Product Functions — High Level

1. **Identity & Access Management** — Registration, login, RBAC, 2FA, audit logs
2. **Dashboard** — KPIs, charts, activity feed, notifications
3. **Contacts** — Full contact lifecycle management with custom fields and timelines
4. **Leads** — Kanban pipeline with scoring, assignment, and follow-up automation
5. **Deals** — Multi-pipeline deal tracking with revenue forecasting
6. **WhatsApp Inbox** — Real-time messaging, media, templates, broadcasts
7. **AI Assistant** — Intelligent suggestions, summaries, and qualification
8. **Tasks** — Task and reminder management tied to contacts and deals
9. **Calendar** — Scheduling and meeting management
10. **Reports** — Business analytics and performance dashboards
11. **Team Management** — Departments, teams, invitations, permissions
12. **Settings** — Company profile, branding, integrations, security

### 2.3 User Classes and Characteristics

| Role | Description | Technical Level |
|------|-------------|-----------------|
| Administrator | Full system access. Manages billing, users, settings, and all data. | Medium-High |
| Manager | Manages teams, pipelines, deals, and reports. Cannot access billing. | Medium |
| Sales Agent | Works assigned leads, contacts, deals, and tasks. | Low-Medium |
| Support Agent | Handles WhatsApp conversations and support tickets. | Low-Medium |
| Viewer | Read-only access to dashboards and reports. | Low |

### 2.4 Operating Environment

- **Cloud Deployment:** Docker containers orchestrated via Docker Compose (production), extensible to Kubernetes
- **Web Browsers:** Chrome 100+, Firefox 100+, Edge 100+, Safari 15+
- **Mobile:** Responsive web (mobile-first), PWA support
- **Backend Runtime:** Node.js 20 LTS
- **Database:** PostgreSQL 15+
- **Cache/Queue:** Redis 7+

### 2.5 Design and Implementation Constraints

1. All API communication must use HTTPS
2. PII (Personally Identifiable Information) must be encrypted at rest
3. Multi-tenancy must be enforced at the application layer using a `workspace_id` (tenant ID) on every database query
4. WhatsApp messaging must comply with Meta's Business Policy and Message Template guidelines
5. AI responses must include a disclaimer that they are AI-generated
6. File uploads are limited to 16 MB per file (Meta WhatsApp API constraint for media)

### 2.6 Assumptions and Dependencies

- Each tenant has an active Meta WABA (WhatsApp Business Account) with approved phone numbers
- Tenants provide their own Meta App credentials (phone number ID, access token)
- AI features require tenants to supply their own AI provider API keys
- SMTP credentials are required for email notification delivery
- The platform assumes UTC as the default timezone, with per-user timezone preferences

---

## 3. Specific Requirements Overview

Full functional requirements are documented in `02-REQUIREMENTS.md`. The following modules constitute the complete system scope:

1. Authentication & Authorization
2. Workspace / Tenant Management
3. Dashboard
4. Contacts
5. Leads
6. Deals
7. WhatsApp Inbox
8. AI Assistant
9. Tasks
10. Calendar
11. Reports & Analytics
12. Team Management
13. Notifications
14. Settings & Configuration

---

## 4. Approval

| Role | Name | Date |
|------|------|------|
| Product Owner | — | 2026-08-04 |
| Lead Architect | — | 2026-08-04 |
| Lead Engineer | — | 2026-08-04 |
