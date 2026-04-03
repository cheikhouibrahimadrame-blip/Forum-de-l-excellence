import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Search, Plus, UserX, UserCheck, Key, ChevronLeft } from 'lucide-react';
import { api } from '../../../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      if (response.status >= 200 && response.status < 300) {
        setUsers(response.data?.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT' as User['role'],
    phone: ''
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/users', newUser);
      const data = response.data;
      console.log('API Response:', data);
      console.log('New User Data:', newUser);
      
      if (response.status >= 200 && response.status < 300) {
        setUsers([data.data.user, ...users]);
        setShowCreateModal(false);
        setNewUser({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'STUDENT',
          phone: ''
        });
        alert('Utilisateur créé avec succès!');
      } else {
        let errorMsg = data.error || data.message || 'Impossible de créer l\'utilisateur';
        if (data.errors && Array.isArray(data.errors)) {
          errorMsg = data.errors.map((e: any) => e.msg || e).join(', ');
        }
        console.error('Creation error:', errorMsg);
        alert(`Erreur: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const endpoint = currentStatus ? 'deactivate' : 'activate';
      const response = await api.patch(`/api/admin/users/${userId}/${endpoint}`);
      if (response.status >= 200 && response.status < 300) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const tempPassword = prompt('Entrez le nouveau mot de passe temporaire (minimum 8 caractères):');
    if (!tempPassword || tempPassword.length < 8) return;

    try {
      const response = await api.post(`/api/admin/users/${userId}/reset-password`, {
        newPassword: tempPassword
      });
      if (response.status >= 200 && response.status < 300) {
        alert('Mot de passe réinitialisé. L\'utilisateur devra le changer à sa prochaine connexion.');
        setUsers(users.map(u => u.id === userId ? { ...u, mustChangePassword: true } : u));
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && user.isActive) ||
                         (selectedStatus === 'disabled' && !user.isActive) ||
                         (selectedStatus === 'mustChangePassword' && user.mustChangePassword);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PARENT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'TEACHER': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ADMIN': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Désactivé</span>;
    }
    if (user.mustChangePassword) {
      return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Doit changer MDP</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Actif</span>;
  };

  const scrollTarget = (location.state as any)?.scrollTo || 'utilisateurs-acces';

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      <button
        onClick={() => navigate('/admin', { state: { scrollTo: scrollTarget } })}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Gestion des Utilisateurs</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Création et gestion des comptes (Admin uniquement)</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Créer un utilisateur
        </button>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Créer un nouvel utilisateur</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email institutionnel*</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="input-field w-full"
                  placeholder="prenom.nom@institution.edu"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom*</label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom*</label>
                  <input
                    type="text"
                    required
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="input-field w-full"
                  placeholder="+221 XX XXX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle*</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as User['role']})}
                  className="input-field w-full"
                >
                  <option value="STUDENT">Élève</option>
                  <option value="PARENT">Parent</option>
                  <option value="TEACHER">Enseignant</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe temporaire*</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="input-field w-full"
                  placeholder="Minimum 8 caractères"
                  minLength={8}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  L'utilisateur devra changer ce mot de passe à sa première connexion
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Annuler
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="input-field"
          >
            <option value="all">Tous les rôles</option>
            <option value="STUDENT">Élèves</option>
            <option value="PARENT">Parents</option>
            <option value="TEACHER">Enseignants</option>
            <option value="ADMIN">Administrateurs</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="disabled">Désactivés</option>
            <option value="mustChangePassword">Doit changer MDP</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[var(--color-text-primary)]" />
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Utilisateurs ({filteredUsers.length})
              </h2>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                      {user.role === 'STUDENT' ? 'Élève' : 
                       user.role === 'PARENT' ? 'Parent' :
                       user.role === 'TEACHER' ? 'Enseignant' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`p-2 rounded ${
                          user.isActive
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="p-2 rounded text-amber-600 hover:bg-amber-50"
                        title="Réinitialiser le mot de passe"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  </div>
  );
};

export default AdminUsers;