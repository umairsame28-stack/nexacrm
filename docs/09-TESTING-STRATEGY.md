# Testing Strategy
## NexaCRM — AI-Powered WhatsApp CRM SaaS

**Version:** 1.0 | **Date:** August 4, 2026

---

## 1. Testing Philosophy

Testing in NexaCRM follows the **Testing Trophy** model (adapted from Kent C. Dodds):

```
          ╱╲
         ╱E2E╲          ← Few, high-value flows (Playwright)
        ╱──────╲
       ╱Integr. ╲       ← Primary confidence layer (Supertest)
      ╱────────────╲
     ╱  Unit Tests  ╲   ← Fast feedback on pure logic
    ╱────────────────╲
   ╱  Static Analysis ╲ ← TypeScript + ESLint (always-on)
  ╱────────────────────╲
```

**Principles:**
1. Test behavior, not implementation. Assert what the system does, not how.
2. Integration tests are the primary confidence layer — they test real DB operations, real HTTP, real queue interactions.
3. Unit tests cover pure business logic: scoring, formatting, validation, crypto, prompt building.
4. E2E tests cover the critical user flows that represent real business value.
5. Mocking at boundaries only: mock external services (Meta API, AI providers, SMTP), never mock the database in integration tests.
6. Tests run in CI on every pull request. No merge without green tests.

---

## 2. Test Types & Tooling

| Layer | Tool | Scope | Target Coverage |
|-------|------|-------|----------------|
| Static Analysis | TypeScript 5.5 (strict) | All source files | 100% — enforced by CI |
| Linting | ESLint + Prettier | All source files | 100% — enforced by CI |
| Unit | Jest + ts-jest | Domain logic, services, utilities | ≥ 80% statement coverage |
| Integration (API) | Jest + Supertest + test PG | All API endpoints | All critical paths covered |
| Component | Jest + React Testing Library | Shared UI components | Core interactions |
| E2E | Playwright | Critical user flows | 20 flows |
| Load | k6 | API + WebSocket under concurrency | SLA validated |
| Security | OWASP ZAP + manual | Auth, injection, CSRF | Zero high-severity findings |
| Accessibility | axe-core (automated) | All pages | Zero critical violations |


---

## 3. Backend Unit Tests

### 3.1 Configuration

```typescript
// apps/api/jest.config.ts
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
  coverageThresholds: {
    global: { statements: 80, branches: 75, functions: 80, lines: 80 }
  },
  testEnvironment: 'node',
};
```

### 3.2 What to Unit Test

**Services with pure logic (no DB dependency):**

```typescript
// lead-scoring.service.spec.ts
describe('LeadScoringService', () => {
  describe('calculateScore', () => {
    it('returns 100 for a lead with all qualifying signals', () => {
      const signals = { hasEmail: true, hasCompany: true, recentActivity: true, highValue: true };
      expect(service.calculateScore(signals)).toBe(100);
    });

    it('returns 0 for a lead with no signals', () => {
      expect(service.calculateScore({})).toBe(0);
    });

    it('clamps score between 0 and 100', () => {
      expect(service.calculateScore({ tooManySignals: true })).toBeLessThanOrEqual(100);
    });
  });
});
```

**Utility functions:**

```typescript
// phone.util.spec.ts
describe('PhoneUtil', () => {
  it('formats +14155552671 as valid E.164', () => {
    expect(normalizePhone('+14155552671')).toBe('+14155552671');
  });
  it('rejects non-E.164 phone number', () => {
    expect(() => normalizePhone('555-1234')).toThrow(InvalidPhoneException);
  });
});

// crypto.util.spec.ts
describe('CryptoUtil', () => {
  it('round-trips encrypt → decrypt', () => {
    const plain = 'super-secret-key';
    const encrypted = encrypt(plain, TEST_SECRET);
    expect(decrypt(encrypted, TEST_SECRET)).toBe(plain);
  });
  it('different encryptions of same plaintext produce different ciphertext', () => {
    expect(encrypt('test', TEST_SECRET)).not.toBe(encrypt('test', TEST_SECRET));
  });
});
```

**Domain value objects:**

