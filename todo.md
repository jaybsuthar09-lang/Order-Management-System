# Order Management System (OMS) - Development Tracker

## Milestone 1: Project Setup & Foundation
- [x] Configure Tailwind CSS 4 with custom theme (ERP-modern style)
- [x] Set up sidebar navigation with DashboardLayout
- [x] Create routing structure (Dashboard, Customers, Products, Orders, Settings, Reports)
- [x] Initialize SQLite database schema (Company, Customers, Products, Orders, OrderItems)
- [x] Create database migration and apply via webdev_execute_sql
- [x] Set up tRPC procedures structure
- [x] Create base API helpers in server/db.ts

## Milestone 2: Customer Master Module
- [x] Create Customer table schema
- [x] Build Customer CRUD API procedures (create, read, update, delete, list, search)
- [x] Create Customer list page with data table
- [x] Create Customer create/edit form modal
- [ ] Implement searchable customer dropdown for Orders
- [x] Implement searchable customer dropdown for Orders
- [x] Add validation and error handling
- [x] Write vitest tests for customer procedures

## Milestone 3: Product Master Module
- [x] Create Product table schema
- [x] Build Product CRUD API procedures
- [x] Create Product list page with data table
- [x] Create Product create/edit form modal
- [x] Add validation and error handling
- [x] Write vitest tests for product procedures

## Milestone 4: Orders Module & Company Settings
- [x] Create Company settings table schema
- [x] Create Order and OrderItem table schemas
- [x] Build auto-increment delivery number generator (DM-2026-000001 format)
- [x] Build Order CRUD API procedures
- [x] Create Company Settings page (logo, name, address, phone, email, GST, footer, signature upload)
- [x] Implement file upload for company logo and digital signature
- [x] Create Order create/edit form with customer/product selection
- [x] Implement status workflow (Pending → Packed → Dispatched → Delivered)
- [x] Implement automatic total calculation
- [x] Create Order list page with status filtering
- [x] Write vitest tests for order procedures

## Milestone 5: PDF Generation
- [x] Study reference delivery memo image layout
- [x] Create PDF template matching reference layout
- [x] Implement pdf-lib integration for PDF generation
- [x] Add company logo to PDF
- [x] Add digital signature to PDF (from Company Settings)
- [x] Add company details section
- [x] Add delivery number and date
- [x] Add customer details section
- [x] Add items table with calculations
- [x] Add receiver signature area
- [x] Add footer section
- [x] Optimize for A4 printing
- [x] Create PDF download endpoint
- [x] Test PDF generation with various data

## Milestone 6: Reports Module
- [x] Create Daily Orders report page
- [x] Create Monthly Orders report page
- [x] Create Customer-Wise report page
- [x] Create Product-Wise report page
- [x] Create Pending Orders report page
- [x] Create Delivered Orders report page
- [x] Implement report filtering and date range selection
- [x] Add export to CSV functionality (optional)
- [x] Write vitest tests for report queries

## Milestone 7: Dashboard & Final Polish
- [x] Create Dashboard with statistics cards
- [x] Add recent orders list to dashboard
- [x] Implement search functionality across orders
- [x] Add quick action buttons
- [x] Implement responsive design for mobile
- [x] Add loading states and error boundaries
- [x] Test all features end-to-end
- [x] Create checkpoint and prepare for deployment
