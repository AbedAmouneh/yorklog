import { useState } from 'react';
import { format } from 'date-fns';
import { useTeamEditRequests, useApproveEditRequest, useRejectEditRequest } from '../../hooks/useEditRequests.js';
import { fmtHours } from '@yorklog/lib';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react';

function DiffRow({ label, before, after, changed }) {
  return (
    <div className={`grid grid-cols-3 gap-2 py-1.5 text-xs ${changed ? 'bg-amber-50 -mx-2 px-2 rounded' : ''}`}>
      <span className="font-semibold text-slate-500">{label}</span>
      <span className={changed ? 'line-through text-red-400' : 'text-slate-600'}>{before ?? '—'}</span>
      <span className={changed ? 'font-bold text-green-700' : 'text-slate-600'}>{after ?? '—'}</span>
    </div>
  );
}

function RequestCard({ req }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const approveMutation = useApproveEditRequest();
  const rejectMutation = useRejectEditRequest({ onSuccess: () => setShowReject(false) });

  const orig = req.originalData;
  const newD = req.newData;

  const minutesChanged = orig?.totalMinutes !== newD?.totalMinutes;
  const summaryChanged = orig?.taskSummary !== newD?.taskSummary;
  const descChanged = (orig?.description ?? '') !== (newD?.description ?? '');

  const isOpen = req.status === 'pending';

  return (
    <div className={`card ${isOpen ? 'border-amber-200' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{req.entry?.user?.name}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500">{req.entry?.project?.name}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">
              {format(new Date(req.entry?.date), 'd MMM yyyy')}
            </span>
            <span className={`badge ${
              req.status === 'pending' ? 'badge-amber' :
              req.status === 'approved' ? 'badge-green' : 'badge-red'
            }`}>
              {req.status}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Submitted {format(new Date(req.createdAt), 'd MMM yyyy · HH:mm')}
          </p>

          {req.reason && (
            <p className="text-xs text-slate-500 mt-1 italic">
              "{req.reason}"
            </p>
          )}

          {req.rejectionReason && (
            <p className="text-xs text-red-500 mt-1">
              Rejected: {req.rejectionReason}
            </p>
          )}
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-slate-400 hover:text-slate-600 p-1"
          title="View changes"
        >
          {expanded ? <ChevronUp size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Diff view */}
      {expanded && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-400 mb-2">
            <span>Field</span>
            <span>Before</span>
            <span>After</span>
          </div>
          <DiffRow
            label="Duration"
            before={fmtHours(orig?.totalMinutes)}
            after={fmtHours(newD?.totalMinutes)}
            changed={minutesChanged}
          />
          <DiffRow
            label="Summary"
            before={orig?.taskSummary}
            after={newD?.taskSummary}
            changed={summaryChanged}
          />
          <DiffRow
            label="Description"
            before={orig?.description || '—'}
            after={newD?.description || '—'}
            changed={descChanged}
          />
        </div>
      )}

      {/* Actions */}
      {isOpen && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {showReject ? (
            <div className="flex gap-2 w-full flex-wrap">
              <input
                type="text"
                placeholder="Reason for rejection…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input flex-1 text-xs py-1.5"
              />
              <button
                onClick={() => rejectMutation.mutate({ id: req.id, reason: rejectReason })}
                disabled={!rejectReason || rejectMutation.isPending}
                className="btn-danger text-xs px-3"
              >
                Confirm Reject
              </button>
              <button onClick={() => setShowReject(false)} className="btn-secondary text-xs px-3">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => approveMutation.mutate(req.id)}
                disabled={approveMutation.isPending}
                className="btn bg-green-600 text-white hover:bg-green-700 text-xs gap-1"
              >
                <CheckCircle size={14} />
                Approve
              </button>
              <button
                onClick={() => setShowReject(true)}
                className="btn-danger text-xs gap-1"
              >
                <XCircle size={14} />
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Approvals() {
  const [filter, setFilter] = useState('pending');

  const { data, isLoading } = useTeamEditRequests(filter);

  const requests = data?.requests ?? [];
  const pending = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-navy-900">Approvals</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review your team's edit requests</p>
        </div>
        {pending > 0 && (
          <span className="badge badge-amber text-sm px-3 py-1">{pending} pending</span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: '', label: 'All' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              filter === tab.value
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No {filter} requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}
