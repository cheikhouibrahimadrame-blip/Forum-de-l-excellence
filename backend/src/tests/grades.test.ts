import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ---------------------------------------------------------------
// Mock Prisma (must be hoisted so the module-level `vi.mock` calls below
// can reference it before the real module is imported).
// ---------------------------------------------------------------
const mockPrisma = vi.hoisted(() => ({
  teacher: { findUnique: vi.fn() },
  course: { findUnique: vi.fn() },
  enrollment: { findFirst: vi.fn() },
  grade: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn()
  },
  gradeLock: { findFirst: vi.fn() },
  student: { findUnique: vi.fn() }
}));

vi.mock('../lib/prisma', () => ({ default: mockPrisma }));

// gradeLock helper imports prisma, mock it transparently via the same path.

// ---------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------
import {
  createGrade,
  updateGrade,
  deleteGrade,
  createGradeValidation
} from '../controllers/gradesController';

// ---------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------
// RFC 4122-compliant UUIDs (version 4, variant 8/9/A/B). validator.js's
// isUUID() rejects placeholders like '11111111-...' because their variant
// nibble must be 8|9|A|B.
const STUDENT_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const TEACHER_USER_ID = '33333333-3333-4333-8333-333333333333';
const TEACHER_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_TEACHER_ID = '55555555-5555-4555-8555-555555555555';
const GRADE_ID = '66666666-6666-4666-8666-666666666666';

const validGradeBody = {
  studentId: STUDENT_ID,
  courseId: COURSE_ID,
  assignmentName: 'Devoir 1',
  assignmentType: 'HOMEWORK',
  pointsEarned: 18,
  pointsPossible: 20
};

// ---------------------------------------------------------------
// App builder — injects req.user the way the real authenticate
// middleware would.
// ---------------------------------------------------------------
const buildApp = (user: { id: string; role: string }) => {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.user = user;
    next();
  });
  app.post('/api/grades', createGradeValidation, createGrade as any);
  app.put('/api/grades/:gradeId', updateGrade as any);
  app.delete('/api/grades/:gradeId', deleteGrade as any);
  return app;
};

