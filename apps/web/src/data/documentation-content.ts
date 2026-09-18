// Documentation Content for NexaCRM

export interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  articles: DocArticle[];
}

export interface DocArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  section: string;
}

export const docSections: DocSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'Introduction to NexaCRM',
    icon: 'BookOpen',
    articles: [
      {
        id: 'introduction',
        title: 'Introduction',
        description: 'What is NexaCRM and what can you do with it',
        section: 'overview',
        content: `# Introduction to NexaCRM

NexaCRM is a modern, AI-powered customer relationship management platform designed for businesses that want to manage customer relationships, track sales opportunities, and grow their revenue.

## What is NexaCRM?

NexaCRM combines traditional CRM functionality with modern communication tools and AI assistance to help you:

- **Manage Contacts**: Store and organize customer information
- **Track Deals**: Monitor sales opportunities through your pipeline
- **Communicate**: Handle customer conversations across channels
- **Collaborate**: Work together with your team
- **Analyze**: Understand your business performance

## Core Features

### Contact Management
Store comprehensive customer profiles with all interaction history in one place.

### Sales Pipeline
Visual deal tracking with customizable stages and forecasting.

### Inbox & Communication
Unified inbox for all customer conversations including WhatsApp Business integration.

### Tasks & Calendar
Never miss a follow-up with integrated task management and calendar.

### Reports & Analytics
Real-time business insights and performance metrics.

### AI Assistant
Intelligent suggestions for replies, lead qualification, and more.

## Who is NexaCRM For?

NexaCRM is designed for:
- **Small to medium businesses** looking to scale their sales operations
- **Sales teams** that need pipeline visibility and collaboration
- **Customer-facing teams** managing high-volume communications
- **Business owners** who want data-driven insights

## Getting Started

1. Set up your workspace
2. Import your contacts
3. Configure your sales pipeline
4. Connect communication channels
5. Invite your team members

Ready to dive in? Check out our [Getting Started Guide](/help/getting-started-nexacrm).`,
      },
      {
        id: 'core-concepts',
        title: 'Core Concepts',
        description: 'Understanding the fundamental concepts of NexaCRM',
        section: 'overview',
        content: `# Core Concepts

Understanding these core concepts will help you use NexaCRM effectively.

## Workspace

Your workspace is the top-level container for all your data. It includes:
- All contacts, leads, and deals
- Team members and their permissions
- Settings and integrations
- Conversation history

Each workspace is isolated from others, ensuring data privacy and security.

## Contacts

Contacts represent people and organizations you interact with. Every contact can have:
- Basic information (name, email, phone)
- Company association
- Custom fields
- Activity timeline
- Related deals
- Conversation history

## Leads

Leads are potential customers in your pipeline. They represent:
- Early-stage opportunities
- Unqualified prospects
- Marketing-generated contacts

Leads can be converted to deals when qualified.

## Deals

Deals represent sales opportunities. Each deal has:
- Monetary value
- Stage in your pipeline
- Expected close date
- Associated contact
- Activity history

## Pipeline

Your pipeline is the structured path deals flow through:
1. Stages: Sequential steps (e.g., Qualification → Proposal → Negotiation → Closed)
2. Probability: Win likelihood at each stage
3. Forecasting: Projected revenue based on pipeline

## Conversations

Conversations consolidate all communications with a contact:
- WhatsApp messages
- Email threads
- Internal notes
- Call logs

## Tasks

Tasks help you manage activities and follow-ups:
- Due dates and reminders
- Assignment to team members
- Priority levels
- Completion tracking

## Team & Permissions

Team members have different access levels:
- **Admin**: Full access to all features
- **Manager**: Can view all data, limited settings
- **User**: Can only access assigned data

## Integrations

Connect NexaCRM with external tools:
- WhatsApp Business
- Email (SMTP)
- Calendar services
- AI assistants
`,
      },
    ],
  },
  {
    id: 'crm',
    title: 'CRM',
    description: 'Contact and lead management',
    icon: 'Users',
    articles: [
      {
        id: 'contacts-overview',
        title: 'Contacts Overview',
        description: 'Managing customer and prospect information',
        section: 'crm',
        content: `# Contacts Overview

Contacts are the foundation of your CRM. They represent the people and organizations you do business with.

## Contact Structure

Each contact record contains:

### Basic Information
- Name (first and last)
- Email address
- Phone number
- Company

### Additional Details
- Job title
- Address
- Social media profiles
- Website

### Custom Fields
Add fields specific to your business needs.

### Activity Timeline
View all interactions with this contact:
- Emails sent and received
- Calls logged
- Meetings scheduled
- Deals created
- Notes added

### Related Data
- Deals: Sales opportunities
- Tasks: Follow-up activities
- Conversations: Message history

## Creating Contacts

Create contacts individually or in bulk:

### Individual Creation
1. Click "New Contact"
2. Enter contact details
3. Add to company (optional)
4. Save

### Bulk Import
1. Prepare CSV file with contact data
2. Click "Import"
3. Map CSV columns to contact fields
4. Review and confirm
5. Import

## Contact Views

Organize contacts with different views:
- **All Contacts**: Complete list
- **Recently Added**: New contacts
- **Active**: Recent activity
- **My Contacts**: Assigned to you
- **Custom Views**: Filter by any criteria

## Tags and Segments

Organize contacts with tags:
- Customer status (prospect, customer, partner)
- Industry
- Size/revenue
- Geography
- Engagement level

Use tags to:
- Filter and search
- Create targeted campaigns
- Assign to team members
- Generate reports

## Contact Merging

Avoid duplicates by merging contacts:
1. Select duplicate contacts
2. Click "Merge"
3. Choose which data to keep
4. Confirm merge

The merged contact retains all activity history.
`,
      },
      {
        id: 'leads-workflow',
        title: 'Lead Management Workflow',
        description: 'Capturing, qualifying, and converting leads',
        section: 'crm',
        content: `# Lead Management Workflow

Leads represent potential customers before they enter your sales pipeline.

## Lead Lifecycle

### 1. Lead Capture
Leads enter your system through:
- Manual entry
- Web forms
- Import from spreadsheet
- Marketing automation
- Referrals

### 2. Lead Qualification
Assess if the lead is a good fit:

**BANT Framework**:
- **Budget**: Can they afford your solution?
- **Authority**: Are they the decision-maker?
- **Need**: Do they have a problem you solve?
- **Timeline**: When will they decide?

### 3. Lead Nurturing
For leads not ready to buy:
- Schedule follow-ups
- Send educational content
- Track engagement
- Build relationship

### 4. Lead Conversion
When qualified, convert lead to:
- Deal in your pipeline
- Contact in your CRM
- Assigned to sales rep

## Lead Stages

Standard lead stages:
1. **New**: Just captured
2. **Contacted**: Initial outreach made
3. **Engaged**: Responding to communication
4. **Qualified**: Meets buying criteria
5. **Converted**: Became a deal

## Lead Scoring

Automatically score leads based on:
- Company size
- Industry fit
- Engagement level
- Budget indicators
- Timeline urgency

Higher scores indicate better fit.

## Lead Sources

Track where leads originate:
- Website
- Social media
- Paid advertising
- Events
- Referrals
- Organic search

Use source tracking to:
- Measure marketing ROI
- Optimize channels
- Forecast pipeline

## Lead Assignment

Distribute leads to team members:
- **Round robin**: Rotate assignments
- **Territory**: Based on geography
- **Expertise**: Based on industry/product
- **Capacity**: Based on workload

## Best Practices

1. **Respond quickly**: Contact new leads within 5 minutes
2. **Qualify thoroughly**: Don't waste time on poor fits
3. **Nurture patiently**: Not all leads buy immediately
4. **Track sources**: Understand what marketing works
5. **Clean regularly**: Remove dead leads
`,
      },
    ],
  },
  {
    id: 'sales',
    title: 'Sales',
    description: 'Deal tracking and pipeline management',
    icon: 'Briefcase',
    articles: [
      {
        id: 'pipeline-management',
        title: 'Pipeline Management',
        description: 'Organizing and tracking your sales process',
        section: 'sales',
        content: `# Pipeline Management

Your sales pipeline is the visual representation of where deals are in your sales process.

## Pipeline Structure

### Stages
Each stage represents a step:
1. **Qualification**: Initial assessment
2. **Discovery**: Understanding needs
3. **Proposal**: Presenting solution
4. **Negotiation**: Discussing terms
5. **Closed Won**: Deal successful
6. **Closed Lost**: Deal unsuccessful

### Stage Probability
Each stage has a win probability:
- Qualification: 10%
- Discovery: 25%
- Proposal: 50%
- Negotiation: 75%
- Closed Won: 100%
- Closed Lost: 0%

## Moving Deals

### Drag and Drop
Simply drag deals between stages.

### Manual Update
1. Open deal
2. Change stage
3. Add notes about the change
4. Save

### Automated Movement
Set rules to auto-move deals:
- After certain activities
- Based on age
- After email opens/clicks

## Pipeline Health

Monitor these metrics:

### Velocity
How fast deals move through stages.

### Conversion Rate
Percentage advancing to next stage.

### Bottlenecks
Stages where deals get stuck.

### Leakage
Deals lost at each stage.

## Pipeline Review

Regular review best practices:

### Daily
- New deals added
- Deals moving stages
- Upcoming close dates

### Weekly
- Team pipeline review
- Stuck deal analysis
- Forecast accuracy

### Monthly
- Win/loss analysis
- Pipeline health metrics
- Process improvements

## Multiple Pipelines

Create separate pipelines for:
- Different products
- Different markets
- Different team members
- Different sales processes

Each pipeline can have unique stages.
`,
      },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Inbox and messaging features',
    icon: 'MessageSquare',
    articles: [
      {
        id: 'inbox-guide',
        title: 'Inbox Guide',
        description: 'Managing customer conversations',
        section: 'communication',
        content: `# Inbox Guide

The Inbox is your central hub for all customer conversations.

## Inbox Structure

### Conversation List
Shows all conversations with:
- Contact name and avatar
- Last message preview
- Unread indicator
- Assignment status
- Labels

### Conversation View
Displays:
- Full message thread
- Contact information sidebar
- Quick actions
- Internal notes area

## Conversation Status

### Open
Requires attention or response.

### Pending
Waiting for customer response.

### Resolved
Completed conversation.

## Managing Conversations

### Replying
1. Type your message
2. Use templates for common responses
3. Add attachments if needed
4. Send

### Assigning
Assign conversations to team members:
1. Click "Assign"
2. Select team member
3. Add note (optional)
4. Save

### Labeling
Organize with labels:
- Support request
- Sales inquiry
- Billing question
- Bug report

### Internal Notes
Add team-only notes:
1. Switch to Notes tab
2. Write note
3. Mention team members with @
4. Save

## Quick Actions

From any conversation:
- Create task
- Schedule meeting
- Create deal
- Add contact tag
- Send template

## Filters and Search

Find conversations by:
- Status (open/pending/resolved)
- Assigned team member
- Labels
- Date range
- Contact name
- Message content

## Keyboard Shortcuts

- \`R\`: Reply to conversation
- \`A\`: Assign conversation
- \`E\`: Resolve conversation
- \`N\`: Add internal note
- \`↑/↓\`: Navigate conversations
`,
      },
    ],
  },
  {
    id: 'productivity',
    title: 'Productivity',
    description: 'Tasks and calendar',
    icon: 'CheckSquare',
    articles: [
      {
        id: 'task-system',
        title: 'Task System',
        description: 'Managing activities and follow-ups',
        section: 'productivity',
        content: `# Task System

Tasks help you stay organized and never miss important follow-ups.

## Task Types

### Follow-up
Contact a customer or prospect.

### Call
Make a phone call.

### Email
Send an email.

### Meeting
Prepare for or attend a meeting.

### To-do
General task to complete.

## Creating Tasks

### Manual Creation
1. Click "New Task"
2. Enter title
3. Set due date
4. Assign to team member
5. Set priority
6. Add description
7. Link to contact/deal
8. Save

### Automatic Creation
Tasks are auto-created from:
- Deal stage changes
- Overdue activities
- Customer requests
- Workflow rules

## Task Properties

### Title
Brief description of what needs to be done.

### Description
Detailed notes and context.

### Due Date
When the task should be completed.

### Priority
- High: Urgent and important
- Medium: Important, not urgent
- Low: Nice to have

### Assignee
Who is responsible for completing.

### Related Records
Link to:
- Contact
- Deal
- Conversation

## Task Views

### My Tasks
Tasks assigned to you.

### Today
Due today.

### This Week
Due in the next 7 days.

### Overdue
Past due date.

### Completed
Finished tasks.

### All Tasks
Complete list.

## Task Completion

Mark complete:
1. Check the task checkbox
2. Add completion notes
3. Create follow-up if needed

## Recurring Tasks

Create tasks that repeat:
- Daily
- Weekly
- Monthly
- Custom schedule

Use for:
- Regular check-ins
- Report generation
- Pipeline reviews
- Account maintenance
`,
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Reports and forecasting',
    icon: 'BarChart2',
    articles: [
      {
        id: 'reporting-guide',
        title: 'Reporting Guide',
        description: 'Understanding your business data',
        section: 'analytics',
        content: `# Reporting Guide

NexaCRM provides comprehensive analytics to understand your business performance.

## Report Types

### Sales Reports
- Revenue by period
- Deal pipeline
- Win/loss analysis
- Sales by rep
- Average deal size

### Activity Reports
- Contact activity
- Email engagement
- Call volume
- Meeting frequency

### Performance Reports
- Team performance
- Individual metrics
- Goal tracking
- Conversion rates

### Forecast Reports
- Weighted pipeline
- Expected revenue
- Best/worst case scenarios

## Creating Reports

### Pre-built Reports
1. Go to Reports
2. Select report type
3. Choose date range
4. Apply filters
5. View

### Custom Reports
1. Click "New Report"
2. Select data source
3. Choose metrics
4. Add filters
5. Save

## Report Filters

Filter by:
- Date range
- Team member
- Pipeline stage
- Contact type
- Deal size
- Lead source

## Date Ranges

Common ranges:
- Today
- This Week
- This Month
- This Quarter
- This Year
- Custom

## Exporting Reports

Export as:
- PDF: For presentations
- CSV: For spreadsheets
- Google Sheets: For collaboration

## Scheduled Reports

Automate report delivery:
1. Create report
2. Click "Schedule"
3. Choose frequency
4. Select recipients
5. Save

Reports are emailed automatically.

## Dashboard Widgets

Add widgets to dashboard:
- Revenue chart
- Pipeline value
- Task list
- Activity feed
- Team leaderboard
`,
      },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    description: 'Workspace and team management',
    icon: 'Settings',
    articles: [
      {
        id: 'workspace-settings',
        title: 'Workspace Settings',
        description: 'Configuring your NexaCRM workspace',
        section: 'administration',
        content: `# Workspace Settings

Configure your workspace to match your business processes.

## General Settings

### Workspace Name
The name displayed across the application.

### Time Zone
Sets the default time zone for dates and times.

### Currency
Default currency for deal values.

### Date Format
How dates are displayed throughout the system.

## Custom Fields

Add fields to:
- Contacts
- Leads
- Deals

Field types:
- Text
- Number
- Date
- Dropdown
- Checkbox

## Pipeline Configuration

### Stages
Define your sales stages:
1. Add/remove stages
2. Set stage names
3. Assign probabilities
4. Choose colors
5. Save

### Deal Fields
Customize deal information:
- Add custom fields
- Set required fields
- Configure validations

## Email Integration

### SMTP Setup
Configure email sending:
1. SMTP host
2. Port
3. Username
4. Password
5. From address

Test before saving.

## WhatsApp Integration

Connect WhatsApp Business:
1. Phone Number ID
2. Business Account ID
3. Access Token
4. Webhook URL

See [WhatsApp Setup Guide](/help/whatsapp-integration).

## Security Settings

### Password Policy
Set requirements:
- Minimum length
- Complexity rules
- Expiration

### Two-Factor Authentication
Enforce 2FA for:
- All users
- Admins only
- Optional

### Session Timeout
Auto-logout after inactivity.

### IP Allowlist
Restrict access to specific IPs (optional).

## Data Management

### Data Retention
How long to keep:
- Resolved conversations
- Completed tasks
- Closed deals

### Data Export
Export all workspace data:
- Contacts
- Deals
- Messages
- Activity history

### Data Deletion
Delete all workspace data (irreversible).
`,
      },
    ],
  },
];

// Search documentation
export function searchDocumentation(query: string): DocArticle[] {
  if (!query.trim()) {
    return docSections.flatMap((section) => section.articles);
  }

  const searchTerm = query.toLowerCase().trim();
  const allArticles = docSections.flatMap((section) => section.articles);

  return allArticles.filter((article) => {
    const titleMatch = article.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = article.description.toLowerCase().includes(searchTerm);
    const contentMatch = article.content.toLowerCase().includes(searchTerm);
    const sectionMatch = article.section.toLowerCase().includes(searchTerm);

    return titleMatch || descriptionMatch || contentMatch || sectionMatch;
  });
}

// Get article by ID
export function getDocArticleById(id: string): DocArticle | undefined {
  const allArticles = docSections.flatMap((section) => section.articles);
  return allArticles.find((article) => article.id === id);
}

// Get section by ID
export function getDocSectionById(id: string): DocSection | undefined {
  return docSections.find((section) => section.id === id);
}
