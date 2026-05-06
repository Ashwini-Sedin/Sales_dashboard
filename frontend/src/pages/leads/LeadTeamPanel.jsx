import React, { useState } from 'react';
import { useUpdateLeadTeam } from '../../hooks/useLeadDetail';
import { MdOutlinePersonAdd, MdOutlineClose } from 'react-icons/md';

const LeadTeamPanel = ({ lead }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Sales Rep');
  const updateTeamMutation = useUpdateLeadTeam();
  
  const team = lead?.team || [];

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    
    const newTeam = [...team, { email: newMemberEmail, role: newMemberRole }];
    updateTeamMutation.mutate({ leadId: lead.id, team: newTeam }, {
      onSuccess: () => {
        setIsAdding(false);
        setNewMemberEmail('');
        setNewMemberRole('Sales Rep');
      }
    });
  };

  const handleRemoveMember = (email) => {
    const newTeam = team.filter(member => member.email !== email);
    updateTeamMutation.mutate({ leadId: lead.id, team: newTeam });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-semibold text-slate-800">Deal Team</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors flex items-center"
        >
          <MdOutlinePersonAdd className="w-4 h-4 mr-1.5" /> Add Member
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddMember} className="p-4 bg-blue-50/30 border-b border-blue-100 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
            <input 
              type="email" 
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="w-full text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500" 
              placeholder="colleague@company.com"
              required
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
            <select 
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="w-full text-sm border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Account Executive">Account Executive</option>
              <option value="Sales Rep">Sales Rep</option>
              <option value="Solutions Engineer">Solutions Engineer</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={updateTeamMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 h-[38px]"
          >
            {updateTeamMutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}

      <ul className="divide-y divide-slate-100">
        {team.length > 0 ? (
          team.map((member, idx) => (
            <li key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-semibold text-sm border border-blue-200 shadow-sm mr-4">
                  {member.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{member.email}</p>
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                    {member.role}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleRemoveMember(member.email)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Remove team member"
              >
                <MdOutlineClose className="w-5 h-5" />
              </button>
            </li>
          ))
        ) : (
          <li className="p-8 text-center text-slate-500 text-sm">
            No team members assigned to this lead yet.
          </li>
        )}
      </ul>
    </div>
  );
};

export default LeadTeamPanel;
