import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Search, Download, Eye, FileText, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';
import { useLiveRefresh } from '../../../hooks/useLiveRefresh';

interface Lesson {
  id: string;
  title: string;
  subject: string;
  subjectColor: string;
  teacher: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  trimester: string;
}

const subjectColors: Record<string, string> = {
  Mathématiques: 'blue',
  Français: 'green',
  Sciences: 'purple',
  Anglais: 'indigo',
  Histoire: 'orange',
  'Histoire-Géographie': 'orange'
};

const StudentLessons: React.FC = () => {
  const { user } = useAuth();
  const refreshTick = useLiveRefresh(30000);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterTrimester, setFilterTrimester] = useState('ALL');
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLessons = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await api.get(API.HOMEWORK);
        const data = res.data;
        const items = Array.isArray(data?.data) ? data.data : [];

        const mappedLessons: Lesson[] = items.map((item: any) => {
          const teacherName = [item.teacher?.user?.firstName, item.teacher?.user?.lastName].filter(Boolean).join(' ').trim() || 'Enseignant';
          const fileUrl = item.attachmentUrl || '';
          const dueDate = item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const trimester = new Date(item.dueDate || new Date()).getMonth() < 3 ? 'Trimestre 1' : new Date(item.dueDate || new Date()).getMonth() < 6 ? 'Trimestre 2' : 'Trimestre 3';
          const subjectColor = subjectColors[item.subject] || 'blue';

          return {
            id: String(item.id),
            title: item.title || 'Leçon',
            subject: item.subject || 'Matière',
            subjectColor,
            teacher: teacherName,
            description: item.description || 'Ressource partagée par l’enseignant',
            fileUrl: fileUrl || '#',
            fileName: fileUrl ? fileUrl.split('/').pop() || `${item.title || 'lesson'}.pdf` : `${item.title || 'lesson'}.pdf`,
            fileSize: fileUrl ? 'Voir pièce jointe' : 'Sans fichier',
            uploadDate: dueDate,
            trimester
          };
        });

        setLessons(mappedLessons);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des leçons');
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [user?.student?.id, refreshTick]);

  const subjects = useMemo(() => ['ALL', ...Array.from(new Set(lessons.map((lesson) => lesson.subject)))], [lessons]);
  const trimesters = ['ALL', 'Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'ALL' || lesson.subject === filterSubject;
    const matchesTrimester = filterTrimester === 'ALL' || lesson.trimester === filterTrimester;
    return matchesSearch && matchesSubject && matchesTrimester;
  });

  const handleDownload = (lesson: Lesson) => {
    if (lesson.fileUrl && lesson.fileUrl !== '#') {
      window.open(lesson.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    alert(`Aucun fichier joint pour ${lesson.title}`);
  };

  const handleView = (lesson: Lesson) => {
    setViewingLesson(lesson);
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mes Leçons et Ressources</h1>
          <p className="text-gray-600 dark:text-gray-400">Consultez les ressources partagées par vos enseignants en temps réel</p>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">{error}</div>}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Ressources disponibles</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {lessons.length} ressource(s) trouvée(s) pour votre compte
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une ressource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {subjects.map((subject) => <option key={subject} value={subject}>{subject === 'ALL' ? 'Toutes les matières' : subject}</option>)}
            </select>

            <select value={filterTrimester} onChange={(e) => setFilterTrimester(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {trimesters.map((tri) => <option key={tri} value={tri}>{tri === 'ALL' ? 'Tous les trimestres' : tri}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLessons.map((lesson) => (
                <div key={lesson.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getColorClass(lesson.subjectColor)} mb-2`}>{lesson.subject}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{lesson.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.teacher}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{lesson.description}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <FileText size={14} />
                    <span className="truncate">{lesson.fileName}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{new Date(lesson.uploadDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <span>{lesson.fileSize}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleView(lesson)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg transition-colors">
                      <Eye size={16} /> Voir
                    </button>
                    <button onClick={() => handleDownload(lesson)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 rounded-lg transition-colors">
                      <Download size={16} /> Ouvrir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredLessons.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">Aucune ressource trouvée</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Aucun devoir ou document partagé ne correspond à vos filtres</p>
              </div>
            )}
          </>
        )}

        {viewingLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Détails de la ressource</h2>
                <button onClick={() => setViewingLesson(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getColorClass(viewingLesson.subjectColor)}`}>{viewingLesson.subject}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{viewingLesson.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Enseignant: {viewingLesson.teacher}</p>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{viewingLesson.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div><strong>Fichier:</strong> {viewingLesson.fileName}</div>
                  <div><strong>Publié le:</strong> {new Date(viewingLesson.uploadDate).toLocaleDateString('fr-FR')}</div>
                  <div><strong>Trimestre:</strong> {viewingLesson.trimester}</div>
                  <div><strong>Taille:</strong> {viewingLesson.fileSize}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLessons;
