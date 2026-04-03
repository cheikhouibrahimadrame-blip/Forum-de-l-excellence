import type React from 'react';
import { Link } from 'react-router-dom';

const AdminPrograms: React.FC = () => {
  return (
    <div className="section">
      <div className="section-content">
        <div className="card p-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Programmes (herite)</h1>
          <p className="text-[var(--color-text-secondary)] mb-4">
            Cette page est issue de l'ancien modele college. Pour l'ecole primaire, utilisez les pages Classes et Matieres.
          </p>
          <div className="flex gap-3">
            <Link to="/admin/classes" className="btn-primary">Aller aux Classes</Link>
            <Link to="/admin/subjects" className="btn-secondary">Aller aux Matieres</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPrograms;
