// Help Center and Documentation Content
// This file contains the knowledge base for NexaCRM help and documentation

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  keywords: string[];
  readingTime: number; // minutes
  relatedArticles?: string[];
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
}

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of NexaCRM and set up your workspace',
    icon: 'Zap',
    articleCount: 4,
  },
  {
    id: 'contacts-leads',
    name: 'Contacts & Leads',
    description: 'Manage your customers, leads, and relationships',
    icon: 'Users',
    articleCount: 5,
  },
  {
    id: 'sales',
    name: 'Sales & Deals',
    description: 'Track opportunities and manage your sales pipeline',
    icon: 'Briefcase',
    articleCount: 4,
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Inbox, WhatsApp, and messaging features',
    icon: 'MessageSquare',
    articleCount: 3,
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Tasks, calendar, and time management',
    icon: 'CheckSquare',
    articleCount: 3,
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Business insights and performance metrics',
    icon: 'BarChart2',
    articleCount: 3,
  },
  {
    id: 'administration',
    name: 'Administration',
    description: 'Workspace settings, team, and security',
    icon: 'Settings',
    articleCount: 4,
  },
];

export const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: 'getting-started-nexacrm',
    title: 'Getting Started with NexaCRM',
    description: 'Learn the basic structure of your workspace, dashboard, and navigation',
    category: 'getting-started',
    content: `# Getting Started with NexaCRM

Welcome to NexaCRM! This guide will help you understand the core components of your CRM workspace.

## Your Dashboard

The dashboard is your command center. It displays:
- Key performance metrics (revenue, deals, contacts)
- Recent activity across your workspace
- Quick actions for common tasks
- Revenue and growth charts

## Navigation

Use the top navigation to access different areas:
- **CRM**: Contacts, Leads, Deals, Inbox
- **Workspace**: Tasks, Calendar, Reports, Team
- **Settings**: Configure integrations and preferences

## Quick Actions

The floating action button in the bottom-right corner provides shortcuts to:
- Create contacts
- Add deals
- Schedule meetings
- Create tasks

## Next Steps

1. Import your first contacts
2. Set up your deal pipeline
3. Configure WhatsApp integration
4. Invite team members`,
    keywords: ['setup', 'onboarding', 'basics', 'introduction', 'dashboard'],
    readingTime: 3,
    relatedArticles: ['workspace-overview', 'first-contact', 'pipeline-setup'],
  },
  {
    id: 'workspace-overview',
    title: 'Workspace Overview',
    description: 'Understanding your NexaCRM workspace structure and features',
    category: 'getting-started',
    content: `# Workspace Overview

Your workspace is the foundation of NexaCRM. It contains all your data, team members, and settings.

## Workspace Components

### Data Organization
- **Contacts**: People and organizations
- **Leads**: Potential customers
- **Deals**: Sales opportunities
- **Conversations**: Customer communications

### Collaboration
- **Team**: Workspace members and roles
- **Tasks**: Shared activities
- **Calendar**: Meetings and events

### Intelligence
- **Reports**: Business analytics
- **AI Assistant**: Smart recommendations
- **Automation**: Workflow automation

## Permissions

Your role determines what you can access and modify. Contact your workspace admin if you need additional permissions.`,
    keywords: ['workspace', 'structure', 'organization', 'overview'],
    readingTime: 2,
    relatedArticles: ['getting-started-nexacrm', 'team-management'],
  },
  {
    id: 'navigation-basics',
    title: 'Navigation Basics',
    description: 'Learn how to navigate efficiently through NexaCRM',
    category: 'getting-started',
    content: `# Navigation Basics

NexaCRM is designed for fast, intuitive navigation.

## Top Navigation

The main navigation bar provides access to:
- Platform features (CRM, Workspace, AI)
- Solutions organized by use case
- Resources (Help, Documentation, Support)

## Quick Search

Press \`Cmd+K\` (Mac) or \`Ctrl+K\` (Windows) to open quick search. Search for:
- Contacts by name
- Deals by title
- Tasks and calendar events

## Keyboard Shortcuts

Learn these shortcuts to navigate faster:
- \`G + D\`: Go to Dashboard
- \`G + C\`: Go to Contacts
- \`G + L\`: Go to Leads
- \`G + I\`: Go to Inbox

## Breadcrumbs

Use breadcrumbs at the top of pages to navigate back through your path.`,
    keywords: ['navigation', 'keyboard', 'shortcuts', 'search', 'quick access'],
    readingTime: 2,
    relatedArticles: ['getting-started-nexacrm', 'keyboard-shortcuts'],
  },
  {
    id: 'dark-mode',
    title: 'Using Dark Mode',
    description: 'Switch between light and dark themes',
    category: 'getting-started',
    content: `# Using Dark Mode

NexaCRM supports both light and dark themes optimized for different lighting conditions.

## Switching Themes

1. Click your profile icon in the top-right corner
2. Select the theme toggle (sun/moon icon)
3. Choose:
   - **Light**: Traditional bright interface
   - **Dark**: Dark navy theme for low-light environments
   - **System**: Match your OS preference

## Theme Persistence

Your theme preference is saved automatically and will persist across devices where you're logged in.

## Accessibility

Both themes meet WCAG contrast requirements for readability.`,
    keywords: ['dark mode', 'theme', 'appearance', 'light mode', 'preferences'],
    readingTime: 1,
    relatedArticles: ['workspace-overview', 'accessibility'],
  },

  // Contacts & Leads
  {
    id: 'first-contact',
    title: 'Adding Your First Contact',
    description: 'Create and manage contact records in NexaCRM',
    category: 'contacts-leads',
    content: `# Adding Your First Contact

Contacts are the foundation of your CRM. Here's how to add and manage them.

## Creating a Contact

1. Navigate to **Contacts**
2. Click **New Contact**
3. Fill in the details:
   - Name (required)
   - Email
   - Phone
   - Company
   - Additional custom fields

## Contact Details

Each contact record stores:
- Basic information (name, email, phone)
- Company association
- Custom fields
- Activity history
- Related deals
- Conversation history
- Notes and files

## Importing Contacts

Import contacts in bulk:
1. Go to Contacts
2. Click **Import**
3. Upload a CSV file
4. Map columns to fields
5. Review and confirm

## Best Practices

- Keep contact information current
- Add tags for segmentation
- Log all interactions
- Link contacts to deals`,
    keywords: ['contacts', 'add contact', 'create', 'import', 'csv'],
    readingTime: 3,
    relatedArticles: ['contact-management', 'lead-conversion', 'tags-and-segments'],
  },
  {
    id: 'contact-management',
    title: 'Managing Contacts',
    description: 'Advanced contact management features and workflows',
    category: 'contacts-leads',
    content: `# Managing Contacts

Effective contact management helps you maintain strong customer relationships.

## Contact Views

Use different views to organize contacts:
- **All Contacts**: Complete list
- **Recently Added**: New contacts
- **Active**: Contacts with recent activity
- **Custom Views**: Create filtered views

## Contact Details Page

The contact detail page shows:
- Contact information
- Activity timeline
- Related deals
- Conversations
- Tasks
- Files and notes

## Tags and Segments

Organize contacts with tags:
- Customer type (prospect, customer, partner)
- Industry
- Size
- Priority
- Custom tags

## Bulk Actions

Select multiple contacts to:
- Add tags
- Assign to team members
- Export data
- Delete contacts`,
    keywords: ['contact management', 'views', 'organization', 'tags', 'bulk actions'],
    readingTime: 4,
    relatedArticles: ['first-contact', 'lead-conversion', 'custom-fields'],
  },
  {
    id: 'lead-conversion',
    title: 'Converting Leads to Customers',
    description: 'Track and qualify prospects through the lead lifecycle',
    category: 'contacts-leads',
    content: `# Converting Leads to Customers

Leads represent potential customers in your pipeline.

## Lead Stages

Leads progress through stages:
1. **New**: Just captured
2. **Contacted**: Initial outreach made
3. **Qualified**: Meets buying criteria
4. **Proposal**: Offer presented
5. **Converted**: Became a customer

## Lead Qualification

Qualify leads by assessing:
- Budget availability
- Authority to purchase
- Need for your solution
- Timeline for decision

## Creating Deals

When a lead is qualified:
1. Open the lead record
2. Click **Convert to Deal**
3. Set deal amount and stage
4. Assign to pipeline

## Lead Sources

Track where leads come from:
- Website forms
- Social media
- Referrals
- Events
- Advertising`,
    keywords: ['leads', 'conversion', 'qualify', 'pipeline', 'sales'],
    readingTime: 3,
    relatedArticles: ['first-contact', 'deal-management', 'pipeline-setup'],
  },
  {
    id: 'custom-fields',
    title: 'Custom Fields',
    description: 'Add custom fields to contacts and deals',
    category: 'contacts-leads',
    content: `# Custom Fields

Customize NexaCRM to capture the data that matters to your business.

## Creating Custom Fields

1. Go to **Settings** > **Custom Fields**
2. Choose the object (Contact, Lead, Deal)
3. Click **Add Field**
4. Configure:
   - Field name
   - Field type (text, number, date, dropdown)
   - Required or optional
   - Default value

## Field Types

Available field types:
- **Text**: Short text input
- **Long Text**: Multi-line text
- **Number**: Numeric values
- **Currency**: Money values
- **Date**: Date picker
- **Dropdown**: Predefined options
- **Checkbox**: Yes/no values

## Using Custom Fields

Custom fields appear in:
- Create and edit forms
- Detail views
- List views (optional columns)
- Filters and search
- Reports and exports`,
    keywords: ['custom fields', 'customization', 'fields', 'data', 'configuration'],
    readingTime: 2,
    relatedArticles: ['contact-management', 'deal-management', 'reports'],
  },
  {
    id: 'tags-and-segments',
    title: 'Tags and Segmentation',
    description: 'Organize and filter contacts using tags',
    category: 'contacts-leads',
    content: `# Tags and Segmentation

Tags help you organize and segment your contacts for targeted actions.

## Creating Tags

1. Go to any contact
2. Click **Add Tag**
3. Create new or select existing tags
4. Save

## Tag Strategies

Effective tagging approaches:
- **Stage**: Prospect, Customer, Partner
- **Industry**: Tech, Healthcare, Finance
- **Size**: SMB, Enterprise
- **Geography**: Region or country
- **Engagement**: Hot, Warm, Cold

## Filtering by Tags

Use tags to filter:
1. Go to Contacts or Leads
2. Click **Filter**
3. Select tags
4. View filtered results

## Bulk Tagging

Tag multiple contacts at once:
1. Select contacts
2. Click **Actions** > **Add Tags**
3. Choose tags
4. Apply`,
    keywords: ['tags', 'segments', 'filter', 'organize', 'categorize'],
    readingTime: 2,
    relatedArticles: ['contact-management', 'lead-conversion', 'custom-fields'],
  },

  // Sales & Deals
  {
    id: 'deal-management',
    title: 'Managing Deals',
    description: 'Create and track sales opportunities',
    category: 'sales',
    content: `# Managing Deals

Deals represent sales opportunities in your pipeline.

## Creating a Deal

1. Go to **Deals**
2. Click **New Deal**
3. Enter:
   - Deal title
   - Contact/organization
   - Deal value
   - Expected close date
   - Stage

## Deal Stages

Standard pipeline stages:
1. **Qualification**: Initial assessment
2. **Proposal**: Offer sent
3. **Negotiation**: Terms discussion
4. **Closed Won**: Deal successful
5. **Closed Lost**: Deal unsuccessful

## Moving Deals

Drag and drop deals between stages or:
1. Open the deal
2. Change the stage
3. Save

## Deal Details

Track comprehensive deal information:
- Value and currency
- Probability
- Expected close date
- Contact and company
- Activity history
- Notes and files
- Products/services`,
    keywords: ['deals', 'opportunities', 'sales', 'pipeline', 'stages'],
    readingTime: 3,
    relatedArticles: ['pipeline-setup', 'lead-conversion', 'forecast'],
  },
  {
    id: 'pipeline-setup',
    title: 'Setting Up Your Pipeline',
    description: 'Configure deal stages and pipeline structure',
    category: 'sales',
    content: `# Setting Up Your Pipeline

Your pipeline structure defines how deals flow through your sales process.

## Default Pipeline

NexaCRM includes a default pipeline with standard stages. You can customize it to match your sales process.

## Pipeline Stages

Each stage represents a step in your sales process:
- **Name**: Stage identifier
- **Probability**: Win likelihood (%)
- **Color**: Visual indicator

## Best Practices

1. **Keep it Simple**: 4-6 stages is ideal
2. **Clear Definitions**: Each stage should have clear entry criteria
3. **Consistent Use**: Train team to use stages consistently
4. **Regular Review**: Update stages as your process evolves

## Multiple Pipelines

Create separate pipelines for:
- Different product lines
- Different market segments
- Different sales processes`,
    keywords: ['pipeline', 'stages', 'setup', 'configuration', 'sales process'],
    readingTime: 2,
    relatedArticles: ['deal-management', 'forecast', 'team-management'],
  },
  {
    id: 'forecast',
    title: 'Sales Forecasting',
    description: 'Project future revenue based on your pipeline',
    category: 'sales',
    content: `# Sales Forecasting

Sales forecasting helps you predict future revenue and plan resources.

## Viewing Forecasts

1. Go to **Deals** > **Forecast**
2. Select time period
3. View projected revenue by stage

## Forecast Calculation

Forecasts are calculated using:
- Deal value
- Stage probability
- Expected close date
- Historical win rates

## Forecast Accuracy

Improve forecast accuracy by:
- Keeping deal stages current
- Setting realistic close dates
- Updating deal values
- Marking lost deals promptly

## Weighted Pipeline

The weighted pipeline shows:
- Total pipeline value
- Weighted value (probability-adjusted)
- Expected close value

This helps you understand realistic revenue projections.`,
    keywords: ['forecast', 'revenue', 'projection', 'prediction', 'pipeline value'],
    readingTime: 2,
    relatedArticles: ['deal-management', 'reports', 'pipeline-setup'],
  },
  {
    id: 'deal-won-lost',
    title: 'Marking Deals Won or Lost',
    description: 'Close deals and track outcomes',
    category: 'sales',
    content: `# Marking Deals Won or Lost

Properly closing deals maintains accurate pipeline and forecast data.

## Marking a Deal Won

1. Open the deal
2. Click **Mark as Won**
3. Confirm:
   - Final deal value
   - Close date
   - Notes

## Marking a Deal Lost

1. Open the deal
2. Click **Mark as Lost**
3. Record:
   - Loss reason (required)
   - Competitor (if applicable)
   - Notes

## Loss Reasons

Common loss reasons:
- Price too high
- Chose competitor
- No budget
- Timing not right
- No decision made

## Win/Loss Analysis

Track why deals succeed or fail to:
- Improve sales process
- Refine pricing
- Identify competitive gaps
- Optimize resource allocation`,
    keywords: ['won', 'lost', 'close', 'outcome', 'results'],
    readingTime: 2,
    relatedArticles: ['deal-management', 'forecast', 'reports'],
  },

  // Communication
  {
    id: 'inbox-overview',
    title: 'Using the Inbox',
    description: 'Manage all customer conversations in one place',
    category: 'communication',
    content: `# Using the Inbox

The Inbox consolidates all customer conversations across channels.

## Inbox Features

- **Unified view**: All channels in one place
- **Conversation history**: Complete message thread
- **Contact context**: Customer information sidebar
- **Quick actions**: Create tasks, deals from messages
- **Internal notes**: Team collaboration

## Managing Conversations

Each conversation shows:
- Contact information
- Message history
- Conversation status
- Assigned team member
- Labels and tags

## Conversation Status

- **Open**: Requires attention
- **Pending**: Waiting for response
- **Resolved**: Completed

## Assigning Conversations

Assign conversations to team members:
1. Open conversation
2. Click **Assign**
3. Select team member
4. Add note (optional)`,
    keywords: ['inbox', 'messages', 'conversations', 'communication', 'channels'],
    readingTime: 3,
    relatedArticles: ['whatsapp-integration', 'team-collaboration', 'internal-notes'],
  },
  {
    id: 'whatsapp-integration',
    title: 'WhatsApp Integration',
    description: 'Connect WhatsApp Business for customer messaging',
    category: 'communication',
    content: `# WhatsApp Integration

Connect your WhatsApp Business account to message customers directly from NexaCRM.

## Setup Requirements

Before connecting:
- WhatsApp Business API account
- Phone number verification
- Business verification (Meta)

## Connecting WhatsApp

1. Go to **Settings** > **WhatsApp**
2. Enter your credentials:
   - Phone Number ID
   - Business Account ID
   - Access Token
3. Test connection
4. Save

## Sending Messages

Send WhatsApp messages from:
- Contact detail page
- Inbox
- Conversations

## Message Templates

Use approved templates for:
- Initial outreach
- Notifications
- Follow-ups
- Customer service

## Best Practices

- Get customer opt-in
- Use approved templates
- Respond within 24 hours
- Maintain professional tone`,
    keywords: ['whatsapp', 'messaging', 'integration', 'chat', 'business'],
    readingTime: 3,
    relatedArticles: ['inbox-overview', 'message-templates', 'integrations'],
  },
  {
    id: 'message-templates',
    title: 'Message Templates',
    description: 'Create reusable message templates',
    category: 'communication',
    content: `# Message Templates

Templates help you send consistent, professional messages quickly.

## Creating Templates

1. Go to **Inbox** > **Templates**
2. Click **New Template**
3. Enter:
   - Template name
   - Subject (for email)
   - Message body
   - Variables (optional)

## Using Variables

Add dynamic content with variables:
- \`{{contact.firstName}}\`: Contact first name
- \`{{contact.company}}\`: Company name
- \`{{deal.value}}\`: Deal amount
- \`{{user.firstName}}\`: Your name

## Template Categories

Organize templates by type:
- **Follow-up**: After meetings/calls
- **Introduction**: First contact
- **Proposal**: Sending quotes
- **Closing**: Deal closure
- **Support**: Customer service

## Quick Replies

Short templates for common responses:
- "Thanks for reaching out"
- "I'll look into this"
- "Meeting scheduled"`,
    keywords: ['templates', 'messages', 'quick replies', 'automation', 'responses'],
    readingTime: 2,
    relatedArticles: ['inbox-overview', 'whatsapp-integration', 'automation'],
  },

  // Productivity
  {
    id: 'task-management',
    title: 'Managing Tasks',
    description: 'Create and track activities and follow-ups',
    category: 'productivity',
    content: `# Managing Tasks

Tasks help you stay organized and never miss a follow-up.

## Creating Tasks

1. Go to **Tasks**
2. Click **New Task**
3. Enter:
   - Title
   - Description
   - Due date
   - Priority
   - Assignee

## Task Types

Common task types:
- **Follow-up**: Contact customer
- **Call**: Schedule phone call
- **Email**: Send email
- **Meeting**: Prepare for meeting
- **Review**: Review documents

## Task Views

Organize tasks by:
- **My Tasks**: Assigned to you
- **Today**: Due today
- **This Week**: Due this week
- **Overdue**: Past due date
- **Completed**: Finished tasks

## Task Completion

Mark tasks complete:
1. Check the task checkbox
2. Add completion notes
3. Create follow-up task if needed

## Task Reminders

Set reminders to get notified:
- At due date/time
- Before due date
- Custom time`,
    keywords: ['tasks', 'activities', 'follow-ups', 'todo', 'reminders'],
    readingTime: 3,
    relatedArticles: ['calendar-events', 'deal-management', 'team-collaboration'],
  },
  {
    id: 'calendar-events',
    title: 'Calendar and Events',
    description: 'Schedule meetings and manage your calendar',
    category: 'productivity',
    content: `# Calendar and Events

The calendar helps you schedule and track meetings, calls, and events.

## Creating Events

1. Go to **Calendar**
2. Click a date or **New Event**
3. Enter:
   - Event title
   - Start/end time
   - Attendees
   - Location
   - Description

## Event Types

Mark events by type:
- **Meeting**: In-person or virtual
- **Call**: Phone conversation
- **Demo**: Product demonstration
- **Follow-up**: Check-in call

## Calendar Views

Switch between views:
- **Month**: Month overview
- **Week**: Week schedule
- **Day**: Daily agenda
- **Agenda**: List view

## Event Colors

Color-code events:
- Blue: Customer meetings
- Green: Internal meetings
- Orange: Calls
- Red: Urgent

## Syncing Calendars

Connect external calendars:
- Google Calendar
- Outlook Calendar
- Apple Calendar`,
    keywords: ['calendar', 'events', 'meetings', 'schedule', 'appointments'],
    readingTime: 3,
    relatedArticles: ['task-management', 'team-collaboration', 'integrations'],
  },
  {
    id: 'time-management',
    title: 'Time Management Tips',
    description: 'Use NexaCRM effectively to manage your time',
    category: 'productivity',
    content: `# Time Management Tips

Maximize your productivity with these time management strategies.

## Daily Routine

Start your day by:
1. Reviewing **Today's Tasks**
2. Checking **Calendar** for meetings
3. Processing **Inbox** messages
4. Updating **Deals**

## Prioritization

Use priority levels:
- **High**: Urgent and important
- **Medium**: Important, not urgent
- **Low**: Nice to have

## Time Blocking

Block time for:
- Deep work (deal management)
- Communication (inbox, calls)
- Planning (reports, forecasting)
- Learning (documentation)

## Automation

Automate repetitive tasks:
- Email follow-ups
- Task creation
- Status updates
- Notifications

## Weekly Review

Every week:
1. Review completed tasks
2. Update deal statuses
3. Plan next week
4. Clean up inbox`,
    keywords: ['time management', 'productivity', 'efficiency', 'planning', 'organization'],
    readingTime: 2,
    relatedArticles: ['task-management', 'calendar-events', 'automation'],
  },

  // Reports & Analytics
  {
    id: 'reports-overview',
    title: 'Reports Overview',
    description: 'Understand your business with analytics and reports',
    category: 'reports',
    content: `# Reports Overview

NexaCRM provides comprehensive analytics to understand your business performance.

## Available Reports

### Sales Reports
- Revenue trends
- Deal pipeline
- Win/loss analysis
- Sales by rep

### Activity Reports
- Contact activity
- Email engagement
- Call logs
- Meeting frequency

### Performance Reports
- Team performance
- Individual metrics
- Goal tracking

## Viewing Reports

1. Go to **Reports**
2. Select report type
3. Choose date range
4. Apply filters
5. View insights

## Report Filters

Filter reports by:
- Date range
- Team member
- Pipeline stage
- Contact type
- Deal size

## Exporting Reports

Export reports as:
- PDF
- Excel (CSV)
- Google Sheets

Use exported data for:
- Executive presentations
- Financial planning
- Further analysis`,
    keywords: ['reports', 'analytics', 'metrics', 'performance', 'insights'],
    readingTime: 3,
    relatedArticles: ['forecast', 'deal-management', 'team-performance'],
  },
  {
    id: 'dashboard-metrics',
    title: 'Understanding Dashboard Metrics',
    description: 'Learn what each metric means on your dashboard',
    category: 'reports',
    content: `# Understanding Dashboard Metrics

Your dashboard displays key performance indicators at a glance.

## Revenue Metrics

### Total Revenue
Sum of all won deals in the selected period.

### Average Deal Size
Total revenue divided by number of won deals.

### Revenue Growth
Percentage change compared to previous period.

## Pipeline Metrics

### Pipeline Value
Total value of all open deals.

### Weighted Pipeline
Pipeline value adjusted by stage probability.

### Conversion Rate
Percentage of deals won vs. total deals.

## Activity Metrics

### New Contacts
Contacts added in the period.

### Active Deals
Open deals being actively worked.

### Tasks Completed
Tasks marked complete.

## Time-Based Metrics

### Average Sales Cycle
Days from deal creation to close.

### Response Time
Average time to respond to messages.

## Using Metrics

Use dashboard metrics to:
- Track progress toward goals
- Identify trends
- Spot problems early
- Make data-driven decisions`,
    keywords: ['dashboard', 'metrics', 'kpi', 'performance', 'indicators'],
    readingTime: 3,
    relatedArticles: ['reports-overview', 'forecast', 'goals'],
  },
  {
    id: 'team-performance',
    title: 'Team Performance Reports',
    description: 'Track and analyze team productivity',
    category: 'reports',
    content: `# Team Performance Reports

Monitor team performance to identify top performers and coaching opportunities.

## Individual Metrics

Track per team member:
- Deals created
- Deals won
- Revenue generated
- Conversion rate
- Activity volume

## Team Metrics

Monitor overall team:
- Total revenue
- Team quota attainment
- Activity levels
- Response times

## Performance Comparison

Compare team members on:
- Revenue contribution
- Deal velocity
- Win rate
- Activity metrics

## Coaching Insights

Use reports to:
- Identify training needs
- Recognize top performers
- Set realistic goals
- Improve processes

## Setting Goals

Establish team goals:
1. Go to **Reports** > **Goals**
2. Set targets by:
   - Revenue
   - Deals won
   - Activities completed
3. Track progress
4. Review regularly`,
    keywords: ['team', 'performance', 'coaching', 'goals', 'productivity'],
    readingTime: 3,
    relatedArticles: ['reports-overview', 'team-management', 'goals'],
  },

  // Administration
  {
    id: 'team-management',
    title: 'Managing Your Team',
    description: 'Add and manage workspace team members',
    category: 'administration',
    content: `# Managing Your Team

Collaborate effectively by adding team members and managing permissions.

## Inviting Team Members

1. Go to **Team**
2. Click **Invite Member**
3. Enter email address
4. Select role
5. Send invitation

## User Roles

### Admin
- Full system access
- Manage settings
- Add/remove users
- Configure integrations

### Manager
- View all data
- Manage team members
- Cannot modify system settings

### User
- Manage assigned data
- Limited settings access
- Cannot manage team

### Custom Roles
Create custom roles with specific permissions.

## Managing Permissions

Control access to:
- Contact data
- Deals and pipeline
- Reports and analytics
- Settings and integrations

## Deactivating Users

To remove access:
1. Go to **Team**
2. Find the user
3. Click **Deactivate**
4. Reassign their data`,
    keywords: ['team', 'users', 'permissions', 'roles', 'access'],
    readingTime: 3,
    relatedArticles: ['workspace-overview', 'security', 'permissions'],
  },
  {
    id: 'security',
    title: 'Security and Privacy',
    description: 'Keep your workspace secure',
    category: 'administration',
    content: `# Security and Privacy

NexaCRM takes security seriously. Here's how to keep your workspace secure.

## Password Security

Strong passwords should:
- Be at least 12 characters
- Include uppercase and lowercase
- Include numbers and symbols
- Be unique to NexaCRM

## Two-Factor Authentication

Enable 2FA for added security:
1. Go to **Settings** > **Security**
2. Click **Enable 2FA**
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes

## Session Management

- Automatic logout after inactivity
- Active session monitoring
- Device tracking

## Data Privacy

Your data is:
- Encrypted in transit (TLS)
- Encrypted at rest
- Backed up daily
- Stored in secure data centers

## Access Control

Control who can access what:
- Role-based permissions
- IP allowlisting (optional)
- API access controls

## Audit Logs

Track all activities:
- User logins
- Data modifications
- Settings changes
- Export events`,
    keywords: ['security', 'privacy', 'password', '2fa', 'authentication'],
    readingTime: 4,
    relatedArticles: ['team-management', 'api-keys', 'compliance'],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect NexaCRM with other tools',
    category: 'administration',
    content: `# Integrations

Extend NexaCRM by connecting with other business tools.

## Available Integrations

### Communication
- WhatsApp Business
- Email (SMTP)

### AI & Automation
- Gemini AI Assistant

### Calendar
- Google Calendar
- Outlook Calendar

### Storage
- Amazon S3

## Setting Up Integrations

1. Go to **Settings** > **Integrations**
2. Select integration
3. Click **Connect**
4. Follow setup wizard
5. Test connection
6. Save

## Managing API Keys

For custom integrations:
1. Go to **Settings** > **API Keys**
2. Click **Generate Key**
3. Name the key
4. Copy the key (shown once)
5. Use in your application

## Webhook Configuration

Set up webhooks for:
- Real-time updates
- Event notifications
- Data synchronization

## Integration Security

- Use environment variables for keys
- Rotate keys regularly
- Monitor API usage
- Limit key permissions`,
    keywords: ['integrations', 'api', 'connect', 'apps', 'tools'],
    readingTime: 3,
    relatedArticles: ['whatsapp-integration', 'api-keys', 'automation'],
  },
  {
    id: 'api-keys',
    title: 'API Keys and Access',
    description: 'Manage API keys for programmatic access',
    category: 'administration',
    content: `# API Keys and Access

API keys allow programmatic access to NexaCRM data.

## Creating API Keys

1. Go to **Settings** > **API Keys**
2. Click **Generate New Key**
3. Enter:
   - Key name
   - Description
   - Permissions
4. Save
5. Copy the key immediately

⚠️ **Important**: The key is only shown once. Store it securely.

## Key Permissions

Grant specific permissions:
- **Read Only**: View data only
- **Read/Write**: View and modify data
- **Full Access**: All operations

Limit permissions to what's needed.

## Using API Keys

Include the key in requests:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## API Documentation

View full API documentation:
- Endpoint reference
- Request/response formats
- Authentication
- Rate limits
- Examples

Visit: \`http://localhost:4000/docs\` (development)

## Security Best Practices

- Store keys in environment variables
- Never commit keys to version control
- Rotate keys periodically
- Revoke unused keys
- Monitor API usage`,
    keywords: ['api', 'keys', 'authentication', 'access', 'developer'],
    readingTime: 3,
    relatedArticles: ['integrations', 'security', 'webhooks'],
  },
];

// Search helper function
export function searchHelpArticles(query: string): HelpArticle[] {
  if (!query.trim()) return helpArticles;

  const searchTerm = query.toLowerCase().trim();

  return helpArticles.filter((article) => {
    const titleMatch = article.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = article.description.toLowerCase().includes(searchTerm);
    const categoryMatch = article.category.toLowerCase().includes(searchTerm);
    const keywordMatch = article.keywords.some((keyword) =>
      keyword.toLowerCase().includes(searchTerm)
    );
    const contentMatch = article.content.toLowerCase().includes(searchTerm);

    return titleMatch || descriptionMatch || categoryMatch || keywordMatch || contentMatch;
  });
}

// Get articles by category
export function getArticlesByCategory(categoryId: string): HelpArticle[] {
  return helpArticles.filter((article) => article.category === categoryId);
}

// Get article by ID
export function getArticleById(id: string): HelpArticle | undefined {
  return helpArticles.find((article) => article.id === id);
}

// Get related articles
export function getRelatedArticles(articleId: string): HelpArticle[] {
  const article = getArticleById(articleId);
  if (!article || !article.relatedArticles) return [];

  return article.relatedArticles
    .map((id) => getArticleById(id))
    .filter((a): a is HelpArticle => a !== undefined);
}
