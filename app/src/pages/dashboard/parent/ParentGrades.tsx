import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Award, AlertCircle, CheckCircle, User, Download, Printer, ChevronLeft } from 'lucide-react';
import { downloadPDF } from '../../../utils/pdfGenerator';
import { useBranding } from '../../../contexts/BrandingContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface LinkedStudent {
  id: string;
  userId: string;
  studentId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  courseName: string;
  assignmentType: string;
  gradeValue: number | null;
  maxScore: number;
  gradedAt: string;
  feedback: string;
  teacherName: string;
}

const ParentGrades: React.FC = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [selectedChild, setSelectedChild] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentsRes = await api.get(API.PARENT_STUDENTS_MY);
        const studentsData = studentsRes.data;

        if (studentsData.success && studentsData.data.students) {
          setLinkedStudents(studentsData.data.students);

          const allGrades: Grade[] = [];
          for (const student of studentsData.data.students) {
            const gradesRes = await api.get(API.GRADES_BY_STUDENT(student.id));
            const gradesData = gradesRes.data;
            const courses = Array.isArray(gradesData?.data?.courses) ? gradesData.data.courses : [];
            const studentName = `${student.user.firstName} ${student.user.lastName}`;

            courses.forEach((course: any) => {
              const assignments = Array.isArray(course.assignments) ? course.assignments : [];
              assignments.forEach((assignment: any) => {
                const pointsEarned = assignment.pointsEarned != null ? Number(assignment.pointsEarned) : null;
                const pointsPossible = assignment.pointsPossible != null ? Number(assignment.pointsPossible) : 20;
                allGrades.push({
                  id: assignment.id,
                  studentId: student.id,
                  studentName,
                  courseName: course.courseName || 'Matiere',
                  assignmentType: assignment.assignmentType || 'HOMEWORK',
                  gradeValue: pointsEarned,
                  maxScore: pointsPossible,
                  gradedAt: assignment.gradeDate || assignment.createdAt || '',
                  feedback: assignment.comments || '',
                  teacherName: course.teacher || '-'
                });
              });
            });
          }
          setGrades(allGrades);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const children = ['all', ...linkedStudents.map(s => `${s.user.firstName} ${s.user.lastName}`)];
  const periods = [
    { value: 'current', label: 'Trimestre en cours' },
    { value: 'q1', label: '1er Trimestre' },
    { value: 'q2', label: '2e Trimestre' },
    { value: 'q3', label: '3e Trimestre' }
  ];

  const filteredGrades = grades.filter(grade => {
    if (selectedChild === 'all') return true;
    const student = linkedStudents.find(s => `${s.user.firstName} ${s.user.lastName}` === selectedChild);
    return student && grade.studentId === student.id;
  });

  const calculateAverage = (studentName: string) => {
    const student = linkedStudents.find(s => `${s.user.firstName} ${s.user.lastName}` === studentName);
    if (!student) return 0;

    const studentGrades = grades.filter(g => g.studentId === student.id);
    if (studentGrades.length === 0) return 0;

    const total = studentGrades.reduce((sum, g) => {
      if (g.gradeValue == null || g.maxScore === 0) return sum;
      return sum + (g.gradeValue / g.maxScore) * 20;
    }, 0);
    return total / studentGrades.length;
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return 'text-green-600';
    if (grade >= 14) return 'text-blue-600';
    if (grade >= 12) return 'text-amber-600';
    if (grade >= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeIcon = (grade: number) => {
    if (grade >= 16) return <Award className="w-4 h-4 text-green-600" />;
    if (grade >= 14) return <CheckCircle className="w-4 h-4 text-blue-600" />;
    if (grade >= 12) return <TrendingUp className="w-4 h-4 text-amber-600" />;
    if (grade >= 10) return <AlertCircle className="w-4 h-4 text-orange-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = () => {
    const simplifiedContent = `
      <div class="header">
        <div class="header-title">Notes et Resultats Scolaires</div>
        <div class="header-subtitle">${selectedChild === 'all' ? 'Tous les enfants' : selectedChild}</div>
      </div>

      <div class="section">
        <div class="section-title">Details des Notes</div>
        <table>
          <thead>
            <tr>
              <th>Enfant</th>
              <th>Matiere</th>
              <th>Note</th>
              <th>Type</th>
              <th>Date</th>
              <th>Enseignant</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            ${filteredGrades.map(grade => {
              const normalizedGrade = grade.gradeValue == null || grade.maxScore === 0
                ? '-'
                : `${((grade.gradeValue / grade.maxScore) * 20).toFixed(1)}/20`;
              return `
              <tr>
                <td>${grade.studentName || 'Inconnu'}</td>
                <td>${grade.courseName}</td>
                <td><strong>${normalizedGrade}</strong></td>
                <td>${grade.assignmentType}</td>
                <td>${grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString('fr-FR') : '-'}</td>
                <td>${grade.teacherName}</td>
                <td>${grade.feedback || '-'}</td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Genere le ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><span class="logo">Forum de L'excellence</span> - Systeme de Gestion Academique</p>
      </div>
    `;

    downloadPDF(simplifiedContent, 'Notes_Resultats');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Notes et Resultats</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #f5f5f5; padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
            td { padding: 10px 12px; border: 1px solid #ddd; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Notes et Resultats Scolaires</div>
            <div class="title">${selectedChild === 'all' ? 'Tous les enfants' : selectedChild}</div>
          </div>

          <h3>Details des Notes</h3>
          <table>
            <thead>
              <tr>
                <th>Enfant</th>
                <th>Matiere</th>
                <th>Note</th>
                <th>Type</th>
                <th>Date</th>
                <th>Enseignant</th>
                <th>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              ${filteredGrades.map(grade => {
                const normalizedGrade = grade.gradeValue == null || grade.maxScore === 0
                  ? '-'
                  : `${((grade.gradeValue / grade.maxScore) * 20).toFixed(1)}/20`;
                return `
                <tr>
                  <td>${grade.studentName || 'Inconnu'}</td>
                  <td>${grade.courseName}</td>
                  <td>${normalizedGrade}</td>
                  <td>${grade.assignmentType}</td>
                  <td>${grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>${grade.teacherName}</td>
                  <td>${grade.feedback || '-'}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Genere le ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>${branding.brand.pdfFooterText}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/parent', { state: { scrollTo: 'parent-grades' } })}
                className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors text-[var(--color-text-primary)]"
                aria-label="Retour"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Notes et Resultats</h1>
            </div>
            <div className="flex gap-2 ml-auto">
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-primary-gold/20 hover:bg-primary-gold/30 rounded-lg transition-colors text-[var(--color-text-primary)]"
              >
                <Download className="w-4 h-4" />
                Telecharger
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-primary-gold/20 hover:bg-primary-gold/30 rounded-lg transition-colors text-[var(--color-text-primary)]"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="input-field pl-10 appearance-none pr-10"
              >
                {children.map(child => (
                  <option key={child} value={child}>
                    {child === 'all' ? 'Tous les enfants' : child}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field appearance-none pr-10"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          {loading ? (
            <div className="card p-8 text-center">
              <p className="text-[var(--color-text-secondary)]">Chargement des notes...</p>
            </div>
          ) : error ? (
            <div className="card p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Erreur de chargement</h3>
              <p className="text-[var(--color-text-secondary)]">{error}</p>
            </div>
          ) : linkedStudents.length === 0 ? (
            <div className="card p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Aucun élève lié</h3>
              <p className="text-[var(--color-text-secondary)]">
                Veuillez contacter l'administration pour lier votre compte.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {linkedStudents.map((student, index) => {
                  const studentName = `${student.user.firstName} ${student.user.lastName}`;
                  const studentGrades = grades.filter(g => g.studentId === student.id);
                  const average = calculateAverage(studentName);

                  return (
                    <div key={index} className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{studentName}</h3>
                        <span className={`badge ${getStatusColor(average >= 16 ? 'excellent' : average >= 12 ? 'good' : 'warning')}`}>
                          {getGradeIcon(average)}
                          {average.toFixed(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                            {studentGrades.length}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">Notes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[var(--color-primary-navy)]">
                            {studentGrades.length > 0 ? Math.max(...studentGrades.map(g => {
                              if (g.gradeValue == null || g.maxScore === 0) return 0;
                              return (g.gradeValue / g.maxScore) * 20;
                            })).toFixed(1) : 0}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">Meilleure</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {studentGrades.filter(g => g.gradeValue != null && g.maxScore > 0 && (g.gradeValue / g.maxScore) * 20 >= 14).length}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">= 14</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grades Table */}
              <div className="card overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)]">
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    Details des Notes ({filteredGrades.length})
                  </h2>
                </div>
                {filteredGrades.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[var(--color-text-secondary)]">Aucune note disponible pour le moment.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--color-bg-secondary)]">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                            Enfant
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                            Matiere
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                            Note
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                            Enseignant
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                            Commentaire
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {filteredGrades.map((grade) => {
                          const normalizedGrade = grade.gradeValue == null || grade.maxScore === 0
                            ? null
                            : (grade.gradeValue / grade.maxScore) * 20;

                          return (
                            <tr key={grade.id} className="hover:bg-[var(--color-bg-secondary)]">
                              <td className="px-6 py-4">
                                <div className="font-medium text-[var(--color-text-primary)]">{grade.studentName || 'Inconnu'}</div>
                              </td>
                              <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.courseName}</td>
                              <td className="px-6 py-4">
                                {normalizedGrade === null ? (
                                  <span className="font-bold text-lg text-[var(--color-text-muted)]">-</span>
                                ) : (
                                  <>
                                    <span className={`font-bold text-lg ${getGradeColor(normalizedGrade)}`}>
                                      {normalizedGrade.toFixed(1)}/20
                                    </span>
                                    <div className="text-xs text-[var(--color-text-muted)]">
                                      ({grade.gradeValue}/{grade.maxScore})
                                    </div>
                                  </>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className="badge bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                                  {grade.assignmentType}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString('fr-FR') : '-'}
                              </td>
                              <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                {grade.teacherName}
                              </td>
                              <td className="px-6 py-4 text-[var(--color-text-secondary)] text-sm max-w-xs">
                                {grade.feedback || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentGrades;
