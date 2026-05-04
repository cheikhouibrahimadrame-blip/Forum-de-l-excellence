import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Search, ChevronLeft, AlertCircle, Users, Award, TrendingUp, Eye } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import UserSelect from '../../../components/forms/UserSelect';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

type GradeRow = {
  course: string;
  grade: number;
  coefficient: number;
  teacher: string;
};

type BulletinData = {
  studentName: string;
  studentId: string;
  className: string;
  period: string;
  gpa: number;
  mention: string;
  grades: GradeRow[];
};

const AdminBulletins: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [bulletin, setBulletin] = useState<BulletinData | null>(null);

  // Batch mode — generate for all students of a class
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classStudents, setClassStudents] = useState<{ id: string; name: string; studentId: string }[]>([]);
  const [classBulletins, setClassBulletins] = useState<BulletinData[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Load classes list
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await api.get(API.CLASSES);
        const data = res.data;
        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setClasses(items.map((c: any) => ({ id: c.id, name: c.name })));
      } catch {
        // silent — classes are optional
      }
    };
    loadClasses();
  }, []);

  // Load single student bulletin
  const loadStudentBulletin = async (studentProfileId: string, studentName?: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(API.GRADES_BY_STUDENT(studentProfileId));
      const result = res.data;
      const courses = Array.isArray(result?.data?.courses) ? result.data.courses : [];

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
      const average = coefSum > 0 ? weightedTotal / coefSum : 0;

      const mention = average >= 16 ? 'Très Bien' : average >= 14 ? 'Bien' : average >= 12 ? 'Assez Bien' : average >= 10 ? 'Passable' : 'Insuffisant';

      const b: BulletinData = {
        studentName: studentName || selectedStudentName || 'Élève',
        studentId: studentProfileId,
        className: result?.data?.className || '-',
        period: result?.data?.semester ? `${result.data.semester} ${result.data.year || ''}`.trim() : 'Semestre en cours',
        gpa: Number(average.toFixed(2)),
        mention,
        grades
      };

      setBulletin(b);
      return b;
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors du chargement du bulletin');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handle student selection
  const handleStudentChange = (id: string, user?: any) => {
    setSelectedStudentId(id);
    if (user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      setSelectedStudentName(name);
    }
    setBulletin(null);
    if (id) {
      loadStudentBulletin(id, user ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : undefined);
    }
  };

  // Generate bulletins for all students in a class
  const handleGenerateClassBulletins = async () => {
    if (!selectedClassId) return;
    try {
      setBatchLoading(true);
      setError('');
      setClassBulletins([]);

      // Get students in this class
      const usersRes = await api.get(API.USERS, { params: { role: 'STUDENT', limit: 500 } });
      const allStudents = Array.isArray(usersRes.data?.data?.users) ? usersRes.data.data.users : [];
      const className = classes.find(c => c.id === selectedClassId)?.name || '';

      // Filter students by class (using student.major = className)
      const studentsInClass = allStudents
        .filter((u: any) => u.student?.major === className && u.student?.id)
        .map((u: any) => ({
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim(),
          studentId: u.student.id
        }));

      setClassStudents(studentsInClass);

      if (studentsInClass.length === 0) {
        setError(`Aucun élève trouvé dans la classe "${className}".`);
        setBatchLoading(false);
        return;
      }

      // Load bulletins for each student
      const bulletins: BulletinData[] = [];
      for (const student of studentsInClass) {
        try {
          const res = await api.get(API.GRADES_BY_STUDENT(student.studentId));
          const result = res.data;
          const courses = Array.isArray(result?.data?.courses) ? result.data.courses : [];

          const grades: GradeRow[] = courses.map((course: any) => {
            const assignments = Array.isArray(course.assignments) ? course.assignments : [];
            let gradeValue = 0;
            if (course.finalGrade != null) {
              gradeValue = Number(course.finalGrade);
            } else if (assignments.length > 0) {
              const totals = assignments.reduce((acc: { earned: number; possible: number }, a: any) => {
                return { earned: acc.earned + (Number(a.pointsEarned) || 0), possible: acc.possible + (Number(a.pointsPossible) || 0) };
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

          const wt = grades.reduce((s, r) => s + r.grade * r.coefficient, 0);
          const cs = grades.reduce((s, r) => s + r.coefficient, 0);
          const avg = cs > 0 ? wt / cs : 0;
          const mention = avg >= 16 ? 'Très Bien' : avg >= 14 ? 'Bien' : avg >= 12 ? 'Assez Bien' : avg >= 10 ? 'Passable' : 'Insuffisant';

          bulletins.push({
            studentName: student.name,
            studentId: student.studentId,
            className,
            period: result?.data?.semester ? `${result.data.semester} ${result.data.year || ''}`.trim() : 'Semestre en cours',
            gpa: Number(avg.toFixed(2)),
            mention,
            grades
          });
        } catch {
          // skip students with no grades
        }
      }

      setClassBulletins(bulletins.sort((a, b) => b.gpa - a.gpa));
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Erreur lors de la génération des bulletins');
    } finally {
      setBatchLoading(false);
    }
  };

  const getMentionColor = (mention: string) => {
    switch (mention) {
      case 'Très Bien': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Bien': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Assez Bien': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Passable': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'bulletins' } })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-navy" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bulletins Semestriels</h1>
                <p className="text-gray-600 dark:text-gray-400">Générer et consulter les bulletins de notes des élèves</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Individual Student Bulletin */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-navy" />
              Bulletin individuel
            </h2>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner un élève
                </label>
                <UserSelect
                  role="STUDENT"
                  valueKind="studentId"
                  value={selectedStudentId}
                  onChange={handleStudentChange}
                  placeholder="Choisir un élève pour voir son bulletin"
                  emptyHint="Aucun élève disponible"
                  showEmail
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement du bulletin...</p>
              </div>
            )}

            {bulletin && !loading && (
              <div className="mt-6 space-y-4">
                {/* Student header */}
                <div className="bg-gradient-to-r from-[var(--color-primary-navy)] to-[var(--color-primary-navy)]/80 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{bulletin.studentName}</h3>
                      <p className="text-white/80 text-sm">Classe : {bulletin.className} — {bulletin.period}</p>
                    </div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getMentionColor(bulletin.mention)}`}>
                      {bulletin.mention}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{bulletin.gpa.toFixed(2)}/20</p>
                      <p className="text-xs text-white/70">Moyenne générale</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{bulletin.grades.length}</p>
                      <p className="text-xs text-white/70">Matières</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{bulletin.mention}</p>
                      <p className="text-xs text-white/70">Mention</p>
                    </div>
                  </div>
                </div>

                {/* Grades table */}
                {bulletin.grades.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Matière</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Enseignant</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Note</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Coefficient</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Appréciation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {bulletin.grades.map((g, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{g.course}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.teacher}</td>
                            <td className="px-4 py-3 font-semibold text-primary-navy">{g.grade}/20</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.coefficient}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                g.grade >= 16 ? 'bg-green-100 text-green-800' :
                                g.grade >= 14 ? 'bg-blue-100 text-blue-800' :
                                g.grade >= 12 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {g.grade >= 16 ? 'Excellent' : g.grade >= 14 ? 'Très bien' : g.grade >= 12 ? 'Bien' : 'À améliorer'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune note enregistrée pour cet élève.</p>
                )}
              </div>
            )}
          </Card>

          {/* Batch Generation by Class */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-navy" />
              Bulletins par classe
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Générer les bulletins pour tous les élèves d'une classe
            </p>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner une classe
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => { setSelectedClassId(e.target.value); setClassBulletins([]); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-navy focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="">Choisir une classe</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerateClassBulletins}
                disabled={!selectedClassId || batchLoading}
                className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:bg-primary-navy/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {batchLoading ? 'Génération...' : 'Générer les bulletins'}
              </button>
            </div>

            {batchLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Génération des bulletins en cours...</p>
              </div>
            )}

            {classBulletins.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {classBulletins.length} bulletin{classBulletins.length > 1 ? 's' : ''} générés
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    Moyenne de classe : {(classBulletins.reduce((s, b) => s + b.gpa, 0) / classBulletins.length).toFixed(2)}/20
                  </div>
                </div>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Rang</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Élève</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Moyenne</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Mention</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Matières</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {classBulletins.map((b, i) => (
                        <tr key={b.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{b.studentName}</td>
                          <td className="px-4 py-3 font-semibold text-primary-navy">{b.gpa.toFixed(2)}/20</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getMentionColor(b.mention)}`}>
                              {b.mention}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{b.grades.length}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedStudentId(b.studentId);
                                setSelectedStudentName(b.studentName);
                                setBulletin(b);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Voir le bulletin"
                            >
                              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminBulletins;
