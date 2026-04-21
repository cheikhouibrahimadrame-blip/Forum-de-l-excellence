--
-- PostgreSQL database dump
--

\restrict UoOyACvWSZeheEgtgazhjYxbeAuKLBFEx0RGzlbkwT3i0GbR0AAV2lBfrebmqVB

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public."AppointmentStatus" OWNER TO postgres;

--
-- Name: AppointmentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AppointmentType" AS ENUM (
    'ACADEMIC_ADVISING',
    'PARENT_CONFERENCE',
    'COUNSELING',
    'ADMINISTRATIVE',
    'TUTORING'
);


ALTER TYPE public."AppointmentType" OWNER TO postgres;

--
-- Name: AssignmentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssignmentType" AS ENUM (
    'HOMEWORK',
    'QUIZ',
    'EXAM',
    'PROJECT',
    'PARTICIPATION'
);


ALTER TYPE public."AssignmentType" OWNER TO postgres;

--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE',
    'EXCUSED'
);


ALTER TYPE public."AttendanceStatus" OWNER TO postgres;

--
-- Name: BehaviorCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BehaviorCategory" AS ENUM (
    'ACADEMIC',
    'SOCIAL',
    'DISCIPLINE',
    'PARTICIPATION',
    'KINDNESS'
);


ALTER TYPE public."BehaviorCategory" OWNER TO postgres;

--
-- Name: BehaviorType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BehaviorType" AS ENUM (
    'POSITIVE',
    'NEGATIVE',
    'INCIDENT'
);


ALTER TYPE public."BehaviorType" OWNER TO postgres;

--
-- Name: DegreeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DegreeType" AS ENUM (
    'CERTIFICATE',
    'ASSOCIATE',
    'BACHELOR',
    'MASTER',
    'DOCTORAL'
);


ALTER TYPE public."DegreeType" OWNER TO postgres;

--
-- Name: EnrollmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EnrollmentStatus" AS ENUM (
    'ENROLLED',
    'DROPPED',
    'COMPLETED',
    'WITHDRAWN'
);


ALTER TYPE public."EnrollmentStatus" OWNER TO postgres;

--
-- Name: HomeworkStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."HomeworkStatus" AS ENUM (
    'PENDING',
    'SUBMITTED',
    'COMPLETED',
    'LATE'
);


ALTER TYPE public."HomeworkStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'STUDENT',
    'PARENT',
    'TEACHER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: StudentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StudentStatus" AS ENUM (
    'ACTIVE',
    'GRADUATED',
    'SUSPENDED',
    'DROPPED'
);


ALTER TYPE public."StudentStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Admin" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "employeeId" character varying(20) NOT NULL,
    department character varying(100),
    permissions jsonb,
    "hireDate" date NOT NULL
);


ALTER TABLE public."Admin" OWNER TO postgres;

--
-- Name: AppearanceSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AppearanceSettings" (
    id uuid NOT NULL,
    theme character varying(50) DEFAULT 'light'::character varying NOT NULL,
    "primaryColor" character varying(7) DEFAULT '#003366'::character varying NOT NULL,
    "accentColor" character varying(7) DEFAULT '#C39D5B'::character varying NOT NULL,
    "fontSize" character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AppearanceSettings" OWNER TO postgres;

--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Appointment" (
    id uuid NOT NULL,
    "requesterId" uuid NOT NULL,
    "recipientId" uuid NOT NULL,
    "appointmentType" public."AppointmentType" NOT NULL,
    "scheduledDatetime" timestamp(3) without time zone NOT NULL,
    "durationMinutes" integer DEFAULT 30 NOT NULL,
    location character varying(100),
    status public."AppointmentStatus" DEFAULT 'PENDING'::public."AppointmentStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Appointment" OWNER TO postgres;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendance" (
    id uuid NOT NULL,
    "studentId" uuid NOT NULL,
    date date NOT NULL,
    status public."AttendanceStatus" NOT NULL,
    "markedById" uuid NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "courseId" uuid
);


ALTER TABLE public."Attendance" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id uuid NOT NULL,
    "userId" uuid,
    action character varying(100) NOT NULL,
    entity character varying(100) NOT NULL,
    "entityId" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: AuthorizedPickup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuthorizedPickup" (
    id uuid NOT NULL,
    "studentId" uuid NOT NULL,
    name character varying(255) NOT NULL,
    relationship character varying(50) NOT NULL,
    phone character varying(20) NOT NULL,
    "photoUrl" text,
    "idNumber" character varying(100),
    "isActive" boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuthorizedPickup" OWNER TO postgres;

--
-- Name: BehaviorLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BehaviorLog" (
    id uuid NOT NULL,
    "studentId" uuid NOT NULL,
    "teacherId" uuid NOT NULL,
    type public."BehaviorType" NOT NULL,
    category public."BehaviorCategory" NOT NULL,
    description text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    date date NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BehaviorLog" OWNER TO postgres;

--
-- Name: Course; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Course" (
    id uuid NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    credits integer NOT NULL,
    "departmentId" uuid NOT NULL,
    "programId" uuid,
    prerequisites character varying(255)[],
    semester character varying(20) NOT NULL,
    year integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "teacherId" uuid
);


ALTER TABLE public."Course" OWNER TO postgres;

--
-- Name: DatabaseSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DatabaseSettings" (
    id uuid NOT NULL,
    "autoBackup" boolean DEFAULT true NOT NULL,
    "backupFrequency" character varying(50) DEFAULT 'daily'::character varying NOT NULL,
    "retentionDays" integer DEFAULT 30 NOT NULL,
    "encryptionEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DatabaseSettings" OWNER TO postgres;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Department" (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10) NOT NULL,
    "headId" uuid,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Department" OWNER TO postgres;

--
-- Name: EmailSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmailSettings" (
    id uuid NOT NULL,
    "smtpServer" character varying(255) NOT NULL,
    "smtpPort" integer DEFAULT 587 NOT NULL,
    "senderEmail" character varying(255) NOT NULL,
    "senderName" character varying(255) NOT NULL,
    "useSSL" boolean DEFAULT true NOT NULL,
    "enableAutoNotifications" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmailSettings" OWNER TO postgres;

