import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';

const EMPTY_TEAM_FORM = { name: '', description: '' };
const EMPTY_MEMBER_FORM = { userId: '', roleInTeam: '', trainingCertification: '' };

export default function DrrmTeamsPage() {
  const { user } = useAuth();
  const canManage = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // full detail incl. members
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]); // for the member picker — only fetched if canManage

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM);

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER_FORM);

  const loadTeams = () => {
    setIsLoading(true);
    api.get('/drrm-teams')
      .then((list) => {
        setTeams(list);
        if (list.length && !selectedTeamId) setSelectedTeamId(list[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  };
  useEffect(loadTeams, []);

  useEffect(() => {
    if (canManage) {
      api.get('/users').then(setUsers).catch(() => {}); // silent — member picker just won't populate if this fails
    }
  }, [canManage]);

  const loadTeamDetail = (teamId) => {
    if (!teamId) { setSelectedTeam(null); return; }
    api.get(`/drrm-teams/${teamId}`).then(setSelectedTeam).catch((e) => setError(e.message));
  };
  useEffect(() => loadTeamDetail(selectedTeamId), [selectedTeamId]);

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await api.post('/drrm-teams', teamForm);
      setShowTeamForm(false);
      setTeamForm(EMPTY_TEAM_FORM);
      loadTeams();
      setSelectedTeamId(created.id);
    } catch (err) {
      setError(err.message);
    }
  };

  // Members already on the team shouldn't appear again in the picker.
  const availableUsers = users.filter((u) => !selectedTeam?.members?.some((m) => m.user_id === u.id));

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/drrm-teams/members', { ...memberForm, teamId: selectedTeamId });
      setShowMemberForm(false);
      setMemberForm(EMPTY_MEMBER_FORM);
      loadTeamDetail(selectedTeamId);
      loadTeams(); // refresh member counts on the team tabs
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMemberStatus = async (member) => {
    try {
      await api.put(`/drrm-teams/members/${member.id}`, { status: member.status === 'active' ? 'inactive' : 'active' });
      loadTeamDetail(selectedTeamId);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (member) => {
    try {
      await api.delete(`/drrm-teams/members/${member.id}`);
      loadTeamDetail(selectedTeamId);
      loadTeams();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">DRRM Teams</h1>
          <p className="text-sm text-slate-500 mt-0.5">Incident Commander and functional response teams, with member assignment.</p>
        </div>
        {canManage && <Button onClick={() => setShowTeamForm(true)}>+ Add Team</Button>}
      </div>

      {error && <div className="text-sm text-risk-critical mb-3">{error}</div>}

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : !teams.length ? (
        <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-8 text-center">
          No teams set up yet. {canManage ? 'Click "Add Team" to create the first one (e.g. Incident Commander, Evacuation Team).' : 'Ask a DRRM Coordinator to set these up.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-1">
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  selectedTeamId === t.id ? 'bg-brand-50 text-brand-800 font-medium border border-brand-200' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div>{t.name}</div>
                <div className="text-xs text-slate-400">{t.active_member_count} member{t.active_member_count === 1 ? '' : 's'}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selectedTeam && (
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-slate-900">{selectedTeam.name}</div>
                    {selectedTeam.description && <div className="text-sm text-slate-500 mt-1">{selectedTeam.description}</div>}
                  </div>
                  {canManage && (
                    <Button variant="secondary" onClick={() => setShowMemberForm(true)}>+ Add Member</Button>
                  )}
                </div>

                {!selectedTeam.members?.length ? (
                  <div className="text-sm text-slate-400 py-6 text-center">No members assigned yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left font-medium text-slate-500 px-3 py-2">Name</th>
                          <th className="text-left font-medium text-slate-500 px-3 py-2">Role in Team</th>
                          <th className="text-left font-medium text-slate-500 px-3 py-2">Position</th>
                          <th className="text-left font-medium text-slate-500 px-3 py-2">Contact</th>
                          <th className="text-left font-medium text-slate-500 px-3 py-2">Training / Cert.</th>
                          <th className="text-left font-medium text-slate-500 px-3 py-2">Status</th>
                          {canManage && <th className="px-3 py-2"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeam.members.map((m) => (
                          <tr key={m.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 text-slate-800">{m.first_name} {m.last_name}</td>
                            <td className="px-3 py-2 text-slate-600">{m.role_in_team || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{m.position || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{m.contact_number || m.email || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{m.training_certification || '—'}</td>
                            <td className="px-3 py-2"><StatusBadge value={m.status} /></td>
                            {canManage && (
                              <td className="px-3 py-2 whitespace-nowrap">
                                <button onClick={() => toggleMemberStatus(m)} className="text-xs font-medium text-brand-700 hover:underline mr-3">
                                  {m.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => removeMember(m)} className="text-xs font-medium text-risk-critical hover:underline">
                                  Remove
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showTeamForm && (
        <Modal title="Add Team" onClose={() => setShowTeamForm(false)}>
          <form onSubmit={handleTeamSubmit} className="space-y-4">
            <FormField label="Team Name" required value={teamForm.name} onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Evacuation Team" />
            <FormField as="textarea" rows={2} label="Description" value={teamForm.description} onChange={(e) => setTeamForm((f) => ({ ...f, description: e.target.value }))} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowTeamForm(false)}>Cancel</Button>
              <Button type="submit">Save Team</Button>
            </div>
          </form>
        </Modal>
      )}

      {showMemberForm && (
        <Modal title={`Add Member — ${selectedTeam?.name}`} onClose={() => setShowMemberForm(false)}>
          <form onSubmit={handleMemberSubmit} className="space-y-4">
            <FormField as="select" label="Person" required value={memberForm.userId} onChange={(e) => setMemberForm((f) => ({ ...f, userId: e.target.value }))}>
              <option value="">Select a person…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}{u.position ? ` — ${u.position}` : ''}</option>
              ))}
            </FormField>
            <FormField label="Role in Team" value={memberForm.roleInTeam} onChange={(e) => setMemberForm((f) => ({ ...f, roleInTeam: e.target.value }))} placeholder="e.g. Team Leader, Member" />
            <FormField label="Training / Certification" value={memberForm.trainingCertification} onChange={(e) => setMemberForm((f) => ({ ...f, trainingCertification: e.target.value }))} placeholder="e.g. Basic Life Support (2025)" />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowMemberForm(false)}>Cancel</Button>
              <Button type="submit" disabled={!availableUsers.length}>Add Member</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
