Marketing Automation Platform
echo "# Marketing-Automation-Platform" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:developertdsl-prog/Marketing-Automation-Platform.git
git push -u origin main

Project: Marketing Automation Platform
1. Project Overview

Build a complete, production-ready Marketing Automation Platform that allows businesses to manage marketing campaigns, automate customer communication, manage leads, track customer engagement, and analyze marketing performance from a centralized dashboard.

The project must include:

Frontend application
Backend API and business logic
Database architecture
Authentication and authorization
Marketing automation workflows
Campaign management
Analytics and reporting
Third-party integrations
Testing and deployment preparation
2. GitHub Repository Instructions

I will provide:

Existing GitHub repository URL
GitHub Personal Access Token (PAT)
Existing project source code, if available

IMPORTANT:

Use the SAME GitHub repository for frontend and backend.
Do not create separate repositories.
First inspect the existing repository and understand its architecture.
Do not delete or overwrite existing code without reviewing it.
Maintain the existing project structure wherever possible.
Create organized frontend and backend directories if required.
Commit and push changes to the same repository.
Never expose or hardcode GitHub tokens, API keys, passwords, or secrets.
Use environment variables and secure configuration files.

Suggested project structure:

marketing-automation-platform/ ├── frontend/ ├── backend/ ├── database/ ├── docs/ ├── tests/ ├── scripts/ ├── .github/ ├── .env.example ├── .gitignore └── README.md

Adapt this structure to the existing repository rather than forcing it.

3. Frontend Development

Build a modern, responsive frontend with a professional SaaS dashboard design.

Required modules:

Authentication
Login
Registration
Forgot password
Reset password
User profile
Role-based access
Dashboard
Total contacts
Total leads
Active campaigns
Campaign performance
Email open rate
Click-through rate
Conversion rate
Recent activities
Analytics charts
Contact Management
Add contacts
Edit contacts
Delete contacts
Import/export contacts
Contact segmentation
Tags and custom fields
Contact activity history
Campaign Management
Create campaigns
Edit campaigns
Schedule campaigns
Draft campaigns
Launch campaigns
Pause campaigns
Campaign performance reports
Email Marketing
Email template builder
Email editor
Template management
Campaign scheduling
Delivery tracking
Open and click tracking
Automation Workflow Builder
Visual workflow interface
Trigger configuration
Action configuration
Conditional logic
Delay and scheduling
Workflow activation/deactivation
Workflow execution history
Lead Management
Lead capture
Lead scoring
Lead status
Lead assignment
Lead activity tracking
Analytics and Reports
Campaign analytics
Contact growth
Email performance
Conversion tracking
Exportable reports
Settings
Account settings
Team management
User permissions
Integration settings
Notification preferences

Frontend requirements:

Responsive desktop, tablet, and mobile layouts.
Reusable components.
Clean navigation and sidebar.
Loading states.
Error handling.
Form validation.
API integration.
Professional UI/UX.
4. Backend Development

Develop a secure and scalable backend.

Required modules:

Authentication and authorization
User and team management
Contact management APIs
Lead management APIs
Campaign management APIs
Email sending services
Template management APIs
Workflow automation engine
Scheduling and background jobs
Analytics and reporting APIs
Third-party integration APIs
Notification services
Audit logs

Backend requirements:

REST API or an appropriate existing API architecture.
Secure authentication.
Role-based access control.
Request validation.
Centralized error handling.
Database migrations.
API documentation.
Rate limiting.
Logging and monitoring.
Secure environment configuration.
5. Database Design

Design a normalized database with appropriate relationships.

Suggested entities:

users
organizations
teams
roles
contacts
contact_tags
contact_segments
leads
campaigns
campaign_recipients
email_templates
email_events
automation_workflows
workflow_nodes
workflow_executions
integrations
notifications
audit_logs

Use appropriate indexes, foreign keys, timestamps, and tenant isolation.

