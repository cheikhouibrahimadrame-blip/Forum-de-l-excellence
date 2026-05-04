import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { API } from '../../lib/apiRoutes';

export type UserSelectRole = 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
export type UserSelectValueKind = 'userId' | 'studentId' | 'teacherId' | 'parentId' | 'adminId';

export interface UserSelectOption {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  studentId?: string;
  teacherId?: string;
  parentId?: string;
  adminId?: string;
}

interface UserSelectProps {
  role: UserSelectRole | UserSelectRole[];
  valueKind?: UserSelectValueKind;
  value: string;
  onChange: (value: string, user?: UserSelectOption) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  emptyHint?: string;
  showEmail?: boolean;
  excludeUserIds?: string[];
}

const formatName = (u: UserSelectOption): string => {
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return full || u.email || 'Utilisateur sans nom';
};

const UserSelect: React.FC<UserSelectProps> = ({
  role,
  valueKind = 'userId',
  value,
  onChange,
  placeholder = 'Sélectionner une personne',
  className,
  required,
  disabled,
  emptyHint = 'Aucun utilisateur disponible',
  showEmail = false,
  excludeUserIds
}) => {
  const [users, setUsers] = useState<UserSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rolesKey = useMemo(() => (Array.isArray(role) ? role.slice().sort().join(',') : role), [role]);

  useEffect(() => {
    const controller = new AbortController();
    const roles = Array.isArray(role) ? role : [role];

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const responses = await Promise.all(
          roles.map((r) =>
            api.get(API.USERS, {
              params: { role: r, limit: 500, status: 'active' },
              signal: controller.signal
            })
          )
        );

        const all: UserSelectOption[] = [];
        responses.forEach((response) => {
          const items = Array.isArray(response.data?.data?.users)
            ? response.data.data.users
            : [];
          items.forEach((u: any) => {
            all.push({
              userId: String(u.id || ''),
              firstName: u.firstName || '',
              lastName: u.lastName || '',
              email: u.email || '',
              studentId: u.student?.id || undefined,
              teacherId: u.teacher?.id || undefined,
              parentId: u.parent?.id || undefined,
              adminId: u.admin?.id || undefined
            });
          });
        });

        all.sort((a, b) => formatName(a).localeCompare(formatName(b), 'fr'));
        setUsers(all);
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        setError(err?.response?.data?.error || err?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [rolesKey]);

  const exclude = useMemo(
    () => new Set((excludeUserIds || []).filter(Boolean)),
    [excludeUserIds]
  );

  const options = useMemo(() => {
    return users
      .filter((u) => !exclude.has(u.userId))
      .map((u) => {
        let id = '';
        if (valueKind === 'userId') id = u.userId;
        else if (valueKind === 'studentId') id = u.studentId || '';
        else if (valueKind === 'teacherId') id = u.teacherId || '';
        else if (valueKind === 'parentId') id = u.parentId || '';
        else if (valueKind === 'adminId') id = u.adminId || '';
        return { id, user: u };
      })
      .filter((opt) => opt.id);
  }, [users, valueKind, exclude]);

  const placeholderLabel = loading
    ? 'Chargement...'
    : options.length === 0
      ? (error || emptyHint)
      : placeholder;

  return (
    <select
      value={value}
      onChange={(e) => {
        const id = e.target.value;
        const match = options.find((opt) => opt.id === id);
        onChange(id, match?.user);
      }}
      className={className}
      required={required}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <option value="">{placeholderLabel}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {formatName(opt.user)}
          {showEmail && opt.user.email ? ` — ${opt.user.email}` : ''}
        </option>
      ))}
    </select>
  );
};

export default UserSelect;
