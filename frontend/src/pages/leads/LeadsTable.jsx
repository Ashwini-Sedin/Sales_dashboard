import React, { useState } from 'react';
import StageBadge from './StageBadge';

const calculateTurnaround = (createdAt) => {
  if (!createdAt) return 0;
  const createdDate = new Date(createdAt);
  const today = new Date();
  const diffTime = Math.abs(today - createdDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const LeadsTable = ({ leads, isLoading }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading leads...</div>;
  if (!leads || leads.length === 0) return <div className="p-8 text-center text-gray-500">No leads found.</div>;

  const sortedLeads = [...leads].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => requestSort('name')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => requestSort('company')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company {getSortIcon('company')}
              </th>
              <th onClick={() => requestSort('source')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source {getSortIcon('source')}
              </th>
              <th onClick={() => requestSort('stage')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage {getSortIcon('stage')}
              </th>
              <th onClick={() => requestSort('score')} className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score {getSortIcon('score')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turnaround
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLeads.map((lead) => {
              const turnaroundDays = calculateTurnaround(lead.created_at);
              const turnaroundClass = turnaroundDays > 14 ? 'text-red-600 font-bold' : turnaroundDays > 7 ? 'text-orange-500 font-semibold' : 'text-gray-900';

              return (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{lead.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{lead.source || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.score || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${turnaroundClass}`}>{turnaroundDays} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsTable;