```typescript
// pagination.util.spec.ts
describe('PaginationUtil', () => {
  it('encodes and decodes a cursor correctly', () => {
    const cursor = encodeCursor({ id: 'uuid-123', createdAt: '2026-08-04' });
    expect(decodeCursor(cursor)).toEqual({ id: 'uuid-123', createdAt: '2026-08-04' });
  });
});
```

**AI prompt builders:**

```typescript
// suggest-reply.prompt.spec.ts
describe('SuggestReplyPrompt', () => {
  it('includes last 10 messages in the prompt context', () => {
    const messages = Array.from({ length: 15 }, (_, i) => mockMessage(i));
    const prompt = buildSuggestReplyPrompt(messages);
    expect(prompt.messages.length).toBeLessThanOrEqual(10);
  });

  it('includes contact name in the system prompt', () => {
    const prompt = buildSuggestReplyPrompt([], { contactName: 'Maria' });
    expect(prompt.system).toContain('Maria');
  });
});
```

### 3.3 Mocking Pattern

External services are mocked at the module boundary using Jest manual mocks:

```typescript
// In test files
jest.mock('../adapters/meta-whatsapp.adapter');
jest.mock('../providers/openai.provider');

const mockWhatsApp = jest.mocked(MetaWhatsAppAdapter);
mockWhatsApp.prototype.sendMessage.mockResolvedValue({ id: 'wamid.test123' });
```

NestJS modules use `Test.createTestingModule` with provider overrides:

```typescript
const moduleRef = await Test.createTestingModule({
  providers: [
    MessagesService,
    { provide: MetaWhatsAppAdapter, useValue: mockWhatsAppAdapter },
    { provide: PrismaService, useValue: mockPrismaService },
  ],
}).compile();
```

---

## 4. Backend Integration Tests

Integration tests spin up a **real PostgreSQL test database** and make **real HTTP requests** against the full NestJS application. External services (Meta API, AI, SMTP, S3) are mocked at the adapter boundary.

### 4.1 Test Database Setup

```typescript
// test/setup.ts
beforeAll(async () => {
  // Point to TEST database URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  await execSync('npx prisma migrate deploy');
});

beforeEach(async () => {
  // Clean slate per test: truncate all tables in dependency order
  await prisma.$executeRaw`TRUNCATE TABLE messages, conversations, leads,
    deals, contacts, workspace_members, workspaces, users RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### 4.2 Test Factory Pattern

```typescript
// test/fixtures/factories.ts
export const createTestUser = async (overrides = {}) => {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      passwordHash: await bcrypt.hash('Test1234!', 12),
      status: 'ACTIVE',
      emailVerified: true,
      ...overrides,
    },
  });
};

export const createTestWorkspace = async (userId: string, role = 'ADMINISTRATOR') => {
  const workspace = await prisma.workspace.create({
    data: { name: 'Test Corp', slug: `test-${Date.now()}`, timezone: 'UTC', currency: 'USD' },
  });
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId, role },
  });
  return workspace;
};

export const createAuthenticatedAgent = async (app: INestApplication) => {
  const user = await createTestUser();
  const workspace = await createTestWorkspace(user.id);
  const { body } = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: 'Test1234!' });
  return { user, workspace, accessToken: body.accessToken };
};
```

### 4.3 Integration Test Examples

