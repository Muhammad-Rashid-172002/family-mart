/**
 * Security & Financial Operations Audit Log
 */
import React, { useState } from 'react';
import { FileText, Search, ShieldAlert, Filter, Clock } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AuditLogs: React.FC = () => {
  const { auditLogs } = useStore();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filtered = auditLogs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch =
      search === '' ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Security & Operations Audit Logs
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Immutable log of sensitive operations: price changes, stock adjustments, discounts, and cashier checkouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter audit entries..."
              className="w-full rounded-xl border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white py-1.5 px-3 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          >
            <option value="all">All Actions</option>
            <option value="CHECKOUT_SALE">Sales Checkouts</option>
            <option value="UPDATE_PRICE">Price Changes</option>
            <option value="UPDATE_COST">Cost Price Changes</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
            <option value="PROCESS_RETURN">Refunds / Returns</option>
            <option value="HOLD_SALE">Parked Bills</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Timestamp (PKT)</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Detailed Audit Record</th>
                <th className="px-4 py-3">User & Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-bold text-neutral-900 dark:text-white">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                      {log.entityType} ({log.entityId.slice(0, 10)})
                    </td>

                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {log.details}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {log.userName}
                      </div>
                      <div className="text-[10px] text-neutral-500 uppercase font-semibold">
                        {log.userRole.replace('_', ' ')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
