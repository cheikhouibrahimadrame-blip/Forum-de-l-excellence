import type React from 'react';
import { useState } from 'react';
import { 
  Pencil, 
  Trash2, 
  Search,
  X,
  Upload,
  Download,
  FileText,
  Calendar,
  BookOpen,
  Eye
} from 'lucide-react';

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

const TeacherLessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: '1',
      title: 'Les nombres de 0 à 100',
      subject: 'Mathématiques',
      subjectColor: 'blue',
      class: 'CP-A',
      description: 'Introduction aux nombres et comptage',
      fileUrl: '/lessons/math-cp-nombres.pdf',
      fileName: 'math-cp-nombres.pdf',
      fileSize: '2.4 MB',
      uploadDate: '2025-09-15',
      trimester: 'Trimestre 1',
      downloads: 28
    },
    {
      id: '2',
      title: 'L\'alphabet et les voyelles',
      subject: 'Français',
      subjectColor: 'green',
      class: 'CP-A',
      description: 'Apprentissage des lettres et sons',
      fileUrl: '/lessons/francais-cp-alphabet.pdf',
      fileName: 'francais-cp-alphabet.pdf',
      fileSize: '3.1 MB',
      uploadDate: '2025-09-20',
      trimester: 'Trimestre 1',
      downloads: 30
    },
    {
      id: '3',
      title: 'Les saisons',
      subject: 'Sciences',
      subjectColor: 'purple',
      class: 'CE1-A',
      description: 'Découverte des 4 saisons',
      fileUrl: '/lessons/sciences-ce1-saisons.pdf',
      fileName: 'sciences-ce1-saisons.pdf',
      fileSize: '5.2 MB',
      uploadDate: '2025-10-01',
      trimester: 'Trimestre 1',
      downloads: 25
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterTrimester, setFilterTrimester] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Mathématiques',
    subjectColor: 'blue',
    class: 'CP-A',
    description: '',
    trimester: 'Trimestre 1',
    file: null as File | null
  });

  const classes = ['CP-A', 'CP-B', 'CE1-A', 'CE1-B', 'CE2-A', 'CM1-A', 'CM2-A'];
  const subjects = [
    { name: 'Mathématiques', color: 'blue' },
    { name: 'Français', color: 'green' },
    { name: 'Sciences', color: 'purple' },
    { name: 'Histoire-Géographie', color: 'orange' },
    { name: 'Anglais', color: 'indigo' },
  ];
  const trimesters = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'ALL' || lesson.class === filterClass;
    const matchesSubject = filterSubject === 'ALL' || lesson.subject === filterSubject;
    const matchesTrimester = filterTrimester === 'ALL' || lesson.trimester === filterTrimester;
    return matchesSearch && matchesClass && matchesSubject && matchesTrimester;
  });

  const handleAdd = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      subject: 'Mathématiques',
      subjectColor: 'blue',
      class: 'CP-A',
      description: '',
      trimester: 'Trimestre 1',
      file: null
    });
    setShowModal(true);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      subject: lesson.subject,
      subjectColor: lesson.subjectColor,
      class: lesson.class,
      description: lesson.description,
      trimester: lesson.trimester,
      file: null
    });
    setShowModal(true);
  };

  const handleView = (lesson: Lesson) => {
    setViewingLesson(lesson);
    setShowViewModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette leçon ? Les élèves n\'y auront plus accès.')) {
      setLessons(lessons.filter(l => l.id !== id));
    }
  };

  const handleDownload = (lesson: Lesson) => {
    // Simulate download
    alert(`Téléchargement de ${lesson.fileName}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLesson) {
      setLessons(lessons.map(l => 
        l.id === editingLesson.id 
          ? { 
              ...l, 
              title: formData.title,
              subject: formData.subject,
              subjectColor: formData.subjectColor,
              class: formData.class,
              description: formData.description,
              trimester: formData.trimester,
              fileName: formData.file ? formData.file.name : l.fileName,
              fileSize: formData.file ? `${(formData.file.size / 1024 / 1024).toFixed(1)} MB` : l.fileSize
            } 
          : l
      ));
    } else {
      if (!formData.file) {
        alert('Veuillez sélectionner un fichier');
        return;
      }

      const newLesson: Lesson = {
        id: Date.now().toString(),
        title: formData.title,
        subject: formData.subject,
        subjectColor: formData.subjectColor,
        class: formData.class,
        description: formData.description,
        fileUrl: `/lessons/${formData.file.name}`,
        fileName: formData.file.name,
        fileSize: `${(formData.file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        trimester: formData.trimester,
        downloads: 0
      };
      setLessons([...lessons, newLesson]);
    }

    setShowModal(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'subject') {
      const subject = subjects.find(s => s.name === value);
      setFormData(prev => ({
        ...prev,
        subject: value,
        subjectColor: subject?.color || 'blue'
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
          Gérez les leçons pour vos classes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Leçons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{lessons.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Download className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Téléchargements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {lessons.reduce((sum, l) => sum + l.downloads, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ce mois</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {lessons.filter(l => new Date(l.uploadDate).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FileText className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taille totale</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {lessons.reduce((sum, l) => sum + parseFloat(l.fileSize), 0).toFixed(1)} MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col gap-4">
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

            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                       text-white rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload size={20} />
              Ajouter une leçon
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
            >
              <option value="ALL">Toutes les classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
            >
              <option value="ALL">Toutes les matières</option>
              {subjects.map(subject => (
                <option key={subject.name} value={subject.name}>{subject.name}</option>
              ))}
            </select>

            <select
              value={filterTrimester}
              onChange={(e) => setFilterTrimester(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
            >
              <option value="ALL">Tous les trimesters</option>
              {trimesters.map(tri => (
                <option key={tri} value={tri}>{tri}</option>
              ))}
            </select>
          </div>
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
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{lesson.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.class}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {lesson.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <FileText size={14} />
              <span>{lesson.fileName}</span>
              <span>•</span>
              <span>{lesson.fileSize}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span>{new Date(lesson.uploadDate).toLocaleDateString('fr-FR')}</span>
              <span>{lesson.downloads} téléchargements</span>
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

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleEdit(lesson)}
                className="flex-1 p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Modifier"
              >
                <Pencil size={16} className="mx-auto" />
              </button>
              <button
                onClick={() => handleDelete(lesson.id)}
                className="flex-1 p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 size={16} className="mx-auto" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">Aucune leçon trouvée</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingLesson ? 'Modifier la leçon' : 'Ajouter une leçon'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Les nombres de 0 à 100"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Matière *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                >
                  {subjects.map(subject => (
                    <option key={subject.name} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Classe *
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trimestre *
                </label>
                <select
                  name="trimester"
                  value={formData.trimester}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                >
                  {trimesters.map(tri => (
                    <option key={tri} value={tri}>{tri}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description de la leçon"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fichier {!editingLesson && '*'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={handleFileChange}
                  required={!editingLesson}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Formats acceptés: PDF, Word, PowerPoint
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                           text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                           dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                           text-white rounded-lg transition-colors"
                >
                  {editingLesson ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Détails de la leçon
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
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
                  {viewingLesson.class} - {viewingLesson.trimester}
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
                    <p className="text-gray-500 dark:text-gray-400">Téléchargements</p>
                    <p className="text-gray-900 dark:text-white font-medium">{viewingLesson.downloads}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleDownload(viewingLesson)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 
                           dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 
                           rounded-lg transition-colors"
                >
                  <Download size={20} />
                  Télécharger
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingLesson);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 
                           dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 
                           rounded-lg transition-colors"
                >
                  <Pencil size={20} />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      </div>    </div>
  );
};

export default TeacherLessons;
