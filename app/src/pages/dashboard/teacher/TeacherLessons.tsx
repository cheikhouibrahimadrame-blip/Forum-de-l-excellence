import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Search, X, Upload, Download, FileText, Calendar, BookOpen, Eye, Plus } from 'lucide-react';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';

interface Lesson {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  class: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  trimester: string;
  downloads: number;
}

const subjectColors: Record<string, string> = {
  Mathématiques: 'blue',
  Français: 'green',
  Sciences: 'purple',
  'Histoire-Géographie': 'orange',
  Anglais: 'indigo'
};

const TeacherLessons: React.FC = () => {
  const refreshTick = useLiveRefresh(30000);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterTrimester, setFilterTrimester] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ title: '', subject: 'Mathématiques', subjectColor: 'blue', class: 'CP-A', description: '', trimester: 'Trimestre 1', file: null as File | null });

  const loadLessons = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(API.HOMEWORK);
      const data = res.data;
      const items = Array.isArray(data?.data) ? data.data : [];

      const mappedLessons: Lesson[] = items.map((item: any) => {
        const subject = item.subject || 'Matière';
        const subjectColor = subjectColors[subject] || 'blue';
        const fileUrl = item.attachmentUrl || '';
        const dueDate = item.dueDate ? new Date(item.dueDate) : new Date();
        const trimester = dueDate.getMonth() < 3 ? 'Trimestre 1' : dueDate.getMonth() < 6 ? 'Trimestre 2' : 'Trimestre 3';

        return {
          id: String(item.id),
          title: item.title || 'Ressource',
          subject,
          subjectColor,
          class: item.course?.class?.name || item.course?.name || 'Tous',
          description: item.description || 'Ressource partagée via le backend',
          fileUrl: fileUrl || '#',
          fileName: fileUrl ? fileUrl.split('/').pop() || `${item.title || 'lesson'}.pdf` : `${item.title || 'lesson'}.pdf`,
          fileSize: fileUrl ? 'Voir pièce jointe' : 'Sans fichier',
          uploadDate: dueDate.toISOString().split('T')[0],
          trimester,
          downloads: Array.isArray(item.submissions) ? item.submissions.length : 0
        };
      });

      setLessons(mappedLessons);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des ressources');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [refreshTick]);

  const classes = useMemo(() => ['ALL', ...Array.from(new Set(lessons.map((lesson) => lesson.class)))], [lessons]);
  const subjects = useMemo(() => ['ALL', ...Array.from(new Set(lessons.map((lesson) => lesson.subject)))], [lessons]);
  const trimesters = ['ALL', 'Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) || lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'ALL' || lesson.class === filterClass;
    const matchesSubject = filterSubject === 'ALL' || lesson.subject === filterSubject;
    const matchesTrimester = filterTrimester === 'ALL' || lesson.trimester === filterTrimester;
    return matchesSearch && matchesClass && matchesSubject && matchesTrimester;
  });

  const handleAdd = () => {
    setEditingLesson(null);
    setFormData({ title: '', subject: 'Mathématiques', subjectColor: 'blue', class: 'CP-A', description: '', trimester: 'Trimestre 1', file: null });
    setShowModal(true);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({ title: lesson.title, subject: lesson.subject, subjectColor: lesson.subjectColor, class: lesson.class, description: lesson.description, trimester: lesson.trimester, file: null });
    setShowModal(true);
  };

  const handleView = (lesson: Lesson) => {
    setViewingLesson(lesson);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) return;
    try {
      await api.delete(API.HOMEWORK_ITEM(id));
      loadLessons();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la suppression');
    }
  };

  const handleDownload = (lesson: Lesson) => {
    if (lesson.fileUrl && lesson.fileUrl !== '#') {
      window.open(lesson.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    alert(`Aucun fichier joint pour ${lesson.title}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');
      const payload = {
        subject: formData.subject,
        title: formData.title,
        description: formData.description,
        dueDate: new Date().toISOString(),
        attachmentUrl: formData.file ? `/uploads/${formData.file.name}` : undefined
      };

      if (editingLesson) {
        await api.put(API.HOMEWORK_ITEM(editingLesson.id), payload);
      } else {
        await api.post(API.HOMEWORK_CREATE, payload);
      }

      setShowModal(false);
      loadLessons();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de l’enregistrement');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'subject') {
      const subject = subjectColors[value] || 'blue';
      setFormData((prev) => ({ ...prev, subject: value, subjectColor: subject }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Mes Ressources</h1>
              <p className="text-[var(--color-text-secondary)]">Leçons et devoirs synchronisés depuis le backend</p>
            </div>
            <button className="btn-primary flex items-center gap-2" onClick={handleAdd}>
              <Plus className="w-5 h-5" />
              Ajouter une ressource
            </button>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading && <div className="text-sm text-[var(--color-text-muted)]">Chargement des ressources...</div>}

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Rechercher une ressource..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {classes.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'Toutes les classes' : item}</option>)}
              </select>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {subjects.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'Toutes les matières' : item}</option>)}
              </select>
              <select value={filterTrimester} onChange={(e) => setFilterTrimester(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {trimesters.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'Tous les trimestres' : item}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mb-2">{lesson.subject}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{lesson.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.class}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{lesson.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3"><FileText size={14} /><span className="truncate">{lesson.fileName}</span></div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1"><Calendar size={14} /><span>{new Date(lesson.uploadDate).toLocaleDateString('fr-FR')}</span></div>
                  <span>{lesson.downloads} accès</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleView(lesson)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg transition-colors"><Eye size={16} /> Voir</button>
                  <button onClick={() => handleDownload(lesson)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 rounded-lg transition-colors"><Download size={16} /> Ouvrir</button>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => handleEdit(lesson)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(lesson.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          {!loading && filteredLessons.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">Aucune ressource trouvée</p>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingLesson ? 'Modifier la ressource' : 'Ajouter une ressource'}</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="Titre" className="input-field w-full" required />
                  <select name="subject" value={formData.subject} onChange={handleChange} className="input-field w-full">
                    {Object.keys(subjectColors).map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                  <input name="class" value={formData.class} onChange={handleChange} placeholder="Classe" className="input-field w-full" />
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="input-field w-full min-h-[120px]" />
                  <input type="file" onChange={handleFileChange} className="input-field w-full" />
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-2">Annuler</button>
                    <button type="submit" className="flex-1 btn-primary py-2 flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Enregistrer</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showViewModal && viewingLesson && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Détails de la ressource</h2>
                  <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div><span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">{viewingLesson.subject}</span></div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{viewingLesson.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">Classe: {viewingLesson.class}</p>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{viewingLesson.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div><strong>Fichier:</strong> {viewingLesson.fileName}</div>
                    <div><strong>Publié le:</strong> {new Date(viewingLesson.uploadDate).toLocaleDateString('fr-FR')}</div>
                    <div><strong>Trimestre:</strong> {viewingLesson.trimester}</div>
                    <div><strong>Accès:</strong> {viewingLesson.downloads}</div>
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

export default TeacherLessons;
