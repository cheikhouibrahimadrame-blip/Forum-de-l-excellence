import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Clock, FileText, MessageSquare, Plus, Edit, Eye, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/api';

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

const TeacherClasses: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Erreur lors du chargement des classes');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();

    return () => controller.abort();
  }, []);

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
      setShowAnnouncementsModal(true);
    }
  };

  const handleSchedule = () => {
    if (selectedClass) {
      navigate('/teacher/schedule');
    }
  };

  const handleEditClass = () => {
    if (selectedClass) {
      alert('Édition de la classe: ' + selectedClassData?.name);
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes Classes</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouvelle Classe
        </button>
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
                Notes - {selectedClassData.name}
              </h2>
              <button 
                onClick={() => setShowGradesModal(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                <p className="text-sm text-[var(--color-text-muted)] mb-2">Matière</p>
                <p className="font-semibold text-[var(--color-text-primary)]">{selectedClassData.subject}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-[var(--color-text-primary)]">Notes récentes</h3>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="text-sm text-[var(--color-text-secondary)]">Devoir 1: 18/20</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="text-sm text-[var(--color-text-secondary)]">Interrogation: 16/20</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="text-sm text-[var(--color-text-secondary)]">Examen: 17/20</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGradesModal(false)}
                className="w-full btn-primary">
                Fermer
              </button>
            </div>
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
              <textarea 
                placeholder="Nouvelle annonce..."
                className="input-field w-full h-24"
              />
              <div className="space-y-3">
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="font-semibold text-[var(--color-text-primary)] mb-1">Annonce 1</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Prochain devoir: mardi</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg">
                  <p className="font-semibold text-[var(--color-text-primary)] mb-1">Annonce 2</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Révision avant l'examen</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 btn-primary">
                  Publier
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
        </div>
      </div>
    </div>
  );
};

export default TeacherClasses;
