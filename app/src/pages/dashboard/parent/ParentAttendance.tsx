import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Filter,
  ChevronLeft
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  subject?: string;
  teacher?: string;
}

const ParentAttendance: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChild] = useState('Aïssatou Sall'); // In real app: from context
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-30');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Simulated attendance records for the period
  const attendanceRecords: AttendanceRecord[] = [
    { id: '1', date: '2026-01-30', status: 'present', subject: 'Mathématiques', teacher: 'M. Sarr' },
    { id: '2', date: '2026-01-29', status: 'present', subject: 'Français', teacher: 'Mme Diop' },
    { id: '3', date: '2026-01-28', status: 'late', subject: 'Sciences', teacher: 'Mme Ndiaye', notes: 'Retard de 15 minutes' },
    { id: '4', date: '2026-01-27', status: 'present', subject: 'Anglais', teacher: 'Mme Fall' },
    { id: '5', date: '2026-01-24', status: 'absent', subject: 'Mathématiques', teacher: 'M. Sarr', notes: 'Maladie (justificatif fourni)' },
    { id: '6', date: '2026-01-23', status: 'present', subject: 'Français', teacher: 'Mme Diop' },
    { id: '7', date: '2026-01-22', status: 'present', subject: 'Sciences', teacher: 'Mme Ndiaye' },
    { id: '8', date: '2026-01-21', status: 'excused', subject: 'Anglais', teacher: 'Mme Fall', notes: 'Rendez-vous médical' },
    { id: '9', date: '2026-01-20', status: 'present', subject: 'Mathématiques', teacher: 'M. Sarr' },
    { id: '10', date: '2026-01-17', status: 'present', subject: 'Français', teacher: 'Mme Diop' },
    { id: '11', date: '2026-01-16', status: 'present', subject: 'Sciences', teacher: 'Mme Ndiaye' },
    { id: '12', date: '2026-01-15', status: 'absent', subject: 'Anglais', teacher: 'Mme Fall', notes: 'Maladie' },
    { id: '13', date: '2026-01-14', status: 'present', subject: 'Mathématiques', teacher: 'M. Sarr' },
    { id: '14', date: '2026-01-13', status: 'late', subject: 'Français', teacher: 'Mme Diop', notes: 'Retard de 5 minutes' },
    { id: '15', date: '2026-01-10', status: 'present', subject: 'Sciences', teacher: 'Mme Ndiaye' },
  ];

  // Filter records
  const filteredRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isInDateRange = recordDate >= start && recordDate <= end;
    const isMatchStatus = filterStatus === 'all' || record.status === filterStatus;
    return isInDateRange && isMatchStatus;
  });

  // Calculate statistics
  const stats = {
    present: filteredRecords.filter(r => r.status === 'present').length,
    absent: filteredRecords.filter(r => r.status === 'absent').length,
    late: filteredRecords.filter(r => r.status === 'late').length,
    excused: filteredRecords.filter(r => r.status === 'excused').length,
    total: filteredRecords.length
  };

  const attendanceRate = stats.total > 0
    ? Math.round(((stats.present + stats.excused) / stats.total) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      present: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        icon: CheckCircle,
        label: 'Présent'
      },
      absent: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        icon: AlertCircle,
        label: 'Absent'
      },
      late: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-800 dark:text-orange-300',
        icon: Clock,
        label: 'Retard'
      },
      excused: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-300',
        icon: CheckCircle,
        label: 'Justifié'
      }
    };
    return statusMap[status] || statusMap.present;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Statut', 'Matière', 'Enseignant', 'Notes'],
      ...filteredRecords.map(r => [
        r.date,
        getStatusBadge(r.status).label,
        r.subject || '-',
        r.teacher || '-',
        r.notes || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `presence_${selectedChild}_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="section">
      <div className="section-content">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/parent')}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Suivi de la Présence
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Consultez l'historique de présence de {selectedChild}
          </p>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Présences</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Absences</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.absent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Retards</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.late}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Justifiés</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.excused}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-navy to-primary-navy/80 dark:from-primary-navy dark:to-primary-navy/60 p-4 rounded-lg text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/80">Assiduité</p>
              <p className="text-lg font-bold text-white">{attendanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Date Début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Date Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="present">Présent</option>
              <option value="absent">Absent</option>
              <option value="late">Retard</option>
              <option value="excused">Justifié</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                       text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="space-y-3">
        {filteredRecords.length > 0 ? (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {filteredRecords.length} enregistrement(s) trouvé(s)
            </div>
            {filteredRecords.map((record) => {
              const status = getStatusBadge(record.status);
              const StatusIcon = status.icon;
              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 
                           dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${status.bg} flex-shrink-0`}>
                        <StatusIcon className={`${status.text}`} size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {formatDate(record.date)}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Matière:</span> {record.subject}
                          </div>
                          <div>
                            <span className="font-medium">Enseignant:</span> {record.teacher}
                          </div>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                            📝 {record.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-500">
                      ID: {record.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucun enregistrement de présence trouvé pour cette période
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Détails de la présence
              </h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statut</p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const status = getStatusBadge(selectedRecord.status);
                    const StatusIcon = status.icon;
                    return (
                      <>
                        <div className={`p-2 rounded-lg ${status.bg}`}>
                          <StatusIcon className={`${status.text}`} size={20} />
                        </div>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatDate(selectedRecord.date)}
                </p>
              </div>

              {/* Subject */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Matière</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {selectedRecord.subject}
                </p>
              </div>

              {/* Teacher */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Enseignant</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {selectedRecord.teacher}
                </p>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notes</p>
                  <p className="text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-3 rounded">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full px-4 py-2 bg-primary-navy hover:bg-primary-navy/90 
                         text-white rounded-lg transition-colors mt-6"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ParentAttendance;
