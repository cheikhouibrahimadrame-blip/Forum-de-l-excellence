// Diagnostic: count courses and classes, list a few rows.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const courseCount = await p.course.count();
    console.log('COURSE_COUNT=' + courseCount);

    const classCount = await p.class.count();
    console.log('CLASS_COUNT=' + classCount);

    const teacherCount = await p.teacher.count();
    console.log('TEACHER_COUNT=' + teacherCount);

    if (courseCount > 0) {
      const courses = await p.course.findMany({
        take: 5,
        select: { id: true, code: true, name: true, semester: true, year: true, teacherId: true },
      });
      console.log('SAMPLE_COURSES=' + JSON.stringify(courses, null, 2));
    }

    if (classCount > 0) {
      const classes = await p.class.findMany({
        take: 5,
        select: { id: true, name: true, level: true, mainTeacherId: true },
      });
      console.log('SAMPLE_CLASSES=' + JSON.stringify(classes, null, 2));
    }

    const subjectCount = await p.subject.count();
    console.log('SUBJECT_COUNT=' + subjectCount);

    const deptCount = await p.department.count();
    console.log('DEPT_COUNT=' + deptCount);
    if (deptCount > 0) {
      const depts = await p.department.findMany({ take: 5, select: { id: true, name: true, code: true } });
      console.log('SAMPLE_DEPTS=' + JSON.stringify(depts, null, 2));
    }
  } catch (e) {
    console.error('ERR=' + e.message);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();
