import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Calendar, ChevronLeft, Plus, Upload, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface ClassItem {
  id: string;
  name: string;
  mainTeacherId?: string;
  mainTeacher?: string;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface ScheduleRequest {
  id: string;
  courseId: string;
  classroom: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  semester: string;
  year: number;
  status: 'PENDING_APPROVAL' | 'REJECTED' | 'PUBLISHED';
  createdAt: string;
  rejectionReason?: string;
}

const currentYear = new Date().getFullYear();

const emptyScheduleForm = {
  classId: '',
  subjectId: '',
  classroom: '',
  dayOfWeek: '1',
  startTime: '08:00',
  endTime: '09:00',
  semester: 'S1',
  year: String(currentYear)
};

const AdminSchedules: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [summary, setSummary] = useState({ published: 0, classesCovered: 0, pending: 0 });
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSummary = async () => {
    try {
      const response = await api.get(API.SCHEDULES_SUMMARY);
      const data = response.data;
      setSummary(data.data || summary);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement du resume');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get(API.CLASSES);
      const data = response.data;
      const payload: any[] = Array.isArray(data) ? data : data.data || [];
      setClasses(
        payload.map((c: any) => ({
          id: String(c.id || ''),
          name: String(c.name || ''),
          mainTeacherId: c.mainTeacherId || undefined,
          mainTeacher: c.mainTeacher || ''
        })).filter((c) => c.id && c.name)
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des classes');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get(API.SUBJECTS);
      const data = response.data;
      const payload: any[] = Array.isArray(data) ? data : data.data || [];
      setSubjects(
        payload
          .map((s: any) => ({
            id: String(s.id || ''),
            code: String(s.code || ''),
            name: String(s.name || ''),
            isActive: s.isActive !== false
          }))
          .filter((s) => s.id && s.isActive)
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des matières');
    }
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const klass = classes.find((c) => c.id === scheduleForm.classId);
    if (!klass) {
      setError('Veuillez sélectionner une classe.');
      return;
    }
    const subject = subjects.find((s) => s.id === scheduleForm.subjectId);
    if (!subject) {
      setError('Veuillez sélectionner une matière.');
      return;
    }
    if (!klass.mainTeacherId) {
      setError("Cette classe n'a pas d'enseignant principal. Assignez-en un dans la page Classes avant de créer un horaire.");
      return;
    }
    if (!scheduleForm.classroom.trim()) {
      setError('Veuillez indiquer la salle.');
      return;
    }
    if (scheduleForm.startTime >= scheduleForm.endTime) {
      setError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }

    const payload = {
      classId: klass.id,
      subjectId: subject.id,
      classroom: scheduleForm.classroom.trim(),
      dayOfWeek: Number(scheduleForm.dayOfWeek),
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      semester: scheduleForm.semester,
      year: Number(scheduleForm.year)
    };

    try {
      setCreating(true);
      await api.post(API.SCHEDULES, payload);
      await Promise.all([fetchSummary(), fetchRequests()]);
      setSuccess(`Horaire créé pour ${klass.name} — ${subject.name}.`);
      setScheduleForm(emptyScheduleForm);
      setShowCreateModal(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.errors?.[0]?.msg ||
          err?.message ||
          "Erreur lors de la création de l'horaire"
      );
    } finally {
      setCreating(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === scheduleForm.classId);

  const fetchRequests = async () => {
    try {
      const response = await api.get(API.SCHEDULES_REQUESTS);
      const data = response.data;
      const payload = Array.isArray(data?.data) ? data.data : [];
      setRequests(payload);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des demandes');
    }
  };

  const reviewRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setError('');
      const reason = action === 'REJECT' ? (window.prompt('Motif du refus:') || '').trim() : undefined;
      if (action === 'REJECT' && !reason) {
        setError('Le motif de refus est requis.');
        return;
      }

      await api.patch(API.SCHEDULES_REQUEST_REVIEW(requestId), {
        action,
        reason
      });

      await Promise.all([fetchSummary(), fetchRequests()]);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du traitement de la demande');
    }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([fetchSummary(), fetchClasses(), fetchSubjects(), fetchRequests()]).finally(() => setLoading(false));
  }, []);

  const dayNames: Record<number, string> = {
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    7: 'Dimanche'
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'emplois-du-temps' } })}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Emplois du temps</h1>
              <p className="text-[var(--color-text-secondary)]">
                Publier, organiser et suivre les emplois du temps par classe
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Créer un horaire
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Importer un fichier
            </button>
          </div>

          {loading && (
            <div className="text-sm text-[var(--color-text-muted)]">Chargement des données...</div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Créer un nouvel horaire</h2>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 text-[var(--color-text-muted)]"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={createSchedule} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Classe *
                    </label>
                    <select
                      value={scheduleForm.classId}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, classId: e.target.value })}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map((klass) => (
                        <option key={klass.id} value={klass.id}>
                          {klass.name}
                          {klass.mainTeacher ? ` — ${klass.mainTeacher}` : ' (sans enseignant principal)'}
                        </option>
                      ))}
                    </select>
                    {classes.length === 0 && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Aucune classe disponible. Créez une classe d'abord.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Matière *
                    </label>
                    <select
                      value={scheduleForm.subjectId}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Sélectionner une matière</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.code} — {subject.name}
                        </option>
                      ))}
                    </select>
                    {subjects.length === 0 && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Aucune matière disponible. Créez une matière depuis « Gestion des matières ».
                      </p>
                    )}
                  </div>

                  {selectedClass && (
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">
                      <span className="text-[var(--color-text-secondary)]">Enseignant principal : </span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {selectedClass.mainTeacher || 'aucun'}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Salle *
                      </label>
                      <input
                        type="text"
                        value={scheduleForm.classroom}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, classroom: e.target.value })}
                        placeholder="Ex : Salle 12"
                        className="input-field w-full"
                        maxLength={50}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Jour *
                      </label>
                      <select
                        value={scheduleForm.dayOfWeek}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })}
                        className="input-field w-full"
                        required
                      >
                        {Object.entries(dayNames).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Heure début *
                      </label>
                      <input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Heure fin *
                      </label>
                      <input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Semestre *
                      </label>
                      <select
                        value={scheduleForm.semester}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, semester: e.target.value })}
                        className="input-field w-full"
                        required
                      >
                        <option value="S1">Semestre 1</option>
                        <option value="S2">Semestre 2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Année *
                      </label>
                      <input
                        type="number"
                        min={2020}
                        max={2100}
                        value={scheduleForm.year}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, year: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 btn-secondary"
                      disabled={creating}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-primary disabled:opacity-60"
                      disabled={creating}
                    >
                      {creating ? 'Création...' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <LayoutTemplate className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Horaires publiés</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.published}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Dernière mise à jour aujourd'hui</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Classes couvertes</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.classesCovered}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">CI à CM2</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <LayoutTemplate className="w-5 h-5 text-[var(--color-primary-navy)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">En attente</h3>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summary.pending}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Horaires à valider</p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Demandes en attente</h3>
            {requests.filter((item) => item.status === 'PENDING_APPROVAL').length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">Aucune demande en attente.</p>
            ) : (
              <div className="space-y-3">
                {requests
                  .filter((item) => item.status === 'PENDING_APPROVAL')
                  .map((item) => (
                    <div key={item.id} className="rounded-lg border border-[var(--color-border)] p-4">
                      <p className="font-medium text-[var(--color-text-primary)]">Cours: {item.courseId}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {dayNames[item.dayOfWeek] || 'Jour'} • {item.startTime} - {item.endTime} • Salle {item.classroom}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Semestre {item.semester} - {item.year}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => reviewRequest(item.id, 'APPROVE')}
                          className="btn-primary text-sm"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => reviewRequest(item.id, 'REJECT')}
                          className="btn-secondary text-sm"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSchedules;
