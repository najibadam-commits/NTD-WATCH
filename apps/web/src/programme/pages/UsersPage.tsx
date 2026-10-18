import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Notice } from '@ntd-watch/design-system';
import {
  PERSON_LEVEL_PERMISSIONS,
  ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type Role,
} from '@ntd-watch/domain';
import { patchUser, type UserRow } from '../api';
import { PageHeader, QueryBoundary } from '../components/Common';
import { formatDateTime } from '../format';
import { useRole, useUsers } from '../useProgrammeData';
import styles from '../programme.module.css';
import { TableScroll } from '../components/TableScroll';

export function UsersPage() {
  const { t } = useTranslation();
  const role = useRole();
  const query = useUsers();
  const client = useQueryClient();
  const [filter, setFilter] = useState<Role | ''>('');
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Role>>({});

  const mutation = useMutation({
    mutationFn: (v: { id: string; body: Partial<Pick<UserRow, 'active' | 'role' | 'scopeId'>> }) =>
      patchUser(role, v.id, v.body),
    onSuccess: ({ user }) => {
      setNotice({ tone: 'success', text: t('programme.users.saved', { name: user.label }) });
      void client.invalidateQueries({ queryKey: ['programme', 'users'] });
    },
    onError: (e) =>
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : t('programme.errorBody') }),
  });

  const scopeFor = (r: Role): string =>
    ({ chw: 'com-01', facility: 'fac-c1', lga: 'lga-c', state: 'st-arewa', admin: 'all' })[r];

  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.users.title')} lead={t('programme.users.lead')} />
      <Notice tone="info">{t('programme.users.simulated')}</Notice>
      <QueryBoundary query={query} isEmpty={(d) => d.users.length === 0}>
        {(d) => {
          const users = d.users.filter((u) => !filter || u.role === filter);
          return (
            <>
              {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
              <section className={styles.panel} aria-labelledby="usr-table">
                <div className={styles.between}>
                  <h2 id="usr-table">{t('programme.users.directory')}</h2>
                  <label className={styles.field}>
                    {t('programme.users.filterRole')}
                    <select value={filter} onChange={(e) => setFilter(e.target.value as Role | '')}>
                      <option value="">{t('programme.filters.all')}</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <TableScroll>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('programme.users.user')}</th>
                        <th scope="col">{t('programme.users.role')}</th>
                        <th scope="col">{t('programme.users.scope')}</th>
                        <th scope="col">{t('programme.users.status')}</th>
                        <th scope="col">{t('programme.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const protectedUser = u.role === 'admin';
                        const draft = drafts[u.id] ?? u.role;
                        return (
                          <tr key={u.id}>
                            <th scope="row">
                              {u.label}
                              <div className={styles.muted}>{u.id}</div>
                            </th>
                            <td>
                              <label className="visually-hidden" htmlFor={`role-${u.id}`}>
                                {t('programme.users.roleFor', { name: u.label })}
                              </label>
                              <select
                                id={`role-${u.id}`}
                                value={draft}
                                disabled={protectedUser}
                                onChange={(e) =>
                                  setDrafts((x) => ({ ...x, [u.id]: e.target.value as Role }))
                                }
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>{u.scopeId}</td>
                            <td>
                              <span
                                className={`${styles.pill} ${u.active ? styles.pillLow : styles.pillNone}`}
                              >
                                {u.active ? '● ' : '○ '}
                                {u.active
                                  ? t('programme.users.active')
                                  : t('programme.users.disabled')}
                              </span>
                            </td>
                            <td>
                              <div className={styles.row}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={protectedUser || draft === u.role || mutation.isPending}
                                  aria-label={t('programme.users.applyRole', { name: u.label })}
                                  onClick={() =>
                                    mutation.mutate({
                                      id: u.id,
                                      body: { role: draft, scopeId: scopeFor(draft) },
                                    })
                                  }
                                >
                                  {t('programme.users.apply')}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={protectedUser || mutation.isPending}
                                  aria-label={
                                    u.active
                                      ? t('programme.users.disableUser', { name: u.label })
                                      : t('programme.users.enableUser', { name: u.label })
                                  }
                                  onClick={() =>
                                    mutation.mutate({ id: u.id, body: { active: !u.active } })
                                  }
                                >
                                  {u.active
                                    ? t('programme.users.disable')
                                    : t('programme.users.enable')}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableScroll>
                <p className={styles.muted}>{t('programme.users.protected')}</p>
              </section>

              <section className={styles.panel} aria-labelledby="usr-matrix">
                <h2 id="usr-matrix">{t('programme.users.matrix')}</h2>
                <p className={styles.muted}>{t('programme.users.matrixNote')}</p>
                <TableScroll>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('programme.users.role')}</th>
                        <th scope="col">{t('programme.users.permissions')}</th>
                        <th scope="col">{t('programme.users.personLevel')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROLES.map((r) => (
                        <tr key={r}>
                          <th scope="row">{ROLE_LABELS[r]}</th>
                          <td>{ROLE_PERMISSIONS[r].join(', ')}</td>
                          <td>
                            {ROLE_PERMISSIONS[r].some((p) => PERSON_LEVEL_PERMISSIONS.includes(p))
                              ? t('common.yes')
                              : t('common.no')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </section>

              <section className={styles.panel} aria-labelledby="usr-audit">
                <h2 id="usr-audit">{t('programme.users.audit')}</h2>
                {d.audit.length === 0 ? (
                  <p>{t('programme.users.noAudit')}</p>
                ) : (
                  <ul className={styles.stack} style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {d.audit.map((a) => (
                      <li key={a.id}>
                        <span className={styles.muted}>{formatDateTime(a.at)}</span> · {a.action} ·{' '}
                        {a.target} · {a.detail}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