```typescript
// contacts.integration.spec.ts
describe('POST /contacts', () => {
  it('creates a contact and returns 201', async () => {
    const { accessToken, workspace } = await createAuthenticatedAgent(app);

    const res = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Workspace-ID', workspace.id)
      .send({ firstName: 'Maria', phone: '+5511999998888' });

    expect(res.status).toBe(201);
    expect(res.body.phone).toBe('+5511999998888');
    expect(res.body.workspaceId).toBe(workspace.id);

    const dbRecord = await prisma.contact.findUnique({ where: { id: res.body.id } });
    expect(dbRecord).not.toBeNull();
  });

  it('rejects duplicate phone in same workspace with 409', async () => {
    const { accessToken, workspace } = await createAuthenticatedAgent(app);
    await createTestContact({ workspaceId: workspace.id, phone: '+5511999998888' });

    const res = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Workspace-ID', workspace.id)
      .send({ firstName: 'Other', phone: '+5511999998888' });

    expect(res.status).toBe(409);
  });

  it('returns 401 without token', async () => {
    const res = await request(app.getHttpServer())
      .post('/contacts')
      .send({ firstName: 'Test', phone: '+15551234567' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for VIEWER role', async () => {
    const { accessToken, workspace } = await createAuthenticatedAgent(app, 'VIEWER');
    const res = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Workspace-ID', workspace.id)
      .send({ firstName: 'Test', phone: '+15551234567' });
    expect(res.status).toBe(403);
  });

  it('rejects invalid E.164 phone with 400', async () => {
    const { accessToken, workspace } = await createAuthenticatedAgent(app);
    const res = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Workspace-ID', workspace.id)
      .send({ firstName: 'Test', phone: '555-1234' });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('phone');
  });
});

// webhook.integration.spec.ts
describe('POST /webhooks/whatsapp', () => {
  it('processes a valid inbound text message', async () => {
    const workspace = await createWorkspaceWithWhatsAppConfig();
    const payload = buildMetaWebhookPayload({ type: 'text', body: 'Hello!' });
    const signature = computeHmacSha256(payload, workspace.wabWebhookSecret);

    const res = await request(app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('X-Hub-Signature-256', `sha256=${signature}`)
      .send(payload);

    expect(res.status).toBe(200);

    const message = await prisma.message.findFirst({
      where: { whatsappMsgId: payload.entry[0].changes[0].value.messages[0].id },
    });
    expect(message).not.toBeNull();
    expect(message.direction).toBe('INBOUND');
    expect(message.body).toBe('Hello!');
  });

  it('rejects invalid HMAC signature with 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('X-Hub-Signature-256', 'sha256=invalidsignature')
      .send({ entry: [] });
    expect(res.status).toBe(403);
  });

  it('is idempotent: duplicate message IDs processed only once', async () => {
    const payload = buildMetaWebhookPayload({ type: 'text', body: 'Hi' });
    const signature = computeHmacSha256(payload, WEBHOOK_SECRET);

    await request(app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('X-Hub-Signature-256', `sha256=${signature}`)
      .send(payload);
    await request(app.getHttpServer())
      .post('/webhooks/whatsapp')
      .set('X-Hub-Signature-256', `sha256=${signature}`)
      .send(payload);

    const count = await prisma.message.count({
      where: { whatsappMsgId: payload.entry[0].changes[0].value.messages[0].id },
    });
    expect(count).toBe(1); // Not 2
  });
});
```

---

## 5. Frontend Component Tests

Shared components are tested with React Testing Library to verify behavior, not markup.

```typescript
// DataTable.test.tsx
describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    render(<DataTable columns={mockColumns} data={[]} emptyMessage="No contacts" />);
    expect(screen.getByText('No contacts')).toBeInTheDocument();
  });

  it('calls onRowClick with row data when row clicked', async () => {
    const onRowClick = jest.fn();
    render(<DataTable columns={mockColumns} data={mockData} onRowClick={onRowClick} />);
    await userEvent.click(screen.getByText('Maria Garcia'));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });
});

// MessageBubble.test.tsx
describe('MessageBubble', () => {
  it('renders inbound message on the left', () => {
    const { container } = render(
      <MessageBubble message={mockInboundMessage} />
    );
    expect(container.firstChild).toHaveClass('justify-start');
  });

  it('shows double blue ticks for read outbound message', () => {
    render(<MessageBubble message={{ ...mockOutboundMessage, status: 'READ' }} />);
    expect(screen.getByTestId('read-receipt')).toHaveClass('text-blue-500');
  });

  it('renders image with expand button', () => {
    render(<MessageBubble message={mockImageMessage} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByLabelText('Expand image')).toBeInTheDocument();
  });
});

// KanbanBoard.test.tsx
describe('KanbanBoard', () => {
  it('renders all stages as columns', () => {
    render(<KanbanBoard stages={mockStages} items={mockLeads} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
  });

  it('calls onItemMove when card dropped into new column', async () => {
    const onItemMove = jest.fn();
    // DnD testing via @testing-library/user-event keyboard drag simulation
    render(<KanbanBoard stages={mockStages} items={mockLeads} onItemMove={onItemMove} />);
    // Simulate keyboard drag: Space to grab, ArrowRight to move, Space to drop
    const card = screen.getByText('Enterprise Demo');
    card.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard(' ');
    expect(onItemMove).toHaveBeenCalled();
  });
});
```

