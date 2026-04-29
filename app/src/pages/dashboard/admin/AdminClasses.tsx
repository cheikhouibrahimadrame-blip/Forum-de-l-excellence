import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  Search,
  X,
  BookOpen,
  UserCheck,
  ChevronLeft
} from 'lucide-react';

interface Class {
  id: string;
  name: string;
  level: string;
  capacity: number;
  currentStudents: number;
  academicYear: string;
  mainTeacherId?: string;
  mainTeacher?: string;
}

interface TeacherOption {
  id: string;
  name: string;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
  className: string;
}

const AdminClasses: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningClass, setAssigningClass] = useState<Class | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    level: 'CI',
    capacity: 25,
    academicYear: '',
    mainTeacherId: '',
    mainTeacher: ''
  });

  const levels = ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];

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
      return 'Session expirée. Veuillez vous reconnecter.';
    }

    if (status === 403) {
      return 'Accès refusé pour cette action.';
    }

    return backendMessage || err?.message || fallback;
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchClasses = async () => {
      setLoading(true);
      setError('');
      try {
        const [classesResponse, yearsResponse, teachersResponse, studentsResponse] = await Promise.all([
          api.get('/api/classes', { signal: controller.signal }),
          api.get('/api/academic-years', { signal: controller.signal }),
          api.get('/api/users', { params: { role: 'TEACHER', limit: 200 }, signal: controller.signal }),
          api.get('/api/users', { params: { role: 'STUDENT', limit: 400 }, signal: controller.signal })
        ]);

        const classData = classesResponse.data;
        const payload = Array.isArray(classData) ? classData : classData.data || [];
        setClasses(payload);

        const yearsData = yearsResponse.data;
        const years = Array.isArray(yearsData?.data)
          ? yearsData.data.map((item: { year?: string }) => item.year).filter(Boolean)
          : [];
        setAcademicYears(years);

        const teacherItems = Array.isArray(teachersResponse.data?.data?.users)
          ? teachersResponse.data.data.users
          : [];
        const mappedTeachers: TeacherOption[] = teacherItems
          .map((teacher: any) => ({
            id: String(teacher.id || ''),
            name: [teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim() || teacher.email || ''
          }))
          .filter((teacher: TeacherOption) => teacher.id && teacher.name);
        setTeachers(mappedTeachers);

        const studentItems = Array.isArray(studentsResponse.data?.data?.users)
          ? studentsResponse.data.data.users
          : [];
        const mappedStudents: StudentOption[] = studentItems
          .map((student: any) => ({
            id: String(student.id || ''),
            name: [student.firstName, student.lastName].filter(Boolean).join(' ').trim() || student.email || '',
            email: student.email || '',
            className: student.student?.major || ''
          }))
          .filter((student: StudentOption) => student.id && student.name);
        setStudents(mappedStudents);
      } catch (err: any) {
        const message = getReadableError(err, 'Erreur lors du chargement des classes');
        if (message) setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();

    return () => controller.abort();
  }, []);

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.mainTeacher?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'ALL' || cls.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const occupiedTeacherIds = new Set(
    classes
      .filter((cls) => cls.id !== editingClass?.id)
      .map((cls) => cls.mainTeacherId)
      .filter(Boolean) as string[]
  );

  const availableTeachers = teachers.filter((teacher) => !occupiedTeacherIds.has(teacher.id));

  const handleAdd = () => {
    setEditingClass(null);
    const defaultTeacher = availableTeachers[0];
    setFormData({
      name: '',
      level: 'CI',
      capacity: 25,
      academicYear: academicYears[0] || '',
      mainTeacherId: defaultTeacher?.id || '',
      mainTeacher: defaultTeacher?.name || ''
    });
    setShowModal(true);
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      level: cls.level,
      capacity: cls.capacity,
      academicYear: cls.academicYear,
      mainTeacherId: cls.mainTeacherId || '',
      mainTeacher: cls.mainTeacher || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ? Les élèves seront désinscrits.')) {
      return;
    }

    try {
      await api.delete(`/api/classes/${id}`);

      setClasses(classes.filter(c => c.id !== id));
    } catch (err: any) {
      const message = getReadableError(err, 'Erreur lors de la suppression de la classe');
      if (message) setError(message);
    }
  };

  const handleOpenAssignStudents = (cls: Class) => {
    if (!cls.mainTeacherId) {
      setError('Veuillez d\'abord assigner un enseignant principal à cette classe.');
      return;
    }
    setAssigningClass(cls);
    const preselected = students
      .filter((student) => student.className === cls.name)
      .map((student) => student.id);
    setSelectedStudentIds(preselected);
    setShowAssignModal(true);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) => (
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    ));
  };

  const handleAssignStudents = async () => {
    if (!assigningClass) return;
    try {
      setAssignLoading(true);
      setError('');
      const response = await api.post(`/api/classes/${assigningClass.id}/students/assign`, {
        studentUserIds: selectedStudentIds
      });

      const currentStudents = Number(response.data?.data?.currentStudents || 0);
      const assignedUserIds: string[] = Array.isArray(response.data?.data?.assignedUserIds)
        ? response.data.data.assignedUserIds.map((id: any) => String(id))
        : [];
      const invalidUserIds: string[] = Array.isArray(response.data?.data?.invalidUserIds)
        ? response.data.data.invalidUserIds.map((id: any) => String(id))
        : [];

      setClasses((prev) => prev.map((item) => item.id === assigningClass.id ? { ...item, currentStudents } : item));
      setStudents((prev) => prev.map((student) => ({
        ...student,
        className: assignedUserIds.includes(student.id)
          ? assigningClass.name
          : (student.className === assigningClass.name ? '' : student.className)
      })));

      if (invalidUserIds.length > 0) {
        setError(`${invalidUserIds.length} compte(s) étudiant sans profil élève ont été ignorés.`);
      }

      setShowAssignModal(false);
      setAssigningClass(null);
      setSelectedStudentIds([]);
    } catch (err: any) {
      const message = getReadableError(err, 'Erreur lors de l\'assignation des élèves');
      if (message) setError(message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeacher = teachers.find((teacher) => teacher.id === formData.mainTeacherId);

    try {
      if (editingClass) {
        const response = await api.put(`/api/classes/${editingClass.id}`, {
          name: formData.name,
          level: formData.level,
          capacity: formData.capacity,
          academicYear: formData.academicYear,
          mainTeacherId: formData.mainTeacherId,
          mainTeacher: selectedTeacher?.name || ''
        });

        const result = response.data;
        const updated = result?.data;
        if (updated) {
          setClasses(classes.map(c => (c.id === editingClass.id ? updated : c)));
        }
      } else {
        const response = await api.post('/api/classes', {
          name: formData.name,
          level: formData.level,
          capacity: formData.capacity,
          academicYear: formData.academicYear,
          mainTeacherId: formData.mainTeacherId,
          mainTeacher: selectedTeacher?.name || ''
        });

        const result = response.data;
        const created = result?.data;
        if (created) {
          setClasses([created, ...classes]);
        }
      }

      setShowModal(false);
    } catch (err: any) {
      const message = getReadableError(err, 'Erreur lors de la sauvegarde de la classe');
      if (message) setError(message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'mainTeacherId') {
      const selectedTeacher = teachers.find((teacher) => teacher.id === value);
      setFormData((prev) => ({
        ...prev,
        mainTeacherId: value,
        mainTeacher: selectedTeacher?.name || ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value
    }));
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
          Gestion des Classes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les classes de votre école primaire (CI à CM2)
        </p>
      </div>

      {loading && (
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Chargement des classes...
        </div>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Élèves</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {classes.reduce((sum, c) => sum + c.currentStudents, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserCheck className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Capacité Totale</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {classes.reduce((sum, c) => sum + c.capacity, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
          >
            <option value="ALL">Tous les niveaux</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                     text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Ajouter une classe
          </button>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Classe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Niveau
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Enseignant Principal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Élèves
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Capacité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Année Scolaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900 dark:text-white">{cls.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {cls.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">
                    {cls.mainTeacher || <span className="text-gray-400 italic">Non assigné</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900 dark:text-white font-medium">{cls.currentStudents}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white">{cls.capacity}</span>
                      {cls.currentStudents >= cls.capacity && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Complet</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">
                    {cls.academicYear}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(cls)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenAssignStudents(cls)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Assigner des élèves"
                      >
                        <Users size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400">Aucune classe trouvée</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingClass ? 'Modifier la classe' : 'Ajouter une classe'}
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
                  Nom de la classe *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: CP-A, CE1-B"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Niveau *
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacité *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Année Scolaire *
                </label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                >
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enseignant Principal
                </label>
                <select
                  name="mainTeacherId"
                  value={formData.mainTeacherId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
                >
                  <option value="">Sélectionner un enseignant</option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Propose automatiquement les enseignants disponibles
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
                  {editingClass ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && assigningClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Assigner des élèves - {assigningClass.name}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Les élèves sélectionnés seront assignés à cette classe et visibles automatiquement sur le dashboard de l'enseignant principal.
            </p>

            <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {students.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Aucun élève disponible.</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center justify-between gap-4 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                        <p className="text-xs text-gray-500">Classe actuelle: {student.className || 'Non assigné'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="h-4 w-4"
                      />
                    </label>
                  ))}
                </div>
              )}
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
                type="button"
                onClick={handleAssignStudents}
                disabled={assignLoading}
                className="flex-1 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 text-white rounded-lg transition-colors disabled:opacity-60"
              >
                {assignLoading ? 'Assignation...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminClasses;
