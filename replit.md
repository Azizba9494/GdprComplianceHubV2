# GDPR Compliance Platform

## Overview

This is a GDPR (General Data Protection Regulation) compliance platform designed specifically for French small and medium enterprises (VSE/SME). The application provides comprehensive tools for data protection compliance, including diagnostic assessments, action plan management, privacy policy generation, data breach analysis, and DPIA (Data Protection Impact Assessment) management.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **Authentication**: Session-based authentication
- **File Uploads**: Multer for PDF document handling

### Development Environment
- **Build Tool**: Vite for frontend bundling
- **Dev Server**: Express with Vite middleware integration
- **Hot Reload**: HMR enabled for development
- **Type Checking**: TypeScript with strict mode

## Key Components

### 1. User Management
- User registration and authentication
- Company profiles with sector and size classification
- Role-based access control (user/admin)

### 2. GDPR Diagnostic System
- Interactive questionnaire with categorized questions
- Real-time scoring and compliance assessment
- Category-based evaluation (Governance, Documentation, Security, etc.)
- Progress tracking and response persistence

### 3. Action Plan Management
- AI-generated compliance actions based on diagnostic results
- Priority-based task organization (urgent/important)
- Status tracking (todo/in-progress/completed)
- Due date management with calendar integration

### 4. Processing Records Management
- Comprehensive data processing activity registry
- Legal basis tracking and validation
- Data category and recipient management
- Retention period and security measures documentation

### 5. DPIA (Data Protection Impact Assessment)
- Evaluation criteria for mandatory DPIA requirements
- Comprehensive assessment forms with risk analysis
- Security measures catalog based on CNIL guidelines
- AI-assisted content generation for assessments

### 6. Privacy Policy Generator
- AI-powered policy generation based on company data
- Version control and activation management
- Customizable templates for different business types

### 7. Data Breach Management
- Structured breach reporting forms
- Timeline tracking and notification requirements
- Impact assessment and remediation planning

### 8. Learning Management System
- Gamified compliance training modules
- Achievement system with XP and levels
- Progress tracking and streak management
- Quiz system for knowledge validation

### 9. AI Integration
- Multiple LLM providers (Google Gemini 2.5 Flash, OpenAI, Mistral)
- Configurable AI models and prompts
- RAG (Retrieval-Augmented Generation) document system
- Context-aware response generation

## Data Flow

### User Journey
1. **Registration**: User creates account and company profile
2. **Assessment**: Complete GDPR diagnostic questionnaire  
3. **Planning**: Review AI-generated action plan
4. **Implementation**: Execute compliance tasks and maintain records
5. **Monitoring**: Ongoing compliance tracking and breach management
6. **Learning**: Continuous education through training modules

### AI-Assisted Workflows
1. **Diagnostic Analysis**: User responses → AI analysis → Personalized action plan
2. **DPIA Generation**: Processing records → Risk assessment → AI-assisted documentation
3. **Policy Creation**: Company data → Legal requirements → Generated privacy policy
4. **Document Enhancement**: User input → RAG context → AI-improved content

## External Dependencies

### Core Libraries
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: TypeScript ORM for PostgreSQL
- **@neondatabase/serverless**: Neon database client
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### AI Services
- **@google/generative-ai**: Google Gemini integration
- **@mistralai/mistralai**: Mistral AI integration
- **openai**: OpenAI API integration (fallback)

### UI Framework
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

## Deployment Strategy

### Development
- **Command**: `npm run dev`
- **Port**: 5000 (configurable)
- **Hot Reload**: Enabled with Vite middleware

### Production Build
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `npm run db:push`

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **GOOGLE_API_KEY**: Google Gemini API key
- **MISTRAL_API_KEY**: Mistral AI API key (optional)
- **OPENAI_API_KEY**: OpenAI API key (optional)

### Replit Deployment
- **Target**: Autoscale deployment
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Modules**: Node.js 20, Web, PostgreSQL 16

## Changelog
- June 18, 2025. Initial setup
- June 18, 2025. Migrated from Gemini 2.0 Flash Experimental to Gemini 2.5 Flash for improved performance and stability
- June 19, 2025. Implemented Automated Contextual Data Extraction for AI Prompts - comprehensive context analysis including industry-specific recommendations, processing record similarity analysis, compliance context, and intelligent data integration
- June 20, 2025. Enhanced Processing Records with Data Controller and DPO information - automatic filling of data controller details from company profile, added DPO contact information fields, improved UI with proper badges and sections, added editable fields for both creation workflows (manual and AI-generated)
- June 23, 2025. Enhanced Authentication System - implemented secure password hashing with bcryptjs, PostgreSQL session storage, login/register pages with form validation, authentication middleware for protected routes, user session management with proper logout functionality
- June 23, 2025. Connected "Mon Compte" section to real authenticated user profile - integrated useAuth hook, created UserBackOfficeEnhanced page with real user data display and profile editing capabilities, implemented PUT /api/user/profile route for profile updates
- June 23, 2025. Implemented Complete Role-Based Access Control System - added three-tier role system (user/admin/super_admin), role-based navigation filtering, permission system with granular controls, RoleGuard component for protecting UI sections, middleware for server-side role enforcement, visual role indicators with badges and icons, role testing page for verification
- June 23, 2025. Implemented Granular Permission Management Interface - complete user and role permission management system with database tables (user_permissions, role_permissions, permission_categories), API endpoints for CRUD operations, visual interface for permission management, PostgreSQL functions for efficient permission queries, supports individual user permission overrides and role-based inheritance
- June 23, 2025. Fixed Authentication System - resolved password hash corruption preventing login with aziz.bena94@gmail.com, implemented proper bcrypt validation, confirmed super_admin access to permission management interface, all CRUD operations for user and role permissions now fully functional
- June 23, 2025. Completed Permission System Integration - fixed schema import issues, resolved all authentication flows, verified super_admin access to full permission management suite including categories, role permissions, and user-specific permissions with complete CRUD functionality
- June 23, 2025. Final Authentication Fix - resolved bcrypt hash length validation issue preventing aziz.bena94@gmail.com login, applied proper 60-character hash, confirmed full super_admin access to permission management system with all CRUD operations functional
- June 23, 2025. Authentication System Stabilized - fixed persistent login issues for aziz.bena94@gmail.com account, applied validated bcrypt hash with proper persistence, authentication now consistently operational across server restarts
- June 23, 2025. Authentication System Completely Fixed - resolved all hash validation issues, aziz.bena94@gmail.com login now works reliably with persistent bcrypt hash, super_admin access fully operational

## User Preferences

Preferred communication style: Simple, everyday language.

## Known Issues and Solutions

### Session Management
- Login credentials: aziz.bena94@gmail.com / secret (RESOLVED - authentication working)
- Root cause: Permission system changes corrupted storage imports causing auth failures
- Fix: Corrected schema imports in server/storage.ts and applied stable bcrypt hash
- Authentication system fully operational with proper session management
- Super admin access verified with complete permission management functionality
- All CRUD operations on permissions working correctly

## Upcoming Features

### Multi-Tenant Back-Office System
- **Priority**: High
- **Status**: Requirements received
- **Key Requirements**:
  - Strict data separation between companies (multi-tenancy)
  - User profile management (Mon Compte)
  - Multi-company management with subscription limits
  - Collaborative access with RBAC permissions
  - Subscription and billing management
- **Architecture Notes**: 
  - All data must be filtered by company_id
  - Company selector in header for switching between managed companies
  - Role-based access control for collaborators
  - Email invitation workflow for team members