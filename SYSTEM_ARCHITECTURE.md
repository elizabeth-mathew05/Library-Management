# System Architecture: Email, Notifications & Payments

## 1️⃣ EMAIL SYSTEM (SMTP)

### Architecture Diagram
```
┌─────────────────────────────────────────────────────┐
│                   APPLICATION                       │
│                                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  Trigger Events                            │    │
│  │  • Overdue reminder triggered by admin     │    │
│  │  • Reservation available (book returned)   │    │
│  │  • Custom emails (future)                  │    │
│  └────────────┬─────────────────────────────┘    │
│               ↓                                   │
│  ┌────────────────────────────────────────────┐    │
│  │  sendEmail Service                         │    │
│  │  (src/services/emailService.js)            │    │
│  │                                            │    │
│  │  ✓ Check SMTP credentials                 │    │
│  │  ✓ Create nodemailer transporter          │    │
│  │  ✓ Send email                             │    │
│  │  ✓ Log success/failure                    │    │
│  └────────────┬─────────────────────────────┘    │
│               ↓                                   │
└───────────────────────────────────────────────────┘
                │
                ↓
    ┌───────────────────────────┐
    │   SMTP Provider           │
    │   (Gmail/Outlook/etc)     │
    │                           │
    │  • Authenticate           │
    │  • Process email          │
    │  • Relay to MX server     │
    └───────────┬───────────────┘
                │
                ↓
    ┌───────────────────────────┐
    │   User's Email Inbox      │
    │   (Received ✓)            │
    └───────────────────────────┘
```

### Code Flow - Overdue Email Example
```
ADMIN Dashboard
  │
  └─→ Clicks "Send Reminders"
      │
      └─→ API: POST /api/borrows/overdue-reminders
          │
          └─→ borrowController.sendOverdueReminders()
              │
              ├─→ Find overdue borrows:
              │   Borrow.find({
              │     returnedAt: null,
              │     dueDate: { $lt: new Date() }
              │   })
              │
              ├─→ For each overdue borrow:
              │   │
              │   ├─→ ✓ Create Notification in DB
              │   │   Notification.create({
              │   │     user: borrow.user._id,
              │   │     type: 'overdue',
              │   │     title: 'Overdue book reminder',
              │   │     message: '${bookTitle} is overdue...'
              │   │   })
              │   │
              │   ├─→ ✓ Send Email
              │   │   sendEmail({
              │   │     to: borrow.user.email,
              │   │     subject: 'Library overdue reminder',
              │   │     text: '${bookTitle} is overdue...'
              │   │   })
              │   │   │
              │   │   ├─→ emailService checks SMTP config
              │   │   ├─→ Creates transporter
              │   │   ├─→ Calls transport.sendMail()
              │   │   └─→ Email sent ✓
              │   │
              │   └─→ ✓ Update status
              │       borrow.status = 'overdue'
              │       borrow.save()
              │
              └─→ Return: { remindersSent: 3 }
                  │
                  └─→ Admin sees: "✓ Reminders sent to 3 users"
```

### Email Configuration Needed
```
.env file needs:
├─ SMTP_HOST=smtp.gmail.com
├─ SMTP_PORT=587
├─ SMTP_USER=your-email@gmail.com
└─ SMTP_PASS=your-app-password

Note: Without these, emails are silently skipped
      System continues working, just no emails sent
```

---

## 2️⃣ NOTIFICATION SYSTEM (In-App)

### Architecture Diagram
```
┌────────────────────────────────────────────────────┐
│              TRIGGER EVENTS                        │
│                                                    │
│  • Overdue book (sendOverdueReminders)           │
│  • Reservation available (returnBook)            │
│  • Admin announcement (createAnnouncement)       │
│  • Payment received (webhook)                    │
└────────────────┬─────────────────────────────────┘
                 ↓
    ┌────────────────────────────┐
    │  Notification.create()     │
    │  (MongoDB Model)           │
    │                            │
    │  Document stored:          │
    │  {                         │
    │    user: ObjectId,         │
    │    title: String,          │
    │    message: String,        │
    │    type: 'overdue'|etc,    │
    │    read: false,            │
    │    createdAt: Date         │
    │  }                         │
    └────────────┬───────────────┘
                 ↓
    ┌────────────────────────────┐
    │  MongoDB Collection        │
    │  (Stored ✓)               │
    └────────────┬───────────────┘
                 ↓
    ┌────────────────────────────────────┐
    │  Frontend: NotificationsPage.jsx   │
    │                                   │
    │  API: GET /api/notifications      │
    │  (User sees only their notifs)    │
    │                                   │
    │  Display Features:                │
    │  • Timeline list                  │
    │  • Filter by type                 │
    │  • Mark as read                   │
    │  • Delete notification            │
    │  • Unread count badge             │
    └────────────┬───────────────────────┘
                 ↓
    ┌────────────────────────────┐
    │  User Interface            │
    │  (In-App Notification)     │
    │                            │
    │  📘 Overdue book reminder  │
    │  The Great Gatsby is       │
    │  overdue. Please return... │
    │  [Mark as read] [Delete]   │
    └────────────────────────────┘
```

