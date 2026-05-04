import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authorize, checkResourceAccess } from '../middleware/auth';
import logger from '../utils/logger';
import { isCoursePeriodLocked } from '../utils/gradeLock';


// express-validator v7 dropped automatic string coercion, so `body('pointsEarned').isDecimal()`
// rejects every numeric JSON value. This custom check accepts both shapes
// (`18` and `'18.5'`) and rejects negatives / NaN.
const isDecimalNumberOrString = (value: unknown): boolean => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0;
  if (typeof value === 'string' && /^[-+]?\d+(\.\d+)?$/.test(value)) {
    return Number(value) >= 0;
  }
  return false;
};

export const createGradeValidation = [
  body('studentId').isUUID().withMessage('ID étudiant invalide'),
  body('courseId').isUUID().withMessage('ID cours invalide'),
  body('assignmentName').isLength({ min: 2 }).withMessage('Nom du devoir requis'),
  body('assignmentType').isIn(['HOMEWORK', 'QUIZ', 'EXAM', 'PROJECT', 'PARTICIPATION']).withMessage('Type de devoir invalide'),
  body('pointsEarned').custom(isDecimalNumberOrString).withMessage('Points gagnés requis (nombre ≥ 0)'),
  body('pointsPossible').custom(isDecimalNumberOrString).withMessage('Points possibles requis (nombre ≥ 0)')
];