---

## 6. End-to-End Tests (Playwright)

### 6.1 Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
```

### 6.2 Critical User Flows

```typescript
// e2e/auth.spec.ts
test('user can register a new workspace and log in', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="firstName"]', 'Sarah');
  await page.fill('[name="email"]', `sarah-${Date.now()}@test.com`);
  await page.fill('[name="password"]', 'Str0ng!Pass#2026');
  await page.fill('[name="workspaceName"]', 'Test Corp');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Good morning, Sarah')).toBeVisible();
});

test('login with wrong password shows error', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@test.com');
  await page.fill('[name="password"]', 'wrongpassword');
  await page.click('[type="submit"]');
  await expect(page.getByText('Invalid email or password')).toBeVisible();
});

// e2e/contacts.spec.ts
test('agent can create, view, and delete a contact', async ({ page }) => {
  await loginAs(page, 'agent');
  await page.goto('/contacts');
  await page.click('text=Add Contact');
  await page.fill('[name="firstName"]', 'Carlos');
  await page.fill('[name="phone"]', '+5511999990000');
  await page.click('text=Save Contact');
  await expect(page.getByText('Contact saved successfully')).toBeVisible();
  await expect(page.getByText('Carlos')).toBeVisible();

  // View detail
  await page.click('text=Carlos');
  await expect(page).toHaveURL(/\/contacts\//);
  await expect(page.getByText('+5511999990000')).toBeVisible();
});

// e2e/inbox.spec.ts
test('agent can see real-time message in inbox', async ({ page, context }) => {
  await loginAs(page, 'agent');
  await page.goto('/inbox');

  // Simulate webhook delivery in a separate context
  await context.request.post('/webhooks/whatsapp', {
    data: buildWebhookPayload({ body: 'Hello from Playwright!' }),
    headers: { 'X-Hub-Signature-256': computeTestSignature(...) },
  });

  // Message should appear in inbox within 2 seconds
  await expect(page.getByText('Hello from Playwright!')).toBeVisible({ timeout: 2000 });
});

// e2e/leads-kanban.spec.ts
test('agent can move a lead between stages on Kanban', async ({ page }) => {
  await loginAs(page, 'agent');
  await page.goto('/leads');
  await expect(page.getByTestId('kanban-column-new')).toBeVisible();

  const card = page.getByText('Enterprise Demo Request');
  const targetColumn = page.getByTestId('kanban-column-qualified');

  // Drag card from New to Qualified
  await card.dragTo(targetColumn);
  await expect(targetColumn.getByText('Enterprise Demo Request')).toBeVisible();
  await expect(page.getByText('Stage changed')).toBeVisible(); // toast
});

// e2e/deals.spec.ts
test('manager can mark a deal as won', async ({ page }) => {
  await loginAs(page, 'manager');
  await page.goto('/deals');
  await page.click('text=Acme Corp — Enterprise Plan');
  await page.click('text=Mark as Won');
  await page.fill('[name="closedAt"]', '2026-08-04');
  await page.click('text=Confirm');
  await expect(page.getByText('Deal won')).toBeVisible();
  await expect(page.getByTestId('deal-status')).toHaveText('Won');
});
```

### 6.3 The 20 Critical E2E Flows

| # | Flow | Role |
|---|------|------|
| 1 | Register + workspace setup | — |
| 2 | Login + 2FA TOTP | Any |
| 3 | Forgot / reset password | Any |
| 4 | Invite team member + accept | Admin |
| 5 | Create + edit + delete contact | Agent |
| 6 | Import CSV contacts (100 rows) | Manager |
| 7 | Merge duplicate contacts | Manager |
| 8 | Create lead → move through pipeline | Agent |
| 9 | Convert lead to deal | Agent |
| 10 | Create deal → mark won | Manager |
| 11 | Receive inbound WhatsApp message (real-time) | Agent |
| 12 | Send text message from inbox | Agent |
| 13 | Send template message | Agent |
| 14 | Use AI suggest-reply and send suggestion | Agent |
| 15 | Schedule a message | Agent |
| 16 | Broadcast to filtered list | Manager |
| 17 | Create task + complete task | Agent |
| 18 | Create calendar event + link to deal | Manager |
| 19 | View sales report + export PDF | Manager |
| 20 | Configure WhatsApp settings | Admin |

---

## 7. Load Tests (k6)

```javascript
// load-tests/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const responseTime = new Trend('response_time');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 500 },   // Ramp up to 500 users
    { duration: '3m', target: 500 },   // Hold at 500 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests < 200ms
    http_req_failed:   ['rate<0.01'],  // Error rate < 1%
    errors:            ['rate<0.01'],
  },
};

