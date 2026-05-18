import React from 'react';

const stageColors = {
  'New': 'bg-[#e5faef] text-[#0ebf99] dark:bg-[#0ebf99]/10 dark:text-[#0ebf99]',
  'Contacted': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'Qualified': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  'Proposal': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  'Negotiation': 'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  'Won': 'bg-[#e5faef] text-[#0ebf99] dark:bg-[#0ebf99]/10 dark:text-[#0ebf99]',
  'Closed Won': 'bg-[#e5faef] text-[#0ebf99] dark:bg-[#0ebf99]/10 dark:text-[#0ebf99]',
  'Closed Lost': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const StageBadge = ({ stage }) => {
  const colorClass = stageColors[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${colorClass}`}>
      {stage === 'Closed Won' ? 'Won' : stage === 'Closed Lost' ? 'Lost' : stage}
    </span>
  );
};

export default StageBadge;
