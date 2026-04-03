import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, BookOpen, Download, Printer, ChevronLeft } from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { downloadPDF } from '../../../utils/pdfGenerator';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';

type GradeRow = {
  course: string;
  teacher: string;
  gradeValue: number | null;
  gradeLabel: string;
  coefficient: number;
  trend: 'up' | 'down' | 'stable';
};

const StudentGrades: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();
  const { ref: tableRef, isVisible: tableVisible } = useScrollReveal();

  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [average, setAverage] = useState<string>('-');
  const [rankLabel, setRankLabel] = useState<string>('-');
  const [mention, setMention] = useState<string>('-');
  const [periodLabel, setPeriodLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user?.student?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await api.get(`/api/grades/student/${user.student.id}`);
        const result = response.data;
        const courses = Array.isArray(result?.data?.courses) ? result.data.courses : [];
        const semester = result?.data?.semester || 'Actuel';
        const year = result?.data?.year || '';
        setPeriodLabel(year ? `${semester} - ${year}` : semester);

        const rows: GradeRow[] = courses.map((course: any) => {
          const assignments = Array.isArray(course.assignments) ? course.assignments : [];
          let averageValue: number | null = null;

          if (course.finalGrade != null) {
            averageValue = Number(course.finalGrade);
          } else if (assignments.length > 0) {
            const totals = assignments.reduce(
              (acc: { earned: number; possible: number }, assignment: any) => {
                const earned = assignment.pointsEarned != null ? Number(assignment.pointsEarned) : 0;
                const possible = assignment.pointsPossible != null ? Number(assignment.pointsPossible) : 0;
                return { earned: acc.earned + earned, possible: acc.possible + possible };
              },
              { earned: 0, possible: 0 }
            );
            if (totals.possible > 0) {
              averageValue = (totals.earned / totals.possible) * 20;
            }
          }

          const gradeLabel = averageValue != null ? `${averageValue.toFixed(1)}/20` : '-';
          const trend: GradeRow['trend'] = averageValue == null
            ? 'stable'
            : averageValue >= 14
              ? 'up'
              : averageValue < 10
                ? 'down'
                : 'stable';

          return {
            course: course.courseName || 'Matiere',
            teacher: course.teacher || '-',
            gradeValue: averageValue,
            gradeLabel,
            coefficient: course.credits || 1,
            trend
          };
        });

        setGrades(rows);

        const numericGrades = rows.filter(row => row.gradeValue != null) as Array<GradeRow & { gradeValue: number }>;
        if (numericGrades.length > 0) {
          const totalWeighted = numericGrades.reduce((sum, row) => sum + row.gradeValue * row.coefficient, 0);
          const coefSum = numericGrades.reduce((sum, row) => sum + row.coefficient, 0);
          const avgValue = coefSum > 0 ? totalWeighted / coefSum : 0;
          setAverage(avgValue.toFixed(2));
          setMention(avgValue >= 16 ? 'Tres Bien' : avgValue >= 14 ? 'Bien' : avgValue >= 12 ? 'Assez Bien' : 'Passable');
        } else {
          setAverage('-');
          setMention('-');
        }
        setRankLabel('-');
      } catch (err) {
        console.error('Error loading student grades:', err);
        setError('Erreur lors du chargement des notes.');
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user?.student?.id]);

  const calculateAverage = () => {
    return average === '-' ? '-' : average;
  };

  const handleDownload = () => {
    const htmlContent = `
      <div class="header">
        <div class="header-title">Mes Notes</div>
        <div class="header-subtitle">${periodLabel || 'Periode en cours'}</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value">${calculateAverage()}</div>
          <div class="stat-label">Moyenne Générale</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${rankLabel}</div>
          <div class="stat-label">Classement</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${mention}</div>
          <div class="stat-label">Mention</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Détails par Matière</div>
        <table>
          <thead>
            <tr>
              <th>Matière</th>
              <th>Enseignant</th>
              <th>Note</th>
              <th>Coef.</th>
            </tr>
          </thead>
          <tbody>
            ${grades.map(grade => `
              <tr>
                <td>${grade.course}</td>
                <td>${grade.teacher}</td>
                <td><strong>${grade.gradeLabel}</strong></td>
                <td>${grade.coefficient}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><span class="logo">Forum de L'excellence</span> - Système de Gestion Académique</p>
      </div>
    `;

    downloadPDF(htmlContent, 'Mes_Notes_Semestre1');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Mes Notes - Semestre 1</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-box { text-align: center; padding: 20px; border: 1px solid #ddd; flex: 1; margin: 0 10px; }
            .stat-value { font-size: 28px; font-weight: bold; color: #003366; }
            .stat-label { color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #f5f5f5; padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
            td { padding: 10px 12px; border: 1px solid #ddd; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Mes Notes</div>
            <div class="title">${periodLabel || 'Periode en cours'}</div>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${calculateAverage()}</div>
              <div class="stat-label">Moyenne Générale</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${rankLabel}</div>
              <div class="stat-label">Classement</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${mention}</div>
              <div class="stat-label">Mention</div>
            </div>
          </div>

          <h3>Détails par Matière</h3>
          <table>
            <thead>
              <tr>
                <th>Matière</th>
                <th>Enseignant</th>
                <th>Note</th>
                <th>Coef.</th>
              </tr>
            </thead>
            <tbody>
              ${grades.map(grade => `
                <tr>
                  <td>${grade.course}</td>
                  <td>${grade.teacher}</td>
                  <td>${grade.gradeLabel}</td>
                  <td>${grade.coefficient}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>Forum de L'excellence - Système de Gestion Académique</p>
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
      <div
        ref={headerRef}
        className={`flex items-center justify-between ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/student', { state: { scrollTo: 'student-grades' } })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes Notes 🎓</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-primary-gold/20 hover:bg-primary-gold/30 rounded-lg transition-colors text-[var(--color-text-primary)]"
          >
            <Download className="w-4 h-4" />
            Télécharger
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

      {/* Overall Stats */}
      <div
        ref={statsRef}
        className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${statsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
      >
        <div className="card p-6 animation-delay-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Moyenne Générale</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{calculateAverage() === '-' ? '-' : `${calculateAverage()}/20`}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 animation-delay-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Classement</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{rankLabel}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 animation-delay-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Mention</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{mention}</p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-[var(--color-text-secondary)]">Chargement des notes...</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Grades Table */}
      <div
        ref={tableRef}
        className={`card overflow-hidden ${tableVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
      >
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Détails par Matière
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-bg-secondary)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Matière
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Enseignant
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Note
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Coef.
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Appreciation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {grades.map((grade, index) => (
                <tr key={index} className="hover:bg-[var(--color-bg-secondary)]">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--color-text-primary)]">{grade.course}</div>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.teacher}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[var(--color-primary-navy)]">{grade.gradeLabel}</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.coefficient}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (grade.gradeValue ?? 0) >= 16 ? 'bg-green-100 text-green-800' :
                      (grade.gradeValue ?? 0) >= 14 ? 'bg-blue-100 text-blue-800' :
                      (grade.gradeValue ?? 0) >= 12 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(grade.gradeValue ?? 0) >= 16 ? 'Excellent' :
                       (grade.gradeValue ?? 0) >= 14 ? 'Tres bien' :
                       (grade.gradeValue ?? 0) >= 12 ? 'Bien' : 'A ameliorer'}
                    </span>
                  </td>
                </tr>
              ))}
              {grades.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-sm text-[var(--color-text-muted)]">
                    Aucune note disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;