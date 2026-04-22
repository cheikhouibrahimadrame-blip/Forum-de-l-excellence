import type React from 'react';
import { useEffect, useState } from 'react';
import { Users, Search, Mail, Phone, FileText, TrendingUp, AlertCircle, CheckCircle, XCircle, ChevronDown, Eye, MessageSquare, Award } from 'lucide-react';
import { api } from '../../../lib/api';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  className?: string;
  level?: string;
  average?: number | null;
  attendance?: number | null;
  status: 'active' | 'warning' | 'excellent';
  parentEmail?: string;
  lastGrade?: string;
}

const TeacherStudents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<'student' | 'parent'>('student');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<string[]>(['all']);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/api/users', { params: { role: 'STUDENT', limit: 200 } });
        const result = response.data;
        const userItems = Array.isArray(result?.data?.users) ? result.data.users : [];

        const mapped = userItems.map((user: any) => {
          const gpa = typeof user.student?.gpa === 'number' ? user.student.gpa : null;
          let status: Student['status'] = 'active';
          if (gpa != null) {
            if (gpa >= 16) status = 'excellent';
            else if (gpa < 10) status = 'warning';
          }

          return {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            className: user.student?.major || '',
            level: user.student?.status || '',
            average: gpa,
            attendance: null,
            status,
            parentEmail: '',
            lastGrade: ''
          };
        });

        const classSet = new Set<string>();
        mapped.forEach((student: Student) => {
          if (student.className) classSet.add(student.className);
        });

        setStudents(mapped);
        setClasses(['all', ...Array.from(classSet).sort()]);
      } catch (err) {
        console.error('Erreur lors du chargement des eleves:', err);
        setError('Erreur lors du chargement des eleves.');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'active': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  const getAttendanceColor = (attendance?: number | null) => {
    if (attendance == null) return 'text-gray-400';
    if (attendance >= 90) return 'text-green-600';
    if (attendance >= 80) return 'text-blue-600';
    if (attendance >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleViewFile = () => {
    if (selectedStudent) {
      setShowFileModal(true);
    }
  };

  const handleContactStudent = () => {
    if (selectedStudent) {
      setContactType('student');
      setShowContactModal(true);
    }
  };

  const handleContactParent = () => {
    if (selectedStudent) {
      setContactType('parent');
      setShowContactModal(true);
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes eleves</h1>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher un eleve..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-64"
                />
              </div>
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
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-sm text-[var(--color-text-muted)]">Chargement des eleves...</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Students List */}
            <div className="lg:col-span-2">
              <div className="card overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)]">
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    Liste des eleves ({filteredStudents.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-bg-secondary)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                          Eleve
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                          Classe
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                          Moyenne
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                          Presence
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
                      {filteredStudents.map((student) => (
                        <tr 
                          key={student.id} 
                          className="hover:bg-[var(--color-bg-secondary)] cursor-pointer"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-[var(--color-text-primary)]">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-[var(--color-text-muted)]">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                            <div className="font-medium">{student.className}</div>
                            <div className="text-sm text-[var(--color-text-muted)]">{student.level}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <TrendingUp
                                className={`w-4 h-4 ${
                                  student.average == null
                                    ? 'text-gray-400'
                                    : student.average >= 14
                                      ? 'text-green-600'
                                      : student.average >= 12
                                        ? 'text-amber-600'
                                        : 'text-red-600'
                                }`}
                              />
                              <span className="font-medium text-[var(--color-text-primary)]">
                                {student.average == null ? '—' : student.average.toFixed(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${getAttendanceColor(student.attendance)}`}>
                              {student.attendance == null ? '—' : `${student.attendance}%`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`badge ${getStatusColor(student.status)} flex items-center gap-1 w-fit`}>
                              {getStatusIcon(student.status)}
                              {student.status === 'excellent' ? 'Excellent' : student.status === 'warning' ? 'Alerte' : 'Actif'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-navy)] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudent(student);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-[var(--color-text-secondary)] hover:text-green-600 transition-colors">
                                <Mail className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Student Details Panel */}
            <div className="lg:col-span-1">
              {selectedStudent ? (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Détails de l'élève
                    </h3>
                    <button 
                      onClick={() => setSelectedStudent(null)}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Student Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-primary-navy)] flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">{selectedStudent.email}</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 text-center">
                      <Award className="w-6 h-6 mx-auto mb-2 text-[var(--color-primary-navy)]" />
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedStudent.average}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">Moyenne</p>
                    </div>
                    <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 text-center">
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {selectedStudent.attendance == null ? '—' : `${selectedStudent.attendance}%`}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">Présence</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-medium text-[var(--color-text-primary)]">Contact</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <span className="text-[var(--color-text-secondary)]">{selectedStudent.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <span className="text-[var(--color-text-secondary)]">{selectedStudent.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <span className="text-[var(--color-text-secondary)]">Parent: {selectedStudent.parentEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Info */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-medium text-[var(--color-text-primary)]">Académique</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Classe:</span>
                        <span className="text-[var(--color-text-primary)]">{selectedStudent.className}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Niveau:</span>
                        <span className="text-[var(--color-text-primary)]">{selectedStudent.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Dernière note:</span>
                        <span className="text-[var(--color-text-primary)]">{selectedStudent.lastGrade}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button 
                      onClick={handleViewFile}
                      className="w-full btn-primary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <FileText className="w-4 h-4" />
                      Voir le Dossier
                    </button>
                    <button 
                      onClick={handleContactStudent}
                      className="w-full btn-secondary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <MessageSquare className="w-4 h-4" />
                      Contacter
                    </button>
                    <button 
                      onClick={handleContactParent}
                      className="w-full btn-secondary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <Mail className="w-4 h-4" />
                      Contacter le Parent
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card p-6 text-center">
                  <div className="w-16 h-16 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[var(--color-text-muted)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    Sélectionnez un élève
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
                    Cliquez sur un élève pour voir les détails
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* File Modal */}
          {showFileModal && selectedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="card p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    Dossier de {selectedStudent.firstName} {selectedStudent.lastName}
                  </h2>
                  <button 
                    onClick={() => setShowFileModal(false)}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    ?
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                      <p className="text-sm text-[var(--color-text-muted)]">Classe</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">{selectedStudent.className}</p>
                    </div>
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                      <p className="text-sm text-[var(--color-text-muted)]">Niveau</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">{selectedStudent.level}</p>
                    </div>
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                      <p className="text-sm text-[var(--color-text-muted)]">Moyenne</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">{selectedStudent.average}/20</p>
                    </div>
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                      <p className="text-sm text-[var(--color-text-muted)]">Présence</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {selectedStudent.attendance == null ? '—' : `${selectedStudent.attendance}%`}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">Dernière note</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{selectedStudent.lastGrade}</p>
                  </div>
                  <button 
                    onClick={() => setShowFileModal(false)}
                    className="w-full btn-primary">
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contact Modal */}
          {showContactModal && selectedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="card p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {contactType === 'student' ? "Contacter l'élève" : 'Contacter le parent'}
                  </h2>
                  <button 
                    onClick={() => setShowContactModal(false)}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    ?
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">Email</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {contactType === 'student' ? selectedStudent.email : selectedStudent.parentEmail}
                    </p>
                  </div>
                  <textarea 
                    placeholder="Écrivez votre message..."
                    className="input-field w-full h-32"
                  />
                  <div className="flex gap-3">
                    <button className="flex-1 btn-primary">
                      Envoyer
                    </button>
                    <button 
                      onClick={() => setShowContactModal(false)}
                      className="flex-1 btn-secondary">
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudents;
