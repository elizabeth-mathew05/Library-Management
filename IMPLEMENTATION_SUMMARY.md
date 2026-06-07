# Borrowing Limits, Due Date Tracking, and Overdue Notification System

## Implementation Summary

This document outlines the complete implementation of borrowing limits, due date tracking, and automated overdue notifications for the Library Management System.

## ✅ Completed Features

### 1. **Borrowing Limits**
- **Status**: ✅ Implemented
- **Location**: [borrowController.js](library-managemnet-backend/src/controllers/borrowController.js)
- **Details**:
  - Default limit: 3 simultaneous borrows per user
  - Configurable via `MAX_BORROW_LIMIT` environment variable
  - Enforced at the borrowBook endpoint
  - Users receive error message when limit is exceeded

### 2. **Due Date Tracking**
- **Status**: ✅ Implemented
- **Location**: [Borrow.js Model](library-managemnet-backend/src/models/Borrow.js), [borrowController.js](library-managemnet-backend/src/controllers/borrowController.js)
- **Details**:
  - Default borrowing period: 14 days
  - Configurable via `DEFAULT_BORROW_DAYS` environment variable
  - Due date automatically calculated when borrowing
  - Stored in database for tracking
  - Displayed to users on Borrowed Books page

### 3. **Late Fee Calculation**
- **Status**: ✅ Implemented
- **Location**: [borrowController.js](library-managemnet-backend/src/controllers/borrowController.js)
- **Details**:
  - Default: $2 per day after due date
  - Configurable via `LATE_FEE_PER_DAY` environment variable
  - Automatically calculated when book is returned
  - Stored in Borrow record
  - Displayed to users

### 4. **Overdue Detection & Status Management**
- **Status**: ✅ Implemented
- **Location**: [borrowController.js](library-managemnet-backend/src/controllers/borrowController.js)
- **Details**:
  - Automatic status update to "overdue" via `sendOverdueReminders` endpoint
  - Identifies books with `dueDate < today` and `returnedAt === null`
  - Triggered manually by admin/librarian

### 5. **Notification System**

#### In-App Notifications
- **Status**: ✅ Implemented
- **Location**: 
  - [NotificationsPage.jsx](library-managemnet-frontend/src/pages/NotificationsPage.jsx) - New
  - [notificationController.js](library-managemnet-backend/src/controllers/notificationController.js)
  - [Notification.js Model](library-managemnet-backend/src/models/Notification.js)
- **Details**:
  - User-facing notifications page with filtering
  - Mark as read/unread functionality
  - Delete individual notifications
  - Filter by type: All, Overdue, Reservations, Payments
  - Unread count badge

#### Email Notifications
- **Status**: ✅ Implemented
- **Location**: [emailService.js](library-managemnet-backend/src/services/emailService.js), [borrowController.js](library-managemnet-backend/src/controllers/borrowController.js)
- **Details**:
  - Uses nodemailer with SMTP
  - Configurable SMTP credentials via environment variables
  - Sends when reminders are triggered
  - Includes book title and overdue status

### 6. **Admin Controls**
- **Status**: ✅ Implemented
- **Location**: [AdminPage.jsx](library-managemnet-frontend/src/pages/AdminPage.jsx)
- **Details**:
  - "Send Overdue Reminders" button in Admin panel
  - Triggers `POST /api/borrows/overdue-reminders` endpoint
  - Shows loading state while processing
  - Displays success message with count of reminders sent

### 7. **Frontend Enhancements**

#### Borrowed Books Page
- **Status**: ✅ Enhanced
- **Location**: [BorrowedBooksPage.jsx](library-managemnet-frontend/src/pages/BorrowedBooksPage.jsx)
- **Details**:
  - Statistics dashboard showing:
    - Active borrows count
    - Due soon count (3 days or less)
    - Overdue count
  - Status indicators with color coding:
    - **Teal**: Active (more than 3 days remaining)
    - **Amber**: Due soon (3 days or less)
    - **Rose/Red**: Overdue
  - Days remaining display
  - Late fee with color highlighting
  - Borrowing guidelines section
  - Return button changes color for overdue items

#### Layout Navigation
- **Status**: ✅ Updated
- **Location**: [Layout.jsx](library-managemnet-frontend/src/components/Layout.jsx)
- **Details**:
  - Added "Notifications" link to main navigation
  - Accessible from all pages

## 🔧 Configuration

