import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Link as LinkIcon, ChevronLeft, UserPlus, UserCheck, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { logger } from '../../../lib/logger';
import { API } from '../../../lib/apiRoutes';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ParentStudentLink {
  id: string;
  parentName: string;
  parentEmail: string;
  students: string[];
  linkedDate?: string;
}

interface ParentStudentApiLink {
  id: string;
  parent: {
    id: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  student: {
    id: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

const AdminParentsStudents: React.FC = () => {
  const navigate = useNavigate();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showLinksTable, setShowLinksTable] = useState(false);
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [links, setLinks] = useState<ParentStudentLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState<string>('');

  const buildLinkGroups = (items: ParentStudentApiLink[]): ParentStudentLink[] => {
    const grouped = new Map<string, ParentStudentLink>();

    items.forEach((item) => {
      const parentUser = item.parent?.user;
      const studentUser = item.student?.user;
      if (!parentUser || !studentUser) return;

      const key = parentUser.id || item.parent.id;
      const existing = grouped.get(key);
      const studentName = `${studentUser.firstName} ${studentUser.lastName}`.trim();

      if (existing) {
        if (!existing.students.includes(studentName)) {
          existing.students.push(studentName);
        }
      } else {
        grouped.set(key, {
          id: key,
          parentName: `${parentUser.firstName} ${parentUser.lastName}`.trim(),
          parentEmail: parentUser.email,
          students: studentName ? [studentName] : []
        });
      }
    });

    return Array.from(grouped.values());
  };

  const fetchLinks = async () => {
    setLinksLoading(true);
    setLinksError('');
    try {
      const response = await api.get(API.PARENT_STUDENTS_ALL);
      const data = response.data;
      const items: ParentStudentApiLink[] = Array.isArray(data?.data?.links) ? data.data.links : [];
      setLinks(buildLinkGroups(items));
    } catch (error: any) {
      console.error('Erreur lors du chargement des liens:', error);
      setLinksError(error?.response?.data?.error || 'Erreur de connexion au serveur');
    } finally {
      setLinksLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get(API.USERS);
        const data = response.data;
        let usersList: User[] = [];

        if (Array.isArray(data)) {
          usersList = data;
        } else if (data.data && data.data.users) {
          usersList = data.data.users;
        } else if (data.users) {
          usersList = data.users;
        }

        const parentUsers = usersList.filter((u: User) => u.role === 'PARENT');
        const studentUsers = usersList.filter((u: User) => u.role === 'STUDENT');

        setParents(parentUsers);
        setStudents(studentUsers);

        if (parentUsers.length === 0 && studentUsers.length === 0) {
          setError('Aucun parent ou élève trouvé. Vérifiez que vous avez créé des utilisateurs avec les rôles PARENT et STUDENT.');
        } else if (parentUsers.length === 0) {
          setError('Aucun parent trouvé. Créez des comptes parents dans la section Utilisateurs.');
        } else if (studentUsers.length === 0) {
          setError('Aucun élève trouvé. Créez des comptes élèves dans la section Utilisateurs.');
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        setError(error?.response?.data?.error || 'Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    fetchLinks();
  }, []);

  const handleLinkParent = async () => {
    if (selectedParent && selectedStudents.length > 0) {
      try {
        const payload = {
          parentId: selectedParent,
          studentIds: selectedStudents
        };

        logger.log('[Link Parent] Request', {
          url: API.PARENT_STUDENTS,
          method: 'POST',
          body: payload
        });
        const response = await api.post(API.PARENT_STUDENTS, payload);
        const data = response.data;

        if (!data?.error) {
          const parent = parents.find(p => p.id.toString() === selectedParent);
          const studentNames = selectedStudents.map(sid => {
            const student = students.find(s => s.id.toString() === sid);
            return student ? `${student.firstName} ${student.lastName}` : '';
          }).filter(n => n);
          
          alert(`✅ Lien créé avec succès!\n${parent?.firstName} ${parent?.lastName} → ${studentNames.join(', ')}`);
          setShowLinkModal(false);
          setSelectedParent('');
          setSelectedStudents([]);
          fetchLinks();
        } else {
          alert(`❌ Erreur: ${data.error || 'Impossible de créer le lien'}`);
        }
      } catch (error: any) {
        console.error('Erreur lors de la création du lien:', error);
        alert(`❌ Erreur de connexion au serveur: ${error?.response?.data?.error || 'Erreur inconnue'}`);
      }
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'parents-eleves' } })}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Parents & Élèves</h1>
              <p className="text-[var(--color-text-secondary)]">
                Lier les comptes parents aux élèves et consulter les liens existants
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setShowLinkModal(true)} className="card p-5 text-left hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[var(--color-primary-navy)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Lier un parent à un élève</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Associer un ou plusieurs élèves à un compte parent.
              </p>
            </button>
            <button onClick={() => setShowLinksTable(!showLinksTable)} className="card p-5 text-left hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-[var(--color-primary-navy)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Voir les liens existants</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Consulter la liste des parents et des élèves liés.
              </p>
            </button>
          </div>

          {/* Links Table */}
          {showLinksTable && (
            <div className="card overflow-x-auto">
              {linksLoading ? (
                <div className="p-6 text-sm text-[var(--color-text-muted)]">Chargement des liens...</div>
              ) : linksError ? (
                <div className="p-6 text-sm text-red-600 dark:text-red-400">{linksError}</div>
              ) : links.length === 0 ? (
                <div className="p-6 text-sm text-[var(--color-text-muted)]">Aucun lien parent-élève trouvé.</div>
              ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)]">Parent</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)]">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)]">Élèves liés</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[var(--color-text-primary)]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {links.map(link => (
                    <tr key={link.id} className="hover:bg-[var(--color-bg-secondary)]">
                      <td className="px-6 py-3 text-sm text-[var(--color-text-primary)]">{link.parentName}</td>
                      <td className="px-6 py-3 text-sm text-[var(--color-text-secondary)]">{link.parentEmail}</td>
                      <td className="px-6 py-3 text-sm text-[var(--color-text-primary)]">{link.students.join(', ')}</td>
                      <td className="px-6 py-3 text-sm text-[var(--color-text-secondary)]">{link.linkedDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {/* Link Modal */}
          {showLinkModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Lier un parent à un élève</h2>
                  <button onClick={() => setShowLinkModal(false)} className="p-1 text-[var(--color-text-muted)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Parent {!loading && `(${parents.length} disponible${parents.length > 1 ? 's' : ''})`}
                    </label>
                    {loading ? (
                      <p className="text-sm text-[var(--color-text-muted)]">Chargement...</p>
                    ) : parents.length === 0 ? (
                      <p className="text-sm text-red-600 dark:text-red-400">Aucun parent disponible. Créez des comptes parents d'abord.</p>
                    ) : (
                      <select 
                        value={selectedParent} 
                        onChange={(e) => setSelectedParent(e.target.value)}
                        className="input-field w-full"
                      >
                        <option value="">Sélectionner un parent</option>
                        {parents.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName} ({p.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Élèves {!loading && `(${students.length} disponible${students.length > 1 ? 's' : ''})`}
                    </label>
                    {loading ? (
                      <p className="text-sm text-[var(--color-text-muted)]">Chargement...</p>
                    ) : students.length === 0 ? (
                      <p className="text-sm text-red-600 dark:text-red-400">Aucun élève disponible. Créez des comptes élèves d'abord.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3">
                        {students.map(student => (
                          <label key={student.id} className="flex items-center gap-2 text-[var(--color-text-primary)]">
                            <input 
                              type="checkbox" 
                              checked={selectedStudents.includes(student.id.toString())}
                              onChange={(e) => {
                                const studentId = student.id.toString();
                                if (e.target.checked) {
                                  setSelectedStudents([...selectedStudents, studentId]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(s => s !== studentId));
                                }
                              }}
                              className="rounded"
                            />
                            {student.firstName} {student.lastName} ({student.email})
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleLinkParent} 
                    className="w-full btn-primary mt-4"
                    disabled={!selectedParent || selectedStudents.length === 0 || loading}
                  >
                    Créer le lien
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Parents enregistrés</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{parents.length}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Comptes actifs</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Élèves liés</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {links.reduce((total, link) => total + link.students.length, 0)}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">Liens actifs</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <LinkIcon className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Multi-élèves</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {links.filter(link => link.students.length > 1).length}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">Parents avec 2+ élèves</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminParentsStudents;
