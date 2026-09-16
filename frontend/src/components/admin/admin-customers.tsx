'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { useAdminCustomers } from '@/hooks/use-admin';
import { formatNaira, formatDate, cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

const ROLES: { value: Role | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'ADMIN', label: 'Admins' },
];

export function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');

  const query = useAdminCustomers({ page, q: q || undefined, role: role === 'all' ? undefined : role });
  const customers = query.data?.customers ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Customers</h1>

      <div className="flex flex-wrap items-center gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search.trim());
            setPage(1);
          }}
          className="relative max-w-md flex-1"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="pl-9"
          />
        </form>
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setRole(r.value);
                setPage(1);
              }}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                role === r.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Try a different search or filter." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Spent</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="block">
                        <p className="font-medium text-primary">{c.fullName}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          c.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground',
                        )}
                      >
                        {c.role === 'ADMIN' ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.orderCount}</td>
                    <td className="px-4 py-3 font-medium">{formatNaira(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
