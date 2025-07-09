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
- June 24, 2025. Standardized LLM configuration to use Gemini 2.5 Flash across all modules for consistency
- June 19, 2025. Implemented Automated Contextual Data Extraction for AI Prompts - comprehensive context analysis including industry-specific recommendations, processing record similarity analysis, compliance context, and intelligent data integration
- June 20, 2025. Enhanced Processing Records with Data Controller and DPO information - automatic filling of data controller details from company profile, added DPO contact information fields, improved UI with proper badges and sections, added editable fields for both creation workflows (manual and AI-generated)
- June 23, 2025. Enhanced Authentication System - implemented secure password hashing with bcryptjs, PostgreSQL session storage, login/register pages with form validation, authentication middleware for protected routes, user session management with proper logout functionality
- June 23, 2025. Connected "Mon Compte" section to real authenticated user profile - integrated useAuth hook, created UserBackOfficeEnhanced page with real user data display and profile editing capabilities, implemented PUT /api/user/profile route for profile updates
- June 24, 2025. Complete Breach Analysis System - implemented comprehensive GDPR violation form with all 10 official sections per EDPB Guidelines 9/2022, fixed critical validation errors in data breach creation, added missing database columns for AI analysis features, resolved schema conflicts between frontend and database, validated end-to-end violation creation workflow
- June 24, 2025. Enhanced Breach Analysis Interface - added preview functionality for AI analysis results, connected breach analysis to configurable prompts in Administration section, fixed LLM model configuration to use stable Gemini 1.5 Flash, improved error handling and logging for AI analysis debugging
- June 24, 2025. Connected Privacy Policy Generation to Configurable Prompts - privacy policy generation now uses the "Génération Politique Confidentialité" prompt from Administration > Prompts IA instead of hard-coded prompts, supports template variables {{company}}, {{processingRecords}}, and {{ragContext}}, maintains fallback to default prompt for compatibility
- June 24, 2025. Implemented New DPIA Risk Assessment System - completely redesigned the preliminary DPIA evaluation section with 9 CNIL/CEPD risk criteria (evaluation/notation, automated decision, systematic surveillance, sensitive data, large scale, data crossing, vulnerable persons, innovative technology, rights obstruction), integrated AI-powered scoring logic (Score ≥2: DPIA required, Score=1: vigilance required, Score=0: DPIA not required), enhanced user interface with detailed justifications and dynamic recommendations
- June 25, 2025. Fixed Breach Analysis Configuration - corrected the system to properly use the "Analyse Violation Données" configured prompt for all breach analyses, ensuring that user-generated form data is processed through the correct AI prompt instead of using default analysis, validated that the configured prompt is now properly retrieved and applied for breach analysis in the "Analyse de violations" section
- June 25, 2025. Enhanced Summary Table in Breach Analysis - implemented comprehensive summary table with expand/collapse functionality for text content, inline editing capabilities for all fields, AI analysis visualization modal, dedicated columns for notification dates (CNIL and data subjects), CSV export functionality, and real-time updates with proper validation and error handling
- June 26, 2025. Complete AIPD Interface Cleanup - removed all "Menaces identifiées" sections from risk assessment interface for illegitimate access, data modification, and data disappearance scenarios, deleted corresponding threat prompts from database and administration panel, updated code mappings and cleaned references to threat functionality, changed UI labels to "Sources de risques et menaces" for better clarity while maintaining existing prompt structure
- June 26, 2025. Implemented Comprehensive Multi-Tenancy and Data Security - set aziz.bena94@gmail.com as system administrator, consolidated all existing data under single admin account, removed all other users and companies to ensure clean state, added verifyUserCompanyAccess method for proper data isolation, implemented security foundation for future user registrations to prevent cross-tenant data access
- July 6, 2025. Fixed Multi-Tenancy Authentication Issues - resolved critical bug where new users were accessing admin company (ID 1) data instead of their own, replaced hardcoded COMPANY_ID across all frontend pages with dynamic authentication-based company access, implemented proper authentication context in dashboard and processing records, added company access verification to all AI generation routes, validated end-to-end workflow with new user (aziz_benammar@hotmail.fr generating records to company ID 3)
- July 6, 2025. Resolved Breach Analysis List Display Issue - fixed critical bug where created violations were not appearing in the list due to incorrect query key format, corrected useQuery configuration to use proper REST endpoint format, updated all cache invalidation calls to use consistent query keys, added proper loading states and authentication validation to BreachAnalysisEnhanced component, validated full workflow from violation creation to AI analysis
- July 6, 2025. Completed Multi-Tenancy Authentication Audit - eliminated all remaining hardcoded COMPANY_ID references across all modules (action-plan.tsx, dpia.tsx, DpiaEvaluation.tsx, DpiaEvaluationOriginal.tsx, chatbot.tsx), replaced with dynamic user authentication using useAuth hook and company data retrieval, updated all API queries and mutations to use proper companyId from authenticated user context, corrected cache invalidation patterns to include company-specific keys, ensured complete data isolation and proper multi-tenant security across all GDPR compliance modules
- July 7, 2025. Enhanced Dashboard Interface and Breach Management - added deletion functionality for violations with proper authentication and confirmation, cleaned up priority actions by removing risk level badges and "Normal" priority indicators, made "Progression par domaine" section fully dynamic based on real compliance categoryScores instead of hardcoded values, improved visual design with color-coded progress indicators for each compliance domain
- July 7, 2025. Improved Navigation and Notifications System - fixed recent activity "Voir" buttons to navigate to correct pages (/actions, /rights, /records, /privacy-policy), enhanced notification bell in header with dropdown menu showing recent alerts and navigation to relevant sections, added interactive notification system with action items and proper routing
- July 7, 2025. Comprehensive Help Section Implementation - created complete help center with 11 detailed tutorial articles covering all major GDPR functionalities (diagnostic, action plans, processing records, violations, DPIA, rights management, security, privacy policies, team training), extensive FAQ with 40+ questions organized in 10 categories (General, Organization, Implementation, Data Management, Legal Bases, Rights, Subcontracting, Security, Digital, Sanctions, Transfers, Sector-specific), integrated search functionality across all content, glossary with 12 key GDPR terms, version history and updates section, support contact options, accessible via functional "Aide" button in header navigation
- July 7, 2025. Complete Subprocessor Registry Implementation - created new "Registre du sous-traitant" module positioned between "Registre des traitements" and "Politique de confidentialité", implemented manual-only creation workflow with comprehensive form fields (client details, representative information, sub-subprocessors, processing categories, international transfers, security measures), added complete database schema and API endpoints, included CSV export functionality and full CRUD operations, integrated navigation in sidebar with proper positioning
- July 7, 2025. Enhanced Joint Controller Support in Processing Records - implemented conditional display section for joint controller information in processing record cards, added "Responsable conjoint du traitement" section that appears only for records with type "joint-controller", included editable field for joint controller coordinates with proper form validation, corrected data flow to ensure jointControllerInfo field is properly saved and displayed from both manual creation and AI generation workflows
- July 7, 2025. Enhanced Subprocessor Registry with Custom Security Measures - added functionality to allow users to add personalized security measures beyond the predefined list, implemented input field with "Enter" key and button support for adding custom measures, displayed custom measures as removable badges with click-to-delete functionality, integrated proper form state management and reset behavior for optimal user experience
- July 7, 2025. Configurable Prompts for LA Team Jean Michel - migrated all 4 Jean Michel bots (Fondement, Voyages, Archive, Irma) from hardcoded prompts to configurable database prompts, added comprehensive prompts with expertise details and professional styling guidelines, implemented template variable support ({{message}}) for dynamic question integration, enabled prompt customization via Administration interface, maintained fallback system for reliability
- July 7, 2025. Enhanced LA Team Jean Michel Interface - added conversation deletion functionality with proper authentication and confirmation dialogs, implemented hover-to-show delete buttons with intuitive UX design, fixed authentication issues in conversation management routes, improved conversation layout with better spacing and visual hierarchy, removed non-functional delete button from chat interface as requested
- July 8, 2025. Fixed Privacy Policy Versioning System - corrected automatic version numbering so each new policy gets incremental version numbers (1, 2, 3...) instead of all being "version 1", updated createPrivacyPolicy method to calculate next version based on existing policies for the company, modified schema to make version auto-calculated, ensured proper version display in UI history
- July 8, 2025. Enhanced AI Justifications in Processing Records - implemented detailed legal justifications using Gemini 2.5 Flash with specialized prompts for purpose, legal basis, and retention period fields, added temperature control (0.1) to minimize hallucinations, created concise 2-3 sentence justifications with precise GDPR article references, integrated loading states and caching system, removed verbose introductory formulas for direct factual responses
- July 8, 2025. Simplified International Transfers in DPIA - replaced checkboxes for "France", "UE", "Pays reconnu adéquat par l'UE", and "Autre pays" with a single text field allowing users to directly specify the destination country, updated database schema and form handling to use simplified country field, improved user experience by reducing form complexity while maintaining compliance tracking
- July 9, 2025. Enhanced Multi-Company Switching System - created comprehensive CompanySwitcher component for seamless enterprise navigation, extended authentication context with currentCompany state management, implemented company access validation and deduplication logic to prevent duplicate entries, added persistent company selection with localStorage, integrated real-time company switching with proper data invalidation and user feedback notifications
- July 9, 2025. Fixed Critical Multi-Company Data Loading Bug - resolved async Promise handling issue in dashboard queries where res.json() was not properly awaited, causing wrong company data to display after switching companies, corrected TanStack Query implementations to properly chain Promises for API responses, validated complete multi-tenant data isolation now working correctly
- July 9, 2025. Complete Authentication System Standardization - resolved final authentication inconsistencies post multi-company implementation by standardizing all authentication references to use req.session?.userId pattern, corrected diagnostic questionnaire responses creation error "Cannot read properties of undefined (reading 'id')", updated 33+ authentication points across all modules (actions, comments, attachments, assignments, profile updates, invitations, access verifications), ensured complete consistency between session-based authentication and multi-tenant access control

## User Preferences

Preferred communication style: Simple, everyday language.

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