export default function () {
  const BASE = __ENV.BASE_URL || 'https://staging.nexacrm.io';

  // Dashboard endpoint (most common, should be cached)
  const dashRes = http.get(`${BASE}/api/v1/dashboard`, {
    headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}`, 'X-Workspace-ID': __ENV.WORKSPACE_ID },
  });
  check(dashRes, { 'dashboard 200': (r) => r.status === 200 });
  responseTime.add(dashRes.timings.duration);
  errorRate.add(dashRes.status !== 200);

  // Contact list (DB query with pagination)
  const contactsRes = http.get(`${BASE}/api/v1/contacts?limit=25`, {
    headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}`, 'X-Workspace-ID': __ENV.WORKSPACE_ID },
  });
  check(contactsRes, { 'contacts 200': (r) => r.status === 200 });

  sleep(1);
}
```

```javascript
// load-tests/websocket-load.js — 500 concurrent WebSocket connections
import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 500,
  duration: '5m',
  thresholds: { ws_session_duration: ['p(95)<5000'] },
};

export default function () {
  const url = `wss://staging.nexacrm.io?token=${__ENV.TEST_TOKEN}`;
  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => socket.send(JSON.stringify({ event: 'typing:start', data: { conversationId: 'test' } })));
    socket.on('message', (data) => check(JSON.parse(data), { 'valid event': (m) => m.event !== undefined }));
    socket.setTimeout(() => socket.close(), 10000);
  });
  check(res, { 'ws connected': (r) => r && r.status === 101 });
}
```

---

## 8. Security Testing

### 8.1 OWASP Top 10 Checklist

| OWASP Risk | Test | Expected Result |
|------------|------|----------------|
| A01 Broken Access Control | SALES_AGENT calls ADMIN-only endpoint | 403 |
| A01 Tenant isolation | User A requests workspace B's contacts | 403 |
| A02 Crypto Failures | Read encrypted AI API key from DB | Encrypted bytes (not plaintext) |
| A03 Injection | SQL injection in search param: `' OR 1=1--` | Parameterized query — safe |
| A03 XSS | Contact name: `<script>alert(1)</script>` | Sanitized on output |
| A04 Insecure Design | Request password reset for non-existent email | 200 (no enumeration) |
| A05 Security Misconfiguration | HTTP (not HTTPS) request | 301 redirect to HTTPS |
| A07 Auth Failures | Brute-force login (6th attempt) | 429 Too Many Requests |
| A07 Auth Failures | Use revoked refresh token | 401 |
| A07 Auth Failures | Tampered JWT signature | 401 |
| A08 Integrity Failures | Replay webhook with same message ID | Idempotent — 200, no duplicate |
| A08 Integrity Failures | Webhook with wrong HMAC signature | 403 |
| A09 Logging Failures | Failed login attempt | Written to audit_log |
| A10 SSRF | URL in API request pointing to internal metadata service | Blocked / not fetched |

### 8.2 Automated Security Scan

```bash
# OWASP ZAP baseline scan against staging
docker run -v $(pwd):/zap/wrk/:rw \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t https://staging.nexacrm.io \
  -g gen.conf \
  -r zap-report.html

# Expected: Zero High-severity findings
# Acceptable: Medium findings documented with risk acceptance
```

### 8.3 Manual Security Tests

```
AUTH:
□ JWT token from workspace A cannot access workspace B's data
□ Expired JWT returns 401 (not 403)
□ JWT signed with wrong key returns 401
□ Refresh token cookie cannot be read by JavaScript (httpOnly)
□ Login rate limit resets after 15 minutes
□ 2FA bypass attempts (submit backup code after TOTP disabled) fail

API:
□ All endpoints return 401 without Authorization header
□ All endpoints return 403 without X-Workspace-ID header
□ Mass assignment: extra fields in PATCH body are ignored
□ Negative pagination limit handled gracefully (400)
□ Extremely large payload (>1MB) returns 413

FILES:
□ Pre-signed S3 URL from workspace A cannot be used to access workspace B's file
□ Pre-signed URL expires after 1 hour

WEBHOOK:
□ Missing X-Hub-Signature-256 header returns 403
□ Signature using wrong secret returns 403
□ Replaying a valid webhook (duplicate wamid) is idempotent
```

