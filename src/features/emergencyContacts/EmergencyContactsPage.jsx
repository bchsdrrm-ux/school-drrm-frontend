import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import PublicToggle from '../../components/PublicToggle';
import { useFeedback } from '../../components/Toast';

const EMPTY_FORM = { organization: '', contactPerson: '', position: '', contactNumber: '', altNumber: '', email: '', availability: '', remarks: '', isPublic: false };

export default function EmergencyContactsPage() {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const canManage = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const load = () => {
    setIsLoading(true);
    api.get('/emergency-contacts').then(setContacts).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, []);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Blank optional fields must be omitted: the API rejects "" for email.
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await api.post('/emergency-contacts', payload);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePublic = async (contact, isPublic) => {
    try {
      await api.put(`/emergency-contacts/${contact.id}`, { isPublic });
      toast.success(isPublic ? `${contact.organization} is now shown on the public page.` : `${contact.organization} is now staff only.`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'organization', header: 'Organization' },
    { key: 'contact_person', header: 'Contact Person' },
    { key: 'contact_number', header: 'Number', render: (r) => <a href={`tel:${r.contact_number}`} className="text-brand-700 hover:underline">{r.contact_number}</a> },
    { key: 'availability', header: 'Availability' },
    { key: 'is_public', header: 'Public page', render: (r) => <PublicToggle value={r.is_public} canManage={canManage} onChange={(v) => togglePublic(r, v)} label={`Show ${r.organization} on the public page`} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Emergency Contact Directory</h1>
        {canManage && <Button onClick={() => setShowForm(true)}>+ Add Contact</Button>}
      </div>

      {error && !showForm && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={contacts} isLoading={isLoading} emptyMessage="No emergency contacts yet." />

      {showForm && (
        <Modal title="Add Emergency Contact" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Organization" required value={form.organization} onChange={handleChange('organization')} placeholder="BFP, PNP, CDRRMO, Hospital…" />
            <FormField label="Contact Person" value={form.contactPerson} onChange={handleChange('contactPerson')} />
            <FormField label="Position" value={form.position} onChange={handleChange('position')} />
            <FormField label="Contact Number" required value={form.contactNumber} onChange={handleChange('contactNumber')} />
            <FormField label="Alternate Number" value={form.altNumber} onChange={handleChange('altNumber')} />
            <FormField type="email" label="Email" value={form.email} onChange={handleChange('email')} />
            <FormField label="Availability" value={form.availability} onChange={handleChange('availability')} placeholder="24/7, Office hours…" />
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-0.5" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} />
              <span>Show on the public information page<span className="block text-xs text-slate-500">Anyone with the link can see the organization, contact person, position, numbers and availability. Email is never shown.</span></span>
            </label>
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Contact</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
