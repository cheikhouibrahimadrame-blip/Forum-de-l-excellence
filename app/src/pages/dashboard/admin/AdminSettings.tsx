import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Bell, Shield, Palette, Database, Mail, Info, LogOut, Save, Edit2, X, Check, GraduationCap, ChevronLeft } from 'lucide-react';
import { api } from '../../../lib/api';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

interface SettingsUserRow {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'inactive';
  joined?: string;
}

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('general');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const sections: SettingSection[] = [
    { id: 'general', title: 'Général', icon: Settings, description: 'Paramètres généraux du système' },
    { id: 'users', title: 'Utilisateurs', icon: User, description: 'Gestion des utilisateurs et permissions' },
    { id: 'security', title: 'Sécurité', icon: Shield, description: 'Configuration de sécurité et authentification' },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Paramètres de notification' },
    { id: 'appearance', title: 'Apparence', icon: Palette, description: 'Thèmes et personnalisation' },
    { id: 'database', title: 'Base de Données', icon: Database, description: 'Gestion et sauvegarde des données' },
    { id: 'email', title: 'Email', icon: Mail, description: 'Configuration des emails' },
    { id: 'about', title: 'À Propos', icon: Info, description: 'Informations sur le système' }
  ];

  const [collegeInfo, setCollegeInfo] = useState({
    name: 'Forum de L\'excellence',
    address: 'Medinatoul Salam, Mbour, Sénégal',
    phone: '+221 775368254',
    email: 'gsforumexcellence@gmail.com',
    website: 'www.forumexcellence.sn',
    principal: 'M. et Mme Fall',
    year: '2025-2026'
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    enableTwoFactor: false,
    maxLoginAttempts: 5
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    browserNotifications: true,
    gradeUpdates: true,
    attendanceAlerts: true,
    appointmentReminders: true,
    systemUpdates: true,
    newsletter: false
  });

  // Fonction pour appliquer les paramètres d'apparence
  const applyAppearanceSettings = (settings: typeof appearanceSettings) => {
    // Appliquer le thème
    const htmlElement = document.documentElement;
    if (settings.theme === 'dark') {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (settings.theme === 'light') {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      // Auto - déterminer selon la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
      localStorage.setItem('theme', 'auto');
    }

    // Appliquer les couleurs personnalisées
    htmlElement.style.setProperty('--color-primary-navy', settings.primaryColor);
    htmlElement.style.setProperty('--color-primary-gold', settings.accentColor);
    localStorage.setItem('primaryColor', settings.primaryColor);
    localStorage.setItem('accentColor', settings.accentColor);

    // Appliquer la taille de police
    const fontSizeMap: Record<string, string> = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    htmlElement.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
    htmlElement.style.fontSize = fontSizeMap[settings.fontSize];
    localStorage.setItem('fontSize', settings.fontSize);

    console.log('Paramètres d\'apparence appliqués:', settings);
  };

  // Charger et appliquer les paramètres d'apparence sauvegardés au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    const savedPrimaryColor = localStorage.getItem('primaryColor') || '#003366';
    const savedAccentColor = localStorage.getItem('accentColor') || '#C39D5B';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';

    const savedAppearance = {
      theme: savedTheme,
      primaryColor: savedPrimaryColor,
      accentColor: savedAccentColor,
      fontSize: savedFontSize
    };

    setAppearanceSettings(savedAppearance);
    applyAppearanceSettings(savedAppearance);
  }, []);

  // Charger les paramètres du serveur au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/api/settings');
        const data = response.data;
        
        if (data.success && data.data) {
          if (data.data.general) {
            setCollegeInfo(data.data.general);
          }
          if (data.data.security) {
            setSecuritySettings(data.data.security);
          }
          if (data.data.notifications) {
            setNotificationSettings(data.data.notifications);
          }
          if (data.data.appearance) {
            setAppearanceSettings(data.data.appearance);
          }
          if (data.data.database) {
            setDatabaseSettings(data.data.database);
          }
          if (data.data.email) {
            setEmailSettings(data.data.email);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };

    loadSettings();
  }, []);

  const [users, setUsers] = useState<SettingsUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError('');

      try {
        const response = await api.get('/api/users');
        const data = response.data;
        let usersList: any[] = [];

        if (Array.isArray(data)) {
          usersList = data;
        } else if (data.data && Array.isArray(data.data.users)) {
          usersList = data.data.users;
        } else if (Array.isArray(data.users)) {
          usersList = data.users;
        }

        const mappedUsers = usersList.map((user: any) => {
          const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
          const status: SettingsUserRow['status'] = user.isActive === false ? 'inactive' : 'active';

          return {
            id: user.id,
            name: fullName || user.email || '—',
            role: user.role || 'UNKNOWN',
            email: user.email || '',
            status,
            joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : ''
          };
        });

        setUsers(mappedUsers);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        setUsersError('Erreur de connexion au serveur');
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      // Sauvegarder selon la section
      if (section === 'security') {
        // Sauvegarder les paramètres de sécurité
        const response = await api.post('/api/settings/security', securitySettings);
        const data = response.data;
        console.log('Réponse du serveur:', data);

        if (!data?.success) {
          throw new Error(data?.error || data?.message || 'Erreur lors de la sauvegarde');
        }

        console.log('Paramètres de sécurité sauvegardés:', securitySettings);
      } else if (section === 'general') {
        // Sauvegarder les informations générales
        const response = await api.post('/api/settings/general', collegeInfo);
        const data = response.data;
        console.log('Réponse du serveur:', data);

        if (!data?.success) {
          throw new Error(data?.message || 'Erreur lors de la sauvegarde');
        }

        console.log('Informations générales sauvegardées:', collegeInfo);
      } else if (section === 'notifications') {
        // Sauvegarder les paramètres de notification
        const response = await api.post('/api/settings/notifications', notificationSettings);
        const data = response.data;
        console.log('Réponse du serveur:', data);

        if (!data?.success) {
          throw new Error(data?.message || 'Erreur lors de la sauvegarde');
        }

        console.log('Paramètres de notification sauvegardés:', notificationSettings);
      } else if (section === 'appearance') {
        // Sauvegarder les paramètres d'apparence
        const response = await api.post('/api/settings/appearance', appearanceSettings);
        const data = response.data;
        console.log('Réponse du serveur:', data);

        if (!data?.success) {
          throw new Error(data?.message || 'Erreur lors de la sauvegarde');
        }

        // Appliquer les changements d'apparence immédiatement
        applyAppearanceSettings(appearanceSettings);
        console.log('Paramètres d\'apparence sauvegardés et appliqués:', appearanceSettings);
      } else if (section === 'database') {
        // Sauvegarder les paramètres de base de données
        const response = await api.post('/api/settings/database', databaseSettings);
        const data = response.data;
        console.log('Réponse du serveur:', data);

        if (!data?.success) {
          throw new Error(data?.message || 'Erreur lors de la sauvegarde');
        }

        console.log('Paramètres de base de données sauvegardés:', databaseSettings);
      } else if (section === 'email') {
        // Sauvegarder les paramètres email
        const response = await api.post('/api/settings/email', emailSettings);
        const data = response.data;
        console.log('Réponse du serveur:', data);

        if (!data?.success) {
          throw new Error(data?.message || 'Erreur lors de la sauvegarde');
        }

        console.log('Paramètres email sauvegardés:', emailSettings);
      }

      // Afficher le message de succès
      setSaved(true);
      setIsEditing(null);
      
      // Afficher une notification visible
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = '✓ Paramètres sauvegardés avec succès';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // Afficher une notification d'erreur visible
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorNotification.textContent = `❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        errorNotification.remove();
      }, 4000);
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Informations du Collège</h3>
        {isEditing === 'general' ? (
          <div className="flex gap-2">
            <button 
              onClick={() => handleSave('general')}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Check className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsEditing(null)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsEditing('general')}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-navy)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Nom du Collège</label>
          <input 
            type="text" 
            value={collegeInfo.name}
            onChange={(e) => setCollegeInfo({...collegeInfo, name: e.target.value})}
            disabled={isEditing !== 'general'}
            className={`input-field w-full ${isEditing !== 'general' ? 'bg-[var(--color-bg-secondary)] cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Année Scolaire</label>
          <input 
            type="text" 
            value={collegeInfo.year}
            onChange={(e) => setCollegeInfo({...collegeInfo, year: e.target.value})}
            disabled={isEditing !== 'general'}
            className={`input-field w-full ${isEditing !== 'general' ? 'bg-[var(--color-bg-secondary)] cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Directeur(s)</label>
          <input 
            type="text" 
            value={collegeInfo.principal}
            onChange={(e) => setCollegeInfo({...collegeInfo, principal: e.target.value})}
            disabled={isEditing !== 'general'}
            className={`input-field w-full ${isEditing !== 'general' ? 'bg-[var(--color-bg-secondary)] cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Téléphone</label>
          <input 
            type="text" 
            value={collegeInfo.phone}
            onChange={(e) => setCollegeInfo({...collegeInfo, phone: e.target.value})}
            disabled={isEditing !== 'general'}
            className={`input-field w-full ${isEditing !== 'general' ? 'bg-[var(--color-bg-secondary)] cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Email</label>
          <input 
            type="email" 
            value={collegeInfo.email}
            onChange={(e) => setCollegeInfo({...collegeInfo, email: e.target.value})}
            disabled={isEditing !== 'general'}
            className={`input-field w-full ${isEditing !== 'general' ? 'bg-[var(--color-bg-secondary)] cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Site Web</label>
          <input 
            type="text" 
            value={collegeInfo.website}
            onChange={(e) => setCollegeInfo({...collegeInfo, website: e.target.value})}
            disabled={isEditing !== 'general'}
            className={`input-field w-full ${isEditing !== 'general' ? 'bg-[var(--color-bg-secondary)] cursor-not-allowed' : ''}`}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Adresse</label>
        <textarea 
          value={collegeInfo.address}
          onChange={(e) => setCollegeInfo({...collegeInfo, address: e.target.value})}
          disabled={isEditing !== 'general'}
          rows={2}
          className={`input-field w-full ${isEditing !== 'general' ? 'bg-[var(--color-bg-secondary)] cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Paramètres de Sécurité</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Durée de Session (minutes)
          </label>
          <input 
            type="number" 
            value={securitySettings.sessionTimeout}
            onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
            className="input-field w-full md:w-32"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Longueur Minimale du Mot de Passe
          </label>
          <input 
            type="number" 
            value={securitySettings.passwordMinLength}
            onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
            className="input-field w-full md:w-32"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Tentatives de Connexion Maximales
          </label>
          <input 
            type="number" 
            value={securitySettings.maxLoginAttempts}
            onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
            className="input-field w-full md:w-32"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={securitySettings.requireUppercase}
              onChange={(e) => setSecuritySettings({...securitySettings, requireUppercase: e.target.checked})}
              className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
            />
            <span className="text-[var(--color-text-secondary)]">Requérir des lettres majuscules</span>
          </label>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={securitySettings.requireNumbers}
              onChange={(e) => setSecuritySettings({...securitySettings, requireNumbers: e.target.checked})}
              className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
            />
            <span className="text-[var(--color-text-secondary)]">Requérir des chiffres</span>
          </label>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={securitySettings.requireSpecialChars}
              onChange={(e) => setSecuritySettings({...securitySettings, requireSpecialChars: e.target.checked})}
              className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
            />
            <span className="text-[var(--color-text-secondary)]">Requérir des caractères spéciaux</span>
          </label>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={securitySettings.enableTwoFactor}
              onChange={(e) => setSecuritySettings({...securitySettings, enableTwoFactor: e.target.checked})}
              className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
            />
            <span className="text-[var(--color-text-secondary)]">Activer l\'authentification à deux facteurs</span>
          </label>
        </div>

        <button 
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={() => handleSave('security')}
          disabled={saving}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les Paramètres de Sécurité'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <Check className="w-5 h-5" />
            <span className="font-medium">Paramètres de sécurité sauvegardés avec succès !</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Paramètres de Notification</h3>
      
      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={notificationSettings.emailNotifications}
            onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Notifications par email</span>
        </label>
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={notificationSettings.browserNotifications}
            onChange={(e) => setNotificationSettings({...notificationSettings, browserNotifications: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Notifications du navigateur</span>
        </label>
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={notificationSettings.gradeUpdates}
            onChange={(e) => setNotificationSettings({...notificationSettings, gradeUpdates: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Mises à jour des notes</span>
        </label>
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={notificationSettings.attendanceAlerts}
            onChange={(e) => setNotificationSettings({...notificationSettings, attendanceAlerts: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Alertes d\'absence</span>
        </label>
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={notificationSettings.appointmentReminders}
            onChange={(e) => setNotificationSettings({...notificationSettings, appointmentReminders: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Rappels de rendez-vous</span>
        </label>
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={notificationSettings.systemUpdates}
            onChange={(e) => setNotificationSettings({...notificationSettings, systemUpdates: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Mises à jour du système</span>
        </label>
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={notificationSettings.newsletter}
            onChange={(e) => setNotificationSettings({...notificationSettings, newsletter: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Newsletter mensuelle</span>
        </label>
      </div>

      <button className="btn-primary" onClick={() => handleSave('notifications')}>
        <Save className="w-4 h-4 mr-2" />
        Sauvegarder les Paramètres de Notification
      </button>
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">À Propos du Système</h3>
      
      <div className="card p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-[var(--color-primary-navy)] flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-[var(--color-primary-gold)]" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[var(--color-text-primary)]">Forum de L\'excellence</h4>
              <p className="text-[var(--color-text-secondary)]">Système de Gestion Scolaire</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Version</p>
              <p className="font-medium text-[var(--color-text-primary)]">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Dernière Mise à Jour</p>
              <p className="font-medium text-[var(--color-text-primary)]">Janvier 2024</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Développé par</p>
              <p className="font-medium text-[var(--color-text-primary)]">Equipe Forum Excellence</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Licence</p>
              <p className="font-medium text-[var(--color-text-primary)]">Propriétaire</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Description</p>
            <p className="text-[var(--color-text-primary)]">
              Système complet de gestion scolaire pour le Forum de L\'excellence, conçu pour gérer 
              les élèves, les enseignants, les programmes et les activités académiques. 
              Sous la direction de M. et Mme Fall, le collège s\'engage à offrir une éducation 
              de qualité à tous ses élèves.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Support Technique</h4>
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Email: support@forumexcellence.sn
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Téléphone: +221 33 123 4568
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Horaires: Lundi - Vendredi, 8h - 17h
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Documentation</h4>
          <div className="space-y-3">
            <button className="text-[var(--color-primary-navy)] hover:underline text-sm">
              Guide de l\'Utilisateur
            </button>
            <button className="text-[var(--color-primary-navy)] hover:underline text-sm block">
              Documentation API
            </button>
            <button className="text-[var(--color-primary-navy)] hover:underline text-sm block">
              Politique de Confidentialité
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primaryColor: '#003366',
    accentColor: '#C39D5B',
    fontSize: 'medium'
  });

  const [databaseSettings, setDatabaseSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    encryptionEnabled: true
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    senderEmail: 'noreply@forumexcellence.sn',
    senderName: 'Forum de L\'excellence',
    useSSL: true,
    enableAutoNotifications: true
  });

  const renderUsersManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Gestion des Utilisateurs</h3>
        <button className="btn-primary text-sm">Ajouter un Utilisateur</button>
      </div>

      <div className="overflow-x-auto">
        {usersLoading ? (
          <div className="p-4 text-sm text-[var(--color-text-muted)]">Chargement des utilisateurs...</div>
        ) : usersError ? (
          <div className="p-4 text-sm text-red-600 dark:text-red-400">{usersError}</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-sm text-[var(--color-text-muted)]">Aucun utilisateur trouve.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-4 text-[var(--color-text-secondary)] font-semibold">Nom</th>
                <th className="text-left py-3 px-4 text-[var(--color-text-secondary)] font-semibold">Role</th>
                <th className="text-left py-3 px-4 text-[var(--color-text-secondary)] font-semibold">Email</th>
                <th className="text-left py-3 px-4 text-[var(--color-text-secondary)] font-semibold">Statut</th>
                <th className="text-left py-3 px-4 text-[var(--color-text-secondary)] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-secondary)]">
                  <td className="py-3 px-4 text-[var(--color-text-primary)]">{user.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--color-text-secondary)]">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {user.status === 'active' ? '✓ Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button className="text-[var(--color-primary-navy)] hover:underline mr-3">Editer</button>
                    <button className="text-red-600 hover:underline">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Total d'utilisateurs: <span className="font-bold text-[var(--color-text-primary)]">{users.length}</span>
        </p>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Paramètres d'Apparence</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Thème</label>
          <select 
            value={appearanceSettings.theme}
            onChange={(e) => setAppearanceSettings({...appearanceSettings, theme: e.target.value})}
            className="input-field w-full"
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="auto">Automatique</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Couleur Primaire</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={appearanceSettings.primaryColor}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, primaryColor: e.target.value})}
              className="w-12 h-12 rounded cursor-pointer"
            />
            <input 
              type="text" 
              value={appearanceSettings.primaryColor}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, primaryColor: e.target.value})}
              className="input-field flex-1"
              placeholder="#003366"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Couleur d'Accent</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={appearanceSettings.accentColor}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, accentColor: e.target.value})}
              className="w-12 h-12 rounded cursor-pointer"
            />
            <input 
              type="text" 
              value={appearanceSettings.accentColor}
              onChange={(e) => setAppearanceSettings({...appearanceSettings, accentColor: e.target.value})}
              className="input-field flex-1"
              placeholder="#C39D5B"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Taille de Police</label>
          <select 
            value={appearanceSettings.fontSize}
            onChange={(e) => setAppearanceSettings({...appearanceSettings, fontSize: e.target.value})}
            className="input-field w-full"
          >
            <option value="small">Petite</option>
            <option value="medium">Moyenne</option>
            <option value="large">Grande</option>
          </select>
        </div>
      </div>

      <div className="card p-4 bg-[var(--color-bg-secondary)]">
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">Aperçu:</p>
        <div className="flex gap-3">
          <div style={{backgroundColor: appearanceSettings.primaryColor}} className="w-16 h-16 rounded-lg"></div>
          <div style={{backgroundColor: appearanceSettings.accentColor}} className="w-16 h-16 rounded-lg"></div>
        </div>
      </div>

      <button 
        className="btn-primary flex items-center gap-2" 
        onClick={() => handleSave('appearance')}
        disabled={saving}
      >
        <Save className="w-4 h-4" />
        {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les Paramètres d\'Apparence'}
      </button>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Gestion de la Base de Données</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">Taille de la Base de Données</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">2.4 GB</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4 dark:bg-gray-700">
            <div className="bg-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
          </div>
        </div>

        <div className="card p-4 bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">Dernière Sauvegarde</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">2h 30m</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">Aujourd\'hui à 14:30</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-[var(--color-text-primary)]">Configuration des Sauvegardes</h4>
        
        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={databaseSettings.autoBackup}
            onChange={(e) => setDatabaseSettings({...databaseSettings, autoBackup: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Sauvegardes Automatiques</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Fréquence de Sauvegarde</label>
          <select 
            value={databaseSettings.backupFrequency}
            onChange={(e) => setDatabaseSettings({...databaseSettings, backupFrequency: e.target.value})}
            disabled={!databaseSettings.autoBackup}
            className="input-field w-full disabled:opacity-50"
          >
            <option value="hourly">Toutes les heures</option>
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuelle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Durée de Rétention (jours)</label>
          <input 
            type="number" 
            value={databaseSettings.retentionDays}
            onChange={(e) => setDatabaseSettings({...databaseSettings, retentionDays: parseInt(e.target.value)})}
            className="input-field w-full"
            min="7"
            max="365"
          />
        </div>

        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={databaseSettings.encryptionEnabled}
            onChange={(e) => setDatabaseSettings({...databaseSettings, encryptionEnabled: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Chiffrer les Sauvegardes</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button 
          className="btn-primary flex items-center gap-2" 
          onClick={() => handleSave('database')}
          disabled={saving}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les Paramètres'}
        </button>
        <button className="btn-secondary">Sauvegarder Maintenant</button>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Configuration des Emails</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Serveur SMTP</label>
          <input 
            type="text" 
            value={emailSettings.smtpServer}
            onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
            placeholder="smtp.gmail.com"
            className="input-field w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Port SMTP</label>
            <input 
              type="number" 
              value={emailSettings.smtpPort}
              onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value)})}
              placeholder="587"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mt-7">
              <input 
                type="checkbox" 
                checked={emailSettings.useSSL}
                onChange={(e) => setEmailSettings({...emailSettings, useSSL: e.target.checked})}
                className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
              />
              Utiliser SSL/TLS
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Email de l'Expéditeur</label>
          <input 
            type="email" 
            value={emailSettings.senderEmail}
            onChange={(e) => setEmailSettings({...emailSettings, senderEmail: e.target.value})}
            placeholder="noreply@forumexcellence.sn"
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Nom de l'Expéditeur</label>
          <input 
            type="text" 
            value={emailSettings.senderName}
            onChange={(e) => setEmailSettings({...emailSettings, senderName: e.target.value})}
            placeholder="Forum de L'excellence"
            className="input-field w-full"
          />
        </div>

        <label className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={emailSettings.enableAutoNotifications}
            onChange={(e) => setEmailSettings({...emailSettings, enableAutoNotifications: e.target.checked})}
            className="w-4 h-4 text-[var(--color-primary-navy)] rounded"
          />
          <span className="text-[var(--color-text-secondary)]">Activer les Notifications Automatiques</span>
        </label>
      </div>

      <div className="card p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <p className="text-sm text-[var(--color-text-secondary)]">
          ⚠️ Les informations sensibles (mots de passe) ne peuvent pas être modifiées ici pour des raisons de sécurité. 
          Contactez le support technique pour changer les données d'authentification.
        </p>
      </div>

      <button 
        className="btn-primary flex items-center gap-2" 
        onClick={() => handleSave('email')}
        disabled={saving}
      >
        <Save className="w-4 h-4" />
        {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les Paramètres Email'}
      </button>
    </div>
  );

  return (
    <div className="section">
      <div className="section-content">
        <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin', { state: { scrollTo: 'parametres-securite' } })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-gold)]/15 text-[var(--color-primary-gold)] border border-[var(--color-primary-gold)]/40 shadow-sm hover:bg-[var(--color-primary-gold)] hover:text-[var(--color-primary-navy)] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Paramètres</h1>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-900/20 px-6 py-4 rounded-lg animate-fade-in-up shadow-md">
            <Check className="w-6 h-6" />
            <div>
              <p className="font-semibold">Paramètres sauvegardés avec succès !</p>
              <p className="text-sm text-green-600/80 dark:text-green-400/80">Vos modifications ont été enregistrées dans la base de données.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="col-span-1">
          <div className="card p-4">
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-[var(--color-primary-navy)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card p-4 mt-6 border-red-200">
            <h4 className="font-semibold text-red-600 mb-3">Zone de Danger</h4>
            <button className="w-full btn-secondary border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              Déconnexion de Tous les Appareils
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="col-span-3">
          <div className="card p-6">
            {activeSection === 'general' && renderGeneralSettings()}
            {activeSection === 'security' && renderSecuritySettings()}
            {activeSection === 'notifications' && renderNotificationSettings()}
            {activeSection === 'users' && renderUsersManagement()}
            {activeSection === 'appearance' && renderAppearanceSettings()}
            {activeSection === 'database' && renderDatabaseSettings()}
            {activeSection === 'email' && renderEmailSettings()}
            {activeSection === 'about' && renderAbout()}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;