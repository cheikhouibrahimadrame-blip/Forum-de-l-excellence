import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, TrendingUp, Calendar, FileText, MessageSquare, Mail, Phone, Eye, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/api';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  className?: string;
  program?: string;
  average?: number | null;
  attendance?: number | null;
  teacher?: string;
  teacherEmail?: string;
  status?: 'excellent' | 'good' | 'warning';
  recentGrade?: string;
  nextExam?: string;
  absences?: number | null;
  tardiness?: number | null;
}

const ParentChildren: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchChildren = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/parent-students/my-students');
        const data = response.data;
        const payload = data?.data?.students || data?.data || [];
        const normalized: Child[] = payload.map((item: any) => {
          const student = item.student || item;
          const user = student.user || item.user || {};
          const classInfo = student.class || {};
          const teacherUser = classInfo.mainTeacher?.user || {};

          return {
            id: String(student.id || item.id || ''),
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            className: classInfo.name,
            program: student.program,
            average: student.average ?? null,
            attendance: student.attendance ?? null,
            teacher: teacherUser.firstName ? `${teacherUser.firstName} ${teacherUser.lastName || ''}`.trim() : undefined,
            teacherEmail: teacherUser.email,
            status: student.status,
            recentGrade: student.recentGrade,
            nextExam: student.nextExam,
            absences: student.absences ?? null,
            tardiness: student.tardiness ?? null
          };
        });

        setChildren(normalized);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Erreur lors du chargement des enfants');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();

    return () => controller.abort();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'excellent': return <Award className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'warning': return 'Attention';
      default: return 'Non défini';
    }
  };
  const handleViewBulletin = () => {
    if (selectedChild) {
      setShowBulletinModal(true);
    }
  };

  const handleContactTeacher = () => {
    if (selectedChild) {
      setShowContactModal(true);
    }
  };

  const handleAppointment = () => {
    if (selectedChild) {
      navigate('/parent/appointments');
    }
  };
  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes Enfants</h1>
      </div>

      {loading && (
        <div className="text-sm text-[var(--color-text-muted)]">Chargement des enfants...</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Children List */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <div 
                key={child.id}
                className={`card p-6 cursor-pointer transition-all hover:shadow-lg ${
                  selectedChild?.id === child.id ? 'ring-2 ring-[var(--color-primary-navy)]' : ''
                }`}
                onClick={() => setSelectedChild(child)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-primary-navy)] flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {child.firstName[0]}{child.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)]">{child.className || '-'}</p>
                    </div>
                  </div>
                  {child.status ? (
                    <span className={`badge ${getStatusColor(child.status)} flex items-center gap-1`}>
                      {getStatusIcon(child.status)}
                      {getStatusText(child.status)}
                    </span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-800">Non défini</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-[var(--color-primary-navy)]" />
                    <p className="text-lg font-bold text-[var(--color-text-primary)]">
                      {child.average ?? '-'}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Moyenne</p>
                  </div>
                  <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <p className="text-lg font-bold text-[var(--color-text-primary)]">
                      {child.attendance ?? '-'}{child.attendance != null ? '%' : ''}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Présence</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Programme:</span>
                    <span className="text-[var(--color-text-primary)]">{child.program || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Enseignant:</span>
                    <span className="text-[var(--color-text-primary)]">{child.teacher || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Dernière note:</span>
                    <span className="text-[var(--color-text-primary)]">{child.recentGrade || '-'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                  <button className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" />
                    Voir
                  </button>
                  <button className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Child Details Panel */}
        <div className="lg:col-span-1">
          {selectedChild ? (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Détails
                </h3>
                <button 
                  onClick={() => setSelectedChild(null)}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <Users className="w-5 h-5" />
                </button>
              </div>

              {/* Child Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-[var(--color-primary-navy)] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {selectedChild.firstName[0]}{selectedChild.lastName[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    {selectedChild.firstName} {selectedChild.lastName}
                  </h4>
                  <p className="text-[var(--color-text-secondary)]">{selectedChild.className || '-'}</p>
                    {selectedChild.status ? (
                      <span className={`badge ${getStatusColor(selectedChild.status)} mt-1`}>
                        {getStatusText(selectedChild.status)}
                      </span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-800 mt-1">Non défini</span>
                    )}
                </div>
              </div>

              {/* Academic Performance */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-[var(--color-text-primary)]">Performance Académique</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 text-center">
                    <Award className="w-8 h-8 mx-auto mb-2 text-[var(--color-primary-navy)]" />
                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">{selectedChild.average ?? '-'}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Moyenne générale</p>
                  </div>
                  <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                      {selectedChild.attendance ?? '-'}{selectedChild.attendance != null ? '%' : ''}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Taux de présence</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-[var(--color-text-primary)]">Activité Récente</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{selectedChild.recentGrade || '-'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Note la plus récente</p>
                    </div>
                    <FileText className="w-5 h-5 text-[var(--color-primary-navy)]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{selectedChild.nextExam || '-'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Prochain examen</p>
                    </div>
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-[var(--color-text-primary)]">Assiduité</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">Absences</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{selectedChild.absences} jours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">Retards</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{selectedChild.tardiness} fois</span>
                  </div>
                </div>
              </div>

              {/* Contact Teacher */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-[var(--color-text-primary)]">Contact Enseignant</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-[var(--color-text-secondary)]">{selectedChild.teacher}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-[var(--color-text-secondary)]">{selectedChild.teacherEmail}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button 
                  onClick={handleViewBulletin}
                  className="w-full btn-primary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <FileText className="w-4 h-4" />
                  Voir le Bulletin
                </button>
                <button 
                  onClick={handleContactTeacher}
                  className="w-full btn-secondary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <MessageSquare className="w-4 h-4" />
                  Contacter l'Enseignant
                </button>
                <button 
                  onClick={handleAppointment}
                  className="w-full btn-secondary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Phone className="w-4 h-4" />
                  Prendre un Rendez-vous
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <div className="w-16 h-16 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Sélectionnez un Enfant
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Cliquez sur un enfant pour voir les détails
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bulletin Modal */}
      {showBulletinModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Bulletin - {selectedChild.firstName} {selectedChild.lastName}
              </h2>
              <button 
                onClick={() => setShowBulletinModal(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="text-sm text-[var(--color-text-muted)]">Classe</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{selectedChild.className}</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="text-sm text-[var(--color-text-muted)]">Moyenne Générale</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{selectedChild.average}/20</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="text-sm text-[var(--color-text-muted)]">Présence</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{selectedChild.attendance}%</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="text-sm text-[var(--color-text-muted)]">Dernière Note</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{selectedChild.recentGrade}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBulletinModal(false)}
                className="w-full btn-primary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Teacher Modal */}
      {showContactModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Contacter {selectedChild.teacher}
              </h2>
              <button 
                onClick={() => setShowContactModal(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                <p className="text-sm text-[var(--color-text-muted)] mb-2">Email</p>
                <p className="font-semibold text-[var(--color-text-primary)]">{selectedChild.teacherEmail}</p>
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

export default ParentChildren;
