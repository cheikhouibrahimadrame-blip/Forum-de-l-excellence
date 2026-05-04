import type React from 'react';
import { useEffect, useState } from 'react';
import { 
  Calendar,
  Search,
  Check,
  X,
  Clock,
  Users,
  AlertCircle,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { API } from '../../../lib/apiRoutes';

interface Student {
  id: string;
  name: string;
}

interface CourseItem {
  id: string;
  name: string;
}

interface AttendanceApiItem {
  id: string;
  status: string;
  remarks?: string | null;
  student: {
    id: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface AttendanceRecord {
  attendanceId?: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [classes, setClasses] = useState<CourseItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.teacher?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await api.get(API.SCHEDULES_TEACHER(user.teacher.id));
        const result = response.data;
        const teachingSchedule = result?.data?.teachingSchedule || {};
        const courseMap = new Map<string, CourseItem>();

        Object.values(teachingSchedule).forEach((items: any) => {
          if (!Array.isArray(items)) return;
          items.forEach((entry: any) => {
            const courseId = entry.courseId;
            if (!courseId) return;
            const label = entry.courseName || entry.courseCode || 'Cours';
            if (!courseMap.has(courseId)) {
              courseMap.set(courseId, { id: courseId, name: label });
            }
          });
        });

        const courseList = Array.from(courseMap.values());
        setClasses(courseList);
        if (courseList.length > 0 && !selectedClass) {
          setSelectedClass(courseList[0].id);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des classes:', err);
        setError('Erreur lors du chargement des classes.');
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [user?.teacher?.id]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!selectedClass) {
        setStudents([]);
        setAttendance([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await api.get(API.ATTENDANCE_BY_CLASS(selectedClass), {
          params: { date: selectedDate }
        });
        const result = response.data;
        const attendanceItems: AttendanceApiItem[] = Array.isArray(result?.data) ? result.data : [];

        const studentList: Student[] = attendanceItems.map((item) => {
          const fullName = [item.student?.user?.firstName, item.student?.user?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
          return {
            id: item.student.id,
            name: fullName || 'Eleve'
          };
        });

        const records: AttendanceRecord[] = attendanceItems.map((item) => {
          const status = item.status?.toLowerCase() || 'present';
          const mappedStatus: AttendanceRecord['status'] =
            status === 'absent' || status === 'late' || status === 'excused' ? status : 'present';
          return {
            attendanceId: item.id,
            studentId: item.student.id,
            status: mappedStatus,
            notes: item.remarks || ''
          };
        });

        setStudents(studentList);
        setAttendance(records);
      } catch (err) {
        console.error('Erreur lors du chargement des présences:', err);
        setError('Erreur lors du chargement des présences.');
        setStudents([]);
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [selectedClass, selectedDate]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'ALL') return matchesSearch;
    
    const record = attendance.find(a => a.studentId === student.id);
    return matchesSearch && record?.status === filterStatus.toLowerCase();
  });

  const getAttendanceStatus = (studentId: string): AttendanceRecord => {
    return attendance.find(a => a.studentId === studentId) || { studentId, status: 'present' };
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId);
      if (existing) {
        return prev.map(a => a.studentId === studentId ? { ...a, status } : a);
      }
      return [...prev, { studentId, status }];
    });
  };

  const addNote = (studentId: string, notes: string) => {
    setAttendance(prev =>
      prev.map(a => a.studentId === studentId ? { ...a, notes } : a)
    );
    setSelectedStudent(null);
    setNoteText('');
  };

  const markAllPresent = () => {
    setAttendance(students.map(s => ({ studentId: s.id, status: 'present' as const })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;

    try {
      const payloads = attendance.map((record) => {
        const status = record.status.toUpperCase();
        if (record.attendanceId) {
          return api.put(API.ATTENDANCE_RECORD(record.attendanceId), {
            status,
            remarks: record.notes || null
          });
        }

        return api.post(API.ATTENDANCE_MARK, {
          studentId: record.studentId,
          status,
          date: selectedDate,
          remarks: record.notes || null
        });
      });

      await Promise.all(payloads);
      alert('Présences enregistrées.');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde des présences.');
    }
  };

  const handleExport = () => {
    alert('Export des présences en cours...');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
      absent: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
      late: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      excused: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    };
    return colors[status as keyof typeof colors] || colors.present;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      present: 'Présent',
      absent: 'Absent',
      late: 'Retard',
      excused: 'Excusé',
    };
    return labels[status as keyof typeof labels] || 'Présent';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      present: <Check size={20} />,
      absent: <X size={20} />,
      late: <Clock size={20} />,
      excused: <AlertCircle size={20} />,
    };
    return icons[status as keyof typeof icons] || icons.present;
  };

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
    total: students.length,
  };

  return (
    <div className="section">
      <div className="section-content">
        {/* Header */}
        <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des Présences
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enregistrez les présences pour vos classes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Users className="text-gray-600 dark:text-gray-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-green-300 dark:border-green-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Check className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Présents</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-red-300 dark:border-red-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <X className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Absents</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-orange-300 dark:border-orange-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Retards</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.late}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <AlertCircle className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Excusés</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.excused}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400" size={20} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold"
          >
            {classes.length === 0 && (
              <option value="">Aucune classe</option>
            )}
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un élève..."
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
            <option value="ALL">Tous</option>
            <option value="PRESENT">Présents</option>
            <option value="ABSENT">Absents</option>
            <option value="LATE">Retards</option>
            <option value="EXCUSED">Excusés</option>
          </select>

          <button
            onClick={markAllPresent}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 
                     text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Check size={20} />
            Tous présents
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Chargement des présences...</div>
      )}

      {/* Attendance List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Élève
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => {
                const record = getAttendanceStatus(student.id);
                return (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">{student.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {student.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full border-2 ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          {getStatusLabel(record.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.notes ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{record.notes}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Aucune note</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => updateAttendance(student.id, 'present')}
                          className={`p-2 rounded-lg transition-colors ${
                            record.status === 'present'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                          title="Présent"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => updateAttendance(student.id, 'absent')}
                          className={`p-2 rounded-lg transition-colors ${
                            record.status === 'absent'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                          title="Absent"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={() => updateAttendance(student.id, 'late')}
                          className={`p-2 rounded-lg transition-colors ${
                            record.status === 'late'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                          title="Retard"
                        >
                          <Clock size={18} />
                        </button>
                        <button
                          onClick={() => updateAttendance(student.id, 'excused')}
                          className={`p-2 rounded-lg transition-colors ${
                            record.status === 'excused'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                          title="Excusé"
                        >
                          <AlertCircle size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student.id);
                            setNoteText(record.notes || '');
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
                          title="Ajouter une note"
                        >
                          <Filter size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 
                   text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                   dark:hover:bg-gray-700 transition-colors"
        >
          <Download size={20} />
          Exporter
        </button>
        <button
          onClick={handleSaveAttendance}
          className="flex items-center gap-2 px-6 py-2 bg-primary-navy hover:bg-primary-navy/90 
                   text-white rounded-lg transition-colors"
        >
          <Check size={20} />
          Enregistrer la présence
        </button>
      </div>

      {/* Note Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Ajouter une note
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {students.find(s => s.id === selectedStudent)?.name}
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ex: Retard justifié par rendez-vous médical"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-primary-navy dark:focus:ring-primary-gold mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setNoteText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                         text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                         dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => addNote(selectedStudent, noteText)}
                className="flex-1 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                         text-white rounded-lg transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TeacherAttendance;
