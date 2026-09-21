import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import { useLocations, locationLabel, formatLocation } from '../../lib/useLocations';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const EMPTY_AREA_FORM = { name: '', locationId: '', capacity: '', accessibility: '', status: 'active' };
const EMPTY_ROUTE_FORM = { destinationAreaId: '', isPrimary: true, obstacles: '' };
const EMPTY_CLASSROOM_FORM = { locationId: '', learnerCount: '', teacherId: '', primaryRouteId: '', altRouteId: '', assemblyAreaId: '' };

export default function EvacuationPage() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const [tab, setTab] = useState('areas'); // 'areas' | 'routes' | 'classrooms'

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [areaForm, setAreaForm] = useState(EMPTY_AREA_FORM);

  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE_FORM);

  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showClassroomForm, setShowClassroomForm] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState(null);
  const [classroomForm, setClassroomForm] = useState(EMPTY_CLASSROOM_FORM);

  const [error, setError] = useState('');

  const canManage = hasRole(user, ROLE_GROUPS.DRRM_MANAGERS);

  const loadAreas = () => {
    setAreasLoading(true);
    api.get('/evacuation/areas').then(setAreas).catch((e) => setError(e.message)).finally(() => setAreasLoading(false));
  };
  const loadRoutes = () => {
    setRoutesLoading(true);
    api.get('/evacuation/routes').then(setRoutes).catch((e) => setError(e.message)).finally(() => setRoutesLoading(false));
  };
  const loadClassrooms = () => {
    setClassroomsLoading(true);
    api.get('/evacuation/classrooms').then(setClassrooms).catch((e) => setError(e.message)).finally(() => setClassroomsLoading(false));
  };

  useEffect(() => { loadAreas(); loadRoutes(); loadClassrooms(); }, []);
  useEffect(() => { if (canManage) api.get('/users').then(setUsers).catch(() => {}); }, [canManage]);

  const handleAreaChange = (field) => (e) => setAreaForm((f) => ({ ...f, [field]: e.target.value }));
  const handleAreaSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/evacuation/areas', { ...areaForm, locationId: areaForm.locationId || undefined, capacity: Number(areaForm.capacity) });
      setShowAreaForm(false);
      setAreaForm(EMPTY_AREA_FORM);
      loadAreas();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRouteChange = (field) => (e) => {
    const value = field === 'isPrimary' ? e.target.value === 'true' : e.target.value;
    setRouteForm((f) => ({ ...f, [field]: value }));
  };
  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/evacuation/routes', routeForm);
      setShowRouteForm(false);
      setRouteForm(EMPTY_ROUTE_FORM);
      loadRoutes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClassroomChange = (field) => (e) => setClassroomForm((f) => ({ ...f, [field]: e.target.value }));

  const openAddClassroom = () => {
    setEditingClassroomId(null);
    setClassroomForm(EMPTY_CLASSROOM_FORM);
    setShowClassroomForm(true);
  };
  const openEditClassroom = (c) => {
    setEditingClassroomId(c.id);
    setClassroomForm({
      locationId: c.location_id || '',
      learnerCount: c.learner_count ?? '',
      teacherId: c.teacher_id || '',
      primaryRouteId: c.primary_route_id || '',
      altRouteId: c.alt_route_id || '',
      assemblyAreaId: c.assembly_area_id || '',
    });
    setShowClassroomForm(true);
  };

  const handleClassroomSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...classroomForm,
      learnerCount: classroomForm.learnerCount === '' ? undefined : Number(classroomForm.learnerCount),
      teacherId: classroomForm.teacherId || undefined,
      primaryRouteId: classroomForm.primaryRouteId || undefined,
      altRouteId: classroomForm.altRouteId || undefined,
      assemblyAreaId: classroomForm.assemblyAreaId || undefined,
    };
    try {
      if (editingClassroomId) {
        await api.put(`/evacuation/classrooms/${editingClassroomId}`, payload);
      } else {
        await api.post('/evacuation/classrooms', payload);
      }
      setShowClassroomForm(false);
      setClassroomForm(EMPTY_CLASSROOM_FORM);
      setEditingClassroomId(null);
      loadClassrooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeClassroom = async (c) => {
    try {
      await api.delete(`/evacuation/classrooms/${c.id}`);
      loadClassrooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const areaColumns = [
    { key: 'name', header: 'Area Name' },
    { key: 'location', header: 'Location', render: formatLocation },
    { key: 'capacity', header: 'Capacity' },
    { key: 'status', header: 'Status' },
  ];

  const routeColumns = [
    { key: 'destination_area_name', header: 'Destination Area' },
    { key: 'is_primary', header: 'Type', render: (r) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${r.is_primary ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {r.is_primary ? 'Primary' : 'Alternative'}
        </span>
      ) },
    { key: 'obstacles', header: 'Obstacles', render: (r) => r.obstacles || '—' },
    { key: 'created_at', header: 'Added', render: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  const classroomColumns = [
    { key: 'location', header: 'Classroom', render: formatLocation },
    { key: 'learner_count', header: 'Learners', render: (r) => r.learner_count ?? '—' },
    { key: 'teacher', header: 'Teacher', render: (r) => r.teacher_first_name ? `${r.teacher_first_name} ${r.teacher_last_name}` : '—' },
    { key: 'primary_route', header: 'Primary Route', render: (r) => r.primary_route_destination || '—' },
    { key: 'alt_route', header: 'Alt. Route', render: (r) => r.alt_route_destination || '—' },
    { key: 'assembly_area', header: 'Assembly Area', render: (r) => r.assembly_area_name || '—' },
    { key: 'actions', header: '', render: (r) => (
        canManage && (
          <div className="flex gap-2 whitespace-nowrap">
            <button onClick={() => openEditClassroom(r)} className="text-xs font-medium text-brand-700 hover:underline">Edit</button>
            <button onClick={() => removeClassroom(r)} className="text-xs font-medium text-risk-critical hover:underline">Remove</button>
          </div>
        )
      ) },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 mb-4">Evacuation Management</h1>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('areas')}
          className={`text-sm font-medium px-4 py-2 rounded-lg border ${tab === 'areas' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
        >
          Evacuation Areas
        </button>
        <button
          onClick={() => setTab('routes')}
          className={`text-sm font-medium px-4 py-2 rounded-lg border ${tab === 'routes' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
        >
          Evacuation Routes
        </button>
        <button
          onClick={() => setTab('classrooms')}
          className={`text-sm font-medium px-4 py-2 rounded-lg border ${tab === 'classrooms' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
        >
          Classrooms
        </button>
      </div>

      {error && <div className="text-sm text-risk-critical mb-3">{error}</div>}

      {tab === 'areas' && (
        <div>
          <div className="flex justify-end mb-3">
            {canManage && <Button onClick={() => setShowAreaForm(true)}>+ Add Area</Button>}
          </div>
          <Table columns={areaColumns} rows={areas} isLoading={areasLoading} emptyMessage="No evacuation areas defined yet." />
        </div>
      )}

      {tab === 'routes' && (
        <div>
          <div className="flex justify-end mb-3">
            {canManage && (
              <Button onClick={() => setShowRouteForm(true)} disabled={!areas.length} title={!areas.length ? 'Add an evacuation area first' : undefined}>
                + Add Route
              </Button>
            )}
          </div>
          {!areas.length && (
            <div className="text-sm text-slate-500 mb-3">
              You'll need at least one evacuation area before adding a route — add one under the "Evacuation Areas" tab first.
            </div>
          )}
          <Table columns={routeColumns} rows={routes} isLoading={routesLoading} emptyMessage="No evacuation routes defined yet." />
        </div>
      )}

      {tab === 'classrooms' && (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            Assign each classroom to a primary and alternative evacuation route, plus its assembly area — so during a drill or real emergency, every room already knows where to go.
          </p>
          <div className="flex justify-end mb-3">
            {canManage && <Button onClick={openAddClassroom}>+ Add Classroom</Button>}
          </div>
          <Table columns={classroomColumns} rows={classrooms} isLoading={classroomsLoading} emptyMessage="No classrooms assigned yet." />
        </div>
      )}

      {showAreaForm && (
        <Modal title="Add Evacuation Area" onClose={() => setShowAreaForm(false)}>
          <form onSubmit={handleAreaSubmit} className="space-y-4">
            <FormField label="Area Name" required value={areaForm.name} onChange={handleAreaChange('name')} placeholder="e.g. Covered Court" />
            <FormField as="select" label="Location" value={areaForm.locationId} onChange={handleAreaChange('locationId')}>
              <option value="">Not specified</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
            </FormField>
            <FormField type="number" min="1" label="Capacity" required value={areaForm.capacity} onChange={handleAreaChange('capacity')} />
            <FormField label="Accessibility Notes" value={areaForm.accessibility} onChange={handleAreaChange('accessibility')} placeholder="e.g. PWD-accessible ramp" />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAreaForm(false)}>Cancel</Button>
              <Button type="submit">Save Area</Button>
            </div>
          </form>
        </Modal>
      )}

      {showRouteForm && (
        <Modal title="Add Evacuation Route" onClose={() => setShowRouteForm(false)}>
          <form onSubmit={handleRouteSubmit} className="space-y-4">
            <FormField as="select" label="Destination Area" required value={routeForm.destinationAreaId} onChange={handleRouteChange('destinationAreaId')}>
              <option value="">Select an area…</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </FormField>
            <FormField as="select" label="Route Type" value={String(routeForm.isPrimary)} onChange={handleRouteChange('isPrimary')}>
              <option value="true">Primary</option>
              <option value="false">Alternative</option>
            </FormField>
            <FormField as="textarea" rows={2} label="Obstacles" value={routeForm.obstacles} onChange={handleRouteChange('obstacles')} placeholder="Anything blocking or narrowing this route" />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowRouteForm(false)}>Cancel</Button>
              <Button type="submit">Save Route</Button>
            </div>
          </form>
        </Modal>
      )}

      {showClassroomForm && (
        <Modal title={editingClassroomId ? 'Edit Classroom' : 'Add Classroom'} onClose={() => setShowClassroomForm(false)} wide>
          <form onSubmit={handleClassroomSubmit} className="space-y-4">
            <FormField as="select" label="Classroom (Location)" required value={classroomForm.locationId} onChange={handleClassroomChange('locationId')}>
              <option value="">Select a location…</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{locationLabel(loc)}</option>)}
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField type="number" min="0" label="Learner Count" value={classroomForm.learnerCount} onChange={handleClassroomChange('learnerCount')} />
              <FormField as="select" label="Teacher" value={classroomForm.teacherId} onChange={handleClassroomChange('teacherId')}>
                <option value="">Not specified</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField as="select" label="Primary Route" value={classroomForm.primaryRouteId} onChange={handleClassroomChange('primaryRouteId')}>
                <option value="">Not specified</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.destination_area_name} ({r.is_primary ? 'Primary' : 'Alternative'})</option>)}
              </FormField>
              <FormField as="select" label="Alternative Route" value={classroomForm.altRouteId} onChange={handleClassroomChange('altRouteId')}>
                <option value="">Not specified</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.destination_area_name} ({r.is_primary ? 'Primary' : 'Alternative'})</option>)}
              </FormField>
            </div>

            <FormField as="select" label="Assembly Area" value={classroomForm.assemblyAreaId} onChange={handleClassroomChange('assemblyAreaId')}>
              <option value="">Not specified</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </FormField>

            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowClassroomForm(false)}>Cancel</Button>
              <Button type="submit">Save Classroom</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
