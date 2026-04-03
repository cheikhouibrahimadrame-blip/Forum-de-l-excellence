import type React from 'react';
import { useState } from 'react';
import { FileText, Download, Printer, Calendar, Award, TrendingUp } from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import { downloadPDF } from '../../../utils/pdfGenerator';

const StudentReportCards: React.FC = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardHeaderRef, isVisible: cardHeaderVisible } = useScrollReveal();
  const { ref: tableRef, isVisible: tableVisible } = useScrollReveal();
  const { ref: commentsRef, isVisible: commentsVisible } = useScrollReveal();
  const { ref: historyRef, isVisible: historyVisible } = useScrollReveal();
  const [selectedTrimester, setSelectedTrimester] = useState('trimester1');

  const reportCards = [
    {
      id: 'trimester1',
      title: 'Trimestre 1 - 2025-2026',
      period: 'Octobre 2025 - D�cembre 2025',
      gpa: 16.2,
      rank: 3,
      totalStudents: 28,
      status: 'Tr�s Bien',
      attendance: 96,
      grades: [
        { course: 'Math�matiques', grade: 17, coefficient: 3, teacher: 'M. Diallo' },
        { course: 'Fran�ais', grade: 16, coefficient: 3, teacher: 'Mme Sow' },
        { course: '�veil scientifique', grade: 15, coefficient: 2, teacher: 'M. Ndiaye' },
        { course: 'Histoire-G�ographie', grade: 16, coefficient: 2, teacher: 'Mme Ba' },
        { course: 'Arts plastiques', grade: 18, coefficient: 1, teacher: 'Mme Diop' },
        { course: 'EPS', grade: 17, coefficient: 1, teacher: 'M. Fall' }
      ]
    },
    {
      id: 'trimester2',
      title: 'Trimestre 2 - 2025-2026',
      period: 'Janvier 2026 - Mars 2026',
      gpa: 15.6,
      rank: 5,
      totalStudents: 28,
      status: 'Bien',
      attendance: 94,
      grades: [
        { course: 'Math�matiques', grade: 15.5, coefficient: 3, teacher: 'M. Diallo' },
        { course: 'Fran�ais', grade: 15, coefficient: 3, teacher: 'Mme Sow' },
        { course: '�veil scientifique', grade: 14.5, coefficient: 2, teacher: 'M. Ndiaye' },
        { course: 'Histoire-G�ographie', grade: 15, coefficient: 2, teacher: 'Mme Ba' },
        { course: 'Arts plastiques', grade: 17, coefficient: 1, teacher: 'Mme Diop' },
        { course: 'EPS', grade: 16, coefficient: 1, teacher: 'M. Fall' }
      ]
    }
  ];

  const selectedReport = reportCards.find(r => r.id === selectedTrimester) || reportCards[0];

  const calculateAverage = (grades: typeof selectedReport.grades) => {
    const total = grades.reduce((sum, g) => sum + (g.grade * g.coefficient), 0);
    const coefSum = grades.reduce((sum, g) => sum + g.coefficient, 0);
    return (total / coefSum).toFixed(2);
  };

  const handleDownload = () => {
    const simplifiedContent = `
      <div class="header">
        <div class="header-title">${selectedReport.title}</div>
        <div class="header-subtitle">${selectedReport.period}</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value">${selectedReport.gpa}</div>
          <div class="stat-label">Moyenne</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${selectedReport.rank}�me</div>
          <div class="stat-label">sur ${selectedReport.totalStudents}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${selectedReport.status}</div>
          <div class="stat-label">Mention</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${selectedReport.attendance}%</div>
          <div class="stat-label">Assiduit�</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">D�tails des mati�res</div>
        <table>
          <thead>
            <tr>
              <th>Mati�re</th>
              <th>Enseignant</th>
              <th>Note</th>
              <th>Coef.</th>
            </tr>
          </thead>
          <tbody>
            ${selectedReport.grades.map(grade => `
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

      <div class="footer">
        <p>G�n�r� le ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><span class="logo">Forum de L'excellence</span> - Syst�me de Gestion Acad�mique</p>
      </div>
    `;

    downloadPDF(simplifiedContent, `Bulletin_${selectedReport.id}`);
  };

  const handlePrint = () => {
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
            <div class="stat-box">
              <div class="stat-value">${selectedReport.gpa}</div>
              <div class="stat-label">Moyenne</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${selectedReport.rank}�me</div>
              <div class="stat-label">sur ${selectedReport.totalStudents}</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${selectedReport.status}</div>
              <div class="stat-label">Mention</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${selectedReport.attendance}%</div>
              <div class="stat-label">Assiduit�</div>
            </div>
          </div>

          <h3>D�tails des mati�res</h3>
          <table>
            <thead>
              <tr>
                <th>Mati�re</th>
                <th>Enseignant</th>
                <th>Note</th>
                <th>Coef.</th>
              </tr>
            </thead>
            <tbody>
              ${selectedReport.grades.map(grade => `
                <tr>
                  <td>${grade.course}</td>
                  <td>${grade.teacher}</td>
                  <td>${grade.grade}/20</td>
                  <td>${grade.coefficient}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>G�n�r� le ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>Forum de L'excellence - Syst�me de Gestion Acad�mique</p>
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
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes Bulletins</h1>
            
            {/* Trimester Selector */}
            <select
              value={selectedTrimester}
              onChange={(e) => setSelectedTrimester(e.target.value)}
              className="input-field appearance-none bg-no-repeat bg-right pr-10"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5rem' }}
            >
              {reportCards.map(report => (
                <option key={report.id} value={report.id}>{report.title}</option>
              ))}
            </select>
          </div>

          {/* Report Card Header */}
          <div
            ref={cardHeaderRef}
            className={`gradient-card rounded-2xl p-8 text-white ${cardHeaderVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedReport.title}</h2>
                <p className="text-white/80">{selectedReport.period}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  T�l�charger
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{selectedReport.gpa}</div>
                <p className="text-sm text-white/80">Moyenne</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{selectedReport.rank}�me</div>
                <p className="text-sm text-white/80">sur {selectedReport.totalStudents}</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{selectedReport.status}</div>
                <p className="text-sm text-white/80">Mention</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{selectedReport.attendance}%</div>
                <p className="text-sm text-white/80">Assiduit�</p>
              </div>
            </div>
          </div>

          {/* Detailed Grades Table */}
          <div
            ref={tableRef}
            className={`card overflow-hidden ${tableVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
          >
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--color-primary-navy)]" />
                D�tails des mati�res
              </h3>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <TrendingUp className="w-4 h-4" />
                Moyenne: {calculateAverage(selectedReport.grades)}/20
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-bg-secondary)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                      Mati�re
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
                      Appr�ciation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {selectedReport.grades.map((grade, index) => (
                    <tr key={index} className="hover:bg-[var(--color-bg-secondary)]">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--color-text-primary)]">{grade.course}</div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.teacher}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[var(--color-primary-navy)]">{grade.grade}/20</span>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.coefficient}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          grade.grade >= 16 ? 'bg-green-100 text-green-800' :
                          grade.grade >= 14 ? 'bg-blue-100 text-blue-800' :
                          grade.grade >= 12 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {grade.grade >= 16 ? 'Excellent' :
                           grade.grade >= 14 ? 'Tr�s bien' :
                           grade.grade >= 12 ? 'Bien' : '� am�liorer'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div
              ref={commentsRef}
              className={`card p-6 ${commentsVisible ? 'animate-slide-in-left' : 'opacity-0'}`}
            >
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--color-primary-navy)]" />
                Appr�ciations g�n�rales
              </h3>
              <div className="space-y-4 text-[var(--color-text-secondary)]">
                <p>
                  <strong className="text-[var(--color-text-primary)]">Travail :</strong> L'�l�ve d�montre une bonne compr�hension des notions et participe activement.
                </p>
                <p>
                  <strong className="text-[var(--color-text-primary)]">Comportement :</strong> Comportement respectueux envers les enseignants et les camarades.
                </p>
                <p>
                  <strong className="text-[var(--color-text-primary)]">Progr�s :</strong> Progr�s constants tout au long du trimestre.
                </p>
              </div>
            </div>

            <div
              ref={historyRef}
              className={`card p-6 ${historyVisible ? 'animate-slide-in-right' : 'opacity-0'}`}
            >
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
                Historique des bulletins
              </h3>
              <div className="space-y-3">
                {reportCards.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedTrimester(report.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      selectedTrimester === report.id
                        ? 'border-[var(--color-primary-navy)] bg-[var(--color-primary-gold-light)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary-navy)]'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-[var(--color-text-primary)]">{report.title}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{report.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[var(--color-primary-navy)]">{report.gpa}/20</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{report.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportCards;
