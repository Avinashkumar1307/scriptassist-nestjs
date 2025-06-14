# TaskFlow API - Senior Backend Engineer Coding Challenge

## Overview

This repository contains my solution to the TaskFlow API coding challenge, implementing a secure, scalable task management system with comprehensive authentication, authorization, and performance optimizations.

## Tech Stack

- **Language**: TypeScript
- **Framework**: NestJS
- **ORM**: TypeORM with PostgreSQL
- **Queue System**: BullMQ with Redis
- **API Style**: REST with JSON
- **Package Manager**: Bun
- **Testing**: Bun test

## Getting Started

### Prerequisites

- Node.js (v16+)
- Bun (latest version)
- PostgreSQL
- Redis

### Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Configure environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   # Update the .env file with your database and Redis connection details
   ```
4. Database Setup:

   Ensure your PostgreSQL database is running, then create a database:

   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE taskflow;
   \q

   # Or using createdb
   createdb -U postgres taskflow
   ```

   Build the TypeScript files to ensure the migrations can be run:

   ```bash
   bun run build
   ```

5. Run database migrations:

   ```bash
   # Option 1: Standard migration (if "No migrations are pending" but tables aren't created)
   bun run migration:run

   # Option 2: Force table creation with our custom script
   bun run migration:custom
   ```

   Our custom migration script will:

   - Try to run formal migrations first
   - If no migrations are executed, it will directly create the necessary tables
   - It provides detailed logging to help troubleshoot database setup issues

6. Seed the database with initial data:
   ```bash
   bun run seed
   ```
7. Start the development server:
   ```bash
   bun run start:dev
   ```

### Troubleshooting Database Issues

If you continue to have issues with database connections:

1. Check that PostgreSQL is properly installed and running:

   ```bash
   # On Linux/Mac
   systemctl status postgresql
   # or
   pg_isready

   # On Windows
   sc query postgresql
   ```

2. Verify your database credentials by connecting manually:

   ```bash
   psql -h localhost -U postgres -d taskflow
   ```

3. If needed, manually create the schema from the migration files:
   - Look at the SQL in `src/database/migrations/`
   - Execute the SQL manually in your database

### Default Users

The seeded database includes two users:

1. Admin User:

   - Email: admin@example.com
   - Password: admin123
   - Role: admin

2. Regular User:
   - Email: user@example.com
   - Password: user123
   - Role: user

## Key Improvements Implemented

This codebase contains a partially implemented task management API that suffers from various architectural, performance, and security issues. Your task is to analyze, refactor, and enhance the codebase to create a production-ready, scalable, and secure application.

### 1. Security Enhancements

- JWT Authentication with Bearer tokens
- Role-based Authorization (Admin/User) with Guards
- Refresh Token Rotation for secure session management
- Input Validation using class-validator DTOs
- Rate Limiting for API endpoints
- Data Ownership Checks to prevent unauthorized access

### 2. Performance Optimizations

- Redis Caching for frequently accessed data (1-minute TTL)
- Efficient Query Building with TypeORM to prevent N+1 issues
- Pagination implemented at database level
- Batch Processing with optimized database operations
- Queue System for background task processing using BullMQ

### 3. Architectural Improvements

- Clean Separation of concerns (Controller-Service-Repository)
- Domain-Driven Design with proper entities and aggregates
- Modular Structure following NestJS best practices
- CQRS Pattern for complex operations
- Transaction Management for data consistency

### 4. Reliability & Observability

- Comprehensive Error Handling with custom exceptions
- Request Logging with correlation IDs
- Health Checks for critical services
- Unit & Integration Tests for core functionality
- API Documentation with Swagger/OpenAPI

## Key Technical Decisions

### Authentication System

- Implemented a robust JWT authentication system with:
- Access tokens (short-lived, 15 minutes)
- Refresh tokens (longer-lived, 7 days)
- Token rotation on refresh
- Secure cookie storage for refresh tokens
- Automatic token refresh mechanism

### Authorization Model

- Role-based access control (RBAC)
- Custom decorators for route permissions
- Data ownership validation
- Admin override capabilities
- Resource-based policies for fine-grained control

### Performance Architecture

- Redis caching layer for:
- User sessions
  -Frequently accessed tasks
- Pagination results
- Database query optimization:
- Proper joins and relations
- Select only required fields

#### Queue system for

- Background processing
- Batch operations
- Resource-intensive tasks

### Tradeoffs and Considerations

- Caching Strategy:
- Chose 1-minute TTL for Redis as balance between freshness and performance
- Implemented manual invalidation for write operations
- Pagination Implementation:
- Used offset-based pagination for simplicity
- Considered cursor-based for very large datasets but deemed unnecessary for this scope

#### Error Handling:

- Generic error messages in production to prevent information leakage
- Detailed errors in development mode for debugging

#### Database Optimization:

- Added indexes on frequently queried columns
- Considered read replicas but kept single DB for simplicity

### Future Improvements

#### Advanced Caching:

- Implement cache invalidation strategies
- Add cache segmentation by user

#### Enhanced Monitoring:

- Distributed tracing
- Performance metrics collection

## API Endpoints

The API should expose the following endpoints:

### Authentication

- `POST /auth/login` - Authenticate a user
- `POST /auth/register` - Register a new user

### Users

- `POST /users` - Create a new user
- `GET /user` - Get all the users
- `POST /users/:id` - Get user details
- `PATCH /users/:id` - Update a user details
- `DELETE /users/:id` - Delete a user

### Tasks

- `GET /tasks` - List tasks with filtering and pagination
- `GET /tasks/:id` - Get task details
- `POST /tasks` - Create a task
- `PATCH /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task
- `POST /tasks/batch` - Batch operations on tasks

### Conclusion

This implementation addresses all core requirements of the challenge while introducing production-grade patterns for security, performance, and maintainability. The solution demonstrates senior-level architectural thinking and attention to both functional and non-functional requirements.
