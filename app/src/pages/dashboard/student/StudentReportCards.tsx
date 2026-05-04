import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Printer, Calendar, Award, TrendingUp } from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { downloadPDF } from '../../../utils/pdfGenerator';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';

type GradeRow = {
  course: string;
  grade: number;
  coefficient: number;
  teacher: string;
};

type ReportCard = {
  id: string;
  title: string;
  period: string;
  gpa: number;
  rank: string;
  totalStudents: string;
  status: string;
  attendance: string;
  grades: GradeRow[];
};

const StudentReportCards: React.FC = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const refreshTick = useLiveRefresh(30000);
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardHeaderRef, isVisible: cardHeaderVisible } = useScrollReveal();
  const { ref: tableRef, isVisible: tableVisible } = useScrollReveal();
  const { ref: commentsRef, isVisible: commentsVisible } = useScrollReveal();
  const { ref: historyRef, isVisible: historyVisible } = useScrollReveal();
  const [selectedTrimester, setSelectedTrimester] = useState('current');
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReportCard = async () => {
      if (!user?.student?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const res = await api.get(API.GRADES_BY_STUDENT(user.student.id));
        const result = res.data;
        const courses = Array.isArray(result?.data?.courses) ? result.data.courses : [];
        const semester = result?.data?.semester || 'Actuel';
        const year = result?.data?.year || '';
        const overallPercentage = typeof result?.data?.overallPercentage === 'number' ? result.data.overallPercentage : null;
        const currentGPA = typeof result?.data?.currentGPA === 'number' ? result.data.currentGPA : null;

        const grades: GradeRow[] = courses.map((course: any) => {
          const assignments = Array.isArray(course.assignments) ? course.assignments : [];
          let gradeValue = 0;

          if (course.finalGrade != null) {
            gradeValue = Number(course.finalGrade);
          } else if (assignments.length > 0) {
            const totals = assignments.reduce((acc: { earned: number; possible: number }, assignment: any) => {
              const earned = assignment.pointsEarned != null ? Number(assignment.pointsEarned) : 0;
              const possible = assignment.pointsPossible != null ? Number(assignment.pointsPossible) : 0;
              return { earned: acc.earned + earned, possible: acc.possible + possible };
            }, { earned: 0, possible: 0 });
            gradeValue = totals.possible > 0 ? (totals.earned / totals.possible) * 20 : 0;
          }

          return {
            course: course.courseName || 'Matière',
            grade: Number(gradeValue.toFixed(1)),
            coefficient: course.credits || 1,
            teacher: course.teacher || '-'
          };
        });

        const weightedTotal = grades.reduce((sum, row) => sum + row.grade * row.coefficient, 0);
        const coefSum = grades.reduce((sum, row) => sum + row.coefficient, 0);
        const bulletinAverage = coefSum > 0 ? weightedTotal / coefSum : 0;

        const reportCard: ReportCard = {
          id: 'current',
          title: `${semester} ${year ? `- ${year}` : ''}`.trim(),
          period: year ? `${semester} - ${year}` : semester,
          gpa: currentGPA ?? bulletinAverage,
          rank: '-',
          totalStudents: '-',
          status: overallPercentage != null
            ? overallPercentage >= 16
              ? 'Très Bien'
              : overallPercentage >= 14
                ? 'Bien'
                : overallPercentage >= 12
                  ? 'Assez Bien'
                  : 'Passable'
            : '-',
          attendance: '-',
          grades
        };

        setReportCards([reportCard]);
        setSelectedTrimester('current');
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement du bulletin');
        setReportCards([]);
      } finally {
        setLoading(false);
      }
    };

    loadReportCard();
  }, [user?.student?.id, refreshTick]);

  const selectedReport = useMemo(() => reportCards.find((report) => report.id === selectedTrimester) || reportCards[0], [reportCards, selectedTrimester]);

  const calculateAverage = (grades: GradeRow[]) => {
    if (!grades.length) return '-';
    const total = grades.reduce((sum, grade) => sum + (grade.grade * grade.coefficient), 0);
    const coefSum = grades.reduce((sum, grade) => sum + grade.coefficient, 0);
    return coefSum > 0 ? (total / coefSum).toFixed(2) : '-';
  };

  const handleDownload = () => {
    if (!selectedReport) return;

    const simplifiedContent = `
      <div class="header">
        <div class="header-title">${selectedReport.title}</div>
        <div class="header-subtitle">${selectedReport.period}</div>
      </div>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">${selectedReport.gpa.toFixed(2)}</div><div class="stat-label">Moyenne</div></div>
        <div class="stat-box"><div class="stat-value">${selectedReport.rank}</div><div class="stat-label">Rang</div></div>
        <div class="stat-box"><div class="stat-value">${selectedReport.status}</div><div class="stat-label">Mention</div></div>
        <div class="stat-box"><div class="stat-value">${selectedReport.attendance}</div><div class="stat-label">Assiduité</div></div>
      </div>
      <div class="section">
        <div class="section-title">Détails des matières</div>
        <table>
          <thead><tr><th>Matière</th><th>Enseignant</th><th>Note</th><th>Coef.</th></tr></thead>
          <tbody>
            ${selectedReport.grades.map((grade) => `
              <tr>
                <td>${grade.course}</td>
                <td>${grade.teacher}</td>
                <td><strong>${grade.grade}/20</strong></td>
                <td>${grade.coefficient}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="footer"><p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p><p>${branding.brand.pdfFooterText}</p></div>
    `;

    downloadPDF(simplifiedContent, `Bulletin_${selectedReport.id}`);
  };

  const handlePrint = () => {
    if (!selectedReport) return;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${selectedReport.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .period { color: #666; font-size: 14px; }
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
            <div class="title">Bulletin</div>
            <div class="period">${selectedReport.title}</div>
            <div class="period">${selectedReport.period}</div>
          </div>
          <div class="stats">
            <div class="stat-box"><div class="stat-value">${selectedReport.gpa.toFixed(2)}</div><div class="stat-label">Moyenne</div></div>
            <div class="stat-box"><div class="stat-value">${selectedReport.rank}</div><div class="stat-label">Rang</div></div>
            <div class="stat-box"><div class="stat-value">${selectedReport.status}</div><div class="stat-label">Mention</div></div>
            <div class="stat-box"><div class="stat-value">${selectedReport.attendance}</div><div class="stat-label">Assiduité</div></div>
          </div>
          <h3>Détails des matières</h3>
          <table>
            <thead><tr><th>Matière</th><th>Enseignant</th><th>Note</th><th>Coef.</th></tr></thead>
            <tbody>
              ${selectedReport.grades.map((grade) => `
                <tr>
                  <td>${grade.course}</td>
                  <td>${grade.teacher}</td>
                  <td>${grade.grade}/20</td>
                  <td>${grade.coefficient}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer"><p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p><p>${branding.brand.pdfFooterText}</p></div>
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
          <div ref={headerRef} className={`flex items-center justify-between ${headerVisible ? 'animate-slide-in-left' : 'opacity-0'}`}>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes Bulletins</h1>
            {reportCards.length > 0 && (
              <select value={selectedTrimester} onChange={(e) => setSelectedTrimester(e.target.value)} className="input-field appearance-none bg-no-repeat bg-right pr-10">
                {reportCards.map((report) => <option key={report.id} value={report.id}>{report.title}</option>)}
              </select>
            )}
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading && <div className="card p-6 text-center text-[var(--color-text-secondary)]">Chargement du bulletin...</div>}

          {selectedReport && !loading && (
            <>
              <div ref={cardHeaderRef} className={`gradient-card rounded-2xl p-8 text-white ${cardHeaderVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedReport.title}</h2>
                    <p className="text-white/80">{selectedReport.period}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"><Download className="w-4 h-4" />Télécharger</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"><Printer className="w-4 h-4" />Imprimer</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center"><div className="text-3xl font-bold mb-1">{selectedReport.gpa.toFixed(2)}</div><p className="text-sm text-white/80">Moyenne</p></div>
                  <div className="text-center"><div className="text-3xl font-bold mb-1">{selectedReport.rank}</div><p className="text-sm text-white/80">Rang</p></div>
                  <div className="text-center"><div className="text-3xl font-bold mb-1">{selectedReport.status}</div><p className="text-sm text-white/80">Mention</p></div>
                  <div className="text-center"><div className="text-3xl font-bold mb-1">{selectedReport.attendance}</div><p className="text-sm text-white/80">Assiduité</p></div>
                </div>
              </div>

              <div ref={tableRef} className={`card overflow-hidden ${tableVisible ? 'animate-slide-in-right' : 'opacity-0'}`}>
                <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><Award className="w-5 h-5 text-[var(--color-primary-navy)]" />Détails des matières</h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]"><TrendingUp className="w-4 h-4" />Moyenne: {calculateAverage(selectedReport.grades)}/20</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-bg-secondary)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">Matière</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">Enseignant</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">Note</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">Coef.</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">Appréciation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {selectedReport.grades.map((grade, index) => (
                        <tr key={index} className="hover:bg-[var(--color-bg-secondary)]">
                          <td className="px-6 py-4"><div className="font-medium text-[var(--color-text-primary)]">{grade.course}</div></td>
                          <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.teacher}</td>
                          <td className="px-6 py-4"><span className="font-semibold text-[var(--color-primary-navy)]">{grade.grade}/20</span></td>
                          <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.coefficient}</td>
                          <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${grade.grade >= 16 ? 'bg-green-100 text-green-800' : grade.grade >= 14 ? 'bg-blue-100 text-blue-800' : grade.grade >= 12 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{grade.grade >= 16 ? 'Excellent' : grade.grade >= 14 ? 'Très bien' : grade.grade >= 12 ? 'Bien' : 'À améliorer'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div ref={commentsRef} className={`card p-6 ${commentsVisible ? 'animate-slide-in-left' : 'opacity-0'}`}>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--color-primary-navy)]" />Appréciations générales</h3>
                  <div className="space-y-4 text-[var(--color-text-secondary)]">
                    <p><strong className="text-[var(--color-text-primary)]">Travail :</strong> Données synchronisées depuis le serveur.</p>
                    <p><strong className="text-[var(--color-text-primary)]">Comportement :</strong> Les appréciations détaillées seront affichées dès qu'elles sont disponibles côté API.</p>
                    <p><strong className="text-[var(--color-text-primary)]">Progrès :</strong> Le bulletin se met à jour automatiquement à chaque synchronisation.</p>
                  </div>
                </div>
                <div ref={historyRef} className={`card p-6 ${historyVisible ? 'animate-slide-in-right' : 'opacity-0'}`}>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />Historique des bulletins</h3>
                  <div className="space-y-3"><div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"><div className="font-medium text-[var(--color-text-primary)]">Bulletin actuel</div><div className="text-sm text-[var(--color-text-secondary)]">Synchronisé en temps réel depuis les notes du serveur</div></div></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReportCards;
