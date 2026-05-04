import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit, Save, X, CheckCircle, AlertCircle, TrendingUp, Download, Upload, Search, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface Grade {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  subject: string;
  grade: number | null;
  maxGrade: number;
  coefficient: number;
  type: 'devoir' | 'interrogation' | 'examen' | 'participation';
  date: string;
  comment: string;
  status: 'graded' | 'pending' | 'validated';
}

const mapAssignmentType = (value: string): Grade['type'] => {
  switch (value) {
    case 'QUIZ':
      return 'interrogation';
    case 'EXAM':
      return 'examen';
    case 'PARTICIPATION':
      return 'participation';
    case 'PROJECT':
    case 'HOMEWORK':
    default:
      return 'devoir';
  }
};

const TeacherGrades: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<string[]>(['all']);
  const [types, setTypes] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredGrades = grades.filter(grade => {
    const matchesClass = selectedClass === 'all' || grade.className === selectedClass;
    const matchesType = selectedType === 'all' || grade.type === selectedType;
    return matchesClass && matchesType;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'devoir': return 'Devoir';
      case 'interrogation': return 'Interrogation';
      case 'examen': return 'Examen';
      case 'participation': return 'Participation';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800';
      case 'graded': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'graded': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user?.teacher?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const scheduleRes = await api.get(API.SCHEDULES_TEACHER(user.teacher.id));
        const scheduleData = scheduleRes.data;
        const teachingSchedule = scheduleData?.data?.teachingSchedule || {};
        const courseIds = Array.from(new Set(
          Object.values(teachingSchedule)
            .flatMap((entries: any) => (Array.isArray(entries) ? entries : []))
            .map((entry: any) => entry.courseId)
            .filter(Boolean)
        ));

        const gradeItems: Grade[] = [];
        const classSet = new Set<string>(['all']);
        const typeSet = new Set<string>(['all']);

        for (const courseId of courseIds) {
          let gradesData: any = null;
          try {
            const gradesRes = await api.get(API.GRADES_BY_COURSE(courseId));
            gradesData = gradesRes.data;
          } catch (error) {
            continue;
          }
          const courseName = gradesData?.data?.courseName || 'Cours';
          const courseCode = gradesData?.data?.courseCode || '';
          const coefficient = gradesData?.data?.credits || 1;
          const students = Array.isArray(gradesData?.data?.students) ? gradesData.data.students : [];

          classSet.add(courseName);

          students.forEach((student: any) => {
            const assignments = Array.isArray(student.assignments) ? student.assignments : [];
            assignments.forEach((assignment: any) => {
              const mappedType = mapAssignmentType(assignment.assignmentType || 'HOMEWORK');
              typeSet.add(mappedType);
              const pointsEarned = assignment.pointsEarned != null ? Number(assignment.pointsEarned) : null;
              const pointsPossible = assignment.pointsPossible != null ? Number(assignment.pointsPossible) : 20;
              const gradeDate = assignment.gradeDate || assignment.createdAt || '';
              const dateLabel = gradeDate ? new Date(gradeDate).toLocaleDateString('fr-FR') : '-';

              gradeItems.push({
                id: assignment.id,
                studentName: student.studentName || 'Eleve',
                studentId: student.studentId || '',
                className: courseName,
                subject: courseCode || courseName,
                grade: pointsEarned,
                maxGrade: pointsPossible,
                coefficient,
                type: mappedType,
                date: dateLabel,
                comment: assignment.comments || '',
                status: pointsEarned === null ? 'pending' : 'graded'
              });
            });
          });
        }

        setGrades(gradeItems);
        setClasses(Array.from(classSet));
        setTypes(Array.from(typeSet));
      } catch (err) {
        console.error('Error loading grades:', err);
        setError('Erreur lors du chargement des notes.');
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user?.teacher?.id]);

  const handleEditGrade = (gradeId: string, currentGrade: number | null) => {
    setEditingGrade(gradeId);
    setEditingValue(currentGrade?.toString() || '');
  };

  const handleSaveGrade = (gradeId: string) => {
    const target = grades.find((item) => item.id === gradeId);
    const maxAllowed = target?.maxGrade ?? 20;
    const newGrade = parseFloat(editingValue);
    if (!isNaN(newGrade) && newGrade >= 0 && newGrade <= maxAllowed) {
      setGrades(grades.map(g => 
        g.id === gradeId 
          ? { ...g, grade: newGrade, status: 'graded' as const }
          : g
      ));
    }
    setEditingGrade(null);
  };

  const stats = {
    totalGrades: grades.length,
    validatedGrades: grades.filter(g => g.status === 'validated').length,
    pendingGrades: grades.filter(g => g.status === 'pending').length,
    averageGrade: (() => {
      const graded = grades.filter(g => g.grade !== null && g.maxGrade > 0);
      if (graded.length === 0) return 0;
      const total = graded.reduce((sum, g) => sum + ((g.grade as number) / g.maxGrade) * 20, 0);
      return total / graded.length;
    })()
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher', { state: { scrollTo: 'teacher-grades' } })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Gestion des Notes</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              // Exporter les notes en CSV
              const headers = ['Élève', 'Classe', 'Matière', 'Note', 'Coefficient', 'Type', 'Date'];
              const csvContent = [
                headers,
                ...filteredGrades.map(g => [
                  g.studentName,
                  g.className,
                  g.subject,
                  g.grade !== null ? `${g.grade}/${g.maxGrade}` : '-',
                  g.coefficient,
                  g.type,
                  g.date
                ])
              ].map(row => row.join(',')).join('\n');
              const element = document.createElement('a');
              element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
              element.setAttribute('download', 'notes.csv');
              element.style.display = 'none';
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button 
            onClick={() => {
              // Ouvrir un dialogue pour importer
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv';
              input.style.display = 'none';
              document.body.appendChild(input);
              input.click();
              document.body.removeChild(input);
            }}
            className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Importer
          </button>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-5 h-5" />
            Ajouter une Note
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Total Notes</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.totalGrades}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Notes Validées</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.validatedGrades}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Notes En Attente</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.pendingGrades}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Moyenne Générale</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.averageGrade.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
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

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field appearance-none pr-10"
              >
                {classes.map(className => (
                  <option key={className} value={className}>
                    {className === 'all' ? 'Toutes les classes' : className}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field appearance-none pr-10"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'Tous les types' : getTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Liste des Notes ({filteredGrades.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-bg-secondary)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Élève
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Matière
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Note
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Coef.
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-[var(--color-bg-secondary)]">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--color-text-primary)]">{grade.studentName}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">{grade.className}</div>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.subject}</td>
                  <td className="px-6 py-4">
                    <span className="badge bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                      {getTypeLabel(grade.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingGrade === grade.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveGrade(grade.id);
                          }}
                          min="0"
                          max={grade.maxGrade}
                          step="0.5"
                          className="input-field w-20 py-1"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleSaveGrade(grade.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingGrade(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`font-medium ${
                        grade.grade === null ? 'text-[var(--color-text-muted)]' :
                        grade.grade >= 16 ? 'text-green-600' :
                        grade.grade >= 12 ? 'text-blue-600' :
                        grade.grade >= 10 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {grade.grade !== null ? grade.grade.toFixed(1) : '-'}/{grade.maxGrade}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.coefficient}</td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)]">{grade.date}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusColor(grade.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(grade.status)}
                      {grade.status === 'validated' ? 'Validé' : grade.status === 'graded' ? 'Noté' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditGrade(grade.id, grade.grade)}
                        className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-navy)] transition-colors"
                        disabled={editingGrade !== null}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[var(--color-text-secondary)] hover:text-green-600 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Grade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              Ajouter une Note
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Élève
                </label>
                <select className="input-field w-full">
                  <option>Sélectionner un élève</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Matière
                </label>
                <input type="text" className="input-field w-full" placeholder="Nom de la matière" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Note
                </label>
                <input type="number" className="input-field w-full" min="0" max="20" step="0.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Commentaire
                </label>
                <textarea className="input-field w-full" rows={3} placeholder="Commentaire (optionnel)" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                className="btn-primary flex-1"
                onClick={() => setShowAddModal(false)}
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </button>
              <button 
                className="btn-secondary flex-1"
                onClick={() => setShowAddModal(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default TeacherGrades;
