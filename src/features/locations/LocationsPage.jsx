import React, { useState } from 'react';
import { api } from '../../lib/apiClient';
import { useLocations } from '../../lib/useLocations';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EMPTY_FORM = { building: '', floor: '', roomArea: '', description: '' };

export default function LocationsPage() {
  const { locations, isLoading, error: loadError } = useLocations();
  const [items, setItems] = useState(null); // local copy so we can refresh after create without a page reload
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const rows = items ?? locations;

  const refresh = () => api.get('/locations').then(setItems).catch((e) => setError(e.message));

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/locations', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'building', header: 'Building' },
    { key: 'floor', header: 'Floor', render: (r) => r.floor || '—' },
    { key: 'room_area', header: 'Room / Area', render: (r) => r.room_area || '—' },
    { key: 'description', header: 'Description', render: (r) => r.description || '—' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Locations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            The master list of buildings, floors, and rooms used across Hazards, Equipment, and Evacuation Areas.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Location</Button>
      </div>

      {(loadError || error) && !showForm && <div className="text-sm text-risk-critical mb-3">{loadError || error}</div>}
      <Table columns={columns} rows={rows} isLoading={isLoading} emptyMessage="No locations defined yet — add your first building below." />

      {showForm && (
        <Modal title="Add Location" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Building" required value={form.building} onChange={handleChange('building')} placeholder="e.g. Main Building" />
            <FormField label="Floor" value={form.floor} onChange={handleChange('floor')} placeholder="e.g. 2nd Floor" />
            <FormField label="Room / Area" value={form.roomArea} onChange={handleChange('roomArea')} placeholder="e.g. Room 201, Covered Court" />
            <FormField as="textarea" rows={2} label="Description" value={form.description} onChange={handleChange('description')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save Location</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
