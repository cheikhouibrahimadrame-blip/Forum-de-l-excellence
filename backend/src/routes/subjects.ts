import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import crypto from 'crypto';
import { loadJsonStore, saveJsonStore } from '../lib/jsonStore';
import prisma from '../lib/prisma';

const router = Router();

type SubjectItem = {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isActive: boolean;
};

type SubjectAssignmentItem = {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classroomId: string;
  classroomName: string;
  teacherId: string;
  teacherName: string;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
};

const SUBJECTS_FILE = 'subjects.json';
const SUBJECT_ASSIGNMENTS_FILE = 'subject-assignments.json';

let subjectAssignmentsStore: SubjectAssignmentItem[] = loadJsonStore<SubjectAssignmentItem[]>(SUBJECT_ASSIGNMENTS_FILE, []);

const persistSubjectAssignments = () => {
  saveJsonStore(SUBJECT_ASSIGNMENTS_FILE, subjectAssignmentsStore);
};

router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const mapped: SubjectItem[] = subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description || undefined,
      color: undefined,
      isActive: subject.isActive
    }));

    res.json({ success: true, data: mapped });
  } catch {
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des matières' });
  }
});

router.get('/teacher/assignments', (req: any, res) => {
  if (req.user?.role !== 'TEACHER') {
    res.status(403).json({ success: false, error: 'Acces reserve aux enseignants' });
    return;
  }

  const assignments = subjectAssignmentsStore
    .filter((assignment) => assignment.teacherId === req.user?.id)
    .sort((a, b) => {
      const classDiff = a.classroomName.localeCompare(b.classroomName);
      if (classDiff !== 0) return classDiff;
      return a.subjectName.localeCompare(b.subjectName);
    });

  res.json({
    success: true,
    data: {
      assignments
    }
  });
});

router.post('/', authorize(['ADMIN']), async (req, res) => {
  const { name, code, description, color, isActive = true } = req.body;

  if (!name || !code) {
    res.status(400).json({ success: false, error: 'Champs requis manquants' });
    return;
  }

  try {
    const newSubject = await prisma.subject.create({
      data: {
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        description: description ? String(description).trim() : null,
        isActive: Boolean(isActive)
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: newSubject.id,
        name: newSubject.name,
        code: newSubject.code,
        description: newSubject.description || undefined,
        color,
        isActive: newSubject.isActive
      }
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Le code matière existe déjà' });
      return;
    }
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la matière' });
  }
});

router.post('/:subjectId/assign', authorize(['ADMIN']), async (req, res) => {
  const { subjectId } = req.params;
  const { classroomId, classroomName, teacherId, teacherName, schoolYear } = req.body || {};

  if (!classroomId || !classroomName || !teacherId || !teacherName || !schoolYear) {
    res.status(400).json({
      success: false,
      error: 'classroomId, classroomName, teacherId, teacherName et schoolYear sont requis'
    });
    return;
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true, code: true }
  });
  if (!subject) {
    res.status(404).json({ success: false, error: 'Matière introuvable' });
    return;
  }

  const existingIndex = subjectAssignmentsStore.findIndex(
    (item) => item.subjectId === subjectId && item.classroomId === classroomId && item.schoolYear === schoolYear
  );

  const assignment = {
    id: existingIndex >= 0 ? subjectAssignmentsStore[existingIndex].id : crypto.randomUUID(),
    subjectId,
    subjectName: subject.name,
    subjectCode: subject.code,
    classroomId,
    classroomName,
    teacherId,
    teacherName,
    schoolYear,
    createdAt: existingIndex >= 0 ? subjectAssignmentsStore[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    subjectAssignmentsStore[existingIndex] = assignment;
  } else {
    subjectAssignmentsStore = [assignment, ...subjectAssignmentsStore];
  }

  persistSubjectAssignments();

  res.json({ success: true, data: assignment });
});

router.put('/:subjectId', authorize(['ADMIN']), async (req, res) => {
  const { subjectId } = req.params;
  try {
    const existing = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Matière introuvable' });
      return;
    }

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: req.body.name != null ? String(req.body.name).trim() : existing.name,
        code: req.body.code != null ? String(req.body.code).trim().toUpperCase() : existing.code,
        description: req.body.description !== undefined ? (req.body.description ? String(req.body.description).trim() : null) : existing.description,
        isActive: req.body.isActive != null ? Boolean(req.body.isActive) : existing.isActive
      }
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        code: updated.code,
        description: updated.description || undefined,
        color: req.body.color,
        isActive: updated.isActive
      }
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Le code matière existe déjà' });
      return;
    }
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de la matière' });
  }
});

router.delete('/:subjectId', authorize(['ADMIN']), async (req, res) => {
  const { subjectId } = req.params;
  const existing = await prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } });

  if (!existing) {
    res.status(404).json({ success: false, error: 'Matière introuvable' });
    return;
  }

  await prisma.subject.delete({ where: { id: subjectId } });
  subjectAssignmentsStore = subjectAssignmentsStore.filter(item => item.subjectId !== subjectId);
  persistSubjectAssignments();
  res.json({ success: true });
});

export default router;
