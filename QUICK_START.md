# Quick Start Guide: Borrowing System with Overdue Notifications

## 🚀 Quick Setup

### 1. Environment Configuration
Copy `.env.example` to `.env` and update with your settings:

```bash
# Backend .env
DEFAULT_BORROW_DAYS=14
MAX_BORROW_LIMIT=3
LATE_FEE_PER_DAY=2

# For email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

### 2. Start Backend
```bash
cd library-managemnet-backend
npm install
npm start
```
Backend runs on `http://localhost:5000`

### 3. Start Frontend
```bash
cd library-managemnet-frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## 📖 Feature Overview

### User Features

#### 1. Borrow a Book
- Go to **Books** page
- Click **Borrow** on any available book
- System automatically:
  - Calculates due date (today + 14 days)
  - Decrements available copies
  - Creates borrow record
  - Shows confirmation message

#### 2. View Borrowed Books
- Click **Borrowed** in navigation
- See **Dashboard** with stats:
  - Active Borrows: Total active borrows
  - Due Soon: Books due within 3 days
  - Overdue: Overdue books needing return
- **Table** shows:
  - Book info (title, author)
  - Borrowed date
  - Due date (color-coded)
  - Days remaining / overdue status
  - Late fees (if any)
  - Return button

#### 3. Return a Book
- Click **Return** button in Borrowed Books table
- System:
  - Calculates days overdue (if any)
  - Multiplies by $2/day for late fee
  - Updates status to "returned"
  - Shows success message

#### 4. View Notifications
- Click **Notifications** in navigation
- See all overdue and system notifications
- Features:
  - **Filter** by type: All, Overdue, Reservations, Payments
  - **Mark as read** to track unread count
  - **Delete** individual notifications
  - See timestamp for each notification

### Admin/Librarian Features

#### 1. Admin Dashboard
- Go to **/admin**
- See **Statistics**:
  - Total books
  - Total users
  - Active borrows
  - Overdue count
  - Total revenue from fees

#### 2. Send Overdue Reminders
- Scroll to **"Overdue reminders"** section
- Click **"Send reminders"** button
- System:
  - Finds all overdue books (dueDate < today, not returned)
  - Creates in-app notifications for users
  - Sends emails (if SMTP configured)
  - Shows confirmation with count

#### 3. Manage Books
- Add/Edit/Delete books
- See inventory with availability
- Track status (available/limited/unavailable)

## 🧪 Test Scenarios

### Scenario 1: Borrow and Return Normal Book
1. **User borrows** a book
2. See due date = today + 14 days
3. Status shows "14 days left"
4. **Return book** before due date
5. Late fee should be $0
6. Status changes to "returned"

### Scenario 2: Borrow Overdue Book
1. **User borrows** book with due date in past (simulate old date)
2. **Admin sends** overdue reminders
3. User receives **notification**: "Overdue book reminder"
4. User sees **status**: "overdue by X days"
5. Return button is **red** (urgent)
6. Late fee calculated: daysLate × $2

### Scenario 3: Hit Borrowing Limit
1. **User borrows** 3 books (max limit)
2. Try to **borrow 4th** book
3. Get error: "Borrowing limit reached (3)"
4. **Return 1 book**
5. Now can **borrow 4th** book

### Scenario 4: Email Notifications
1. Configure SMTP in `.env`
2. Create overdue book (manual date manipulation for testing)
3. **Admin sends** reminders
4. Check **email inbox** for:
   - Subject: "Library overdue reminder"
   - Body: "{Book Title} is overdue. Please return it as soon as possible."

### Scenario 5: Notification Management
1. Receive multiple **notifications**
2. Go to **Notifications** page
3. **Filter** by "Overdue" - see only overdue notifications
4. **Mark as read** - count badge updates
5. **Delete** - notification removed
6. **Filter All** - see remaining notifications

## 📊 Status Color Codes

| Color | Status | Meaning |
|-------|--------|---------|
| **Teal** | Active | More than 3 days remaining |
| **Amber** | Due Soon | 3 days or less remaining |
| **Rose/Red** | Overdue | Past due date, needs return |
| **Gray** | Returned | Book already returned |

## 💰 Late Fee Calculation

```
Late Fee = Days Overdue × $2/day

