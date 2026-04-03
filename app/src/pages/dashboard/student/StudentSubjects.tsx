import type React from 'react';
import { useState } from 'react';
import { 
  BookOpen,
  Users,
  Calendar,
  Clock,
  Award,
  GraduationCap
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  teacher: string;
  color: string;
  lessons: number;
  currentGrade: number;
  status: 'good' | 'warning' | 'excellent';
  schedule: string;
}

const StudentSubjects: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Simulated subjects for student's class (CP-A)
  const subjects: Subject[] = [
    {
      id: '1',
      name: 'Mathématiques',
      code: 'MATH',
      teacher: 'M. Sarr',
      color: 'blue',
      lessons: 15,
      currentGrade: 85,
      status: 'excellent',
      schedule: 'Lun, Mer, Ven: 09:00-10:00'
    },
    {
      id: '2',
      name: 'Français',
      code: 'FRAN',
      teacher: 'Mme Diop',
      color: 'green',
      lessons: 18,
      currentGrade: 78,
      status: 'good',
      schedule: 'Lun, Mar, Jeu: 10:15-11:15'
    },
    {
      id: '3',
      name: 'Sciences/Éveil',
      code: 'SCI',
      teacher: 'Mme Ndiaye',
      color: 'purple',
      lessons: 12,
      currentGrade: 82,
      status: 'excellent',
      schedule: 'Mar, Jeu: 14:00-15:00'
    },
    {
      id: '4',
      name: 'Anglais',
      code: 'ANG',
      teacher: 'Mme Fall',
      color: 'indigo',
      lessons: 10,
      currentGrade: 72,
      status: 'warning',
      schedule: 'Mer, Ven: 11:30-12:15'
    },
    {
      id: '5',
      name: 'Éducation Physique',
      code: 'EPS',
      teacher: 'M. Ba',
      color: 'red',
      lessons: 8,
      currentGrade: 90,
      status: 'excellent',
      schedule: 'Mar, Ven: 15:30-16:30'
    },
    {
      id: '6',
      name: 'Arts Plastiques',
      code: 'ARTS',
      teacher: 'Mme Sow',
      color: 'pink',
      lessons: 6,
      currentGrade: 88,
      status: 'excellent',
      schedule: 'Jeu: 13:00-14:00'
    },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'excellent':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'good':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'excellent':
        return '✓ Excellent';
      case 'good':
        return '✓ Bon';
      case 'warning':
        return '⚠ À améliorer';
      default:
        return 'En cours';
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/30',
      green: 'bg-green-100 dark:bg-green-900/30',
      purple: 'bg-purple-100 dark:bg-purple-900/30',
      orange: 'bg-orange-100 dark:bg-orange-900/30',
      red: 'bg-red-100 dark:bg-red-900/30',
      pink: 'bg-pink-100 dark:bg-pink-900/30',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
    };
    return colorMap[color] || colorMap.blue;
  };

  const averageGrade = Math.round(subjects.reduce((sum, s) => sum + s.currentGrade, 0) / subjects.length);
  const excellentCount = subjects.filter(s => s.status === 'excellent').length;

  return (
    <div className="section">
      <div className="section-content">
        {/* Header */}
        <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mes Matières
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez vos matières et vos enseignants pour cette année scolaire
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Matières</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{subjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Award className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Moyenne</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageGrade}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <GraduationCap className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Excellentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{excellentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Users className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Leçons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {subjects.reduce((sum, s) => sum + s.lessons, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            onClick={() => setSelectedSubject(subject)}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${getColorClass(subject.color)}`}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{subject.teacher}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full border-2 ${getStatusColor(subject.status)}`}>
                {getStatusLabel(subject.status)}
              </span>
            </div>

            {/* Grade Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Moyenne</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{subject.currentGrade}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    subject.currentGrade >= 80
                      ? 'bg-green-500'
                      : subject.currentGrade >= 70
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${subject.currentGrade}%` }}
                ></div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock size={16} />
                <span>{subject.schedule}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar size={16} />
                <span>{subject.lessons} leçons disponibles</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Détails de la matière
              </h2>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${getColorClass(selectedSubject.color)}`}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedSubject.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedSubject.code}
                  </p>
                </div>
              </div>

              {/* Teacher */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Enseignant</p>
                <p className="text-gray-900 dark:text-white font-medium">{selectedSubject.teacher}</p>
              </div>

              {/* Schedule */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Horaire</p>
                <p className="text-gray-900 dark:text-white font-medium">{selectedSubject.schedule}</p>
              </div>

              {/* Grade */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Moyenne Trimestre 1</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        selectedSubject.currentGrade >= 80
                          ? 'bg-green-500'
                          : selectedSubject.currentGrade >= 70
                          ? 'bg-blue-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${selectedSubject.currentGrade}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white w-12 text-right">
                    {selectedSubject.currentGrade}%
                  </span>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statut</p>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border-2 ${getStatusColor(selectedSubject.status)}`}>
                  {getStatusLabel(selectedSubject.status)}
                </span>
              </div>

              {/* Lessons */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Leçons disponibles</p>
                <p className="text-gray-900 dark:text-white font-medium">{selectedSubject.lessons} leçons</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                           text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                           dark:hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    alert(`Consultation des leçons de ${selectedSubject.name}`);
                    // In real app: navigate to lessons page filtered by subject
                    setSelectedSubject(null);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                           text-white rounded-lg transition-colors"
                >
                  Voir les leçons
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

export default StudentSubjects;