// ---------------------------------------------------------------
// P0-2: createGrade course-teacher check
// ---------------------------------------------------------------
describe('POST /api/grades — P0-2 course ownership', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects with 403 when the teacher does not own the course', async () => {
    mockPrisma.teacher.findUnique.mockResolvedValueOnce({ id: TEACHER_ID, userId: TEACHER_USER_ID });
    // Course belongs to a different teacher
    mockPrisma.course.findUnique.mockResolvedValueOnce({ teacherId: OTHER_TEACHER_ID });

    const app = buildApp({ id: TEACHER_USER_ID, role: 'TEACHER' });
    const res = await request(app).post('/api/grades').send(validGradeBody);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/n'enseignez pas/i);
    // No grade should be persisted
    expect(mockPrisma.grade.create).not.toHaveBeenCalled();
  });

  it('rejects with 404 when the course does not exist', async () => {
    mockPrisma.teacher.findUnique.mockResolvedValueOnce({ id: TEACHER_ID, userId: TEACHER_USER_ID });
    mockPrisma.course.findUnique.mockResolvedValueOnce(null);

    const app = buildApp({ id: TEACHER_USER_ID, role: 'TEACHER' });
    const res = await request(app).post('/api/grades').send(validGradeBody);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('allows the grade when the teacher owns the course and the period is open', async () => {
    mockPrisma.teacher.findUnique.mockResolvedValueOnce({ id: TEACHER_ID, userId: TEACHER_USER_ID });
    mockPrisma.course.findUnique
      // 1st: gradesController ownership check
      .mockResolvedValueOnce({ teacherId: TEACHER_ID })
      // 2nd: gradeLock helper reads course.semester
      .mockResolvedValueOnce({ semester: 'q1' });
    mockPrisma.gradeLock.findFirst.mockResolvedValueOnce(null);
    mockPrisma.enrollment.findFirst.mockResolvedValueOnce({ id: 'enr-1' });
    mockPrisma.grade.create.mockResolvedValueOnce({
      id: GRADE_ID,
      ...validGradeBody,
      teacherId: TEACHER_ID,
      gradeDate: new Date(),
      student: { user: { firstName: 'A', lastName: 'B' } },
      course: {},
      teacher: { user: { firstName: 'X', lastName: 'Y' } }
    });

    const app = buildApp({ id: TEACHER_USER_ID, role: 'TEACHER' });
    const res = await request(app).post('/api/grades').send(validGradeBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.grade.create).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------
// P0-4: Grade lock enforcement
// ---------------------------------------------------------------
describe('Grade mutations — P0-4 GradeLock enforcement', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('createGrade returns 423 when the period is locked', async () => {
    mockPrisma.teacher.findUnique.mockResolvedValueOnce({ id: TEACHER_ID, userId: TEACHER_USER_ID });
    mockPrisma.course.findUnique
      // ownership check
      .mockResolvedValueOnce({ teacherId: TEACHER_ID })
      // gradeLock helper
      .mockResolvedValueOnce({ semester: 'q1' });
    mockPrisma.gradeLock.findFirst.mockResolvedValueOnce({ id: 'lock-1' });

    const app = buildApp({ id: TEACHER_USER_ID, role: 'TEACHER' });
    const res = await request(app).post('/api/grades').send(validGradeBody);

    expect(res.status).toBe(423);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/verrouill/i);
    expect(mockPrisma.grade.create).not.toHaveBeenCalled();
  });

  it('updateGrade returns 423 when the period is locked', async () => {
    mockPrisma.grade.findUnique.mockResolvedValueOnce({
      id: GRADE_ID,
      teacherId: TEACHER_ID,
      courseId: COURSE_ID,
      pointsEarned: 15,
      pointsPossible: 20,
      comments: '',
      course: {}
    });
    mockPrisma.teacher.findUnique.mockResolvedValueOnce({ id: TEACHER_ID, userId: TEACHER_USER_ID });
    mockPrisma.course.findUnique.mockResolvedValueOnce({ semester: 'q1' });
    mockPrisma.gradeLock.findFirst.mockResolvedValueOnce({ id: 'lock-1' });

    const app = buildApp({ id: TEACHER_USER_ID, role: 'TEACHER' });
    const res = await request(app).put(`/api/grades/${GRADE_ID}`).send({ pointsEarned: 19 });

    expect(res.status).toBe(423);
    expect(mockPrisma.grade.update).not.toHaveBeenCalled();
  });

  it('deleteGrade returns 423 when the period is locked', async () => {
    mockPrisma.grade.findUnique.mockResolvedValueOnce({
      id: GRADE_ID,
      teacherId: TEACHER_ID,
      courseId: COURSE_ID
    });
    mockPrisma.teacher.findUnique.mockResolvedValueOnce({ id: TEACHER_ID, userId: TEACHER_USER_ID });
    mockPrisma.course.findUnique.mockResolvedValueOnce({ semester: 'q1' });
    mockPrisma.gradeLock.findFirst.mockResolvedValueOnce({ id: 'lock-1' });

    const app = buildApp({ id: TEACHER_USER_ID, role: 'TEACHER' });
    const res = await request(app).delete(`/api/grades/${GRADE_ID}`);

    expect(res.status).toBe(423);
    expect(mockPrisma.grade.delete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------
// P1-6: updateGrade no longer swallows zero scores
// ---------------------------------------------------------------
describe('PUT /api/grades/:id — P1-6 zero-score handling', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('persists pointsEarned: 0 instead of falling back to the previous value', async () => {
    mockPrisma.grade.findUnique.mockResolvedValueOnce({
      id: GRADE_ID,
      teacherId: TEACHER_ID,
      courseId: COURSE_ID,
      pointsEarned: 18,
      pointsPossible: 20,
      comments: 'old',
      course: {}
    });
    mockPrisma.teacher.findUnique.mockResolvedValueOnce({ id: TEACHER_ID, userId: TEACHER_USER_ID });
    mockPrisma.course.findUnique.mockResolvedValueOnce({ semester: 'q1' });
    mockPrisma.gradeLock.findFirst.mockResolvedValueOnce(null);
    mockPrisma.grade.update.mockImplementation(async (args: any) => ({
      id: GRADE_ID,
      teacherId: TEACHER_ID,
      courseId: COURSE_ID,
      pointsEarned: { toNumber: () => Number(args.data.pointsEarned) },
      pointsPossible: { toNumber: () => 20 },
      comments: args.data.comments ?? 'old',
      course: {},
      student: { user: { firstName: 'A', lastName: 'B' } },
      teacher: { user: { firstName: 'X', lastName: 'Y' } }
    }));

    const app = buildApp({ id: TEACHER_USER_ID, role: 'TEACHER' });
    const res = await request(app).put(`/api/grades/${GRADE_ID}`).send({ pointsEarned: 0 });

    expect(res.status).toBe(200);
    const callArgs = mockPrisma.grade.update.mock.calls[0][0];
    expect(callArgs.data.pointsEarned).toBe(0);
  });
});