### Notification Types & Triggers
```
TYPE: 'overdue'
├─ Trigger: sendOverdueReminders() called
├─ Title: "Overdue book reminder"
├─ Message: "{Book Title} is overdue..."
├─ Color: Red/Rose
└─ Action: User clicks return button

TYPE: 'reservation'
├─ Trigger: Book returned with pending reservation
├─ Title: "Reserved book available"
├─ Message: "{Book Title} is now available..."
├─ Color: Teal/Green
└─ Action: User goes to pick up book

TYPE: 'announcement'
├─ Trigger: Admin creates announcement
├─ Title: "Custom title"
├─ Message: "Custom message"
├─ Color: Gray/Default
├─ Visible to: ALL USERS (user: null)
└─ Action: Info only

TYPE: 'payment'
├─ Trigger: Payment received (from webhook)
├─ Title: "Payment received"
├─ Message: "Thank you for payment..."
├─ Color: Green/Teal
└─ Action: View payment receipt
```

### Database Query
```javascript
// What does the query return?
db.notifications.find({
  $or: [
    { user: userId },  // User's personal notifications
    { user: null }     // System announcements (for everyone)
  ]
})
.sort({ createdAt: -1 })  // Newest first
.limit(50)                // Last 50 notifications
```

---

## 3️⃣ PAYMENT SYSTEM (Stripe)

### Architecture Diagram
```
┌──────────────────────────────────────┐
│    User on PaymentsPage              │
│                                      │
│    Shows: Late fees from overdue     │
│    books + payment status            │
└────────────┬─────────────────────────┘
             ↓
    ┌────────────────────────────┐
    │  User Clicks "Pay Now"     │
    │  for $10 late fee          │
    └────────────┬───────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  CREATE PAYMENT                         │
    │  POST /api/payments/late-fee            │
    │                                         │
    │  Body: { borrowId: '123' }              │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  paymentController.createLateFeePayment  │
    │                                         │
    │  ✓ Get borrow record                   │
    │  ✓ Validate lateFee > 0                │
    │  ✓ Create Stripe PaymentIntent          │
    │  ✓ Create Payment record (pending)     │
    │  ✓ Return clientSecret                 │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  Stripe Payment Intent Created          │
    │                                         │
    │  {                                      │
    │    id: 'pi_xxxxx',                      │
    │    amount: 1000,    // $10 in cents     │
    │    status: 'requires_payment_method',   │
    │    client_secret: 'pi_xxxxx_secret'    │
    │  }                                      │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  Payment Record Created in DB           │
    │                                         │
    │  {                                      │
    │    user: userId,                        │
    │    borrow: borrowId,                    │
    │    amount: 10,                          │
    │    status: 'pending',                   │
    │    stripePaymentIntentId: 'pi_xxxxx'   │
    │  }                                      │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  Frontend Receives Response             │
    │                                         │
    │  {                                      │
    │    payment: {...},                      │
    │    clientSecret: 'pi_xxxxx_secret'      │
    │  }                                      │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  Stripe Payment Form Shows              │
    │  (Using @stripe/react-stripe-js)       │
    │                                         │
    │  ┌─────────────────────────────┐        │
    │  │ Card Number: [____________]  │        │
    │  │ Exp: [__/__]  CVC: [___]    │        │
    │  │        [Pay $10]            │        │
    │  └─────────────────────────────┘        │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  User Enters Card Details               │
    │  Clicks Pay Button                      │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  Stripe Processes Payment               │
    │                                         │
    │  • Authenticate card                   │
    │  • Charge $10                          │
    │  • Create transaction                  │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  Stripe Sends Webhook to Backend        │
    │  POST /webhook                          │
    │  { event: 'payment_intent.succeeded' }  │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  Backend Processes Webhook              │
    │                                         │
    │  ✓ Find Payment record                 │
    │  ✓ Update status = 'paid'              │
    │  ✓ Create Notification                 │
    │  ✓ Send email confirmation             │
    └────────────┬────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  Frontend Sees Confirmation             │
    │                                         │
    │  ✓ "Payment received for $10"          │
    │  ✓ Status changes to "Paid"            │
    │  ✓ Payment removed from pending        │
    └─────────────────────────────────────────┘
                 ↓
    ┌─────────────────────────────────────────┐
    │  User Receives:                         │
    │  • In-app notification                 │
    │  • Email receipt                       │
    │  • Updated payment status              │
    └─────────────────────────────────────────┘
```

### Payment Status Flow
```
START: pending
  ↓
  (User clicks Pay)
  ↓
Stripe Processing
  ↓
Webhook Received
  ↓
✓ Success → status = 'paid'
✗ Failed  → status = 'failed'
```

---

## 🔄 COMPLETE INTEGRATION FLOW