--
-- Name: Enrollment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Enrollment" (
    id uuid NOT NULL,
    "studentId" uuid NOT NULL,
    "courseId" uuid NOT NULL,
    "enrollmentDate" date NOT NULL,
    status public."EnrollmentStatus" DEFAULT 'ENROLLED'::public."EnrollmentStatus" NOT NULL,
    "finalGrade" character varying(5)
);


ALTER TABLE public."Enrollment" OWNER TO postgres;

--
-- Name: GeneralSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GeneralSettings" (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255) NOT NULL,
    website character varying(255) NOT NULL,
    principal character varying(255) NOT NULL,
    year character varying(10) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GeneralSettings" OWNER TO postgres;

--
-- Name: Grade; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Grade" (
    id uuid NOT NULL,
    "studentId" uuid NOT NULL,
    "courseId" uuid NOT NULL,
    "teacherId" uuid NOT NULL,
    "assignmentName" character varying(200) NOT NULL,
    "assignmentType" public."AssignmentType" NOT NULL,
    "pointsEarned" numeric(5,2) NOT NULL,
    "pointsPossible" numeric(5,2) NOT NULL,
    "gradeDate" date NOT NULL,
    comments text
);


ALTER TABLE public."Grade" OWNER TO postgres;

--
-- Name: HealthRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HealthRecord" (
    id uuid NOT NULL,
    "studentId" uuid NOT NULL,
    allergies character varying(255)[],
    "medicalConditions" character varying(255)[],
    "bloodType" character varying(10),
    medications text,
    "dietaryRestrictions" text,
    "doctorName" character varying(255),
    "doctorPhone" character varying(20),
    "hospitalPreference" character varying(255),
    "insuranceInfo" text,
    notes text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HealthRecord" OWNER TO postgres;

--
-- Name: Homework; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Homework" (
    id uuid NOT NULL,
    "teacherId" uuid NOT NULL,
    subject character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    "dueDate" date NOT NULL,
    "attachmentUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "courseId" uuid
);


ALTER TABLE public."Homework" OWNER TO postgres;

--
-- Name: HomeworkSubmission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HomeworkSubmission" (
    id uuid NOT NULL,
    "homeworkId" uuid NOT NULL,
    "studentId" uuid NOT NULL,
    status public."HomeworkStatus" DEFAULT 'PENDING'::public."HomeworkStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone,
    "checkedById" uuid,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."HomeworkSubmission" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id uuid NOT NULL,
    "senderId" uuid NOT NULL,
    "receiverId" uuid NOT NULL,
    subject character varying(255) NOT NULL,
    content text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: MessageAttachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MessageAttachment" (
    id uuid NOT NULL,
    "messageId" uuid NOT NULL,
    "fileName" character varying(255) NOT NULL,
    "fileUrl" text NOT NULL,
    "fileType" character varying(50) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageAttachment" OWNER TO postgres;

--
-- Name: NotificationSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NotificationSettings" (
    id uuid NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "browserNotifications" boolean DEFAULT true NOT NULL,
    "gradeUpdates" boolean DEFAULT true NOT NULL,
    "attendanceAlerts" boolean DEFAULT true NOT NULL,
    "appointmentReminders" boolean DEFAULT true NOT NULL,
    "systemUpdates" boolean DEFAULT true NOT NULL,
    newsletter boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationSettings" OWNER TO postgres;

--
-- Name: Parent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Parent" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    relationship character varying(50) NOT NULL,
    occupation character varying(100),
    address text NOT NULL
);


ALTER TABLE public."Parent" OWNER TO postgres;

--
-- Name: ParentStudent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ParentStudent" (
    id uuid NOT NULL,
    "parentId" uuid NOT NULL,
    "studentId" uuid NOT NULL,
    relationship character varying(50) NOT NULL,
    "isPrimaryContact" boolean DEFAULT false NOT NULL,
    "canAccessGrades" boolean DEFAULT true NOT NULL,
    "canAccessSchedule" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ParentStudent" OWNER TO postgres;

--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PasswordResetToken" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    token character varying(500) NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PasswordResetToken" OWNER TO postgres;

--
-- Name: PickupLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PickupLog" (
    id uuid NOT NULL,
    "studentId" uuid NOT NULL,
    "pickedUpBy" character varying(255) NOT NULL,
    "pickupTime" timestamp(3) without time zone NOT NULL,
    "verifiedById" uuid NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PickupLog" OWNER TO postgres;

--
-- Name: Program; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Program" (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(20) NOT NULL,
    "departmentId" uuid NOT NULL,
    "degreeType" public."DegreeType" NOT NULL,
    "totalCredits" integer NOT NULL,
    "durationYears" integer NOT NULL,
    description text,
    requirements jsonb
);


ALTER TABLE public."Program" OWNER TO postgres;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RefreshToken" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tokenHash" character varying(128) NOT NULL,
    "sessionId" uuid
);


ALTER TABLE public."RefreshToken" OWNER TO postgres;

--
-- Name: ReportCard; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReportCard" (
    id uuid NOT NULL,
    "studentId" uuid NOT NULL,
    semester character varying(20) NOT NULL,
    year integer NOT NULL,
    gpa numeric(3,2) NOT NULL,
    "totalCredits" integer NOT NULL,
    "academicStanding" character varying(50) NOT NULL,
    "generatedDate" date NOT NULL,
    comments text,
    "isFinal" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."ReportCard" OWNER TO postgres;

--
-- Name: Schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Schedule" (
    id uuid NOT NULL,
    "courseId" uuid NOT NULL,
    "teacherId" uuid NOT NULL,
    classroom character varying(50) NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" character varying(10) NOT NULL,
    "endTime" character varying(10) NOT NULL,
    semester character varying(20) NOT NULL,
    year integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Schedule" OWNER TO postgres;

