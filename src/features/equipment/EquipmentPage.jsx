import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import { useLocations, locationLabel, formatLocation } from '../../lib/useLocations';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EMPTY_FORM = {
  equipmentType: '', descriptionModel: '', quantity: 1, locationId: '', condition: 'good',
  expirationDate: '', lastInspection: '', nextInspection: '', remarks: '',
};

export default function EquipmentPage() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [photoEquipmentId, setPhotoEquipmentId] = useState(null);
  const [locationFilter, setLocationFilter] = useState('');

  const canManage = hasRole(user, ROLE_GROUPS.DRRM_OPERATIONAL);

  const load = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (locationFilter) params.set('locationId', locationFilter);
    const query = params.toString() ? `?${params.toString()}` : '';
    Promise.all([api.get(`/equipment${query}`), api.get('/equipment/alerts')])
      .then(([itemsRes, alertsRes]) => { setItems(itemsRes); setAlerts(alertsRes); })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  };
  useEffect(load, [locationFilter]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/equipment', { ...form, locationId: form.locationId || undefined, quantity: Number(form.quantity) });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'equipment_code', header: 'ID' },
    { key: 'equipment_type', header: 'Type' },
    { key: 'location', header: 'Location', render: formatLocation },
    { key: 'quantity', header: 'Qty' },
    { key: 'condition', header: 'Condition', render: (r) => <StatusBadge value={r.condition} /> },
    { key: 'next_inspection', header: 'Next Inspection', render: (r) => r.next_inspection ? new Date(r.next_inspection).toLocaleDateString() : '—' },
    { key: 'photo', header: 'Photo', render: (r) => (
        <div className="flex items-center gap-2">
          {r.photo_url && (
            <a href={r.photo_url} target="_blank" rel="noreferrer">
              <img src={r.photo_url} alt={r.equipment_type} className="w-10 h-10 object-cover rounded-md border border-slate-200" />
            </a>
          )}
          {canManage && (
            <button onClick={() => setPhotoEquipmentId(r.id)} className="text-xs font-medium text-brand-700 hover:underline">
              {r.photo_url ? 'Change' : '📷 Add photo'}
            </button>
          )}
          {!r.photo_url && !canManage && <span className="text-xs text-slate-400">—</span>}
        </div>
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Emergency Equipment Inventory</h1>
        {canManage && <Button onClick={() => setShowForm(true)}>+ Add Equipment</Button>}
      </div>

      <div className="flex justify-end mb-4">
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="">All locations</option>
          {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
        </select>
      </div>

      {alerts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5">
              <StatusBadge value={a.alert_type} type="alert" />
              <span className="text-slate-600">{a.equipment_code} — {a.equipment_type}</span>
            </div>
          ))}
        </div>
      )}

      {error && !showForm && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={items} isLoading={isLoading} emptyMessage="No equipment recorded yet." />

      {showForm && (
        <Modal title="Add Equipment" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Equipment Type" required value={form.equipmentType} onChange={handleChange('equipmentType')} placeholder="Fire extinguisher, first aid kit…" />
              <FormField type="number" min="1" label="Quantity" value={form.quantity} onChange={handleChange('quantity')} />
            </div>
            <FormField label="Description / Model" value={form.descriptionModel} onChange={handleChange('descriptionModel')} />
            <FormField as="select" label="Location" value={form.locationId} onChange={handleChange('locationId')}>
              <option value="">Not specified</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
            </FormField>
            <FormField as="select" label="Condition" value={form.condition} onChange={handleChange('condition')}>
              <option value="good">Good</option>
              <option value="needs_repair">Needs Repair</option>
              <option value="damaged">Damaged</option>
              <option value="missing">Missing</option>
              <option value="expired">Expired</option>
              <option value="for_replacement">For Replacement</option>
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField type="date" label="Expiration Date" value={form.expirationDate} onChange={handleChange('expirationDate')} />
              <FormField type="date" label="Last Inspection" value={form.lastInspection} onChange={handleChange('lastInspection')} />
              <FormField type="date" label="Next Inspection" value={form.nextInspection} onChange={handleChange('nextInspection')} />
            </div>
            <FormField as="textarea" rows={2} label="Remarks" value={form.remarks} onChange={handleChange('remarks')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Equipment</Button>
            </div>
          </form>
        </Modal>
      )}

      {photoEquipmentId && (
        <EquipmentPhotoModal
          equipmentId={photoEquipmentId}
          onClose={() => setPhotoEquipmentId(null)}
          onUploaded={() => { setPhotoEquipmentId(null); load(); }}
        />
      )}
    </div>
  );
}

function EquipmentPhotoModal({ equipmentId, onClose, onUploaded }) {
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
      await api.upload(`/equipment/${equipmentId}/photo`, formData);
      onUploaded();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <Modal title="Equipment Photo" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Choose a photo</span>
          <input
            type="file"
            accept="image/*"
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