### Environment Variables
Add to `.env` file:
```bash
# Borrowing System
DEFAULT_BORROW_DAYS=14
MAX_BORROW_LIMIT=3
LATE_FEE_PER_DAY=2

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

See [.env.example](.env.example) for full configuration template.

## 📋 API Endpoints

### Borrowing
```
GET  /api/borrows              - Get user's borrows (authenticated)
POST /api/borrows              - Borrow a book (authenticated)
PATCH /api/borrows/:id/return  - Return a book (authenticated)
POST /api/borrows/overdue-reminders - Send overdue reminders (admin/librarian only)
```

### Notifications
```
GET    /api/notifications      - Get user's notifications (authenticated)
PATCH  /api/notifications/:id/read - Mark notification as read (authenticated)
DELETE /api/notifications/:id  - Delete notification (authenticated)
POST   /api/notifications/announcements - Create announcement (admin/librarian only)
```

## 🎯 User Workflows

### For Regular Users

**Borrowing a Book**
1. Navigate to Books page
2. Click "Borrow" on available book
3. System checks: availability and borrowing limit
4. Book added to Borrowed Books with:
   - Today's date as borrow date
   - Today + 14 days as due date
   - Status: "borrowed"

**Viewing Borrowed Books**
1. Navigate to "Borrowed" in navigation
2. See statistics: Active, Due Soon, Overdue counts
3. Table shows:
   - Book details
   - Borrow date
   - Due date (highlighted if soon or overdue)
   - Status with days remaining
   - Any late fees accrued
   - Return button

**Returning an Overdue Book**
1. On Borrowed Books page, locate overdue book (red button)
2. Click "Return"
3. Late fee calculated automatically
4. Late fee amount displayed
5. Status updated to "returned"

**Checking Notifications**
1. Click "Notifications" in navigation
2. See all notifications:
   - Overdue reminders
   - Reservation notifications
   - System announcements
3. Filter by type if needed
4. Mark individual notifications as read
5. Delete notifications

### For Librarians/Admins

**Sending Overdue Reminders**
1. Navigate to Admin panel (`/admin`)
2. Scroll to "Overdue reminders" section
3. Click "Send reminders" button
4. System will:
   - Find all overdue borrows
   - Create in-app notifications
   - Send email notifications (if configured)
   - Display success message with count

**Monitoring Borrowing Statistics**
1. Admin dashboard shows:
   - Total books
   - Total users
   - Active borrows
   - Overdue books count
   - Total revenue from late fees

## 🧪 Testing Checklist

- [ ] User can borrow books up to MAX_BORROW_LIMIT (3)
- [ ] User gets error when trying to exceed limit
- [ ] Borrow record created with correct due date (today + 14 days)
- [ ] Book availability decrements on borrow
- [ ] Borrowed Books page displays all borrows with correct dates
- [ ] Status shows days remaining for active borrows
- [ ] Status shows "overdue by X days" for overdue books
- [ ] Return button available only for unreturned books
- [ ] Late fee calculated correctly on return (days late × $2)
- [ ] Admin can see overdue count in dashboard
- [ ] Admin can send overdue reminders
- [ ] In-app notification created for each overdue book
- [ ] Email sent to user (if SMTP configured)
- [ ] User can view notifications
- [ ] User can filter notifications by type
- [ ] User can mark notifications as read
- [ ] User can delete notifications
- [ ] Borrowing limit enforced at 3 books
- [ ] Late fees displayed with proper formatting ($X.XX)
- [ ] UI color coding works correctly (teal/amber/rose)

## 📝 Database Schema References

### Borrow Model
```javascript
{
  user: ObjectId,           // User who borrowed
  book: ObjectId,           // Book borrowed
  borrowedAt: Date,         // Auto: now
  dueDate: Date,            // Required: calculated as now + 14 days
  returnedAt: Date,         // Null until returned
  lateFee: Number,          // Default: 0
  status: String,           // "borrowed" | "returned" | "overdue"
  createdAt: Date,          // Auto
  updatedAt: Date           // Auto
}
```

### Notification Model
```javascript
{
  user: ObjectId,           // User receiving notification
  title: String,            // "Overdue book reminder", etc.
  message: String,          // Detailed message
  type: String,             // "overdue" | "reservation" | "announcement" | "payment"
  read: Boolean,            // Default: false
  createdAt: Date,          // Auto
  updatedAt: Date           // Auto
}
```

## 🔒 Security & Permissions

- ✅ Users can only see their own borrowing records
- ✅ Users can only return their own books
- ✅ Users can see/delete only their own notifications
- ✅ Admins/Librarians can access all records
- ✅ Email sending requires SMTP credentials (not exposed in frontend)
- ✅ Overdue reminders endpoint protected (admin/librarian only)

## 🚀 Future Enhancements

1. **Automatic Scheduled Reminders**
   - Cron job to automatically send reminders daily
   - No manual admin intervention needed

2. **Renewal Requests**
   - Allow users to extend due date (if no holds)
   - Automatic renewal logic

3. **SMS Notifications**
   - Send overdue alerts via SMS
   - Integrate with Twilio or similar

4. **Fine Payment System**
   - Track paid vs unpaid fines
   - Payment processing integration
   - Suspend borrowing privileges for unpaid fines

5. **Borrowing Limits by User Role**
   - Different limits for different user types
   - VIP members get higher limits

6. **Analytics & Reports**
   - Borrowing patterns
   - Most borrowed books
   - User borrowing behavior analysis

7. **Integration with Calendar**
   - Add due dates to user's calendar
   - Email with calendar event attachment

8. **Notification Preferences**
   - Let users configure notification frequency
   - Email vs in-app preferences
   - Quiet hours settings

## 📞 Support & Troubleshooting

### Email Not Sending
1. Check `.env` has correct SMTP credentials
2. Verify SMTP_HOST and SMTP_PORT
3. For Gmail: Enable 2FA and create App Password
4. Check backend logs for errors

### Borrowing Limit Not Working
1. Verify `MAX_BORROW_LIMIT` set in `.env`
2. Clear and retry
3. Check for "borrowed" or "overdue" status in query

### Overdue Status Not Updating
1. Click "Send Overdue Reminders" in Admin panel
2. Check that dueDate is in past
3. Verify returnedAt is null

For more detailed troubleshooting, see [BORROWING_SYSTEM.md](BORROWING_SYSTEM.md).

## 📚 Related Files

- [borrowController.js](library-managemnet-backend/src/controllers/borrowController.js) - Business logic
- [Borrow.js](library-managemnet-backend/src/models/Borrow.js) - Database schema
- [BorrowedBooksPage.jsx](library-managemnet-frontend/src/pages/BorrowedBooksPage.jsx) - User interface
- [NotificationsPage.jsx](library-managemnet-frontend/src/pages/NotificationsPage.jsx) - Notification center
- [AdminPage.jsx](library-managemnet-frontend/src/pages/AdminPage.jsx) - Admin controls
- [emailService.js](library-managemnet-backend/src/services/emailService.js) - Email configuration

---

**Last Updated**: June 7, 2026  
**Status**: Production Ready ✅
