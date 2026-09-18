# Folder Structure
## NexaCRM — AI-Powered WhatsApp CRM SaaS

**Version:** 1.0 | **Date:** August 4, 2026

---

## Repository Layout (Monorepo)

```
nexacrm/                          ← Monorepo root
├── apps/
│   ├── api/                      ← NestJS backend
│   └── web/                      ← Next.js frontend
├── packages/
│   ├── shared-types/             ← TypeScript types shared by api + web
│   ├── ui/                       ← Design system (shadcn/ui extensions)
│   └── config/                   ← Shared ESLint, Prettier, tsconfig
├── infra/
│   ├── docker/                   ← Dockerfiles
│   ├── nginx/                    ← Nginx config
│   └── scripts/                  ← DB seed, migration, deploy scripts
├── .github/
│   └── workflows/                ← CI/CD GitHub Actions
├── docker-compose.yml            ← Production compose
├── docker-compose.dev.yml        ← Development compose
├── .env.example                  ← Environment variable template
├── turbo.json                    ← Turborepo pipeline config
├── package.json                  ← Root workspace config
└── README.md
```

---

## 1. Backend — `apps/api/`

```
apps/api/
├── src/
│   │
│   ├── main.ts                           ← NestJS bootstrap, Swagger setup
│   ├── app.module.ts                     ← Root module, global imports
│   │
│   ├── config/                           ← Configuration management
│   │   ├── app.config.ts                 ← App-level config (port, env, cors)
│   │   ├── database.config.ts            ← PostgreSQL / Prisma config
│   │   ├── redis.config.ts               ← Redis connection config
│   │   ├── jwt.config.ts                 ← JWT keys, expiry, algorithm
│   │   ├── s3.config.ts                  ← S3 bucket, region, credentials
│   │   └── index.ts                      ← Re-exports all configs
│   │
│   ├── common/                           ← Cross-cutting concerns
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts ← @CurrentUser() param decorator
│   │   │   ├── workspace.decorator.ts    ← @CurrentWorkspace() decorator
│   │   │   ├── roles.decorator.ts        ← @Roles(Role.MANAGER) decorator
│   │   │   └── api-key.decorator.ts      ← @ApiKeyAuth() decorator
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         ← Validates JWT access token
│   │   │   ├── workspace.guard.ts        ← Resolves workspace from header
│   │   │   ├── roles.guard.ts            ← Enforces RBAC
│   │   │   └── api-key.guard.ts          ← Validates API key header
│   │   ├── interceptors/
│   │   │   ├── request-logging.interceptor.ts  ← Correlation ID + timing
│   │   │   ├── response-transform.interceptor.ts ← Wrap responses in envelope
│   │   │   └── audit-log.interceptor.ts  ← Write audit on mutating requests
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts ← Maps all errors to standard shape
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts        ← Global class-validator pipe
│   │   ├── middlewares/
│   │   │   └── rate-limit.middleware.ts  ← Per-route rate limiting
│   │   ├── dto/
│   │   │   └── pagination.dto.ts         ← Shared cursor pagination DTO
│   │   └── utils/
│   │       ├── crypto.util.ts            ← AES-256-GCM encrypt/decrypt
│   │       ├── phone.util.ts             ← E.164 validation + formatting
│   │       ├── slug.util.ts              ← Workspace slug generator
│   │       ├── pagination.util.ts        ← Cursor encode/decode helpers
│   │       └── date.util.ts              ← Date formatting helpers
│   │
│   ├── prisma/                           ← Database client
│   │   ├── prisma.service.ts             ← PrismaClient singleton
│   │   └── prisma.module.ts              ← Global Prisma module
│   │
│   ├── modules/                          ← Feature modules
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts        ← POST /auth/*
│   │   │   ├── auth.service.ts           ← Login, register, token ops
│   │   │   ├── totp.service.ts           ← TOTP generation + verification
│   │   │   ├── token.service.ts          ← JWT sign/verify, refresh rotation
│   │   │   ├── password.service.ts       ← bcrypt hash + compare
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts       ← Passport JWT strategy
│   │   │   │   └── refresh-token.strategy.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       ├── login.dto.ts
│   │   │       ├── refresh-token.dto.ts
│   │   │       ├── forgot-password.dto.ts
│   │   │       ├── reset-password.dto.ts
│   │   │       └── totp-verify.dto.ts
│   │   │
│   │   ├── workspace/
│   │   │   ├── workspace.module.ts
│   │   │   ├── workspace.controller.ts
│   │   │   ├── workspace.service.ts
│   │   │   ├── members.service.ts        ← Membership management
│   │   │   ├── invitations.service.ts    ← Invite + accept flow
│   │   │   └── dto/
│   │   │       ├── update-workspace.dto.ts
│   │   │       ├── invite-member.dto.ts
│   │   │       └── update-member.dto.ts
│   │   │
│   │   ├── teams/
│   │   │   ├── teams.module.ts
│   │   │   ├── teams.controller.ts       ← /departments + /teams routes
│   │   │   ├── departments.service.ts
│   │   │   ├── teams.service.ts
│   │   │   └── dto/
│   │   │       ├── create-department.dto.ts
│   │   │       └── create-team.dto.ts
│   │   │
│   │   ├── contacts/
│   │   │   ├── contacts.module.ts
│   │   │   ├── contacts.controller.ts
│   │   │   ├── contacts.service.ts       ← CRUD, search, filters
│   │   │   ├── contacts-import.service.ts ← CSV parse + bulk upsert
│   │   │   ├── contacts-export.service.ts ← CSV generation
│   │   │   ├── contacts-merge.service.ts  ← Merge + dedup logic
│   │   │   ├── timeline.service.ts        ← Timeline event writes
│   │   │   └── dto/
│   │   │       ├── create-contact.dto.ts
│   │   │       ├── update-contact.dto.ts
│   │   │       ├── filter-contacts.dto.ts
│   │   │       └── merge-contacts.dto.ts
│   │   │
│   │   ├── leads/
│   │   │   ├── leads.module.ts
│   │   │   ├── leads.controller.ts
│   │   │   ├── leads.service.ts
│   │   │   ├── pipelines.service.ts
│   │   │   ├── pipeline-stages.service.ts
│   │   │   ├── lead-scoring.service.ts   ← Auto-scoring rules engine
│   │   │   └── dto/
│   │   │       ├── create-lead.dto.ts
│   │   │       ├── update-lead.dto.ts
│   │   │       ├── move-lead-stage.dto.ts
│   │   │       ├── convert-lead.dto.ts
│   │   │       ├── create-pipeline.dto.ts
│   │   │       └── create-pipeline-stage.dto.ts
│   │   │
│   │   ├── deals/
│   │   │   ├── deals.module.ts
│   │   │   ├── deals.controller.ts
│   │   │   ├── deals.service.ts
│   │   │   ├── deal-pipelines.service.ts
│   │   │   ├── deal-forecast.service.ts  ← Revenue forecast calc
│   │   │   └── dto/
│   │   │       ├── create-deal.dto.ts
│   │   │       ├── update-deal.dto.ts
│   │   │       ├── close-deal.dto.ts
│   │   │       └── create-deal-pipeline.dto.ts
│   │   │
│   │   ├── whatsapp/
│   │   │   ├── whatsapp.module.ts
│   │   │   ├── conversations.controller.ts
│   │   │   ├── messages.controller.ts
│   │   │   ├── templates.controller.ts
│   │   │   ├── broadcasts.controller.ts
│   │   │   ├── quick-replies.controller.ts
│   │   │   ├── webhook.controller.ts     ← GET+POST /webhooks/whatsapp
│   │   │   ├── services/
│   │   │   │   ├── conversations.service.ts
│   │   │   │   ├── messages.service.ts
│   │   │   │   ├── broadcast.service.ts
│   │   │   │   ├── templates.service.ts
│   │   │   │   ├── quick-replies.service.ts
│   │   │   │   └── webhook-processor.service.ts
│   │   │   ├── adapters/
│   │   │   │   └── meta-whatsapp.adapter.ts ← Meta Graph API calls
│   │   │   └── dto/
│   │   │       ├── send-message.dto.ts
│   │   │       ├── schedule-message.dto.ts
│   │   │       ├── create-broadcast.dto.ts
│   │   │       ├── create-template.dto.ts
│   │   │       └── update-conversation.dto.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai-facade.service.ts      ← Orchestrates all AI use-cases
│   │   │   ├── providers/
│   │   │   │   ├── ai-provider.interface.ts ← IAIProvider port
│   │   │   │   ├── openai.provider.ts
│   │   │   │   ├── anthropic.provider.ts
│   │   │   │   ├── gemini.provider.ts
│   │   │   │   └── ai-provider.factory.ts ← Resolves provider at runtime
│   │   │   ├── prompts/
│   │   │   │   ├── suggest-reply.prompt.ts
│   │   │   │   ├── summarize.prompt.ts
│   │   │   │   ├── sentiment.prompt.ts
│   │   │   │   ├── qualify-lead.prompt.ts
│   │   │   │   ├── rewrite.prompt.ts
│   │   │   │   └── translate.prompt.ts
│   │   │   └── dto/
│   │   │       ├── suggest-reply.dto.ts
│   │   │       ├── summarize.dto.ts
│   │   │       ├── rewrite.dto.ts
│   │   │       ├── translate.dto.ts
│   │   │       ├── qualify-lead.dto.ts
│   │   │       └── ai-search.dto.ts
│   │   │
│   │   ├── tasks/
│   │   │   ├── tasks.module.ts
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   └── dto/
│   │   │       ├── create-task.dto.ts
│   │   │       └── update-task.dto.ts
│   │   │
│   │   ├── calendar/
│   │   │   ├── calendar.module.ts
│   │   │   ├── calendar.controller.ts
│   │   │   ├── calendar.service.ts
│   │   │   └── dto/
│   │   │       ├── create-event.dto.ts
│   │   │       └── update-event.dto.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── sales-report.service.ts
│   │   │   │   ├── revenue-report.service.ts
│   │   │   │   ├── agent-performance.service.ts
│   │   │   │   ├── pipeline-report.service.ts
│   │   │   │   ├── whatsapp-analytics.service.ts
│   │   │   │   └── report-export.service.ts
│   │   │   └── dto/
│   │   │       ├── report-filter.dto.ts
│   │   │       └── export-report.dto.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts  ← Create + deliver notifications
│   │   │   ├── email-notification.service.ts ← SMTP dispatch
│   │   │   ├── push-notification.service.ts  ← Web Push API
│   │   │   └── dto/
│   │   │       └── notification-preferences.dto.ts
│   │   │
│   │   ├── settings/
│   │   │   ├── settings.module.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   ├── api-keys.service.ts
│   │   │   └── dto/
│   │   │       ├── update-settings.dto.ts
│   │   │       ├── update-whatsapp-settings.dto.ts
│   │   │       ├── update-ai-settings.dto.ts
│   │   │       ├── update-smtp-settings.dto.ts
│   │   │       └── update-security-settings.dto.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   └── dashboard.service.ts      ← Aggregates KPI queries
│   │   │
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   ├── storage.controller.ts
│   │   │   └── storage.service.ts        ← S3 presign + serve
│   │   │
│   │   └── custom-fields/
│   │       ├── custom-fields.module.ts
│   │       ├── custom-fields.controller.ts
│   │       ├── custom-fields.service.ts
│   │       └── dto/
│   │           └── create-custom-field.dto.ts
│   │
│   ├── websocket/
│   │   ├── websocket.module.ts
│   │   ├── app.gateway.ts                ← Socket.IO gateway (auth + rooms)
│   │   └── events/
│   │       ├── message.events.ts         ← message:new, message:status
│   │       ├── conversation.events.ts    ← conversation:updated
│   │       ├── notification.events.ts    ← notification:new
│   │       └── kanban.events.ts          ← deal:updated, lead:updated
│   │
│   └── queue/
│       ├── queue.module.ts
│       └── processors/
│           ├── message-scheduler.processor.ts
│           ├── broadcast.processor.ts
│           ├── csv-import.processor.ts
│           ├── notification.processor.ts
│           ├── ai-analysis.processor.ts
│           └── report.processor.ts
│
├── prisma/
│   ├── schema.prisma                     ← Full database schema
│   ├── migrations/                       ← Versioned migration files
│   └── seed.ts                           ← Development seed data
│
├── test/
│   ├── unit/                             ← Jest unit tests (mirror src/)
│   ├── integration/                      ← Supertest API tests
│   └── fixtures/                         ← Shared test data factories
│
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.ts
├── package.json
└── Dockerfile
```