6. Automation Engine

Develop a workflow engine supporting:

Triggers:

New contact created
Form submission
Tag added
Lead status changed
Campaign event

Actions:

Send email
Add tag
Update contact
Assign lead
Wait/delay
Trigger webhook
Update lead status

Conditions:

Contact attributes
Tags
Lead score
Campaign engagement

Ensure workflows support retries, execution logs, error handling, and duplicate-event protection.

7. GitHub Development and Update Rules

Use the same provided repository throughout the project.

For every milestone:

Inspect existing code.
Implement the milestone.
Run relevant tests.
Fix identified errors.
Check frontend and backend integration.
Review changed files.
Commit completed work.
Push changes to the same GitHub repository.
Update README and project documentation.
Update the milestone tracking document.

Use meaningful commit messages, for example:

feat(frontend): implement dashboard
feat(backend): add authentication APIs
feat(campaigns): implement campaign management
feat(automation): add workflow engine
test: add integration tests
docs: update project documentation

Never claim a commit or push succeeded unless it has been verified.

8. Development Milestones

Milestone 1: Repository Analysis and Project Setup

Inspect repository
Identify existing technologies
Review source code
Plan frontend/backend architecture
Identify dependencies
Prepare project roadmap

Milestone 2: Database and Backend Foundation

Database setup
Backend configuration
Models and migrations
API architecture
Error handling

Milestone 3: Authentication and User Management

Login and registration
Password reset
Authentication middleware
Roles and permissions

Milestone 4: Frontend Foundation

Dashboard layout
Sidebar and navigation
Reusable components
Responsive design
API connection

Milestone 5: Contact and Lead Management

Contact CRUD
Lead CRUD
Segmentation
Tags
Import/export

Milestone 6: Campaign Management

Campaign CRUD
Campaign scheduling
Email templates
Campaign execution

Milestone 7: Automation Workflow Engine

Workflow builder
Triggers
Actions
Conditions
Scheduling
Execution history

Milestone 8: Integrations and Notifications

Email provider integration
Webhooks
Notification system
Integration management

Milestone 9: Analytics and Reporting

Dashboard analytics
Campaign reports
Engagement tracking
Conversion metrics

Milestone 10: Testing and Quality Assurance

Frontend testing
Backend testing
API testing
Security checks
Integration testing
Bug fixes

Milestone 11: Deployment and Final Documentation

Production configuration
Deployment preparation
Environment documentation
README update
Final GitHub push
Project completion report
9. Important Development Rules
Do not build everything in one step.
Complete milestones sequentially.
Keep frontend and backend synchronized.
Do not use dummy data as a substitute for working backend functionality.
Do not leave buttons or forms non-functional.
Use proper loading, success, and error states.
Write clean, reusable, maintainable code.
Do not break existing working functionality.
Test every important feature.
Document incomplete features honestly.
Ask for clarification only when essential information is missing.
10. Milestone Reporting Format

After completing every milestone, provide:

Milestone Name: Status: Pending / In Progress / Completed / Blocked

Completed Tasks:

List completed features.

Frontend Updates:

Files changed
Features implemented

Backend Updates:

APIs created
Database changes
Business logic implemented

Testing:

Tests executed
Test results
Issues identified

GitHub Updates:

Repository
Branch
Commit hash
Push status

Remaining Tasks:

Pending implementation
Known issues
Next milestone
11. First Task

Do not immediately start coding.

First:

Wait for my GitHub repository URL and access configuration.
Inspect the existing repository.
Analyze its frontend and backend technologies.
Prepare a technical architecture.
Create a detailed milestone implementation plan.
Identify risks, dependencies, and missing requirements.
Present the plan for approval.

After approval, start Milestone 1 and continue milestone by milestone.

The final objective is a fully functional, tested, documented, and deployment-ready Marketing Automation Platform maintained in one GitHub repository.
which one prefredred and goof technology to go wtih suggest  ?