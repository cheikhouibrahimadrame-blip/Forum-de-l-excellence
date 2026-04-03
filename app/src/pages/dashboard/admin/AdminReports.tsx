import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Plus, Edit, Trash2, Download, X, Calendar, Users, ChevronLeft } from 'lucide-react';
import { downloadPDF } from '../../../utils/pdfGenerator';
import { api } from '../../../lib/api';

interface Report {
  id: string;
  name: string;
  type: 'academic' | 'financial' | 'administrative';
  department: string;
  createdDate: string;
  generatedBy: string;
  recipients: number;
  status: 'draft' | 'published' | 'archived';
}

const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: 'academic' | 'financial' | 'administrative';
    department: string;
    generatedBy: string;
  }>({
    name: '',
    type: 'academic',
    department: '',
    generatedBy: ''
  });

  const handleOpenModal = (report?: Report) => {
    if (report) {
      setEditingId(report.id);
      setFormData({
        name: report.name,
        type: report.type,
        department: report.department,
        generatedBy: report.generatedBy
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        type: 'academic',
        department: '',
        generatedBy: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'academic',
      department: '',
      generatedBy: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateReport(editingId, formData);
    } else {
      createReport(formData);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport?')) {
      deleteReport(id);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/reports');
      const data = response.data;
      const payload = Array.isArray(data) ? data : data.data || [];
      setReports(payload);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (payload: { name: string; type: Report['type']; department: string; generatedBy: string; }) => {
    try {
      await api.post('/api/reports', payload);
      await fetchReports();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la creation');
    }
  };

  const updateReport = async (id: string, payload: { name: string; type: Report['type']; department: string; generatedBy: string; }) => {
    try {
      await api.put(`/api/reports/${id}`, payload);
      await fetchReports();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la mise a jour');
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await api.delete(`/api/reports/${id}`);
      await fetchReports();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = (report: Report) => {
    const htmlContent = `
      <div class="header">
        <div class="header-title">${report.name}</div>
        <div class="header-subtitle">${getTypeLabel(report.type)}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Informations du Rapport</div>
        <p><strong>Département:</strong> ${report.department}</p>
        <p><strong>Date de création:</strong> ${report.createdDate}</p>
        <p><strong>Généré par:</strong> ${report.generatedBy}</p>
        <p><strong>Destinataires:</strong> ${report.recipients}</p>
        <p><strong>Statut:</strong> ${getStatusLabel(report.status)}</p>
      </div>

      <div class="footer">
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><span class="logo">Forum de L'excellence</span> - Système de Gestion Académique</p>
      </div>
    `;

    downloadPDF(htmlContent, `${report.name.replace(/\s+/g, '_')}`);
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'academic': return 'Académique';
      case 'financial': return 'Financier';
      case 'administrative': return 'Administratif';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'administrative': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'draft': return 'Brouillon';
      case 'published': return 'Publié';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  const scrollTarget = (location.state as any)?.scrollTo || 'notes-verrous';

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      <button
          onClick={() => navigate('/admin', { state: { scrollTo: scrollTarget } })}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour
      </button>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Gestion des Rapports</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Rapport
        </button>
      </div>

      {loading && (
        <div className="text-sm text-[var(--color-text-muted)]">Chargement des rapports...</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reports.map((report) => (
          <div key={report.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  {report.name}
                </h3>
                <div className="flex gap-2 mb-4">
                  <span className={`badge ${getTypeColor(report.type)}`}>
                    {getTypeLabel(report.type)}
                  </span>
                  <span className={`badge ${
                    report.status === 'published' ? 'bg-green-100 text-green-800' :
                    report.status === 'draft' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status === 'published' ? 'Publié' :
                     report.status === 'draft' ? 'Brouillon' : 'Archivé'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenModal(report)}
                  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-navy)] transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(report.id)}
                  className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">{report.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">{report.createdDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">{report.recipients} destinataires</span>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Généré par: <span className="font-medium">{report.generatedBy}</span>
              </div>
            </div>

            <button 
              onClick={() => handleDownload(report)}
              className="w-full mt-4 px-4 py-2 border border-[var(--color-primary-gold)] text-[var(--color-primary-gold)] rounded hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingId ? 'Éditer le Rapport' : 'Nouveau Rapport'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Titre du rapport*</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="Ex: Rapport Académique Trimestre 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Type de rapport*</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="academic" className="text-gray-900 dark:text-white">Académique</option>
                  <option value="financial" className="text-gray-900 dark:text-white">Financier</option>
                  <option value="administrative" className="text-gray-900 dark:text-white">Administratif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Département*</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="Ex: Cycle Primaire"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Généré par*</label>
                <input
                  type="text"
                  required
                  value={formData.generatedBy}
                  onChange={(e) => setFormData({...formData, generatedBy: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="Ex: M. Ndiaye"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary-gold)] text-[var(--color-primary-navy)] font-medium rounded hover:bg-opacity-90"
                >
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
