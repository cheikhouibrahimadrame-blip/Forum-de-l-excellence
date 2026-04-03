# Admin Dashboard Navigation - Content Editors Integration

## 📍 Where to Add Navigation Links

To make the content editors easily accessible from the Admin Dashboard, add these links in **AdminDashboard.tsx**:

### Option 1: Quick Links Section
Add a new "Page Content Management" section to AdminDashboard.tsx:

```tsx
// In your AdminDashboard component, add this section:

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <Link 
    to="/admin/mainpage"
    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
  >
    <div className="flex items-center gap-3 mb-2">
      <Home className="w-6 h-6 text-[var(--color-primary-gold)]" />
      <h3 className="font-semibold">Accueil</h3>
    </div>
    <p className="text-sm text-gray-600">Éditer la page d'accueil</p>
  </Link>

  <Link 
    to="/admin/content/admissions"
    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
  >
    <div className="flex items-center gap-3 mb-2">
      <FileText className="w-6 h-6 text-[var(--color-primary-gold)]" />
      <h3 className="font-semibold">Admissions</h3>
    </div>
    <p className="text-sm text-gray-600">Éditer la page admissions</p>
  </Link>

  <Link 
    to="/admin/content/programs"
    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
  >
    <div className="flex items-center gap-3 mb-2">
      <BookOpen className="w-6 h-6 text-[var(--color-primary-gold)]" />
      <h3 className="font-semibold">Programmes</h3>
    </div>
    <p className="text-sm text-gray-600">Éditer les programmes</p>
  </Link>

  <Link 
    to="/admin/content/campuslife"
    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
  >
    <div className="flex items-center gap-3 mb-2">
      <Users className="w-6 h-6 text-[var(--color-primary-gold)]" />
      <h3 className="font-semibold">Vie du Campus</h3>
    </div>
    <p className="text-sm text-gray-600">Éditer la vie du campus</p>
  </Link>
</div>
```

### Option 2: Sidebar Navigation
Add these items to the admin sidebar menu:

```tsx
// In your admin sidebar/navigation component:

const adminContentLinks = [
  {
    label: 'Accueil',
    path: '/admin/mainpage',
    icon: <Home className="w-5 h-5" />
  },
  {
    label: 'Admissions',
    path: '/admin/content/admissions',
    icon: <FileText className="w-5 h-5" />
  },
  {
    label: 'Programmes',
    path: '/admin/content/programs',
    icon: <BookOpen className="w-5 h-5" />
  },
  {
    label: 'Vie du Campus',
    path: '/admin/content/campuslife',
    icon: <Users className="w-5 h-5" />
  }
];

{adminContentLinks.map(link => (
  <Link
    key={link.path}
    to={link.path}
    className="nav-link flex items-center gap-3"
  >
    {link.icon}
    {link.label}
  </Link>
))}
```

### Option 3: Dropdown Menu
Add a dropdown for "Content Management":

```tsx
// In your admin navigation:

<div className="dropdown">
  <button className="btn btn-sm dropdown-toggle">
    📝 Gérer le Contenu
    <ChevronDown className="w-4 h-4" />
  </button>
  <ul className="dropdown-menu">
    <li>
      <Link to="/admin/mainpage">Page d'accueil</Link>
    </li>
    <li>
      <Link to="/admin/content/admissions">Admissions</Link>
    </li>
    <li>
      <Link to="/admin/content/programs">Programmes</Link>
    </li>
    <li>
      <Link to="/admin/content/campuslife">Vie du Campus</Link>
    </li>
  </ul>
</div>
```

---

## 🎯 Recommended Implementation