--
-- Name: SecretRotationAudit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SecretRotationAudit" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "rotationCount" integer NOT NULL,
    "previousAccessSecret" text NOT NULL,
    "currentAccessSecret" text NOT NULL,
    "previousRefreshSecret" text NOT NULL,
    "currentRefreshSecret" text NOT NULL,
    "rotatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason character varying(100) DEFAULT 'automatic_rotation'::character varying NOT NULL,
    "rotatedBy" character varying(255),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SecretRotationAudit" OWNER TO postgres;

--
-- Name: SecuritySettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SecuritySettings" (
    id uuid NOT NULL,
    "sessionTimeout" integer DEFAULT 30 NOT NULL,
    "passwordMinLength" integer DEFAULT 8 NOT NULL,
    "requireUppercase" boolean DEFAULT true NOT NULL,
    "requireNumbers" boolean DEFAULT true NOT NULL,
    "requireSpecialChars" boolean DEFAULT true NOT NULL,
    "enableTwoFactor" boolean DEFAULT false NOT NULL,
    "maxLoginAttempts" integer DEFAULT 5 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SecuritySettings" OWNER TO postgres;

--
-- Name: Student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Student" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "studentId" character varying(20) NOT NULL,
    "dateOfBirth" date NOT NULL,
    "enrollmentDate" date NOT NULL,
    "graduationDate" date,
    major character varying(100),
    gpa numeric(3,2) DEFAULT 0.00,
    status public."StudentStatus" DEFAULT 'ACTIVE'::public."StudentStatus" NOT NULL,
    address text,
    "emergencyContact" jsonb
);


ALTER TABLE public."Student" OWNER TO postgres;

--
-- Name: Teacher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Teacher" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "employeeId" character varying(20) NOT NULL,
    "departmentId" uuid,
    "hireDate" date NOT NULL,
    specialization character varying(100),
    qualifications character varying(255)[],
    "officeLocation" character varying(100),
    "officeHours" jsonb
);


ALTER TABLE public."Teacher" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public."Role" NOT NULL,
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    phone character varying(20),
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "mustChangePassword" boolean DEFAULT true NOT NULL,
    "tokenVersion" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserSession; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserSession" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "ipAddress" character varying(64),
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeenAt" timestamp(3) without time zone,
    "revokedAt" timestamp(3) without time zone,
    "deviceIdHash" character varying(128)
);


ALTER TABLE public."UserSession" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Admin" (id, "userId", "employeeId", department, permissions, "hireDate") FROM stdin;
\.