Example:
- Returned 5 days late
- Late Fee = 5 × $2 = $10
```

## 🔑 Key Configuration Values

| Setting | Default | Configurable | Env Variable |
|---------|---------|--------------|--------------|
| Borrow Period | 14 days | ✅ | DEFAULT_BORROW_DAYS |
| Borrow Limit | 3 books | ✅ | MAX_BORROW_LIMIT |
| Late Fee | $2/day | ✅ | LATE_FEE_PER_DAY |
| Email Service | Not configured | ✅ | SMTP_* variables |

## 🐛 Common Issues & Solutions

### Issue: Can't borrow more than 1 book
**Solution**: Check `MAX_BORROW_LIMIT` is set in `.env` (default: 3)

### Issue: Due dates not showing
**Solution**: Ensure `DEFAULT_BORROW_DAYS` is set in `.env` (default: 14)

### Issue: Late fees not calculating
**Solution**: 
- Check `LATE_FEE_PER_DAY` is set (default: $2)
- Only calculated on return, not on view

### Issue: Email not sending
**Solution**:
- Check SMTP credentials in `.env`
- For Gmail: Use App Password (not regular password)
- Verify SMTP_HOST and SMTP_PORT are correct
- Check backend logs: `npm start` output

### Issue: Overdue status not updating
**Solution**:
- Click "Send reminders" button in Admin
- Status updates from "borrowed" to "overdue"
- Check that dueDate is actually in the past

### Issue: Notifications not appearing
**Solution**:
- Check notification was created (check logs)
- Refresh page or clear cache
- Verify user ID matches in notification

## 📋 Database Check

### MongoDB Queries

```javascript
// Find all overdue borrows
db.borrows.find({ 
  returnedAt: null, 
  dueDate: { $lt: new Date() },
  status: { $in: ['borrowed', 'overdue'] }
})

// Find user's notifications
db.notifications.find({ user: ObjectId("...") })

// Check late fees sum
db.borrows.aggregate([
  { $group: { _id: "$user", totalFees: { $sum: "$lateFee" } } }
])
```

## 🔐 Permission Matrix

| Action | User | Librarian | Admin |
|--------|------|-----------|-------|
| View own borrows | ✅ | ✅ | ✅ |
| Borrow books | ✅ | ✅ | ✅ |
| Return own books | ✅ | ✅ | ✅ |
| Send reminders | ❌ | ✅ | ✅ |
| View all borrows | ❌ | ✅ | ✅ |
| Create announcements | ❌ | ✅ | ✅ |
| View reports | ❌ | ✅ | ✅ |

## 📱 UI Locations

| Page | Feature | Location |
|------|---------|----------|
| **Borrowed** | Borrow stats | Top dashboard (3 cards) |
| **Borrowed** | Status table | Below stats |
| **Borrowed** | Guidelines | Bottom section |
| **Notifications** | Filter buttons | Top of page |
| **Notifications** | Notification list | Below filters |
| **Admin** | Stats dashboard | Top (5 metrics) |
| **Admin** | Overdue reminders | Right sidebar |
| **Books** | Borrow button | BookCard component |

## 🎯 Key Files Changed/Created

### Frontend (New)
- ✅ `src/pages/NotificationsPage.jsx` - Notification center

### Frontend (Modified)
- ✅ `src/pages/BorrowedBooksPage.jsx` - Enhanced with stats and colors
- ✅ `src/pages/AdminPage.jsx` - Added send reminders handler
- ✅ `src/components/Layout.jsx` - Added Notifications navigation
- ✅ `src/App.jsx` - Added Notifications route

### Backend (Modified)
- ✅ `src/controllers/notificationController.js` - Added deleteNotification
- ✅ `src/routes/notificationRoutes.js` - Added delete route

### Configuration
- ✅ `.env.example` - Updated with borrowing settings
- ✅ `BORROWING_SYSTEM.md` - Full documentation
- ✅ `IMPLEMENTATION_SUMMARY.md` - Implementation details
- ✅ `QUICK_START.md` - This guide

## 📞 API Endpoints Reference

```bash
# User Borrows
GET /api/borrows
POST /api/borrows
PATCH /api/borrows/:id/return

# Admin/Librarian
POST /api/borrows/overdue-reminders

# Notifications
GET /api/notifications
PATCH /api/notifications/:id/read
DELETE /api/notifications/:id
POST /api/notifications/announcements
```

## 🔗 Related Documentation

- [BORROWING_SYSTEM.md](BORROWING_SYSTEM.md) - Detailed system overview
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation checklist
- [.env.example](.env.example) - Configuration template

---

**Version**: 1.0  
**Last Updated**: June 7, 2026  
**Status**: ✅ Production Ready
