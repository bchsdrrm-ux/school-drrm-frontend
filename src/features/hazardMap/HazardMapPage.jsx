import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

// Colors chosen to be distinct from the risk-level palette (StatusBadge)
// so a hazard map pin isn't visually confused with a risk-level badge
// elsewhere in the app.
const MARKER_STYLES = {
  hazard: { label: 'Hazard', color: '#dc2626' },
  risk_area: { label: 'Risk Area', color: '#ea580c' },
  safe_area: { label: 'Safe Area', color: '#16a34a' },
  emergency_equipment: { label: 'Emergency Equipment', color: '#2563eb' },
  evacuation_route: { label: 'Evacuation Route', color: '#9333ea' },
  assembly_area: { label: 'Assembly Area', color: '#0d9488' },
};

const EMPTY_MARKER_FORM = { markerType: 'hazard', label: '', notes: '' };
const EMPTY_UPLOAD_FORM = { building: '', floor: '' };

export default function HazardMapPage() {
  const { user } = useAuth();
  const canEdit = hasRole(user, ROLE_GROUPS.DRRM_OPERATIONAL);
  const imageContainerRef = useRef(null);

  const [floorPlans, setFloorPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD_FORM);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [placingMode, setPlacingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null); // { xPercent, yPercent }
  const [markerForm, setMarkerForm] = useState(EMPTY_MARKER_FORM);
  const [selectedMarker, setSelectedMarker] = useState(null); // marker shown in the info panel on click

  const selectedPlan = floorPlans.find((p) => p.id === selectedPlanId);

  const loadFloorPlans = () => {
    setIsLoading(true);
    api.get('/hazard-map/floor-plans')
      .then((plans) => {
        setFloorPlans(plans);
        if (plans.length && !selectedPlanId) setSelectedPlanId(plans[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  };
  useEffect(loadFloorPlans, []);

  const loadMarkers = (planId) => {
    if (!planId) { setMarkers([]); return; }
    api.get(`/hazard-map/floor-plans/${planId}/markers`).then(setMarkers).catch((e) => setError(e.message));
  };
  useEffect(() => loadMarkers(selectedPlanId), [selectedPlanId]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) { setError('Choose a floor plan image first.'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('building', uploadForm.building);
      formData.append('floor', uploadForm.floor);
      formData.append('image', uploadFile);
      const created = await api.upload('/hazard-map/floor-plans', formData);
      setShowUploadForm(false);
      setUploadForm(EMPTY_UPLOAD_FORM);
      setUploadFile(null);
      loadFloorPlans();
      setSelectedPlanId(created.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Percentage coordinates (not pixels) so a marker stays correctly placed
  // however large the image renders on different screens.
  const handleImageClick = (e) => {
    if (!placingMode) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingCoords({ xPercent: Math.round(xPercent * 100) / 100, yPercent: Math.round(yPercent * 100) / 100 });
    setMarkerForm(EMPTY_MARKER_FORM);
    setPlacingMode(false);
  };

  const handleMarkerSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hazard-map/markers', {
        floorPlanId: selectedPlanId,
        markerType: markerForm.markerType,
        label: markerForm.label,
        xPercent: pendingCoords.xPercent,
        yPercent: pendingCoords.yPercent,
        notes: markerForm.notes || undefined,
      });
      setPendingCoords(null);
      loadMarkers(selectedPlanId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMarker = async (markerId) => {
    try {
      await api.delete(`/hazard-map/markers/${markerId}`);
      setSelectedMarker(null);
      loadMarkers(selectedPlanId);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Hazard Map</h1>
          <p className="text-sm text-slate-500 mt-0.5">Floor plans with hazard, equipment, and evacuation markers.</p>
        </div>
        {canEdit && <Button onClick={() => setShowUploadForm(true)}>+ Upload Floor Plan</Button>}
      </div>

      {error && <div className="text-sm text-risk-critical mb-3">{error}</div>}

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : !floorPlans.length ? (
        <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-8 text-center">
          No floor plans uploaded yet. {canEdit ? 'Click "Upload Floor Plan" to add the first one.' : 'Ask a DRRM Coordinator to upload one.'}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {floorPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => { setSelectedPlanId(plan.id); setSelectedMarker(null); setPlacingMode(false); }}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg border ${
                  selectedPlanId === plan.id ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {plan.building}{plan.floor ? ` — ${plan.floor}` : ''}
              </button>
            ))}
          </div>

          {selectedPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(MARKER_STYLES).map(([type, style]) => (
                      <div key={type} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: style.color }} />
                        {style.label}
                      </div>
                    ))}
                  </div>
                  {canEdit && (
                    <Button
                      variant={placingMode ? 'secondary' : 'primary'}
                      onClick={() => setPlacingMode((p) => !p)}
                    >
                      {placingMode ? 'Cancel' : '+ Add Marker'}
                    </Button>
                  )}
                </div>

                {placingMode && (
                  <div className="text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 mb-2">
                    Click anywhere on the floor plan below to place a marker.
                  </div>
                )}

                <div
                  ref={imageContainerRef}
                  onClick={handleImageClick}
                  className={`relative border border-slate-200 rounded-lg overflow-hidden bg-slate-100 ${placingMode ? 'cursor-crosshair' : ''}`}
                >
                  <img src={selectedPlan.image_url} alt={`${selectedPlan.building} floor plan`} className="w-full h-auto block select-none" draggable={false} />
                  {markers.map((m) => (
                    <button
                      key={m.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedMarker(m); }}
                      title={m.label}
                      className="absolute w-4 h-4 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
                      style={{ left: `${m.x_percent}%`, top: `${m.y_percent}%`, backgroundColor: MARKER_STYLES[m.marker_type]?.color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Markers ({markers.length})</div>
                {!markers.length ? (
                  <div className="text-sm text-slate-400">No markers placed yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {markers.map((m) => (
                      <li
                        key={m.id}
                        onClick={() => setSelectedMarker(m)}
                        className={`text-sm bg-white border rounded-lg px-3 py-2 cursor-pointer ${selectedMarker?.id === m.id ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: MARKER_STYLES[m.marker_type]?.color }} />
                          <span className="font-medium text-slate-800 truncate">{m.label}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{MARKER_STYLES[m.marker_type]?.label}</div>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedMarker && (
                  <div className="mt-4 bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-slate-800 text-sm">{selectedMarker.label}</div>
                      <button onClick={() => setSelectedMarker(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{MARKER_STYLES[selectedMarker.marker_type]?.label}</div>
                    {selectedMarker.notes && <p className="text-sm text-slate-600 mb-2">{selectedMarker.notes}</p>}
                    {selectedMarker.hazard_code && (
                      <div className="text-xs text-slate-500 mb-1">Linked hazard: {selectedMarker.hazard_code} — {selectedMarker.hazard_name}</div>
                    )}
                    {selectedMarker.equipment_code && (
                      <div className="text-xs text-slate-500 mb-1">Linked equipment: {selectedMarker.equipment_code} — {selectedMarker.equipment_type}</div>
                    )}
                    {selectedMarker.evacuation_area_name && (
                      <div className="text-xs text-slate-500 mb-1">Linked evacuation area: {selectedMarker.evacuation_area_name}</div>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteMarker(selectedMarker.id)}
                        className="text-xs font-medium text-risk-critical hover:underline mt-2"
                      >
                        Remove marker
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showUploadForm && (
        <Modal title="Upload Floor Plan" onClose={() => setShowUploadForm(false)}>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <FormField label="Building" required value={uploadForm.building} onChange={(e) => setUploadForm((f) => ({ ...f, building: e.target.value }))} placeholder="e.g. Main Building" />
            <FormField label="Floor" value={uploadForm.floor} onChange={(e) => setUploadForm((f) => ({ ...f, floor: e.target.value }))} placeholder="e.g. 2nd Floor" />
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1">Floor plan image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:text-sm file:font-medium hover:file:bg-brand-100"
              />
            </label>
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowUploadForm(false)}>Cancel</Button>
              <Button type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {pendingCoords && (
        <Modal title="Add Marker" onClose={() => setPendingCoords(null)}>
          <form onSubmit={handleMarkerSubmit} className="space-y-4">
            <FormField as="select" label="Marker Type" value={markerForm.markerType} onChange={(e) => setMarkerForm((f) => ({ ...f, markerType: e.target.value }))}>
              {Object.entries(MARKER_STYLES).map(([type, style]) => <option key={type} value={type}>{style.label}</option>)}
            </FormField>
            <FormField label="Label" required value={markerForm.label} onChange={(e) => setMarkerForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. Fire extinguisher, Exposed wiring" />
            <FormField as="textarea" rows={2} label="Notes" value={markerForm.notes} onChange={(e) => setMarkerForm((f) => ({ ...f, notes: e.target.value }))} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setPendingCoords(null)}>Cancel</Button>
              <Button type="submit">Place Marker</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