export const getStudentGrades = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { studentId } = req.params;
    const { semester, year } = req.query;

    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (!student || student.id !== studentId) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: req.user!.id },
        include: { parentStudents: true }
      });
      
      if (!parent || !parent.parentStudents.some(ps => ps.studentId === studentId)) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        enrollments: {
          where: semester && year ? {
            course: {
              semester: semester as string,
              year: parseInt(year as string)
            }
          } : undefined,
          include: {
            course: {
              include: {
                teacher: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true }
                    }
                  }
                }
              }
            }
          }
        },
        grades: {
          where: semester && year ? {
            course: {
              semester: semester as string,
              year: parseInt(year as string)
            }
          } : undefined,
          include: {
            course: true,
            teacher: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          },
          orderBy: { gradeDate: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Étudiant non trouvé'
      });
    }

    const gradesByCourse = student.grades.reduce((acc: any, grade) => {
      if (!acc[grade.courseId]) {
        acc[grade.courseId] = [];
      }
      acc[grade.courseId].push(grade);
      return acc;
    }, {});

    const coursesWithGrades = student.enrollments.map(enrollment => ({
      courseId: enrollment.course.id,
      courseCode: enrollment.course.code,
      courseName: enrollment.course.name,
      credits: enrollment.course.credits,
      finalGrade: enrollment.finalGrade,
      teacher: enrollment.course.teacher?.user ? 
        `${enrollment.course.teacher.user.firstName} ${enrollment.course.teacher.user.lastName}` : null,
      assignments: gradesByCourse[enrollment.course.id] || []
    }));

    const totalPoints = student.grades.reduce((sum, grade) => 
      sum + grade.pointsEarned.toNumber(), 0);
    const totalPossible = student.grades.reduce((sum, grade) => 
      sum + grade.pointsPossible.toNumber(), 0);
    
    const overallPercentage = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;

    res.json({
      success: true,
      data: {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        currentGPA: student.gpa,
        academicStanding: 'Bon standing',
        overallPercentage: Math.round(overallPercentage * 100) / 100,
        courses: coursesWithGrades
      }
    });
  } catch (error) {
    logger.error({ error }, 'Get student grades error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const getCourseGrades = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { courseId } = req.params;
    const { semester, year } = req.query;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                },
                grades: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Cours non trouvé'
      });
    }

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!teacher || course.teacherId !== teacher.id) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    const studentsWithGrades = course.enrollments.map((enrollment: any) => ({
      studentId: enrollment.student.id,
      studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      studentCode: enrollment.student.studentId,
      currentGrade: enrollment.finalGrade,
      assignments: enrollment.student.grades.filter((g: any) => g.courseId === courseId)
    }));

    const gradeDistribution = studentsWithGrades.reduce((acc: any, student: any) => {
      const grade = student.currentGrade;
      if (grade) {
        acc[grade] = (acc[grade] || 0) + 1;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        semester: course.semester,
        year: course.year,
        teacher: (course as any).teacher?.user ? 
          `${(course as any).teacher.user.firstName} ${(course as any).teacher.user.lastName}` : null,
        enrolledStudents: course.enrollments.length,
        gradeDistribution,
        students: studentsWithGrades
      }
    });
  } catch (error) {
    logger.error({ error }, 'Get course grades error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const createGrade = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { studentId, courseId, assignmentName, assignmentType, pointsEarned, pointsPossible, comments } = req.body;

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });

    if (!teacher) {
      return res.status(403).json({
        success: false,
        error: 'Enseignant non trouvé'
      });
    }

    // P0-2: verify the teacher owns this course before allowing grade creation.
    // Without this check any teacher could post grades in any course.
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Cours non trouvé'
      });
    }

    if (course.teacherId !== teacher.id) {
      return res.status(403).json({
        success: false,
        error: "Vous n'enseignez pas ce cours"
      });
    }

    // P0-4: refuse mutation when the course's period is locked.
    if (await isCoursePeriodLocked(courseId)) {
      return res.status(423).json({
        success: false,
        error: 'Cette période est verrouillée. Saisie de notes interdite.'
      });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        status: 'ENROLLED'
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Étudiant non inscrit à ce cours'
      });
    }

    const grade = await prisma.grade.create({
      data: {
        studentId,
        courseId,
        teacherId: teacher.id,
        assignmentName,
        assignmentType,
        pointsEarned,
        pointsPossible,
        gradeDate: new Date(),
        comments
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        course: true,
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    const percentage = (parseFloat(pointsEarned) / parseFloat(pointsPossible)) * 100;
    let letterGrade = 'F';
    if (percentage >= 90) letterGrade = 'A';
    else if (percentage >= 80) letterGrade = 'B';
    else if (percentage >= 70) letterGrade = 'C';
    else if (percentage >= 60) letterGrade = 'D';

    res.status(201).json({
      success: true,
      message: 'Note créée avec succès',
      data: {
        ...grade,
        percentage: Math.round(percentage * 100) / 100,
        letterGrade
      }
    });
  } catch (error) {
    logger.error({ error }, 'Create grade error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const updateGrade = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { gradeId } = req.params;
    const { pointsEarned, comments } = req.body;

    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        course: true
      }
    });

    if (!existingGrade) {
      return res.status(404).json({
        success: false,
        error: 'Note non trouvée'
      });
    }

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!teacher || existingGrade.teacherId !== teacher.id) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    // P0-4: refuse mutation when the course's period is locked.
    if (await isCoursePeriodLocked(existingGrade.courseId)) {
      return res.status(423).json({
        success: false,
        error: 'Cette période est verrouillée. Modification de notes interdite.'
      });
    }

    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        // P1-6: distinguish missing field from a legitimate zero score.
        pointsEarned: pointsEarned !== undefined ? pointsEarned : existingGrade.pointsEarned,
        comments: comments !== undefined ? comments : existingGrade.comments
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        course: true,
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    const percentage = (grade.pointsEarned.toNumber() / grade.pointsPossible.toNumber()) * 100;
    let letterGrade = 'F';
    if (percentage >= 90) letterGrade = 'A';
    else if (percentage >= 80) letterGrade = 'B';
    else if (percentage >= 70) letterGrade = 'C';
    else if (percentage >= 60) letterGrade = 'D';

    res.json({
      success: true,
      message: 'Note mise à jour avec succès',
      data: {
        ...grade,
        percentage: Math.round(percentage * 100) / 100,
        letterGrade
      }
    });
  } catch (error) {
    logger.error({ error }, 'Update grade error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const deleteGrade = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { gradeId } = req.params;

    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId }
    });

    if (!existingGrade) {
      return res.status(404).json({
        success: false,
        error: 'Note non trouvée'
      });
    }

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!teacher || existingGrade.teacherId !== teacher.id) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    // P0-4: refuse mutation when the course's period is locked.
    if (await isCoursePeriodLocked(existingGrade.courseId)) {
      return res.status(423).json({
        success: false,
        error: 'Cette période est verrouillée. Suppression de notes interdite.'
      });
    }

    await prisma.grade.delete({
      where: { id: gradeId }
    });

    res.json({
      success: true,
      message: 'Note supprimée avec succès'
    });
  } catch (error) {
    logger.error({ error }, 'Delete grade error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const calculateGPA = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { studentId } = req.params;
    const { semester, year } = req.query;

    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (!student || student.id !== studentId) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: req.user!.id },
        include: { parentStudents: true }
      });
      
      if (!parent || !parent.parentStudents.some(ps => ps.studentId === studentId)) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        },
        enrollments: {
          where: semester && year ? {
            course: {
              semester: semester as string,
              year: parseInt(year as string)
            }
          } : undefined,
          include: {
            course: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Étudiant non trouvé'
      });
    }

    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0
    };

    let totalCredits = 0;
    let totalQualityPoints = 0;

    student.enrollments.forEach(enrollment => {
      if (enrollment.finalGrade && gradePoints[enrollment.finalGrade]) {
        totalCredits += enrollment.course.credits;
        totalQualityPoints += gradePoints[enrollment.finalGrade] * enrollment.course.credits;
      }
    });

    const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

    res.json({
      success: true,
      data: {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        gpaType: semester && year ? 'Semestriel' : 'Cumulatif',
        gpa: Math.round(gpa * 100) / 100,
        totalCredits,
        totalQualityPoints: Math.round(totalQualityPoints * 100) / 100,
        academicStanding: gpa >= 3.5 ? 'Excellence' : gpa >= 3.0 ? 'Bon standing' : 'Satisfaisant'
      }
    });
  } catch (error) {
    logger.error({ error }, 'Calculate GPA error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};