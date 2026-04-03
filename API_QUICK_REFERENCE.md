# API QUICK REFERENCE - 6 NEW MODULES
**Forum de L'excellence Management System**

---

## 1️⃣ ATTENDANCE API

### Mark Attendance (Teacher/Admin only)
```bash
POST /api/attendance/mark
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "uuid",
  "status": "PRESENT|ABSENT|LATE|EXCUSED",
  "date": "2026-02-02",
  "remarks": "optional"
}

Response: { success: true, data: { attendance record } }
```

### Get Student Attendance
```bash
GET /api/attendance/student/{studentId}?startDate=2026-02-01&endDate=2026-02-28

Response: {
  success: true,
  data: {
    attendance: [...],
    stats: {
      total, present, absent, late, excused,
      percentage (attendance %)
    }
  }
}
```

### Get Class Attendance (Teacher/Admin only)
```bash
GET /api/attendance/class/{courseId}?date=2026-02-02
```

---

## 2️⃣ MESSAGES API

### Send Message
```bash
POST /api/messages/send
Authorization: Bearer {token}

{
  "receiverId": "uuid",
  "subject": "...",
  "content": "...",
  "attachments": [
    { "fileName": "...", "fileUrl": "...", "fileType": "..." }
  ]
}

Rules:
- PARENT → TEACHER/ADMIN only
- STUDENT → TEACHER only
- TEACHER → PARENT/STUDENT/ADMIN
- ADMIN → anyone
```

### Get Inbox
```bash
GET /api/messages/received?page=1&limit=20&unreadOnly=false
```

### Get Sent Messages
```bash
GET /api/messages/sent?page=1&limit=20
```

### Get Unread Count
```bash
GET /api/messages/unread/count

Response: { success: true, data: { unreadCount: 5 } }
```

### Get Conversation with User
```bash
GET /api/messages/conversation/{otherUserId}

Note: Automatically marks messages as read
```

### Mark as Read
```bash
PUT /api/messages/{messageId}/read
```

### Delete Message
```bash
DELETE /api/messages/{messageId}
```

---

## 3️⃣ BEHAVIOR API

### Log Behavior Incident (Teacher/Admin only)
```bash
POST /api/behavior/log
Authorization: Bearer {token}

{
  "studentId": "uuid",
  "type": "POSITIVE|NEGATIVE|INCIDENT",
  "category": "ACADEMIC|SOCIAL|DISCIPLINE|PARTICIPATION|KINDNESS",
  "description": "detailed description",
  "points": 5,
  "date": "2026-02-02"
}
```

### Get Student Behavior
```bash
GET /api/behavior/student/{studentId}
  ?startDate=2026-02-01
  &endDate=2026-02-28
  &type=POSITIVE
  &category=ACADEMIC

Response: {
  behaviors: [...],
  stats: { total, positive, negative, incidents, totalPoints }
}
```

### Get Behavior Report (Teacher/Admin/Parent only)
```bash
GET /api/behavior/report?startDate=...&endDate=...
```

### Update Behavior (Teacher/Admin only)
```bash
PUT /api/behavior/{behaviorId}

{
  "type": "...",
  "category": "...",
  "description": "...",
  "points": 5,
  "date": "2026-02-02"
}
```

### Delete Behavior (Admin only)
```bash
DELETE /api/behavior/{behaviorId}
```

---

## 4️⃣ HOMEWORK API

### Create Homework (Teacher/Admin only)
```bash
POST /api/homework/create
Authorization: Bearer {token}

{
  "subject": "Mathematics",
  "title": "Chapter 3 Exercises",
  "description": "Complete exercises 1-20",
  "dueDate": "2026-02-10",
  "courseId": "optional-uuid",
  "attachmentUrl": "https://..."
}
```

### Get Homework (Student sees assigned, Teacher sees their own)
```bash
GET /api/homework/?courseId=optional

Student Response: [
  {
    homework data,
    submissions: [{
      id, status, submittedAt, notes
    }]
  }
]
```

### Submit Homework (Student only)
```bash
POST /api/homework/{homeworkId}/submit

{
  "notes": "optional submission notes"
}

Note: Multiple submissions allowed - latest one is marked
```

