import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  X,
  BookOpen,
  Hash,
  FileText,
  Users,
  ChevronLeft
} from 'lucide-react';
import { api } from '../../../lib/api';

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  isActive: boolean;
}

interface ClassOption {
  id: string;
  name: string;
  mainTeacherId?: string;
  mainTeacher?: string;
}

const AdminSubjects: React.FC = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningSubject, setAssigningSubject] = useState<Subject | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ classroomId: '', schoolYear: '' });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: 'blue',
    isActive: true
  });

  const colors = [
    { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
    { value: 'green', label: 'Vert', class: 'bg-green-500' },
    { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'red', label: 'Rouge', class: 'bg-red-500' },
    { value: 'pink', label: 'Rose', class: 'bg-pink-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { value: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
  ];

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'ACTIVE' && subject.isActive) ||
                         (filterStatus === 'INACTIVE' && !subject.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      color: 'blue',
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      color: subject.color,
      isActive: subject.isActive
    });
    setShowModal(true);
  };

  const handleOpenAssign = (subject: Subject) => {
    setAssigningSubject(subject);
    setAssignForm({
      classroomId: classes.find((item) => item.mainTeacherId)?.id || '',
      schoolYear: schoolYears[0] || ''
    });
    setShowAssignModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ? Elle sera retirée de toutes les classes.')) {
      deleteSubject(id);
    }
  };

  const toggleActive = (id: string) => {
    const subject = subjects.find(s => s.id === id);
    if (subject) {
      updateSubject(id, { ...subject, isActive: !subject.isActive });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSubject) {
      updateSubject(editingSubject.id, { ...editingSubject, ...formData });
    } else {
      createSubject(formData);
    }

    setShowModal(false);
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');

      const [subjectsResponse, classesResponse, yearsResponse] = await Promise.all([
        api.get('/api/subjects'),
        api.get('/api/classes'),
        api.get('/api/academic-years')
      ]);

      const data = subjectsResponse.data;
      const payload = Array.isArray(data) ? data : data.data || [];
      setSubjects(payload);

      const classPayload = Array.isArray(classesResponse.data?.data) ? classesResponse.data.data : [];
      setClasses(
        classPayload
          .map((item: any) => ({
            id: String(item.id || ''),
            name: String(item.name || ''),
            mainTeacherId: item.mainTeacherId || '',
            mainTeacher: item.mainTeacher || ''
          }))
          .filter((item: ClassOption) => item.id && item.name)
      );

      const yearsPayload = Array.isArray(yearsResponse.data?.data)
        ? yearsResponse.data.data.map((item: { year?: string }) => item.year).filter(Boolean)
        : [];
      setSchoolYears(yearsPayload);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async (payload: Omit<Subject, 'id'>) => {
    try {
      await api.post('/api/subjects', payload);
      await fetchSubjects();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la création');
    }
  };

  const updateSubject = async (id: string, payload: Subject) => {
    try {
      await api.put(`/api/subjects/${id}`, payload);
      await fetchSubjects();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la mise à jour');
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await api.delete(`/api/subjects/${id}`);
      await fetchSubjects();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la suppression');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningSubject) return;

    const selectedClass = classes.find((item) => item.id === assignForm.classroomId);
    if (!selectedClass || !selectedClass.mainTeacherId || !selectedClass.mainTeacher) {
      setError('Veuillez sélectionner une classe avec un enseignant principal assigné.');
      return;
    }

    try {
      setAssignLoading(true);
      setError('');
      await api.post(`/api/subjects/${assigningSubject.id}/assign`, {
        classroomId: selectedClass.id,
        classroomName: selectedClass.name,
        teacherId: selectedClass.mainTeacherId,
        teacherName: selectedClass.mainTeacher,
        schoolYear: assignForm.schoolYear
      });
      setShowAssignModal(false);
      setAssigningSubject(null);
      setAssignForm({ classroomId: '', schoolYear: '' });
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de l’assignation de la matière');
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const getColorClass = (color: string, type: 'bg' | 'text' = 'bg') => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
      green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
      red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
      pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-300' },
      indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-300' },
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
    };
    return colorMap[color]?.[type] || colorMap.blue[type];
  };

  return (
    <div className="section">
      <div className="section-content">
        {/* Header */}
        <div className="mb-6">
        <button
          onClick={() => navigate('/admin', { state: { scrollTo: 'classes-matieres' } })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des Matières
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les matières enseignées dans votre école (dynamiques et flexibles)
        </p>
      </div>

      {loading && (
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">Chargement des matières...</div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Matières</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{subjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Hash className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Actives</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {subjects.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <FileText className="text-gray-600 dark:text-gray-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactives</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {subjects.filter(s => !s.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une matière..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actives</option>
            <option value="INACTIVE">Inactives</option>
          </select>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                     text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Ajouter une matière
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <div 
            key={subject.id} 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${getColorClass(subject.color, 'bg')} rounded-lg`}>
                  <BookOpen className={getColorClass(subject.color, 'text')} size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{subject.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(subject)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="Modifier"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleOpenAssign(subject)}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded transition-colors"
                  title="Assigner"
                >
                  <Users size={16} />
                </button>
                <button
                  onClick={() => handleDelete(subject.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {subject.description}
            </p>

            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                subject.isActive 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {subject.isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleActive(subject.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {subject.isActive ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">Aucune matière trouvée</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingSubject ? 'Modifier la matière' : 'Ajouter une matière'}
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
                  Nom de la matière *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Mathématiques, Français"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Ex: MATH, FRAN"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description de la matière"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Couleur *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className={`w-full h-6 ${color.class} rounded`}></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-navy focus:ring-primary-navy rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Matière active
                </label>
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
                  {editingSubject ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && assigningSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Assigner la matière - {assigningSubject.name}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Classe *
                </label>
                <select
                  value={assignForm.classroomId}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, classroomId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}{item.mainTeacher ? ` - ${item.mainTeacher}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  La matière sera reliée à l'enseignant principal de la classe.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Année scolaire *
                </label>
                <select
                  value={assignForm.schoolYear}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, schoolYear: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                  required
                >
                  <option value="">Sélectionner une année</option>
                  {schoolYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="flex-1 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  {assignLoading ? 'Assignation...' : 'Assigner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminSubjects;
