# Pet Customer Management Module

This module implements a comprehensive customer management system based on the Pet/Customer.json format. It allows you to view, create, edit, and delete customers with extended data fields.

## Features

- **Customer List**: View all customers with filtering by type and tags
- **Customer Detail View**: See customer details along with associated jobs and invoices
- **Customer Creation**: Add new customers with full profile information
- **Customer Editing**: Update existing customer information
- **Address Management**: Add and manage customer addresses
- **Tag Management**: Add and remove tags for better customer categorization

## Pages

### Customer List
- Path: `/customers`
- Features:
  - Search by name, email, phone, or company
  - Filter by customer type (homeowner or business)
  - Filter by tags
  - Quick access to view, edit, or delete actions

### Customer Detail View
- Path: `/customers/view/[id]`
- Features:
  - Complete customer profile information
  - Primary address display
  - Contact information
  - Associated jobs tab
  - Associated invoices tab
  - Activity history tab

### Add Customer
- Path: `/customers/new`
- Features:
  - Form to create a new customer
  - Required validation for essential fields
  - Add customer tags
  - Set primary address
  - Configure customer settings

### Edit Customer
- Path: `/customers/edit/[id]`
- Features:
  - Update existing customer information
  - Manage customer tags
  - Update address information
  - Change customer settings

## Services

The module uses the `petCustomerService` which provides:

- CRUD operations for customers
- Address management
- Tag management
- Data filtering and search

## Data Structure

Customer data follows the Pet/Customer.json format with fields such as:
- Basic information (name, type)
- Contact information (email, phone numbers)
- Business information (company, job title)
- Address information
- Tags
- Settings (card on file, notifications)
- Tracking data (created/updated timestamps)

## Technical Notes

- Uses React Query for data fetching and state management
- Implements responsive design with Tailwind CSS
- Provides offline support indicators
- Includes loading states and error handling
- Uses mock data for development and testing