### Get Submissions (Teacher/Admin only)
```bash
GET /api/homework/{homeworkId}/submissions
```

### Grade Submission (Teacher/Admin only)
```bash
PUT /api/homework/submission/{submissionId}/grade

{
  "status": "SUBMITTED|COMPLETED|LATE",
  "notes": "teacher feedback"
}
```

### Delete Homework (Admin only)
```bash
DELETE /api/homework/{homeworkId}
```

---

## 5️⃣ HEALTH RECORDS API

### Update Health Record
```bash
PUT /api/health/{studentId}
Authorization: Bearer {token}

{
  "allergies": ["peanuts", "milk"],
  "medicalConditions": ["asthma"],
  "bloodType": "O+",
  "medications": "inhaler as needed",
  "dietaryRestrictions": "no dairy",
  "doctorName": "Dr. Smith",
  "doctorPhone": "+212 6XX XXX XXX",
  "hospitalPreference": "Hospital ABC",
  "insuranceInfo": "policy #12345",
  "notes": "additional notes"
}

Permissions:
- STUDENT: can update own
- PARENT: can update children
- ADMIN: can update anyone
```

### Get Health Record
```bash
GET /api/health/{studentId}

Permissions:
- STUDENT: own only
- PARENT: children only
- TEACHER/ADMIN: all
```

### Get All Health Records (Admin/Teacher only)
```bash
GET /api/health/
```

### Delete Health Record (Admin only)
```bash
DELETE /api/health/{studentId}
```

---

## 6️⃣ PICKUP MANAGEMENT API

### Add Authorized Pickup Person
```bash
POST /api/pickup/authorized/add
Authorization: Bearer {token}

{
  "studentId": "uuid",
  "name": "John Smith",
  "relationship": "Grandfather",
  "phone": "+212 6XX XXX XXX",
  "photoUrl": "optional",
  "idNumber": "optional",
  "validFrom": "2026-02-01",
  "validUntil": "2027-02-01"
}

Permissions:
- PARENT: can add for their children
- ADMIN: can add for anyone
```

### Get Authorized Pickup People
```bash
GET /api/pickup/{studentId}

Response: Only active, valid people returned
```

### Update Pickup Person
```bash
PUT /api/pickup/authorized/{pickupId}

{
  "name": "...",
  "relationship": "...",
  "phone": "...",
  "photoUrl": "...",
  "idNumber": "...",
  "validFrom": "...",
  "validUntil": "...",
  "isActive": true|false
}
```

### Delete Pickup Person
```bash
DELETE /api/pickup/authorized/{pickupId}
```

### Log Pickup Event (Admin/Teacher only)
```bash
POST /api/pickup/log
Authorization: Bearer {token}

{
  "studentId": "uuid",
  "pickedUpBy": "John Smith",
  "pickupTime": "2026-02-02T15:30:00Z",
  "notes": "optional notes"
}
```

### Get Pickup History
```bash
GET /api/pickup/logs/history
  ?studentId=uuid
  &startDate=2026-02-01
  &endDate=2026-02-28
  &page=1
  &limit=20

Permissions:
- PARENT: own children only
- TEACHER/ADMIN: all
```

---

## RATE LIMITS

| Module | Window | Limit |
|--------|--------|-------|
| Attendance | 15 min | 100 |
| Messages | 15 min | 150 |
| Behavior | 15 min | 100 |
| Homework | 15 min | 100 |
| Health | 15 min | 50 |
| Pickup | 15 min | 100 |

---

## ERROR RESPONSES

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}

Common HTTP Status Codes:
- 200: Success
- 400: Validation error
- 401: Not authenticated
- 403: Not authorized
- 404: Not found
- 429: Rate limit exceeded
- 500: Server error
```

---

## AUTHENTICATION

All requests require:
```
Authorization: Bearer {JWT_token}
```

Get token from `/api/auth/login` endpoint.

---

## ROLE HIERARCHY

```
ADMIN > TEACHER > PARENT > STUDENT
```

Each role can access its own resources and those of subordinates.

---

**For more details, see: AUDIT_REPORT_6MODULES.md**