### Day-by-Day Timeline
```
TUESDAY (Day 1) - User Borrows Book
┌─────────────────────────────────────┐
│ borrowController.borrowBook()        │
│                                     │
│ Create Borrow:                      │
│ ✓ borrowedAt = June 7               │
│ ✓ dueDate = June 21 (14 days)      │
│ ✓ status = 'borrowed'               │
│ ✓ lateFee = 0                       │
│ ✓ Decrement book availability       │
└─────────────────────────────────────┘

THURSDAY (Day 15) - Book Becomes Overdue
┌─────────────────────────────────────┐
│ Book is now: dueDate < today        │
│ But notification not sent yet       │
│ (Admin sends manually)              │
└─────────────────────────────────────┘

FRIDAY (Day 16) - Admin Sends Reminders
┌─────────────────────────────────────┐
│ Admin Dashboard                     │
│ Clicks: Send Overdue Reminders      │
│                                     │
│ Backend:                            │
│ ├─ Find overdue borrows (1 found)  │
│ │                                  │
│ ├─ For each:                       │
│ │  ├─ Create Notification          │
│ │  │  (type: 'overdue')            │
│ │  │  Stored in MongoDB            │
│ │  │                               │
│ │  ├─ Send Email                   │
│ │  │  "Book is overdue..."         │
│ │  │  Sent via SMTP                │
│ │  │                               │
│ │  └─ Update status                │
│ │     borrow.status = 'overdue'    │
│ │                                  │
│ └─ Return success count: 1         │
│                                    │
│ Frontend:                          │
│ Shows: "✓ Reminders sent to 1"    │
└─────────────────────────────────────┘

User sees:
├─ 📧 Email in inbox: "Book overdue"
├─ 🔔 In-app notification
└─ 🔴 Red badge on Borrowed page

MONDAY (Day 20) - User Returns Late Book
┌─────────────────────────────────────┐
│ User clicks Return button           │
│                                     │
│ borrowController.returnBook()       │
│                                     │
│ Calculate late fee:                 │
│ ├─ returnDate = June 26 (20th day) │
│ ├─ dueDate = June 21 (14th day)   │
│ ├─ Overdue = 5 days                │
│ └─ lateFee = 5 × $2 = $10          │
│                                     │
│ Update Borrow:                      │
│ ✓ returnedAt = June 26             │
│ ✓ lateFee = 10                      │
│ ✓ status = 'returned'               │
│ ✓ Increment book availability       │
└─────────────────────────────────────┘

If book was reserved:
├─ ✓ Notify next user (Notification)
└─ ✓ Send email to next user

TUESDAY (Day 21) - User Pays Fine
┌─────────────────────────────────────┐
│ PaymentsPage shows: $10 due         │
│                                     │
│ User clicks "Pay Now"               │
│                                     │
│ paymentController.createLateFeePayment()
│                                     │
│ ├─ Create Stripe PaymentIntent      │
│ ├─ Create Payment record (pending)  │
│ └─ Return clientSecret              │
│                                     │
│ Frontend shows Stripe form          │
│ User enters card & pays             │
│                                     │
│ Stripe processes & sends webhook    │
│                                     │
│ Backend receives webhook:           │
│ ├─ Update Payment status = 'paid'   │
│ ├─ Create Notification (payment)    │
│ └─ Send email receipt               │
│                                     │
│ Frontend confirms:                  │
│ "✓ Payment received for $10"       │
└─────────────────────────────────────┘

User sees:
├─ 🟢 Payment status: Paid
├─ 📧 Email receipt
└─ 🔔 In-app confirmation
```

---

## 📊 Data Model Relationships

```
USER
├─ Email (for sending)
│
├─ Borrows (multiple)
│  ├─ Book
│  ├─ dueDate
│  ├─ lateFee
│  ├─ status ('borrowed'/'overdue'/'returned')
│  │
│  └─ Payments (multiple, if lateFee > 0)
│     ├─ amount
│     ├─ status ('pending'/'paid'/'failed')
│     └─ stripePaymentIntentId
│
└─ Notifications (multiple)
   ├─ type ('overdue'/'reservation'/'payment'/'announcement')
   ├─ read (true/false)
   └─ message
```

---

## ✅ Verification Checklist

### Email System
- [ ] SMTP credentials in `.env`
- [ ] Email service imported in controller
- [ ] Admin can send reminders
- [ ] Email received in user's inbox
- [ ] Subject line correct
- [ ] Body contains book title

### Notification System
- [ ] Notification model created
- [ ] Routes registered
- [ ] Notifications page loads
- [ ] Filter buttons work
- [ ] Can mark as read
- [ ] Can delete
- [ ] Unread count shows correctly

### Payment System
- [ ] Stripe keys in `.env`
- [ ] Payment page loads
- [ ] Shows correct late fees
- [ ] Payment form appears
- [ ] Stripe test card works
- [ ] Payment marked as paid
- [ ] Webhook received
- [ ] Email receipt sent

---

This completes the comprehensive explanation of how Email, Notifications, and Payments work together in your system!
