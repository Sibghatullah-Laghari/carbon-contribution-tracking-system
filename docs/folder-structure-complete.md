# CCTRS Folder Structure (Complete)

Generated on: 2026-03-21

## 1. Root Overview

```text
carbon-contribution-tracking-system/
├── .github/workflows/               # CI/CD workflow configurations
├── backend/                         # Backend workspace for the Spring Boot application
│   └── cctrs-backend/               # Primary Spring Boot service
├── frontend/                        # React + Vite single-page application
├── database/                        # Database schema and migration scripts
├── docs/                            # Project documentation
├── clevercloud/                     # Clever Cloud configuration files
├── data/                            # Supporting data files
├── README.md                        # Primary project README
├── PROJECT_README.md                # Generated read-only documentation
├── test-api.sh                      # API testing helper script
└── vercel.json                      # Root deployment configuration
```

## 2. Backend Layout (`backend/cctrs-backend`)

```text
backend/cctrs-backend/
├── src/main/java/com/cctrs/backend/
│   ├── controller/                  # REST controllers (activities, reports, admin, etc.)
│   ├── security/                    # JWT, OAuth2, authentication controller, security configuration
│   ├── service/                     # Business logic and application services
│   ├── repository/                  # JDBC repositories and SQL queries
│   │   └── mapper/                  # RowMapper implementations
│   ├── model/                       # Domain models and entities
│   ├── dto/                         # API request and response DTOs
│   ├── config/                      # Swagger, exception handling, and application configuration
│   ├── startup/                     # Startup initialization and schema migration runner
│   ├── scheduler/                   # Scheduled background tasks
│   └── BackendApplication.java      # Spring Boot application entry point
├── src/main/resources/
│   ├── application.properties       # Runtime configuration (profile/environment based)
│   ├── application-prod.properties  # Production-specific properties
│   ├── application-prod.yml         # Production YAML overrides
│   ├── schema.sql                   # Idempotent database schema initialization
│   └── schema-postgres.sql          # PostgreSQL-specific schema
├── src/test/java/                   # Backend test sources
├── pom.xml                          # Maven build and dependency configuration
├── Dockerfile                       # Backend container image definition
├── mvnw / mvnw.cmd                  # Maven wrapper scripts
└── clevercloud/maven.json           # Clever Cloud application metadata
```

## 3. Frontend Layout (`frontend`)

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── public/                  # Public-facing pages (auth, legal, FAQ, help)
│   │   └── dashboard/               # User and administrator dashboard pages
│   ├── layout/                      # Shared layouts and navigation components
│   ├── context/                     # AuthContext and global authentication state
│   ├── api/                         # Axios client and authentication utilities
│   ├── config/                      # API base URL configuration
│   ├── components/                  # Reusable UI components
│   │   └── analytics/               # Analytics charts and helper components
│   ├── App.jsx                      # Application route definitions
│   ├── main.jsx                     # React application bootstrap
│   └── styles.css                   # Global application styles
├── package.json                     # Frontend scripts and dependencies
├── vite.config.js                   # Vite project configuration
└── vercel.json                      # Vercel deployment configuration
```

## 4. Database and Migrations

```text
database/
├── schema.sql
├── migration_add_questions_table.sql
├── migration_add_rejection_reason.sql
├── migration_add_soft_delete_archive.sql
├── migration_add_tree_abuse_flags.sql
└── migration_fix_proof_image_size.sql
```

## 5. Documentation Area

```text
docs/
├── README.md
├── api-design.md
├── architecture.md
├── development-plan.md
├── er-diagram.md
├── architecture-complete.md         # Generated during this documentation run
├── api-reference-complete.md        # Generated during this documentation run
└── folder-structure-complete.md     # Generated during this documentation run
```

## 6. Responsibility Mapping (Quick Reference)

- `controller/`: Handles HTTP requests and endpoint orchestration
- `service/`: Implements core business logic and workflows
- `repository/`: Manages SQL persistence and query execution
- `security/`: Provides authentication, authorization, and JWT/OAuth integration
- `pages/`: Contains feature-specific frontend pages
- `layout/`: Defines shared layouts and navigation structures
- `database/`: Stores schema definitions and database migration scripts
