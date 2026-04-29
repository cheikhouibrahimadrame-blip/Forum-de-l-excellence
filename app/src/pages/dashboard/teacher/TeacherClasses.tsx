import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Clock, FileText, MessageSquare, Edit, Eye, CheckCircle, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { api } from '../../../lib/api';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';

interface Class {
  id: string;
  name: string;
  subject?: string;
  program?: string;
  level?: string;
  students?: number;
  attendance?: number;
  schedule?: string;
  classroom?: string;
  semester?: string;
  status?: 'active' | 'completed' | 'upcoming';
  nextSession?: string;
}

interface ClassNotesSummary {
  average: number;
  notesCount: number;
  coursesCount: number;
  studentsCount: number;
  gradedStudentsCount: number;
  coverage: number;
  mastery: string;
  remark: string;
  trend: string;
  lastGradeDate?: string | null;
  topCourse?: {
    courseId: string;
    courseName: string;
    courseCode: string;
    average: number;
    notesCount: number;
  } | null;
}

const TeacherClasses: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [notesSummary, setNotesSummary] = useState<ClassNotesSummary | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const refreshTick = useLiveRefresh(15000);

  const getReadableError = (err: any, fallback: string) => {
    const status = err?.status ?? err?.response?.status;
    const backendMessage = err?.data?.error || err?.data?.message || err?.response?.data?.error || err?.response?.data?.message;
    const message = String(err?.message || '').toLowerCase();
    const code = err?.code;
    const name = err?.name;

    if (name === 'AbortError' || name === 'CanceledError' || code === 'ERR_CANCELED' || message === 'canceled') {
      return '';
    }

    if (status === 401) {
      return 'Session expiree. Veuillez vous reconnecter.';
    }

    if (status === 403) {
      return 'Acces refuse pour cette action.';
    }

    return backendMessage || err?.message || fallback;
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchClasses = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/classes', { signal: controller.signal });
        const data = response.data;
        const payload = Array.isArray(data) ? data : data.data || [];
        setClasses(payload);
      } catch (err: any) {
        const message = getReadableError(err, 'Erreur lors du chargement des classes');
        if (message) setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();

    return () => controller.abort();
  }, [refreshTick]);

  const selectedClassData = classes.find(c => c.id === selectedClass);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'En Cours';
      case 'completed': return 'Terminé';
      case 'upcoming': return 'À Venir';
      default: return 'Non défini';
    }
  };

  const handleViewGrades = () => {
    if (selectedClass) {
      setShowGradesModal(true);
    }
  };

  const handleAnnouncements = () => {
    if (selectedClass) {
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementError('');
      setAnnouncementSuccess('');
      setShowAnnouncementsModal(true);
    }
  };

  const handlePublishAnnouncement = async () => {
    if (!selectedClassData) return;

    if (!announcementTitle.trim() || !announcementContent.trim()) {
      setAnnouncementError('Veuillez renseigner un titre et un contenu.');
      return;
    }

    try {
      setAnnouncementLoading(true);
      setAnnouncementError('');
      setAnnouncementSuccess('');

      const response = await api.post(`/api/classes/${selectedClassData.id}/announce`, {
        title: announcementTitle.trim(),
        content: announcementContent.trim()
      });

      const recipients = response.data?.data?.recipients;
      setAnnouncementSuccess(
        `Annonce publiée (${recipients?.total ?? 0} destinataires: ${recipients?.students ?? 0} élèves, ${recipients?.parents ?? 0} parents).`
      );
      setAnnouncementContent('');
    } catch (err: any) {
      const message = getReadableError(err, 'Erreur lors de la publication de l\'annonce');
      if (message) setAnnouncementError(message);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleSchedule = () => {
    if (selectedClass) {
      navigate('/teacher/schedule');
    }
  };

  const handleEditClass = () => {
    if (selectedClass) {
      setEditTitle(selectedClassData?.name || '');
      setEditCapacity(String(selectedClassData?.students ?? ''));
      setEditError('');
      setEditSuccess('');
      setShowEditModal(true);
    }
  };

  const handleSaveClass = async () => {
    if (!selectedClassData) return;

    const capacityValue = Number(editCapacity);
    if (!editTitle.trim() || !Number.isFinite(capacityValue) || capacityValue <= 0) {
      setEditError('Veuillez renseigner un nom de classe et une capacité valide.');
      return;
    }

    try {
      setEditLoading(true);
      setEditError('');
      setEditSuccess('');

      await api.put(`/api/classes/${selectedClassData.id}`, {
        name: editTitle.trim(),
        capacity: capacityValue
      });

      setEditSuccess('Informations générales de la classe mises à jour.');
      setShowEditModal(false);
      setClasses((prev) => prev.map((item) => item.id === selectedClassData.id ? { ...item, name: editTitle.trim(), students: item.students } : item));
    } catch (err: any) {
      const message = getReadableError(err, 'Erreur lors de la mise à jour de la classe');
      if (message) setEditError(message);
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const loadNotesSummary = async () => {
      if (!showGradesModal || !selectedClass) {
        return;
      }

      const controller = new AbortController();
      setNotesLoading(true);
      setNotesError('');

      try {
        const response = await api.get(`/api/classes/${selectedClass}/notes-summary`, { signal: controller.signal });
        const payload = response.data?.data;

        setNotesSummary({
          average: Number(payload?.average || 0),
          notesCount: Number(payload?.notesCount || 0),
          coursesCount: Number(payload?.coursesCount || 0),
          studentsCount: Number(payload?.studentsCount || 0),
          gradedStudentsCount: Number(payload?.gradedStudentsCount || 0),
          coverage: Number(payload?.coverage || 0),
          mastery: payload?.mastery || 'En consolidation',
          remark: payload?.remark || '',
          trend: payload?.trend || 'Stable',
          lastGradeDate: payload?.lastGradeDate || null,
          topCourse: payload?.topCourse || null
        });
      } catch (err: any) {
        const message = getReadableError(err, 'Erreur lors du chargement des notes générales');
        if (message) {
          setNotesError(message);
        }
        setNotesSummary(null);
      } finally {
        setNotesLoading(false);
      }

      return () => controller.abort();
    };

    loadNotesSummary();
  }, [showGradesModal, selectedClass]);

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes Classes</h1>
      </div>

      {loading && (
        <div className="text-sm text-[var(--color-text-muted)]">Chargement des classes...</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes List */}
        <div className="lg:col-span-2">
          {!loading && classes.length === 0 && (
            <div className="card p-6 text-center text-sm text-[var(--color-text-secondary)]">
              Aucune classe principale assignee pour le moment.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((classItem) => (
              <div 
                key={classItem.id}
                className={`card p-6 cursor-pointer transition-all ${
                  selectedClass === classItem.id ? 'ring-2 ring-[var(--color-primary-navy)]' : ''
                }`}
                onClick={() => setSelectedClass(classItem.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[var(--color-primary-gold)]" />
                  </div>
                  <span className={`badge ${getStatusColor(classItem.status)}`}>
                    {getStatusText(classItem.status)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  {classItem.name}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  {classItem.program || 'Programme non défini'} • {classItem.level || 'Niveau non défini'}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                      <Users className="w-4 h-4" /> Élèves
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">{classItem.students ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Horaire
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">{classItem.schedule || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Salle</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{classItem.classroom || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Prochaine séance: {classItem.nextSession || '-'}
                  </span>
                  <button className="p-2 text-[var(--color-primary-navy)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Class Details Panel */}
        <div className="lg:col-span-1">
          {selectedClassData ? (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
                {selectedClassData.name}
              </h3>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-[var(--color-primary-navy)]" />
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedClassData.students ?? '-'}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Élèves</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {selectedClassData.attendance ?? '-'}
                    {selectedClassData.attendance != null ? '%' : ''}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Présence</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 mb-6">
                <button 
                  onClick={handleViewGrades}
                  className="w-full btn-primary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <FileText className="w-4 h-4" />
                  Voir les Notes
                </button>
                <button 
                  onClick={handleAnnouncements}
                  className="w-full btn-secondary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <MessageSquare className="w-4 h-4" />
                  Annonces
                </button>
                <button 
                  onClick={handleSchedule}
                  className="w-full btn-secondary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Calendar className="w-4 h-4" />
                  Planning
                </button>
              </div>

              {/* Class Info */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-medium text-[var(--color-text-primary)]">Informations</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Matière:</span>
                    <span className="text-[var(--color-text-primary)]">{selectedClassData.subject || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Programme:</span>
                    <span className="text-[var(--color-text-primary)]">{selectedClassData.program || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Niveau:</span>
                    <span className="text-[var(--color-text-primary)]">{selectedClassData.level || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Semestre:</span>
                    <span className="text-[var(--color-text-primary)]">{selectedClassData.semester || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="pt-4 border-t border-[var(--color-border)] mt-4">
                <button 
                  onClick={handleEditClass}
                  className="w-full btn-secondary flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Edit className="w-4 h-4" />
                  Modifier la Classe
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <div className="w-16 h-16 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Sélectionnez une Classe
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Cliquez sur une classe pour voir les détails
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grades Modal */}
      {showGradesModal && selectedClassData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Notes générales - {selectedClassData.name}
              </h2>
              <button 
                onClick={() => setShowGradesModal(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>
            {notesLoading && (
              <div className="text-sm text-[var(--color-text-muted)]">Chargement des notes générales...</div>
            )}
            {notesError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {notesError}
              </div>
            )}
            {!notesLoading && notesSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)] text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Moyenne de classe
                  </div>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{notesSummary.average}/20</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)] text-sm">
                    <BarChart3 className="w-4 h-4" />
                    Notes enregistrées
                  </div>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{notesSummary.notesCount}</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-[var(--color-text-muted)] text-sm">
                    <Award className="w-4 h-4" />
                    Maîtrise
                  </div>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)]">{notesSummary.mastery}</p>
                </div>
              </div>

              <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Tendance globale</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{notesSummary.trend}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Cours actifs</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{notesSummary.coursesCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Couverture</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{notesSummary.coverage}%</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-6">{notesSummary.remark}</p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-6">
                  Cette fenêtre présente uniquement une synthèse générale de la classe. Les notes détaillées par élève restent réservées à l’écran de gestion des notes.
                </p>
                {notesSummary.topCourse && (
                  <div className="bg-white/60 dark:bg-black/10 rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Cours le plus performant</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {notesSummary.topCourse.courseName} ({notesSummary.topCourse.courseCode})
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Moyenne: {notesSummary.topCourse.average}/20 · Notes: {notesSummary.topCourse.notesCount}
                    </p>
                  </div>
                )}
                {notesSummary.lastGradeDate && (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Dernière note enregistrée: {new Date(notesSummary.lastGradeDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setShowGradesModal(false)}
                className="w-full btn-primary">
                Fermer
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Announcements Modal */}
      {showAnnouncementsModal && selectedClassData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Annonces - {selectedClassData.name}
              </h2>
              <button 
                onClick={() => setShowAnnouncementsModal(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Titre de l'annonce"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="input-field w-full"
              />
              <textarea 
                placeholder="Nouvelle annonce..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                className="input-field w-full h-24"
              />
              {announcementError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {announcementError}
                </div>
              )}
              {announcementSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {announcementSuccess}
                </div>
              )}
              <div className="space-y-3">
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="font-semibold text-[var(--color-text-primary)] mb-1">Diffusion automatique</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">La publication notifie les élèves de la classe et leurs parents liés.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePublishAnnouncement}
                  disabled={announcementLoading}
                  className="flex-1 btn-primary disabled:opacity-60"
                >
                  {announcementLoading ? 'Publication...' : 'Publier'}
                </button>
                <button 
                  onClick={() => setShowAnnouncementsModal(false)}
                  className="flex-1 btn-secondary">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedClassData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Modifier la Classe
              </h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Nom de classe</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field w-full"
                  placeholder="Nom de la classe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Capacité</label>
                <input
                  type="number"
                  min="1"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="input-field w-full"
                  placeholder="Capacité"
                />
              </div>
              <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg text-sm text-[var(--color-text-secondary)] space-y-1">
                <p>Non modifiable ici: niveau, semestre, année scolaire, affectation enseignant principal.</p>
                <p>Seules les informations générales de la classe sont autorisées pour le professeur.</p>
              </div>
              {editError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</div>
              )}
              {editSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{editSuccess}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 btn-primary disabled:opacity-60" onClick={handleSaveClass} disabled={editLoading}>
                  {editLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button className="flex-1 btn-secondary" onClick={() => setShowEditModal(false)}>
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

export default TeacherClasses;
