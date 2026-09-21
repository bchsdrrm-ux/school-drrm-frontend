import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EMPTY_TRAINING_FORM = { title: '', trainingDate: '', venue: '', organizer: '', facilitator: '', trainingHours: '', topics: '', evaluationNotes: '', remarks: '' };

export default function TrainingPage() {
  const { user } = useAuth();
  const canEdit = hasRole(user, ROLE_GROUPS.DRRM_OPERATIONAL);

  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [trainingForm, setTrainingForm] = useState(EMPTY_TRAINING_FORM);

  const [detailTraining, setDetailTraining] = useState(null); // full detail incl. participants
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [certUploadingId, setCertUploadingId] = useState(null); // participant id currently uploading a certificate

  const load = () => {
    setIsLoading(true);
    api.get('/training').then(setTrainings).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    if (canEdit) api.get('/users').then(setUsers).catch(() => {});
  }, [canEdit]);

  const handleTrainingChange = (field) => (e) => setTrainingForm((f) => ({ ...f, [field]: e.target.value }));

  const handleTrainingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/training', { ...trainingForm, trainingHours: trainingForm.trainingHours ? Number(trainingForm.trainingHours) : undefined });
      setShowTrainingForm(false);
      setTrainingForm(EMPTY_TRAINING_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openDetail = async (training) => {
    try {
      setDetailTraining(await api.get(`/training/${training.id}`));
      setSelectedUserId('');
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshDetail = async () => {
    if (!detailTraining) return;
    setDetailTraining(await api.get(`/training/${detailTraining.id}`));
    load();
  };

  const availableUsers = users.filter((u) => !detailTraining?.participants?.some((p) => p.user_id === u.id));

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await api.post(`/training/${detailTraining.id}/participants`, { userId: selectedUserId });
      setSelectedUserId('');
      refreshDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeParticipant = async (participant) => {
    try {
      await api.delete(`/training/participants/${participant.id}`);
      refreshDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCertificateUpload = async (participant, file) => {
    if (!file) return;
    setCertUploadingId(participant.id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload(`/training/participants/${participant.id}/certificate`, formData);
      refreshDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setCertUploadingId(null);
    }
  };

  const columns = [
    { key: 'training_code', header: 'ID' },
    { key: 'title', header: 'Title' },
    { key: 'training_date', header: 'Date', render: (r) => new Date(r.training_date).toLocaleDateString() },
    { key: 'venue', header: 'Venue', render: (r) => r.venue || '—' },
    { key: 'training_hours', header: 'Hours', render: (r) => r.training_hours ?? '—' },
    { key: 'participant_count', header: 'Participants' },
    { key: 'view', header: '', render: (r) => (
        <button onClick={() => openDetail(r)} className="text-xs font-medium text-brand-700 hover:underline">View / Manage</button>
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">DRRM Training</h1>
        {canEdit && <Button onClick={() => setShowTrainingForm(true)}>+ Record Training</Button>}
      </div>

      {error && !showTrainingForm && !detailTraining && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={trainings} isLoading={isLoading} emptyMessage="No training records yet." />

      {showTrainingForm && (
        <Modal title="Record Training" onClose={() => setShowTrainingForm(false)} wide>
          <form onSubmit={handleTrainingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Title" required value={trainingForm.title} onChange={handleTrainingChange('title')} placeholder="e.g. Basic Life Support Training" />
              <FormField type="date" label="Date" required value={trainingForm.trainingDate} onChange={handleTrainingChange('trainingDate')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Venue" value={trainingForm.venue} onChange={handleTrainingChange('venue')} />
              <FormField label="Organizer" value={trainingForm.organizer} onChange={handleTrainingChange('organizer')} />
              <FormField label="Facilitator" value={trainingForm.facilitator} onChange={handleTrainingChange('facilitator')} />
            </div>
            <FormField type="number" min="0" step="0.5" label="Training Hours" value={trainingForm.trainingHours} onChange={handleTrainingChange('trainingHours')} />
            <FormField as="textarea" rows={2} label="Topics" value={trainingForm.topics} onChange={handleTrainingChange('topics')} />
            <FormField as="textarea" rows={2} label="Evaluation Notes" value={trainingForm.evaluationNotes} onChange={handleTrainingChange('evaluationNotes')} />
            <FormField as="textarea" rows={2} label="Remarks" value={trainingForm.remarks} onChange={handleTrainingChange('remarks')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowTrainingForm(false)}>Cancel</Button>
              <Button type="submit">Save Training</Button>
            </div>
          </form>
        </Modal>
      )}

      {detailTraining && (
        <Modal title={detailTraining.title} onClose={() => setDetailTraining(null)} wide>
          <div className="space-y-4">
            {detailTraining.topics && (
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">Topics</div>
                <p className="text-sm text-slate-600">{detailTraining.topics}</p>
              </div>
            )}

            <div className="text-sm font-medium text-slate-700">Participants ({detailTraining.participants?.length || 0})</div>

            {canEdit && (
              <form onSubmit={handleAddParticipant} className="flex items-end gap-2">
                <FormField as="select" label="Add participant" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="flex-1">
                  <option value="">Select a person…</option>
                  {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}{u.position ? ` — ${u.position}` : ''}</option>)}
                </FormField>
                <Button type="submit" variant="secondary" disabled={!selectedUserId}>Add</Button>
              </form>
            )}

            {!detailTraining.participants?.length ? (
              <div className="text-sm text-slate-400">No participants added yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left font-medium text-slate-500 px-3 py-2">Name</th>
                      <th className="text-left font-medium text-slate-500 px-3 py-2">Position</th>
                      <th className="text-left font-medium text-slate-500 px-3 py-2">Certificate</th>
                      {canEdit && <th className="px-3 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {detailTraining.participants.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 text-slate-800">{p.first_name} {p.last_name}</td>
                        <td className="px-3 py-2 text-slate-600">{p.position || '—'}</td>
                        <td className="px-3 py-2">
                          {p.certificate_url ? (
                            <a href={p.certificate_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-700 hover:underline">View</a>
                          ) : canEdit ? (
                            <label className="text-xs font-medium text-brand-700 hover:underline cursor-pointer">
                              {certUploadingId === p.id ? 'Uploading…' : 'Upload'}
                              <input type="file" className="hidden" disabled={certUploadingId === p.id} onChange={(e) => handleCertificateUpload(p, e.target.files[0])} />
                            </label>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-3 py-2">
                            <button onClick={() => removeParticipant(p)} className="text-xs font-medium text-risk-critical hover:underline">Remove</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {error && <div className="text-sm text-risk-critical">{error}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