---

## 2. Frontend — `apps/web/`

```
apps/web/
├── src/
│   │
│   ├── app/                              ← Next.js App Router
│   │   ├── (auth)/                       ← Auth route group (no sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx               ← Centered card layout
│   │   │
│   │   ├── (dashboard)/                  ← Protected route group (with sidebar)
│   │   │   ├── layout.tsx               ← AppShell: sidebar + topnav
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx             ← Main dashboard
│   │   │   │
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx             ← Contact list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx         ← Contact detail / timeline
│   │   │   │   └── import/
│   │   │   │       └── page.tsx         ← CSV import wizard
│   │   │   │
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx             ← Kanban board (default view)
│   │   │   │   ├── list/
│   │   │   │   │   └── page.tsx         ← Table view
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         ← Lead detail
│   │   │   │
│   │   │   ├── deals/
│   │   │   │   ├── page.tsx             ← Kanban board
│   │   │   │   ├── list/
│   │   │   │   │   └── page.tsx         ← Table view
│   │   │   │   ├── forecast/
│   │   │   │   │   └── page.tsx         ← Revenue forecast
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         ← Deal detail
│   │   │   │
│   │   │   ├── inbox/
│   │   │   │   ├── layout.tsx           ← Two-panel inbox layout
│   │   │   │   ├── page.tsx             ← Empty state (no conversation selected)
│   │   │   │   └── [conversationId]/
│   │   │   │       └── page.tsx         ← Active conversation
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx             ← Task list / kanban
│   │   │   │   └── calendar/
│   │   │   │       └── page.tsx         ← Tasks in calendar view
│   │   │   │
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx             ← Full calendar
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx             ← Reports overview
│   │   │   │   ├── sales/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── revenue/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── agents/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── pipeline/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── whatsapp/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── team/
│   │   │   │   ├── page.tsx             ← Members list
│   │   │   │   ├── departments/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── teams/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── layout.tsx           ← Settings sidebar layout
│   │   │       ├── profile/
│   │   │       │   └── page.tsx         ← Personal profile
│   │   │       ├── workspace/
│   │   │       │   └── page.tsx         ← Company profile + branding
│   │   │       ├── whatsapp/
│   │   │       │   └── page.tsx         ← WAB integration
│   │   │       ├── ai/
│   │   │       │   └── page.tsx         ← AI provider config
│   │   │       ├── smtp/
│   │   │       │   └── page.tsx         ← Email SMTP config
│   │   │       ├── team/
│   │   │       │   └── page.tsx         ← Invite + manage members
│   │   │       ├── api-keys/
│   │   │       │   └── page.tsx
│   │   │       ├── audit-log/
│   │   │       │   └── page.tsx
│   │   │       └── security/
│   │   │           └── page.tsx
│   │   │
│   │   ├── api/                         ← Next.js API routes (thin proxies)
│   │   │   └── auth/
│   │   │       └── [...nextauth]/       ← (optional OAuth callback)
│   │   │
│   │   ├── layout.tsx                   ← Root HTML layout (fonts, metadata)
│   │   ├── not-found.tsx                ← Custom 404 page
│   │   ├── error.tsx                    ← Global error boundary
│   │   └── loading.tsx                  ← Root loading state
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                          ← shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── table.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── sheet.tsx               ← Side drawer
│   │   │   ├── command.tsx             ← Command palette
│   │   │   ├── calendar.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── toast.tsx
│   │   │   └── index.ts                ← Barrel export
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            ← Root layout: sidebar + topnav + main
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx         ← Collapsible sidebar
│   │   │   │   ├── SidebarNav.tsx      ← Navigation items
│   │   │   │   ├── SidebarItem.tsx     ← Single nav item with badge
│   │   │   │   └── SidebarFooter.tsx   ← User avatar + logout
│   │   │   ├── TopNav/
│   │   │   │   ├── TopNav.tsx          ← Top navigation bar
│   │   │   │   ├── SearchCommand.tsx   ← Global ⌘K search
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   └── UserMenu.tsx        ← Avatar + dropdown
│   │   │   ├── SettingsSidebar.tsx     ← Settings page sub-nav
│   │   │   ├── PageHeader.tsx          ← Title + breadcrumbs + actions
│   │   │   └── AuthLayout.tsx          ← Centered auth card layout
│   │   │
│   │   ├── shared/                     ← Reusable feature-agnostic components
│   │   │   ├── DataTable/
│   │   │   │   ├── DataTable.tsx       ← Sortable, filterable table
│   │   │   │   ├── DataTableToolbar.tsx
│   │   │   │   ├── DataTablePagination.tsx
│   │   │   │   └── DataTableColumnHeader.tsx
│   │   │   ├── KanbanBoard/
│   │   │   │   ├── KanbanBoard.tsx     ← DnD Kanban container
│   │   │   │   ├── KanbanColumn.tsx    ← Stage column + card list
│   │   │   │   └── KanbanCard.tsx      ← Draggable card
│   │   │   ├── FileUpload/
│   │   │   │   ├── FileUpload.tsx      ← Dropzone + progress
│   │   │   │   └── MediaPreview.tsx    ← Image/PDF/video preview
│   │   │   ├── EmojiPicker.tsx
│   │   │   ├── RichTextEditor.tsx      ← Tiptap-based (notes, descriptions)
│   │   │   ├── FilterBuilder.tsx       ← Dynamic AND/OR filter builder
│   │   │   ├── InfiniteScroll.tsx      ← Cursor-based infinite list
│   │   │   ├── ConfirmDialog.tsx       ← Generic confirm modal
│   │   │   ├── EmptyState.tsx          ← Illustration + CTA
│   │   │   ├── LoadingSkeleton.tsx     ← Configurable skeleton blocks
│   │   │   ├── StatusBadge.tsx         ← Color-coded status pill
│   │   │   ├── PriorityBadge.tsx
│   │   │   ├── UserAvatar.tsx          ← Avatar with fallback initials
│   │   │   ├── UserSelect.tsx          ← Searchable user dropdown
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   ├── AIBadge.tsx             ← "AI" indicator label
│   │   │   └── ChartCard.tsx           ← Recharts wrapper with header
│   │   │
│   │   └── features/                   ← Feature-specific components
│   │       │
│   │       ├── dashboard/
│   │       │   ├── KpiCard.tsx         ← Revenue/contact/deal metric card
│   │       │   ├── SalesTrendChart.tsx
│   │       │   ├── CustomerGrowthChart.tsx
│   │       │   ├── ConversionFunnel.tsx
│   │       │   ├── TeamPerformanceTable.tsx
│   │       │   ├── ActivityFeed.tsx
│   │       │   └── UpcomingTasksWidget.tsx
│   │       │
│   │       ├── contacts/
│   │       │   ├── ContactCard.tsx
│   │       │   ├── ContactForm.tsx       ← Create / edit drawer
│   │       │   ├── ContactTimeline.tsx
│   │       │   ├── ContactNotes.tsx
│   │       │   ├── CustomFieldsSection.tsx
│   │       │   ├── TagSelector.tsx
│   │       │   ├── ImportWizard.tsx
│   │       │   └── DuplicatesMergeModal.tsx
│   │       │
│   │       ├── leads/
│   │       │   ├── LeadCard.tsx          ← Kanban card
│   │       │   ├── LeadForm.tsx
│   │       │   ├── LeadScoreBadge.tsx
│   │       │   ├── PipelineSelector.tsx
│   │       │   └── ConvertLeadModal.tsx
│   │       │
│   │       ├── deals/
│   │       │   ├── DealCard.tsx
│   │       │   ├── DealForm.tsx
│   │       │   ├── DealForecastChart.tsx
│   │       │   ├── DealTimeline.tsx
│   │       │   └── CloseDealModal.tsx
│   │       │
│   │       ├── inbox/
│   │       │   ├── ConversationList/
│   │       │   │   ├── ConversationList.tsx
│   │       │   │   ├── ConversationItem.tsx  ← Row in left panel
│   │       │   │   └── ConversationFilters.tsx
│   │       │   ├── ChatWindow/
│   │       │   │   ├── ChatWindow.tsx        ← Right panel container
│   │       │   │   ├── ChatHeader.tsx        ← Contact name + assign + status
│   │       │   │   ├── MessageList.tsx       ← Virtualized message scroll
│   │       │   │   ├── MessageBubble.tsx     ← Single message (in/out)
│   │       │   │   ├── MessageMedia.tsx      ← Image/audio/video/doc renderer
│   │       │   │   ├── MessageComposer.tsx   ← Input + emoji + attach + send
│   │       │   │   ├── TypingIndicator.tsx
│   │       │   │   ├── QuickRepliesPanel.tsx
│   │       │   │   ├── TemplatePickerModal.tsx
│   │       │   │   ├── ScheduleMessageModal.tsx
│   │       │   │   └── InternalNoteInput.tsx
│   │       │   └── ContactSidebar/
│   │       │       ├── ContactSidebar.tsx    ← Collapsible right panel
│   │       │       ├── ContactInfo.tsx
│   │       │       ├── RelatedLeads.tsx
│   │       │       ├── RelatedDeals.tsx
│   │       │       └── RelatedTasks.tsx
│   │       │
│   │       ├── ai/
│   │       │   ├── AISuggestReply.tsx        ← Suggestion cards panel
│   │       │   ├── AIConversationSummary.tsx
│   │       │   ├── AIRewriteButton.tsx       ← Inline rewrite action
│   │       │   ├── AISentimentBadge.tsx
│   │       │   ├── AIInsightsPanel.tsx       ← Dashboard insights
│   │       │   └── AISearchBar.tsx
│   │       │
│   │       ├── tasks/
│   │       │   ├── TaskCard.tsx
│   │       │   ├── TaskForm.tsx
│   │       │   └── TaskKanban.tsx
│   │       │
│   │       ├── calendar/
│   │       │   ├── FullCalendar.tsx      ← Month/week/day views
│   │       │   ├── EventForm.tsx
│   │       │   └── EventPopover.tsx
│   │       │
│   │       ├── reports/
│   │       │   ├── SalesReportView.tsx
│   │       │   ├── RevenueReportView.tsx
│   │       │   ├── AgentPerformanceView.tsx
│   │       │   ├── PipelineReportView.tsx
│   │       │   └── WhatsAppAnalyticsView.tsx
│   │       │
│   │       └── settings/
│   │           ├── WhatsAppSettingsForm.tsx
│   │           ├── AISettingsForm.tsx
│   │           ├── SMTPSettingsForm.tsx
│   │           ├── SecuritySettingsForm.tsx
│   │           ├── ApiKeysList.tsx
│   │           └── AuditLogTable.tsx
│   │
│   ├── hooks/                            ← Custom React hooks
│   │   ├── useAuth.ts                    ← Auth state + token refresh
│   │   ├── useWorkspace.ts               ← Current workspace context
│   │   ├── useSocket.ts                  ← Socket.IO connection + events
│   │   ├── useNotifications.ts           ← Real-time notification state
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts              ← Responsive breakpoints
│   │   ├── useIntersectionObserver.ts    ← Infinite scroll trigger
│   │   ├── useClipboard.ts
│   │   └── useTheme.ts                   ← Dark/light mode toggle
│   │
│   ├── stores/                           ← Zustand global stores
│   │   ├── auth.store.ts                 ← User, workspace, tokens
│   │   ├── ui.store.ts                   ← Sidebar, modals, theme
│   │   ├── notification.store.ts         ← Unread count, notification list
│   │   └── inbox.store.ts                ← Active conversation, typing state
│   │
│   ├── queries/                          ← React Query query/mutation hooks
│   │   ├── auth.queries.ts
│   │   ├── contacts.queries.ts
│   │   ├── leads.queries.ts
│   │   ├── deals.queries.ts
│   │   ├── conversations.queries.ts
│   │   ├── messages.queries.ts
│   │   ├── tasks.queries.ts
│   │   ├── calendar.queries.ts
│   │   ├── reports.queries.ts
│   │   ├── ai.queries.ts
│   │   ├── notifications.queries.ts
│   │   ├── settings.queries.ts
│   │   └── dashboard.queries.ts
│   │
│   ├── lib/                              ← Utility and client setup
│   │   ├── api-client.ts                 ← Axios instance with interceptors
│   │   ├── socket-client.ts              ← Socket.IO client singleton
│   │   ├── query-client.ts               ← React Query client config
│   │   ├── auth.ts                       ← Token storage helpers
│   │   ├── cn.ts                         ← clsx + tailwind-merge helper
│   │   ├── format.ts                     ← Date, currency, number formatters
│   │   ├── validators.ts                 ← Zod schemas for forms
│   │   └── constants.ts                  ← App-wide constants
│   │
│   ├── styles/
│   │   ├── globals.css                   ← Tailwind directives + CSS vars
│   │   └── themes/
│   │       ├── light.css                 ← Light theme CSS variables
│   │       └── dark.css                  ← Dark theme CSS variables
│   │
│   └── types/                            ← Frontend-only TypeScript types
│       ├── api.types.ts                  ← API response types (auto-gen from shared-types)
│       ├── form.types.ts
│       └── ui.types.ts
│
├── public/
│   ├── icons/                            ← PWA icons
│   ├── images/                           ← Static images (logos, illustrations)
│   └── manifest.json                     ← PWA manifest
│
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── jest.config.ts
├── playwright.config.ts
├── package.json
└── Dockerfile
```

