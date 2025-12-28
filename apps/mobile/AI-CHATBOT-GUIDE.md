# AI Chatbot (AIRA) - User Guide

## Overview

AIRA (AI Field Service Assistant) is your conversational AI assistant that helps you manage customers through natural language. Simply type what you want to do, and AIRA will understand and execute it.

## 🎯 What AIRA Can Do

### Customer Management

#### 1. Create Customers
Create new customers by telling AIRA the details in natural language.

**Examples:**
```
Create customer John Smith, email john@example.com, phone 555-1234
Add customer Jane Doe, phone 555-5678, email jane@example.com
New client Mike Johnson, 555-9999, mike@test.com
Create company ABC Plumbing, phone 555-0000
```

**What AIRA Extracts:**
- ✅ Name (first and last)
- ✅ Email address
- ✅ Phone number (mobile)
- ✅ Company name (for commercial customers)
- ✅ Customer type (auto-detected: RESIDENTIAL or COMMERCIAL)

#### 2. Find/Search Customers
Search for existing customers by name, email, or phone.

**Examples:**
```
Find customer John Smith
Search for Mike
Show customer john@example.com
Get customer 555-1234
```

**Response:**
- Lists up to 5 matching customers
- Shows name, email, phone, and ID
- Provides ID for updates

#### 3. Update Customers
Update customer information using their ID (get from search first).

**Examples:**
```
Update customer abc-123-def email to newemail@example.com
Change customer abc-123 phone to 555-7777
Edit customer abc-123 name to John Smith Jr
```

## 🔐 Tenant Isolation & Security

### How Tenant ID Works

1. **Automatic Tenant Detection**
   - When you log in, your tenant ID is stored securely
   - All chatbot operations automatically use YOUR tenant ID
   - You can ONLY create/view/update customers in YOUR company

2. **Data Isolation**
   - API client automatically adds `x-tenant-id` header
   - Backend filters all data by tenant
   - Impossible to access other companies' data

3. **Security Flow**
   ```
   User Message
   ↓
   AIRA Parses Intent
   ↓
   Calls Customer Service API
   ↓
   API Client adds Tenant ID header (from login)
   ↓
   Backend validates tenant access
   ↓
   Returns only YOUR company's data
   ```

## 🤖 How AIRA Works

### Natural Language Processing

AIRA uses pattern matching and regex to understand your intent:

1. **Intent Detection**
   - Analyzes keywords: create, update, find, customer, etc.
   - Determines action with confidence score
   - Extracts relevant data from your message

2. **Data Extraction**
   - **Email**: Pattern matching for email addresses
   - **Phone**: Supports multiple formats (555-1234, (555) 123-4567, 5551234567)
   - **Names**: Detects capitalized words as names
   - **Company**: Looks for "company" keyword
   - **ID**: UUID format for updates

3. **Validation**
   - Checks required fields before API call
   - Provides helpful error messages
   - Suggests correct format if extraction fails

### Example Conversation

```
User: Hi
AIRA: 👋 Hello! I'm AIRA, your AI field service assistant.
      I can help you create, find, and update customers.
      What would you like to do?

User: Create customer John Smith, email john@example.com, phone 555-1234
AIRA: ✅ Customer created successfully!

      **John Smith**
      📧 john@example.com
      📱 5551234
      🏢 Type: RESIDENTIAL

      Customer ID: abc-123-def-456

      You can now create jobs for this customer!

User: Find customer John
AIRA: Found 2 customers:

      1. **John Smith**
         📧 john@example.com
         📱 5551234
         ID: abc-123-def-456

      2. **John Doe**
         📧 johndoe@example.com
         📱 5559999
         ID: xyz-789-ghi-012

User: Update customer abc-123-def-456 phone to 555-7777
AIRA: ✅ Customer updated successfully!

      **John Smith**
      📧 john@example.com
      📱 5557777

      The changes have been saved.
```

## 💡 Tips & Best Practices

### For Best Results

1. **Be Specific**
   - Include all available information
   - Use clear, simple language
   - One action per message

2. **Follow Patterns**
   - "Create customer [name], email [email], phone [phone]"
   - "Find customer [search term]"
   - "Update customer [ID] [field] to [value]"

3. **Get Help Anytime**
   - Type "help" to see all commands
   - Type "hi" or "hello" for a greeting and intro
   - AIRA will guide you if extraction fails

### Common Formats

**Phone Numbers:**
- 555-1234
- (555) 123-4567
- 5551234567
- 555.123.4567

**Names:**
- Use capital letters: John Smith
- Can include middle: John Q. Smith
- Last name optional for single names

**Company:**
- Use keyword: "company ABC Plumbing"
- Automatically sets type to COMMERCIAL

## 🛠️ Technical Details

### API Integration

**Customer Service Endpoints Used:**
```typescript
// Create
POST /customers
Headers: { x-tenant-id: [auto-added] }
Body: { firstName, lastName, email, mobilePhone, type }

// Update
PUT /customers/{id}
Headers: { x-tenant-id: [auto-added] }
Body: { ...updatedFields }

// Search
GET /customers?search={term}
Headers: { x-tenant-id: [auto-added] }
```

### Tenant ID Flow

```typescript
// 1. User logs in
login(email, password)
  → Returns user with tenantId
  → Stores tenantId in SecureStore

// 2. User sends chat message
sendMessage("Create customer John...")
  → aiChatService.sendMessage()
  → Parses intent
  → Calls customerService.createCustomer()
  → apiClient.post() automatically adds tenant ID header
  → Backend creates customer in user's tenant
```

### Error Handling

AIRA handles errors gracefully:
- Invalid data → Helpful suggestions
- Missing required fields → Clear instructions
- API errors → User-friendly error messages
- Network issues → Fallback responses

## 📊 Data Privacy

### What's Stored

- **Conversation History**: Kept in memory during session
- **Customer Data**: Stored in database with tenant isolation
- **Tenant ID**: Securely stored in device SecureStore
- **No Cross-Tenant Access**: Impossible by design

### What's NOT Stored

- Messages are not permanently logged
- No conversation analytics
- No data sharing between tenants

## 🚀 Future Enhancements

Planned features:
1. **Job Creation**: Create jobs through chat
2. **Schedule Management**: Check and book appointments
3. **Invoice Generation**: Create invoices via chat
4. **Multi-step Conversations**: Remember context across messages
5. **Voice Input**: Speak instead of type
6. **Smart Suggestions**: Auto-complete and suggestions

## 🆘 Troubleshooting

### AIRA doesn't understand me
- Check spelling and capitalization
- Use one of the example formats
- Type "help" to see all commands

### Customer creation fails
- Verify you have name or company name
- Check email format (must include @)
- Phone should be 10 digits

### Can't find customer
- Try searching by name, email, or phone
- Check spelling
- Customer might not exist yet

### Update not working
- Get customer ID first by searching
- Use exact UUID format
- Specify what field to update

## 📞 Need Help?

Type any of these in the chat:
- `help` - See all commands
- `what can you do` - Learn capabilities
- `examples` - View example commands
- `hi` - Get a friendly introduction

---

**AIRA is always learning!** Your feedback helps improve the experience.