---

## 9. Accessibility Tests

```typescript
// e2e/accessibility.spec.ts
import { checkA11y, injectAxe } from 'axe-playwright';

test.beforeEach(async ({ page }) => {
  await injectAxe(page);
});

const pages = [
  { name: 'Login', url: '/login' },
  { name: 'Dashboard', url: '/dashboard', requiresAuth: true },
  { name: 'Contacts', url: '/contacts', requiresAuth: true },
  { name: 'Inbox', url: '/inbox', requiresAuth: true },
  { name: 'Leads', url: '/leads', requiresAuth: true },
];

for (const { name, url, requiresAuth } of pages) {
  test(`${name} page has no critical accessibility violations`, async ({ page }) => {
    if (requiresAuth) await loginAs(page, 'agent');
    await page.goto(url);
    await checkA11y(page, undefined, {
      detailedReport: true,
      violationNames: ['critical', 'serious'],
    });
  });
}
```

**Manual accessibility checks per page:**
- [ ] All images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages are announced by screen reader (ARIA live regions)
- [ ] Modal focus trap: Tab cycles only within open modal
- [ ] Modal closes on Escape key
- [ ] Color is not the only indicator of state (status badge has text + icon)
- [ ] Focus indicator visible on all interactive elements (no `outline: none` without replacement)

---

## 10. CI/CD Test Pipeline

```yaml
# .github/workflows/ci.yml

name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint          # ESLint on all packages
      - run: npm run type-check    # tsc --noEmit on all packages
      - run: npm run format:check  # Prettier check

  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_DB: nexacrm_test, POSTGRES_PASSWORD: test }
        options: --health-cmd pg_isready
      redis:
        image: redis:7
        options: --health-cmd "redis-cli ping"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma migrate deploy
        env: { DATABASE_URL: postgresql://postgres:test@localhost/nexacrm_test }
      - run: npm run test:cov --workspace=apps/api
        env:
          DATABASE_URL: postgresql://postgres:test@localhost/nexacrm_test
          TEST_DATABASE_URL: postgresql://postgres:test@localhost/nexacrm_test
          REDIS_URL: redis://localhost:6379
          JWT_PRIVATE_KEY: ${{ secrets.TEST_JWT_PRIVATE_KEY }}
      - uses: codecov/codecov-action@v4
        with: { file: apps/api/coverage/lcov.info }

  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test --workspace=apps/web

  e2e:
    runs-on: ubuntu-latest
    needs: [test-api, test-web]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: docker compose -f docker-compose.test.yml up -d
      - run: npm run test:e2e
        env: { E2E_BASE_URL: http://localhost:3000 }
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 11. Test Coverage Targets

| Module | Statement | Branch | Notes |
|--------|-----------|--------|-------|
| auth | 90% | 85% | Security-critical |
| contacts | 85% | 80% | |
| leads | 85% | 80% | |
| deals | 85% | 80% | |
| whatsapp | 85% | 80% | Mocked external APIs |
| ai | 80% | 75% | Mocked AI provider |
| notifications | 80% | 75% | |
| reports | 80% | 75% | |
| common/utils | 95% | 90% | Pure functions |
| **Overall** | **≥80%** | **≥75%** | CI enforced |

---

## 12. Bug Severity Classification

| Severity | Definition | SLA |
|----------|------------|-----|
| P0 — Critical | Data loss, security breach, system down | Fix immediately, deploy within 2h |
| P1 — High | Core feature broken (can't send messages, can't login) | Fix within 24h |
| P2 — Medium | Feature partially broken, workaround exists | Fix within 72h (next sprint) |
| P3 — Low | Minor UI issue, cosmetic, non-blocking | Fix in planned sprint |
| P4 — Enhancement | Feature request, UX improvement | Backlog |

No P0 or P1 bugs may be present at any milestone boundary. A milestone is not complete until all P0/P1 issues discovered during that phase are resolved and tested.
