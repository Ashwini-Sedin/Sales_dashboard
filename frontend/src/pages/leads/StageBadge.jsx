import React from 'react';

const stageColors = {
  'New': 'bg-blue-100 text-blue-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Qualified': 'bg-purple-100 text-purple-800',
  'Proposal': 'bg-orange-100 text-orange-800',
  'Negotiation': 'bg-pink-100 text-pink-800',
  'Closed Won': 'bg-green-100 text-green-800',
  'Closed Lost': 'bg-red-100 text-red-800',
};

const StageBadge = ({ stage }) => {
  const colorClass = stageColors[stage] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {stage}
    </span>
  );
};

export default StageBadge;
