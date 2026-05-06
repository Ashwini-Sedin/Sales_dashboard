import React from 'react';

const TurnaroundBadge = ({ createdAt }) => {
  const daysSinceCreated = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  
  let colorClass = 'bg-green-100 text-green-800 border-green-200';
  if (daysSinceCreated >= 14) {
    colorClass = 'bg-red-100 text-red-800 border-red-200';
  } else if (daysSinceCreated >= 7) {
    colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {daysSinceCreated} Days Active
    </span>
  );
};

export default TurnaroundBadge;
