import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EMPTY_FORM = { title: '', category: '', version: '', effectiveDate: '', reviewDate: '', expirationDate: '', remarks: '' };

const APPROVAL_STYLES = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  pending_approval: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function ApprovalBadge({ value }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${APPROVAL_STYLES[value] || ''}`}>
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fileModalDoc, setFileModalDoc] = useState(null); // document currently open for file upload

  const canManage = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const load = () => {
    setIsLoading(true);
    api.get('/documents').then(setDocuments).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, []);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setApprovalStatus = async (doc, approvalStatus) => {
    try {
      await api.put(`/documents/${doc.id}`, { approvalStatus });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'category', header: 'Category' },
    { key: 'version', header: 'Version', render: (r) => r.version || '—' },
    { key: 'approval_status', header: 'Status', render: (r) => <ApprovalBadge value={r.approval_status} /> },
    { key: 'expiration_date', header: 'Expires', render: (r) => r.expiration_date ? new Date(r.expiration_date).toLocaleDateString() : '—' },
    { key: 'file', header: 'File', render: (r) => (
        r.file_url ? (
          <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-700 hover:underline">View</a>
        ) : canManage ? (
          <button onClick={() => setFileModalDoc(r)} className="text-xs font-medium text-brand-700 hover:underline">📎 Attach</button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      ) },
    { key: 'actions', header: '', render: (r) => (
        canManage && r.approval_status !== 'approved' ? (
          <div className="flex gap-2">
            {r.approval_status === 'draft' && (
              <button onClick={() => setApprovalStatus(r, 'pending_approval')} className="text-xs font-medium text-brand-700 hover:underline">Submit</button>
            )}
            {r.approval_status === 'pending_approval' && (
              <>
                <button onClick={() => setApprovalStatus(r, 'approved')} className="text-xs font-medium text-green-700 hover:underline">Approve</button>
                <button onClick={() => setApprovalStatus(r, 'rejected')} className="text-xs font-medium text-risk-critical hover:underline">Reject</button>
              </>
            )}
          </div>
        ) : null
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Documents & Records</h1>
        {canManage && <Button onClick={() => setShowForm(true)}>+ Add Document</Button>}
      </div>

      {error && !showForm && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={documents} isLoading={isLoading} emptyMessage="No documents recorded yet." />

      {showForm && (
        <Modal title="Add Document" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Title" required value={form.title} onChange={handleChange('title')} placeholder="e.g. School DRRM Plan 2026" />
              <FormField label="Category" required value={form.category} onChange={handleChange('category')} placeholder="DRRM Plan, Drill Report, MOA…" />
            </div>
            <FormField label="Version" value={form.version} onChange={handleChange('version')} placeholder="e.g. v2, 2026 Rev A" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField type="date" label="Effective Date" value={form.effectiveDate} onChange={handleChange('effectiveDate')} />
              <FormField type="date" label="Review Date" value={form.reviewDate} onChange={handleChange('reviewDate')} />
              <FormField type="date" label="Expiration Date" value={form.expirationDate} onChange={handleChange('expirationDate')} />
            </div>
            <FormField as="textarea" rows={2} label="Remarks" value={form.remarks} onChange={handleChange('remarks')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Document</Button>
            </div>
          </form>
        </Modal>
      )}

      {fileModalDoc && (
        <DocumentFileModal
          doc={fileModalDoc}
          onClose={() => setFileModalDoc(null)}
          onUploaded={() => { setFileModalDoc(null); load(); }}
        />
      )}
    </div>
  );
}

function DocumentFileModal({ doc, onClose, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload(`/documents/${doc.id}/file`, formData);
      onUploaded();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <Modal title={`Attach File — ${doc.title}`} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Choose a file</span>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:text-sm file:font-medium hover:file:bg-brand-100"
          />
          {uploading && <span className="text-xs text-slate-500 mt-1 block">Uploading…</span>}
        </label>
        {error && <div className="text-sm text-risk-critical">{error}</div>}
      </div>
    </Modal>
  );
}