Here's a complete AdminDashboard component with content editor links:

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, BookOpen, FileText, Settings, BarChart3 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="section">
      <div className="section-content">
        <h1 className="text-4xl font-bold mb-12">Tableau de Bord Admin</h1>

        {/* 📝 Content Management Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Gérer le Contenu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Homepage */}
            <Link 
              to="/admin/mainpage"
              className="card p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-[var(--color-primary-gold)] hover:border-[var(--color-primary-gold)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[var(--color-primary-gold)]/10 rounded-lg">
                  <Home className="w-6 h-6 text-[var(--color-primary-gold)]" />
                </div>
                <h3 className="font-bold">Accueil</h3>
              </div>
              <p className="text-sm text-gray-600">Modifier la page d'accueil</p>
              <p className="text-xs text-gray-400 mt-2">Page principale du site</p>
            </Link>

            {/* Admissions */}
            <Link 
              to="/admin/content/admissions"
              className="card p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-[var(--color-primary-gold)] hover:border-[var(--color-primary-gold)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[var(--color-primary-gold)]/10 rounded-lg">
                  <FileText className="w-6 h-6 text-[var(--color-primary-gold)]" />
                </div>
                <h3 className="font-bold">Admissions</h3>
              </div>
              <p className="text-sm text-gray-600">Éditer les admissions</p>
              <p className="text-xs text-gray-400 mt-2">Critères et processus</p>
            </Link>

            {/* Programs */}
            <Link 
              to="/admin/content/programs"
              className="card p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-[var(--color-primary-gold)] hover:border-[var(--color-primary-gold)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[var(--color-primary-gold)]/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-[var(--color-primary-gold)]" />
                </div>
                <h3 className="font-bold">Programmes</h3>
              </div>
              <p className="text-sm text-gray-600">Éditer les programmes</p>
              <p className="text-xs text-gray-400 mt-2">Curriculum et cursus</p>
            </Link>

            {/* Campus Life */}
            <Link 
              to="/admin/content/campuslife"
              className="card p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-[var(--color-primary-gold)] hover:border-[var(--color-primary-gold)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[var(--color-primary-gold)]/10 rounded-lg">
                  <Users className="w-6 h-6 text-[var(--color-primary-gold)]" />
                </div>
                <h3 className="font-bold">Vie du Campus</h3>
              </div>
              <p className="text-sm text-gray-600">Éditer la vie du campus</p>
              <p className="text-xs text-gray-400 mt-2">Événements et activités</p>
            </Link>
          </div>
        </section>

        {/* System Management Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Gestion du Système</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Users */}
            <Link 
              to="/admin/users"
              className="card p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <Users className="w-6 h-6 text-[var(--color-primary-gold)] mb-3" />
              <h3 className="font-bold mb-2">Utilisateurs</h3>
              <p className="text-sm text-gray-600">Gérer les comptes</p>
            </Link>

            {/* Classes */}
            <Link 
              to="/admin/classes"
              className="card p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <Users className="w-6 h-6 text-[var(--color-primary-gold)] mb-3" />
              <h3 className="font-bold mb-2">Classes</h3>
              <p className="text-sm text-gray-600">Gérer les classes</p>
            </Link>

            {/* Reports */}
            <Link 
              to="/admin/reports"
              className="card p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <BarChart3 className="w-6 h-6 text-[var(--color-primary-gold)] mb-3" />
              <h3 className="font-bold mb-2">Rapports</h3>
              <p className="text-sm text-gray-600">Voir les statistiques</p>
            </Link>
          </div>
        </section>

        {/* Settings Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Configuration</h2>
          <Link 
            to="/admin/settings"
            className="card p-6 hover:shadow-lg transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="p-3 bg-[var(--color-primary-gold)]/10 rounded-lg">
              <Settings className="w-6 h-6 text-[var(--color-primary-gold)]" />
            </div>
            <div>
              <h3 className="font-bold">Paramètres Système</h3>
              <p className="text-sm text-gray-600">Configuration générale</p>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

---

## 🎨 Styling Tips

Use these CSS classes to make the links stand out:

```css
/* In your CSS file */
.content-editor-card {
  @apply card p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-[var(--color-primary-gold)];
}

.content-editor-card:hover {
  @apply shadow-lg translate-y-[-2px];
}

.content-editor-icon {
  @apply p-2 bg-[var(--color-primary-gold)]/10 rounded-lg;
}
```

Then use them:
```tsx
<Link to="/admin/mainpage" className="content-editor-card">
  <div className="flex items-center gap-3 mb-4">
    <div className="content-editor-icon">
      <Home className="w-6 h-6 text-[var(--color-primary-gold)]" />
    </div>
    <h3 className="font-bold">Accueil</h3>
  </div>
  <p className="text-sm text-gray-600">Modifier la page d'accueil</p>
</Link>
```

---

## ✅ Integration Checklist

- [ ] Find AdminDashboard.tsx location
- [ ] Choose integration option (quick links, sidebar, or dropdown)
- [ ] Add new imports (Home, BookOpen, FileText, Users icons)
- [ ] Copy navigation code to AdminDashboard
- [ ] Test links navigate to correct pages
- [ ] Check styling matches your design system
- [ ] Test authorization (only ADMIN can access)
- [ ] Update mobile responsive layout if needed

---

## 📱 Mobile Responsive Note

The grid layout automatically adjusts:
```tsx
grid-cols-1      // 1 column on mobile
md:grid-cols-2   // 2 columns on tablet
lg:grid-cols-4   // 4 columns on desktop
```

Adjust the breakpoints if needed:
```tsx
grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6
```

---

**Ready to integrate? Find AdminDashboard.tsx and add the content editor links!**
