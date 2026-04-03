import type React from 'react';
import { useState } from 'react';
import { 
  Search,
  Download,
  Eye,
  FileText,
  Calendar,
  BookOpen
} from 'lucide-react';

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

const StudentLessons: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterTrimester, setFilterTrimester] = useState('ALL');
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);

  // Simulated lessons - in real app, fetched based on student's class
  const lessons: Lesson[] = [
    {
      id: '1',
      title: 'Les nombres de 0 à 100',
      subject: 'Mathématiques',
      subjectColor: 'blue',
      teacher: 'M. Sarr',
      description: 'Introduction aux nombres et comptage. Exercices pratiques inclus.',
      fileUrl: '/lessons/math-cp-nombres.pdf',
      fileName: 'math-cp-nombres.pdf',
      fileSize: '2.4 MB',
      uploadDate: '2025-09-15',
      trimester: 'Trimestre 1'
    },
    {
      id: '2',
      title: 'L\'alphabet et les voyelles',
      subject: 'Français',
      subjectColor: 'green',
      teacher: 'Mme Diop',
      description: 'Apprentissage des lettres et sons. Fiches d\'exercices.',
      fileUrl: '/lessons/francais-cp-alphabet.pdf',
      fileName: 'francais-cp-alphabet.pdf',
      fileSize: '3.1 MB',
      uploadDate: '2025-09-20',
      trimester: 'Trimestre 1'
    },
    {
      id: '3',
      title: 'Les animaux domestiques',
      subject: 'Sciences',
      subjectColor: 'purple',
      teacher: 'Mme Ndiaye',
      description: 'Découverte des animaux domestiques et leurs caractéristiques.',
      fileUrl: '/lessons/sciences-cp-animaux.pdf',
      fileName: 'sciences-cp-animaux.pdf',
      fileSize: '4.2 MB',
      uploadDate: '2025-10-01',
      trimester: 'Trimestre 1'
    },
    {
      id: '4',
      title: 'Les jours de la semaine',
      subject: 'Français',
      subjectColor: 'green',
      teacher: 'Mme Diop',
      description: 'Apprendre les jours de la semaine et se repérer dans le temps.',
      fileUrl: '/lessons/francais-cp-jours.pdf',
      fileName: 'francais-cp-jours.pdf',
      fileSize: '1.8 MB',
      uploadDate: '2025-10-05',
      trimester: 'Trimestre 1'
    },
    {
      id: '5',
      title: 'Addition simple',
      subject: 'Mathématiques',
      subjectColor: 'blue',
      teacher: 'M. Sarr',
      description: 'Introduction à l\'addition avec des nombres jusqu\'à 20.',
      fileUrl: '/lessons/math-cp-addition.pdf',
      fileName: 'math-cp-addition.pdf',
      fileSize: '2.1 MB',
      uploadDate: '2025-10-10',
      trimester: 'Trimestre 1'
    },
    {
      id: '6',
      title: 'Les couleurs en anglais',
      subject: 'Anglais',
      subjectColor: 'indigo',
      teacher: 'Mme Fall',
      description: 'Apprendre les couleurs en anglais avec images.',
      fileUrl: '/lessons/anglais-cp-couleurs.pdf',
      fileName: 'anglais-cp-couleurs.pdf',
      fileSize: '3.5 MB',
      uploadDate: '2025-10-12',
      trimester: 'Trimestre 1'
    },
  ];

  const subjects = ['ALL', 'Mathématiques', 'Français', 'Sciences', 'Anglais'];
  const trimesters = ['ALL', 'Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'ALL' || lesson.subject === filterSubject;
    const matchesTrimester = filterTrimester === 'ALL' || lesson.trimester === filterTrimester;
    return matchesSearch && matchesSubject && matchesTrimester;
  });

  const handleDownload = (lesson: Lesson) => {
    alert(`Téléchargement de ${lesson.fileName}`);
    // In real app: window.location.href = lesson.fileUrl;
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
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="section">
      <div className="section-content">
        {/* Header */}
        <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mes Leçons
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez et téléchargez les leçons partagées par vos enseignants
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Classe: CP-A</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {lessons.length} leçons disponibles pour cette année scolaire
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une leçon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
            />
          </div>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject === 'ALL' ? 'Toutes les matières' : subject}
              </option>
            ))}
          </select>

          <select
            value={filterTrimester}
            onChange={(e) => setFilterTrimester(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
          >
            {trimesters.map(tri => (
              <option key={tri} value={tri}>
                {tri === 'ALL' ? 'Tous les trimestres' : tri}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLessons.map((lesson) => (
          <div 
            key={lesson.id} 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getColorClass(lesson.subjectColor)} mb-2`}>
                  {lesson.subject}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {lesson.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lesson.teacher}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {lesson.description}
            </p>

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
              <button
                onClick={() => handleView(lesson)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 
                         dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 
                         rounded-lg transition-colors"
              >
                <Eye size={16} />
                Voir
              </button>
              <button
                onClick={() => handleDownload(lesson)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 
                         dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 
                         rounded-lg transition-colors"
              >
                <Download size={16} />
                Télécharger
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">Aucune leçon trouvée</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Vos enseignants n'ont pas encore partagé de leçons pour cette période
          </p>
        </div>
      )}

      {/* View Modal */}
      {viewingLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Détails de la leçon
              </h2>
              <button
                onClick={() => setViewingLesson(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getColorClass(viewingLesson.subjectColor)}`}>
                  {viewingLesson.subject}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {viewingLesson.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enseignant: {viewingLesson.teacher}
                </p>
              </div>

              {viewingLesson.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {viewingLesson.description}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Fichier</p>
                    <p className="text-gray-900 dark:text-white font-medium">{viewingLesson.fileName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Taille</p>
                    <p className="text-gray-900 dark:text-white font-medium">{viewingLesson.fileSize}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Date d'ajout</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(viewingLesson.uploadDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Trimestre</p>
                    <p className="text-gray-900 dark:text-white font-medium">{viewingLesson.trimester}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setViewingLesson(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                           text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                           dark:hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    handleDownload(viewingLesson);
                    setViewingLesson(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 
                           dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 
                           rounded-lg transition-colors"
                >
                  <Download size={20} />
                  Télécharger
                </button>
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
