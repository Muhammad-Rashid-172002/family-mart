/**
 * Staff Accounts & Role-Based Permissions Management
 */
import React, { useState } from 'react';
import { UserCheck, Shield, Plus, Check, X, ShieldAlert, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, UserProfile } from '../../types';

export const StaffManagement: React.FC = () => {
  const { currentUser } = useAuth();

  const [staffList, setStaffList] = useState<UserProfile[]>([
    {
      id: 'usr-owner-01',
      email: 'muhammadrashid172002@gmail.com',
      displayName: 'Muhammad Rashid (Owner)',
      role: 'owner',
      phone: '+92 300 1234567',
      status: 'active',
      createdAt: '2026-01-01',
    },
    {
      id: 'usr-mgr-01',
      email: 'hamza.manager@familymart.pk',
      displayName: 'Hamza Khan (Store Manager)',
      role: 'manager',
      phone: '+92 321 9876543',
      status: 'active',
      createdAt: '2026-02-15',
    },
    {
      id: 'usr-cashier-01',
      email: 'bilal.cashier@familymart.pk',
      displayName: 'Bilal Ahmed (Senior Cashier)',
      role: 'cashier',
      phone: '+92 333 4455667',
      status: 'active',
      createdAt: '2026-03-01',
    },
    {
      id: 'usr-inv-01',
      email: 'usman.inventory@familymart.pk',
      displayName: 'Usman Ali (Stock Supervisor)',
      role: 'inventory_staff',
      phone: '+92 301 5566778',
      status: 'active',
      createdAt: '2026-03-10',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [phone, setPhone] = useState('+92 ');

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: UserProfile = {
      id: `usr-${Date.now()}`,
      displayName,
      email,
      role,
      phone,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setStaffList((prev) => [...prev, newStaff]);
    setModalOpen(false);
  };

  const permissionsMatrix: {
    permission: string;
    owner: boolean;
    manager: boolean;
    cashier: boolean;
    inventory: boolean;
  }[] = [
    { permission: 'POS Checkout & Receipt Printing', owner: true, manager: true, cashier: true, inventory: false },
    { permission: 'Hold / Resume Customer Cart', owner: true, manager: true, cashier: true, inventory: false },
    { permission: 'Authorize Customer Returns & Refunds', owner: true, manager: true, cashier: false, inventory: false },
    { permission: 'Add & Edit Products / Prices', owner: true, manager: true, cashier: false, inventory: true },
    { permission: 'Receive Purchase Orders & Stock', owner: true, manager: true, cashier: false, inventory: true },
    { permission: 'Perform Manual Stock Adjustments', owner: true, manager: true, cashier: false, inventory: true },
    { permission: 'View Profit & Loss / Margin Reports', owner: true, manager: true, cashier: false, inventory: false },
    { permission: 'Record Store Operating Expenses', owner: true, manager: true, cashier: false, inventory: false },
    { permission: 'Manage Staff Roles & Security', owner: true, manager: false, cashier: false, inventory: false },
    { permission: 'Configure Store Settings & Hardware', owner: true, manager: false, cashier: false, inventory: false },
    { permission: 'Inspect Security Audit Logs', owner: true, manager: true, cashier: false, inventory: false },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Staff & Role Permissions
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Role-Based Access Control (RBAC) enforced on the server and client interfaces.
          </p>
        </div>

        <button
          onClick={() => {
            setDisplayName('');
            setEmail('');
            setPhone('+92 ');
            setRole('cashier');
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffList.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    member.role === 'owner'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : member.role === 'manager'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : member.role === 'cashier'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {member.role.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Active</span>
              </div>

              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {member.displayName}
              </h3>
              <div className="text-xs text-neutral-500 truncate mt-0.5">{member.email}</div>
              {member.phone && (
                <div className="text-[11px] text-neutral-500 font-mono mt-1">{member.phone}</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
              ID: {member.id}
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            Role Permission Matrix
          </h2>
          <p className="text-xs text-neutral-500">
            Enforced across all API routes, database rules, and UI navigation tabs.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Permission / Capability</th>
                <th className="px-4 py-3 text-center">Owner / Super Admin</th>
                <th className="px-4 py-3 text-center">Store Manager</th>
                <th className="px-4 py-3 text-center">Cashier Terminal</th>
                <th className="px-4 py-3 text-center">Inventory Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {permissionsMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 font-semibold text-neutral-800 dark:text-neutral-200">
                    {row.permission}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.owner ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-neutral-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.manager ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-neutral-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.cashier ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-neutral-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.inventory ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-neutral-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Add Staff User
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Asad Javed"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@familymart.pk"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Assigned Store Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="cashier">Cashier (POS Checkout Only)</option>
                  <option value="inventory_staff">Inventory Staff (Stock & Purchasing)</option>
                  <option value="manager">Store Manager (Products, Reports & Refunds)</option>
                  <option value="owner">Owner / Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Mobile / Emergency Contact
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-neutral-300 px-4 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