---

## 3. Shared Packages

### `packages/shared-types/`

```
packages/shared-types/
├── src/
│   ├── entities/             ← Mirror of Prisma models as plain TS interfaces
│   │   ├── user.ts
│   │   ├── workspace.ts
│   │   ├── contact.ts
│   │   ├── lead.ts
│   │   ├── deal.ts
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   ├── task.ts
│   │   └── notification.ts
│   ├── api/                  ← Request/response DTOs shared between api and web
│   │   ├── auth.types.ts
│   │   ├── contacts.types.ts
│   │   ├── leads.types.ts
│   │   ├── deals.types.ts
│   │   ├── messages.types.ts
│   │   ├── ai.types.ts
│   │   └── reports.types.ts
│   ├── enums.ts              ← Re-export of all enums (mirrors Prisma enums)
│   └── index.ts
├── tsconfig.json
└── package.json
```

### `packages/config/`

```
packages/config/
├── eslint-preset.js          ← Shared ESLint config
├── prettier.config.js        ← Shared Prettier config
├── tsconfig.base.json        ← Base tsconfig (strict mode)
└── package.json
```

---

## 4. Infrastructure

### `infra/docker/`

```
infra/docker/
├── api.Dockerfile            ← Multi-stage: build → production
├── web.Dockerfile            ← Multi-stage: build → production
└── worker.Dockerfile         ← Inherits api image, different CMD
```