--
-- Data for Name: AppearanceSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AppearanceSettings" (id, theme, "primaryColor", "accentColor", "fontSize", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Appointment" (id, "requesterId", "recipientId", "appointmentType", "scheduledDatetime", "durationMinutes", location, status, notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendance" (id, "studentId", date, status, "markedById", remarks, "createdAt", "courseId") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "userId", action, entity, "entityId", "createdAt") FROM stdin;
0a78dc77-d6d1-41c1-89ca-7233872909fb	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-02-16 21:20:35.077
368ff8bd-e9d3-48bf-8390-d4770221e3db	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-02-16 21:48:41.594
bcacba92-a8b8-4034-8767-9480f5ef7db1	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-02-17 11:57:41.935
99cf3616-f583-4cab-a97d-825e9ea1f362	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-02-21 14:12:11.88
471a7c15-1a91-47f7-b39c-3b6e401146ec	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-02-21 14:38:51.707
19c6485f-8c96-4c9a-9e44-4976e759ed53	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-02-21 17:42:39.732
773839d1-8bf2-4462-9c76-3989c664348a	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-02-21 19:17:31.449
8220898c-0d2e-4916-8692-dba543a88f0a	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-02-23 13:07:56.876
79ab9940-1d40-497e-ad5d-361eef630ea2	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-03-13 15:16:37.021
892922b0-1ba8-4f46-af38-1d154c1e0b82	c813a66f-04d2-4dde-9f78-0cdfa831c093	LOGIN	AUTH	\N	2026-04-03 15:42:38.809
\.


--
-- Data for Name: AuthorizedPickup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuthorizedPickup" (id, "studentId", name, relationship, phone, "photoUrl", "idNumber", "isActive", "validFrom", "validUntil", "createdAt") FROM stdin;
\.


--
-- Data for Name: BehaviorLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BehaviorLog" (id, "studentId", "teacherId", type, category, description, points, date, "createdAt") FROM stdin;
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Course" (id, code, name, description, credits, "departmentId", "programId", prerequisites, semester, year, "isActive", "teacherId") FROM stdin;
\.


--
-- Data for Name: DatabaseSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DatabaseSettings" (id, "autoBackup", "backupFrequency", "retentionDays", "encryptionEnabled", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Department" (id, name, code, "headId", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: EmailSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmailSettings" (id, "smtpServer", "smtpPort", "senderEmail", "senderName", "useSSL", "enableAutoNotifications", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Enrollment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Enrollment" (id, "studentId", "courseId", "enrollmentDate", status, "finalGrade") FROM stdin;
\.


--
-- Data for Name: GeneralSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GeneralSettings" (id, name, address, phone, email, website, principal, year, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Grade; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Grade" (id, "studentId", "courseId", "teacherId", "assignmentName", "assignmentType", "pointsEarned", "pointsPossible", "gradeDate", comments) FROM stdin;
\.


--
-- Data for Name: HealthRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HealthRecord" (id, "studentId", allergies, "medicalConditions", "bloodType", medications, "dietaryRestrictions", "doctorName", "doctorPhone", "hospitalPreference", "insuranceInfo", notes, "updatedAt") FROM stdin;
\.


--
-- Data for Name: Homework; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Homework" (id, "teacherId", subject, title, description, "dueDate", "attachmentUrl", "createdAt", "courseId") FROM stdin;
\.


--
-- Data for Name: HomeworkSubmission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HomeworkSubmission" (id, "homeworkId", "studentId", status, "submittedAt", "checkedById", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, "senderId", "receiverId", subject, content, "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: MessageAttachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MessageAttachment" (id, "messageId", "fileName", "fileUrl", "fileType", "createdAt") FROM stdin;
\.


--
-- Data for Name: NotificationSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NotificationSettings" (id, "emailNotifications", "browserNotifications", "gradeUpdates", "attendanceAlerts", "appointmentReminders", "systemUpdates", newsletter, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Parent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Parent" (id, "userId", relationship, occupation, address) FROM stdin;
4ae05214-1e2d-4c5d-840c-20461d19eae5	90bdc4a9-c843-467c-8633-5298ee250678	Parent	\N	Non renseignée
3d0898de-6b85-4e2e-8e2c-85a82980a614	adf1d60b-e752-453e-ab0a-5f0119ab58c5	Parent	\N	Non renseignée
\.


--
-- Data for Name: ParentStudent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ParentStudent" (id, "parentId", "studentId", relationship, "isPrimaryContact", "canAccessGrades", "canAccessSchedule") FROM stdin;
16809706-b055-4591-902a-86f7ce4f6bd9	4ae05214-1e2d-4c5d-840c-20461d19eae5	2c026671-4b17-4e59-89ef-1deccb826f3f	Parent	f	t	t
20dcb361-02d9-45de-ac06-6bea4ce1c5bb	3d0898de-6b85-4e2e-8e2c-85a82980a614	2c026671-4b17-4e59-89ef-1deccb826f3f	Parent	f	t	t
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PasswordResetToken" (id, "userId", token, "expiresAt", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: PickupLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PickupLog" (id, "studentId", "pickedUpBy", "pickupTime", "verifiedById", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: Program; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Program" (id, name, code, "departmentId", "degreeType", "totalCredits", "durationYears", description, requirements) FROM stdin;
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RefreshToken" (id, "userId", "expiresAt", "createdAt", "tokenHash", "sessionId") FROM stdin;
3e59cd38-8889-4eb3-92c4-1428c79ec816	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-09 10:49:04.722	2026-02-02 10:49:04.724	7dfa70c3116ef03f05976c41f641c747f72dbb4a0a178069aca519e11376f0e0	\N
94ee5fc8-c946-4c48-bcb3-ac7bfaebaaf8	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-09 10:49:36.096	2026-02-02 10:49:36.098	e094c16bcfe2418d5cc4b4439b26705f4ac487010824557a7eca12e111d607ed	\N
5812ba2c-9930-44b8-b6bc-9e85a7b628e6	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-09 10:49:59.172	2026-02-02 10:49:59.181	873bb07ca0cca6e2fce2e5d0d49a9897619eb1397483d17e987bf869a0ee2e2a	\N
e2566bcc-8004-45ca-835c-1a130540c643	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-09 11:10:44.895	2026-02-02 11:10:44.906	35375dded7f0a9ae8a8cdf5ece03d6326f826d36ca88d01a4222ec550c9cad58	\N
de41031c-185b-4905-8bd8-5657a90f7a30	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-09 13:11:11.829	2026-02-02 13:11:11.836	0de884a3cc1db6ec027174927f9347b2bf9128adc38fc8ca4e19192361235ffa	\N
5ddebec9-62b0-4fcd-b2f3-505b71c35315	a2739d47-b6d4-4219-ba82-5ed4ed1a6362	2026-02-10 12:54:52.376	2026-02-03 12:54:52.379	071df927da75477c54408e55f2670cb0863955f3b006c521ee16900f75de4d1b	\N
39236f71-d9d4-4be7-b4e7-d7b3602806a6	a2739d47-b6d4-4219-ba82-5ed4ed1a6362	2026-02-10 12:55:53.071	2026-02-03 12:55:53.073	9f0e8910867806543974067a2543af51fe54623d1147ff7ab7b115ca523c85fb	\N
38d3e61c-5780-44f3-8da1-d025bffce9b2	a2739d47-b6d4-4219-ba82-5ed4ed1a6362	2026-02-10 12:56:47.021	2026-02-03 12:56:47.02	56892b520f2a6dc1796d6b70cecbce51f100f6f70757f5fa483327adfe0bdd70	\N
4ff175a7-a953-482e-a8c3-a72895ecfa28	a2739d47-b6d4-4219-ba82-5ed4ed1a6362	2026-02-14 11:46:55.113	2026-02-07 11:46:55.119	2eb9955ac88fdcdb6d76ba39e97f8e75d68f9b7ae432f7b576c86420eeac223f	\N
5e7f1cf4-5302-4004-bead-95c0b0b745f8	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-14 12:23:02.099	2026-02-07 12:23:02.102	1f1e967f02a2beab331506ecb26eb80d04897fc1806e9efb26b1db7089cfc2dd	\N
f97a3c47-f86f-41e6-8aae-6a8dff8dbb96	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-14 13:27:35.174	2026-02-07 13:27:35.177	20dee2807e01542ead35d35b926950e6ac87c8911941a16b4b52b8f6adac7f4f	\N
20f82b5b-6066-46b3-8435-b4bf7e187250	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-14 13:48:49.767	2026-02-07 13:48:49.769	8ea382718e7e67f10fb80772834d5fa052a01b4c26e3e7602798667ee5b5ea35	\N
f8fded87-d6e4-42ae-a16b-ad91a49d1641	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-14 14:19:38.538	2026-02-07 14:19:38.541	cd0aadcd73fdf15e23926700230ac3ca2f6b1373d413656bbe70945aad66c939	\N
1b12e52c-e62d-4b05-afa2-2c242b307a73	adf1d60b-e752-453e-ab0a-5f0119ab58c5	2026-02-16 10:52:34.134	2026-02-09 10:52:34.142	71bece5697d5bab60c17c5fefe23e02e87f5cb15b9f5fc0c7f8aa015cec5d496	\N
dfc1b047-5305-4b98-b428-dee92c63539e	e6b2514c-3570-4af0-abe8-cb3b162becbe	2026-02-19 12:54:21.893	2026-02-12 12:54:21.896	4d834c17035934481e2222b050678eeabd7db958c32c9674ac0d444e21c34289	\N
ea79bc2a-0851-4340-936c-3c964be1db61	e6b2514c-3570-4af0-abe8-cb3b162becbe	2026-02-19 12:55:00.486	2026-02-12 12:55:00.489	67d915bfd12c199a8cdcd26e896f8db63656af90b8562d9082c307e6acf08b6a	\N
ba58e554-ee44-4ee3-abb6-ddbf388d9ab7	e6b2514c-3570-4af0-abe8-cb3b162becbe	2026-02-19 12:55:17.076	2026-02-12 12:55:17.079	bd92f5c4b0970560cd57a7261ff4d975e45604b325eb10be63ff49c9190a01f6	\N
9a06083c-e45b-4754-8025-3de3741da92d	e6b2514c-3570-4af0-abe8-cb3b162becbe	2026-02-19 13:16:15.814	2026-02-12 13:16:15.819	58b09a020edce3682dd930d791e3b10d0482a8e016b0eefba82b59e1eb554402	\N
7344825a-eb42-406b-b91d-6adec6ee1cc6	e6b2514c-3570-4af0-abe8-cb3b162becbe	2026-02-19 13:40:17.466	2026-02-12 13:40:17.476	1f43d88d056e6dae18ceba941f940b2f7905a1385a9775ae09fcaf5a5809dede	\N
02fedd4f-387e-4e5a-ad87-53ac87748985	c813a66f-04d2-4dde-9f78-0cdfa831c093	2026-04-10 15:42:38.756	2026-04-03 15:42:38.758	8fe8df68216f7a75b530d2580898094795f4d21bd21e6077aecbfdaa6c193fff	5d4d48cd-b315-4704-af3f-260732299857
\.


--
-- Data for Name: ReportCard; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ReportCard" (id, "studentId", semester, year, gpa, "totalCredits", "academicStanding", "generatedDate", comments, "isFinal") FROM stdin;
\.


--
-- Data for Name: Schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Schedule" (id, "courseId", "teacherId", classroom, "dayOfWeek", "startTime", "endTime", semester, year, "isActive") FROM stdin;
\.


--
-- Data for Name: SecretRotationAudit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SecretRotationAudit" (id, "rotationCount", "previousAccessSecret", "currentAccessSecret", "previousRefreshSecret", "currentRefreshSecret", "rotatedAt", reason, "rotatedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: SecuritySettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SecuritySettings" (id, "sessionTimeout", "passwordMinLength", "requireUppercase", "requireNumbers", "requireSpecialChars", "enableTwoFactor", "maxLoginAttempts", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Student" (id, "userId", "studentId", "dateOfBirth", "enrollmentDate", "graduationDate", major, gpa, status, address, "emergencyContact") FROM stdin;
2c026671-4b17-4e59-89ef-1deccb826f3f	a2739d47-b6d4-4219-ba82-5ed4ed1a6362	STU-a2739d47b6d4	2026-02-07	2026-02-07	\N	\N	0.00	ACTIVE	\N	\N
\.


--
-- Data for Name: Teacher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Teacher" (id, "userId", "employeeId", "departmentId", "hireDate", specialization, qualifications, "officeLocation", "officeHours") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, role, "firstName", "lastName", phone, "isActive", "createdAt", "updatedAt", "mustChangePassword", "tokenVersion") FROM stdin;
c813a66f-04d2-4dde-9f78-0cdfa831c093	khaliloullah6666@gmail.com	$2a$12$0Qt4Ur/p.rn6APGLFRp3Qe2XPM3RCpXDDKGDGLNdNxXjQkzGz/sS.	ADMIN	Admin	Principal	\N	t	2026-02-02 10:10:20.283	2026-02-02 10:16:07.643	f	1
adf1d60b-e752-453e-ab0a-5f0119ab58c5	astou@gmail.com	$2a$12$jFuGN7RmK7dqBkkKIam7LOQXNKaXv7ZCAeQblyhILilZZPA7BTgCq	PARENT	astou	Drame	+221769854852	t	2026-02-02 10:18:33.97	2026-02-02 10:49:36.044	f	1
a2739d47-b6d4-4219-ba82-5ed4ed1a6362	boubacar@gmail.com	$2a$12$STJOq9MV3cgsTw0oakIGLeT5PH3HYqyLLeYvsESUOy8FnXkhnSbRS	STUDENT	Boubacar 	Drame	+221772897696	t	2026-02-03 12:48:21.869	2026-02-03 12:55:52.703	f	1
90bdc4a9-c843-467c-8633-5298ee250678	ahma6@gmail.com	$2a$12$5ue5gs.4u0EZBHp3sMJcg.Xu6PxWNh.FgWo.EhLLw0sEPKRuVKfQa	PARENT	Ahma	diop	+221765432789	t	2026-02-07 12:43:13.125	2026-02-07 12:43:13.125	t	1
e6b2514c-3570-4af0-abe8-cb3b162becbe	anata@gmail.com	$2a$12$7.e2oz6HtwquS/2eMfKCDOwADLwn5VRola2IGN9nP8qnZuI4MDkcq	TEACHER	ana	diop	+221769854585	t	2026-02-12 12:53:53.904	2026-02-12 12:55:00.287	f	1
\.


--
-- Data for Name: UserSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserSession" (id, "userId", "ipAddress", "userAgent", "createdAt", "lastSeenAt", "revokedAt", "deviceIdHash") FROM stdin;
5d7b9542-d08b-4fec-8921-2ee70951c697	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 21:20:34.454	2026-02-16 21:22:08.314	2026-02-16 21:48:41.484	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
3a09f583-10fd-4c9e-b646-4abce46fbc91	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 21:48:41.52	2026-02-16 21:53:40.026	2026-02-17 11:57:41.155	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
bc2fea1a-010d-44a2-981e-9d872c8afcc6	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-17 11:57:41.578	2026-02-17 12:48:49.928	2026-02-21 14:12:11.24	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
fdc090bb-7db3-4b86-934b-902230741fa1	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-21 14:12:11.476	2026-02-21 14:12:11.471	2026-02-21 14:38:51.557	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
d21a02eb-6a87-42e8-8ee2-b445f2283abe	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-21 14:38:51.598	2026-02-21 14:38:51.594	2026-02-21 17:42:39.277	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
9ad108c7-0a17-45c4-b7f7-69b81af61b6b	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-21 17:42:39.399	2026-02-21 17:42:39.391	2026-02-21 19:17:30.923	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
2cd744d1-da05-48f0-b568-ad62ddcbed20	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-21 19:17:31.082	2026-02-21 19:17:31.076	2026-02-23 13:07:56.136	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
f34b9a9a-ca48-419c-a56f-a5a7b2af6805	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 13:07:56.343	2026-02-23 13:07:56.341	2026-03-13 15:16:36.052	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
36e1f6a0-ca07-4df0-b1e2-cfeea910f446	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-13 15:16:36.513	2026-03-13 15:16:36.504	2026-04-03 15:42:37.673	5900c1394079c292cecd5acf210a793fb7b4e425a0c5f7979b2050b0821181ec
5d4d48cd-b315-4704-af3f-260732299857	c813a66f-04d2-4dde-9f78-0cdfa831c093	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-03 15:42:38.148	2026-04-03 15:42:38.145	\N	bb5465246938d430a9a4a6673b6fc61df63d550181bf92f4a7b4157ae9c64cbd
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3d9d2184-320d-4879-8249-aebed4c87773	90902910ee1de7910c14bc911b7152d70376215354dc6d1815278392c9d03e56	2026-02-02 01:01:15.94552+01	20260126161618_init	\N	\N	2026-02-02 01:01:13.168451+01	1
2cb3a256-b01b-4b0b-afc3-f2b9af8e89f5	ac4d882eeb6d987088b9ce1e60c6d513a8c6d2932084d985a0fe6f10ecc7a044	2026-02-02 01:01:15.965647+01	20260127130000_add_must_change_password	\N	\N	2026-02-02 01:01:15.950395+01	1
7e3c7ae5-b584-4210-86eb-c9f05189ef7f	dadaf38f4219d76d06c8fb20007050700f55e76ae31c55485135b8f86a7cf291	2026-02-16 18:12:39.192977+01	20260215_add_user_sessions	\N	\N	2026-02-16 18:12:37.851496+01	1
cb4b688c-160a-4f27-b66a-08a53d07c586	0fad3b0aa75ff4fe3c20c2501daa62e39164982e02d24b268d422f10e253ce83	2026-02-02 01:01:16.210773+01	20260128_add_settings_models	\N	\N	2026-02-02 01:01:15.97023+01	1
2df553db-1130-4232-ab3f-78e307162217	7f3860e3bd9fa8fe11ab20dc54d796156adee1e1b4dae099e168b354332a2f62	2026-02-02 01:01:33.100293+01	20260202000131_add_primary_school_features	\N	\N	2026-02-02 01:01:32.1203+01	1
d9fc5f85-d23a-4420-9c49-2a504793396a	36e995c92d8c81dc9c0c41ba4f8d205b6ba7a4a49e8aafc4c7f978423eafbf9f	2026-02-02 01:26:50.726907+01	20260202002650_fix_classid_to_courseid	\N	\N	2026-02-02 01:26:50.50424+01	1
20489097-53c9-41ca-9dd4-d1e453146073	019be85a419b7bd783610d367c65bf1148443d56d3937ccfe6bcaaecd3769144	2026-02-16 18:12:39.213974+01	20260216_add_user_session_deviceid	\N	\N	2026-02-16 18:12:39.197764+01	1
7285fb9d-7c03-4781-9153-2431c9e5d6eb	934e5014b8f3413f146f62102bf30684a197b31ab7aea66fb82a76ca1a77a18a	2026-02-14 02:36:51.068141+01	20260214130000_add_tokenhash_auditlog	\N	\N	2026-02-14 02:36:44.777319+01	1
abcd999a-2846-485d-939c-b05746899e6b	90bbfec240ede7564c364894f04984b12728d9ea92b5dffdfa17104d60caba93	2026-02-16 14:46:58.439427+01	20260216_add_token_version	\N	\N	2026-02-16 14:46:57.095667+01	1
b2e65df7-91e1-4a98-925f-804c75ba07fd	19bac81ff5b4a44d9e222e5e79b3fc7d8f216ae3730d7206ce95d6a7ef181f2a	2026-02-16 18:06:02.658348+01	20260216_add_secret_rotation_audit	\N	\N	2026-02-16 18:06:01.264983+01	1
dd8737d2-b464-43d4-97b5-f031f0164dfa	019be85a419b7bd783610d367c65bf1148443d56d3937ccfe6bcaaecd3769144	\N	20260216_add_user_session_deviceid	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260216_add_user_session_deviceid\n\nDatabase error code: 42P01\n\nDatabase error:\nERREUR: la relation « UserSession » n'existe pas\n\nDbError { severity: "ERREUR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "la relation « UserSession » n'existe pas", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(639), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260216_add_user_session_deviceid"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="20260216_add_user_session_deviceid"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226	2026-02-16 18:10:13.274607+01	2026-02-16 18:06:02.667567+01	0
\.


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- Name: AppearanceSettings AppearanceSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AppearanceSettings"
    ADD CONSTRAINT "AppearanceSettings_pkey" PRIMARY KEY (id);


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AuthorizedPickup AuthorizedPickup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuthorizedPickup"
    ADD CONSTRAINT "AuthorizedPickup_pkey" PRIMARY KEY (id);


--
-- Name: BehaviorLog BehaviorLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BehaviorLog"
    ADD CONSTRAINT "BehaviorLog_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: DatabaseSettings DatabaseSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DatabaseSettings"
    ADD CONSTRAINT "DatabaseSettings_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: EmailSettings EmailSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmailSettings"
    ADD CONSTRAINT "EmailSettings_pkey" PRIMARY KEY (id);


--
-- Name: Enrollment Enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_pkey" PRIMARY KEY (id);


--
-- Name: GeneralSettings GeneralSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GeneralSettings"
    ADD CONSTRAINT "GeneralSettings_pkey" PRIMARY KEY (id);


--
-- Name: Grade Grade_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_pkey" PRIMARY KEY (id);


--
-- Name: HealthRecord HealthRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HealthRecord"
    ADD CONSTRAINT "HealthRecord_pkey" PRIMARY KEY (id);


--
-- Name: HomeworkSubmission HomeworkSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HomeworkSubmission"
    ADD CONSTRAINT "HomeworkSubmission_pkey" PRIMARY KEY (id);


--
-- Name: Homework Homework_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Homework"
    ADD CONSTRAINT "Homework_pkey" PRIMARY KEY (id);


--
-- Name: MessageAttachment MessageAttachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachment"
    ADD CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: NotificationSettings NotificationSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationSettings"
    ADD CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY (id);


--
-- Name: ParentStudent ParentStudent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ParentStudent"
    ADD CONSTRAINT "ParentStudent_pkey" PRIMARY KEY (id);


--
-- Name: Parent Parent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Parent"
    ADD CONSTRAINT "Parent_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: PickupLog PickupLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PickupLog"
    ADD CONSTRAINT "PickupLog_pkey" PRIMARY KEY (id);


--
-- Name: Program Program_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Program"
    ADD CONSTRAINT "Program_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: ReportCard ReportCard_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReportCard"
    ADD CONSTRAINT "ReportCard_pkey" PRIMARY KEY (id);


--
-- Name: Schedule Schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_pkey" PRIMARY KEY (id);


--
-- Name: SecretRotationAudit SecretRotationAudit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SecretRotationAudit"
    ADD CONSTRAINT "SecretRotationAudit_pkey" PRIMARY KEY (id);


--
-- Name: SecuritySettings SecuritySettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SecuritySettings"
    ADD CONSTRAINT "SecuritySettings_pkey" PRIMARY KEY (id);


--
-- Name: Student Student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_pkey" PRIMARY KEY (id);


--
-- Name: Teacher Teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_pkey" PRIMARY KEY (id);


--
-- Name: UserSession UserSession_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSession"
    ADD CONSTRAINT "UserSession_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Admin_employeeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Admin_employeeId_idx" ON public."Admin" USING btree ("employeeId");


--
-- Name: Admin_employeeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Admin_employeeId_key" ON public."Admin" USING btree ("employeeId");


--
-- Name: Admin_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Admin_userId_key" ON public."Admin" USING btree ("userId");


--
-- Name: Appointment_recipientId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Appointment_recipientId_idx" ON public."Appointment" USING btree ("recipientId");


--
-- Name: Appointment_requesterId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Appointment_requesterId_idx" ON public."Appointment" USING btree ("requesterId");


--
-- Name: Appointment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Appointment_status_idx" ON public."Appointment" USING btree (status);


--
-- Name: Attendance_courseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendance_courseId_idx" ON public."Attendance" USING btree ("courseId");


--
-- Name: Attendance_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendance_date_idx" ON public."Attendance" USING btree (date);


--
-- Name: Attendance_markedById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendance_markedById_idx" ON public."Attendance" USING btree ("markedById");


--
-- Name: Attendance_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendance_studentId_idx" ON public."Attendance" USING btree ("studentId");


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: AuthorizedPickup_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuthorizedPickup_studentId_idx" ON public."AuthorizedPickup" USING btree ("studentId");


--
-- Name: AuthorizedPickup_validUntil_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuthorizedPickup_validUntil_idx" ON public."AuthorizedPickup" USING btree ("validUntil");


--
-- Name: BehaviorLog_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BehaviorLog_date_idx" ON public."BehaviorLog" USING btree (date);


--
-- Name: BehaviorLog_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BehaviorLog_studentId_idx" ON public."BehaviorLog" USING btree ("studentId");


--
-- Name: BehaviorLog_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BehaviorLog_teacherId_idx" ON public."BehaviorLog" USING btree ("teacherId");


--
-- Name: Course_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Course_code_key" ON public."Course" USING btree (code);


--
-- Name: Course_departmentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Course_departmentId_idx" ON public."Course" USING btree ("departmentId");


--
-- Name: Course_programId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Course_programId_idx" ON public."Course" USING btree ("programId");


--
-- Name: Course_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Course_teacherId_idx" ON public."Course" USING btree ("teacherId");


--
-- Name: Department_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_code_key" ON public."Department" USING btree (code);


--
-- Name: Department_headId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_headId_key" ON public."Department" USING btree ("headId");


--
-- Name: Department_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_name_key" ON public."Department" USING btree (name);


--
-- Name: Enrollment_courseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Enrollment_courseId_idx" ON public."Enrollment" USING btree ("courseId");


--
-- Name: Enrollment_studentId_courseId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Enrollment_studentId_courseId_key" ON public."Enrollment" USING btree ("studentId", "courseId");


--
-- Name: Enrollment_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Enrollment_studentId_idx" ON public."Enrollment" USING btree ("studentId");


--
-- Name: Grade_courseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Grade_courseId_idx" ON public."Grade" USING btree ("courseId");


--
-- Name: Grade_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Grade_studentId_idx" ON public."Grade" USING btree ("studentId");


--
-- Name: Grade_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Grade_teacherId_idx" ON public."Grade" USING btree ("teacherId");


--
-- Name: HealthRecord_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HealthRecord_studentId_idx" ON public."HealthRecord" USING btree ("studentId");


--
-- Name: HealthRecord_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "HealthRecord_studentId_key" ON public."HealthRecord" USING btree ("studentId");


--
-- Name: HomeworkSubmission_homeworkId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HomeworkSubmission_homeworkId_idx" ON public."HomeworkSubmission" USING btree ("homeworkId");


--
-- Name: HomeworkSubmission_homeworkId_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "HomeworkSubmission_homeworkId_studentId_key" ON public."HomeworkSubmission" USING btree ("homeworkId", "studentId");


--
-- Name: HomeworkSubmission_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HomeworkSubmission_studentId_idx" ON public."HomeworkSubmission" USING btree ("studentId");


--
-- Name: Homework_courseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Homework_courseId_idx" ON public."Homework" USING btree ("courseId");


--
-- Name: Homework_dueDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Homework_dueDate_idx" ON public."Homework" USING btree ("dueDate");


--
-- Name: Homework_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Homework_teacherId_idx" ON public."Homework" USING btree ("teacherId");


--
-- Name: MessageAttachment_messageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MessageAttachment_messageId_idx" ON public."MessageAttachment" USING btree ("messageId");


--
-- Name: Message_isRead_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_isRead_idx" ON public."Message" USING btree ("isRead");


--
-- Name: Message_receiverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_receiverId_idx" ON public."Message" USING btree ("receiverId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: ParentStudent_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ParentStudent_parentId_idx" ON public."ParentStudent" USING btree ("parentId");


--
-- Name: ParentStudent_parentId_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ParentStudent_parentId_studentId_key" ON public."ParentStudent" USING btree ("parentId", "studentId");


--
-- Name: ParentStudent_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ParentStudent_studentId_idx" ON public."ParentStudent" USING btree ("studentId");


--
-- Name: Parent_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Parent_userId_key" ON public."Parent" USING btree ("userId");


--
-- Name: PasswordResetToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON public."PasswordResetToken" USING btree (token);


--
-- Name: PasswordResetToken_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PasswordResetToken_userId_idx" ON public."PasswordResetToken" USING btree ("userId");


--
-- Name: PickupLog_pickupTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PickupLog_pickupTime_idx" ON public."PickupLog" USING btree ("pickupTime");


--
-- Name: PickupLog_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PickupLog_studentId_idx" ON public."PickupLog" USING btree ("studentId");


--
-- Name: Program_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Program_code_key" ON public."Program" USING btree (code);


--
-- Name: Program_departmentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Program_departmentId_idx" ON public."Program" USING btree ("departmentId");


--
-- Name: RefreshToken_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RefreshToken_sessionId_idx" ON public."RefreshToken" USING btree ("sessionId");


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: RefreshToken_userId_tokenHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RefreshToken_userId_tokenHash_key" ON public."RefreshToken" USING btree ("userId", "tokenHash");


--
-- Name: ReportCard_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ReportCard_studentId_idx" ON public."ReportCard" USING btree ("studentId");


--
-- Name: ReportCard_studentId_semester_year_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ReportCard_studentId_semester_year_key" ON public."ReportCard" USING btree ("studentId", semester, year);


--
-- Name: Schedule_courseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Schedule_courseId_idx" ON public."Schedule" USING btree ("courseId");


--
-- Name: Schedule_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Schedule_teacherId_idx" ON public."Schedule" USING btree ("teacherId");


--
-- Name: SecretRotationAudit_reason_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SecretRotationAudit_reason_idx" ON public."SecretRotationAudit" USING btree (reason);


--
-- Name: SecretRotationAudit_rotatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SecretRotationAudit_rotatedAt_idx" ON public."SecretRotationAudit" USING btree ("rotatedAt");


--
-- Name: Student_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Student_studentId_idx" ON public."Student" USING btree ("studentId");


--
-- Name: Student_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Student_studentId_key" ON public."Student" USING btree ("studentId");


--
-- Name: Student_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Student_userId_key" ON public."Student" USING btree ("userId");


--
-- Name: Teacher_employeeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Teacher_employeeId_idx" ON public."Teacher" USING btree ("employeeId");


--
-- Name: Teacher_employeeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Teacher_employeeId_key" ON public."Teacher" USING btree ("employeeId");


--
-- Name: Teacher_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Teacher_userId_key" ON public."Teacher" USING btree ("userId");


--
-- Name: UserSession_revokedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserSession_revokedAt_idx" ON public."UserSession" USING btree ("revokedAt");


--
-- Name: UserSession_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserSession_userId_idx" ON public."UserSession" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: Admin Admin_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Appointment Appointment_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_markedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuthorizedPickup AuthorizedPickup_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuthorizedPickup"
    ADD CONSTRAINT "AuthorizedPickup_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BehaviorLog BehaviorLog_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BehaviorLog"
    ADD CONSTRAINT "BehaviorLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BehaviorLog BehaviorLog_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BehaviorLog"
    ADD CONSTRAINT "BehaviorLog_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Course Course_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Course Course_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Course Course_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Department Department_headId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_headId_fkey" FOREIGN KEY ("headId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Enrollment Enrollment_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Enrollment Enrollment_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Grade Grade_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Grade Grade_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Grade Grade_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HealthRecord HealthRecord_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HealthRecord"
    ADD CONSTRAINT "HealthRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HomeworkSubmission HomeworkSubmission_checkedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HomeworkSubmission"
    ADD CONSTRAINT "HomeworkSubmission_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HomeworkSubmission HomeworkSubmission_homeworkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HomeworkSubmission"
    ADD CONSTRAINT "HomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES public."Homework"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HomeworkSubmission HomeworkSubmission_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HomeworkSubmission"
    ADD CONSTRAINT "HomeworkSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Homework Homework_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Homework"
    ADD CONSTRAINT "Homework_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MessageAttachment MessageAttachment_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachment"
    ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ParentStudent ParentStudent_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ParentStudent"
    ADD CONSTRAINT "ParentStudent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Parent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ParentStudent ParentStudent_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ParentStudent"
    ADD CONSTRAINT "ParentStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Parent Parent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Parent"
    ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PickupLog PickupLog_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PickupLog"
    ADD CONSTRAINT "PickupLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PickupLog PickupLog_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PickupLog"
    ADD CONSTRAINT "PickupLog_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Program Program_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Program"
    ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RefreshToken RefreshToken_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."UserSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportCard ReportCard_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReportCard"
    ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Schedule Schedule_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Schedule Schedule_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Student Student_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Teacher Teacher_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Teacher Teacher_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSession UserSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSession"
    ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict UoOyACvWSZeheEgtgazhjYxbeAuKLBFEx0RGzlbkwT3i0GbR0AAV2lBfrebmqVB