### `infra/nginx/`

```
infra/nginx/
├── nginx.conf                ← Main nginx config
├── conf.d/
│   ├── nexacrm.conf          ← Upstream routing: web + api + ws
│   └── ssl.conf              ← TLS settings (TLS 1.2/1.3, ciphers)
└── snippets/
    ├── security-headers.conf ← CSP, HSTS, X-Frame-Options
    └── rate-limit.conf       ← Nginx-level rate limiting zones
```

### `infra/scripts/`

```
infra/scripts/
├── seed-dev.ts               ← Creates demo workspace, users, contacts
├── migrate-deploy.sh         ← Production migration runner
├── backup-db.sh              ← pg_dump to S3
└── health-check.sh           ← Pre-deploy smoke test
```

### `.github/workflows/`

```
.github/workflows/
├── ci.yml                    ← Lint + type-check + test on PR
├── deploy-staging.yml        ← Build + push + deploy on merge to main
└── deploy-production.yml     ← Manual trigger with approval gate
```

---

## 5. File Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| NestJS files | `kebab-case.type.ts` | `contacts.service.ts` |
| React components | `PascalCase.tsx` | `ContactForm.tsx` |
| React hooks | `camelCase.ts` with `use` prefix | `useAuth.ts` |
| Zustand stores | `camelCase.store.ts` | `auth.store.ts` |
| Query hooks | `camelCase.queries.ts` | `contacts.queries.ts` |
| Types/interfaces | `PascalCase` | `interface CreateContactDto` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_IMPORT_ROWS = 10000` |
| CSS variables | `--nexacrm-primary` | kebab-case with prefix |
| Env variables | `SCREAMING_SNAKE_CASE` | `DATABASE_URL` |

---

## 6. Key Architectural Files Explained

| File | Purpose |
|------|---------|
| `apps/api/src/main.ts` | Bootstrap NestJS, register global pipe/filter/interceptor, enable CORS, start Swagger |
| `apps/api/src/app.module.ts` | Import all feature modules; configure global Redis, throttler, event emitter |
| `apps/api/src/prisma/prisma.service.ts` | Extends PrismaClient; adds `onModuleInit` connect + `enableShutdownHooks` |
| `apps/api/src/common/guards/workspace.guard.ts` | Reads `X-Workspace-ID`, verifies user membership, attaches to `request.workspace` |
| `apps/api/src/common/guards/roles.guard.ts` | Reads `@Roles()` metadata; compares against `request.workspace.role` |
| `apps/web/src/lib/api-client.ts` | Axios instance; request interceptor attaches Bearer token + workspace ID; response interceptor auto-refreshes on 401 |
| `apps/web/src/lib/socket-client.ts` | Socket.IO client; connects on auth, rejoins rooms after reconnect |
| `apps/web/src/app/(dashboard)/layout.tsx` | Server component; redirects unauthenticated users; renders AppShell |
| `apps/web/src/stores/auth.store.ts` | Zustand store; persists user + workspace to localStorage; exposes `logout()` |
| `apps/web/src/queries/conversations.queries.ts` | React Query hooks for inbox; integrates with Socket.IO to update cache on real-time events |
