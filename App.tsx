
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Info,
  History,
  Trash2,
  FileText,
  Users
} from 'lucide-react';
import Layout from './components/Layout';
import ProgressBar from './components/ProgressBar';
import { Complaint, UserRole, ComplaintStatus, ActionLog, Officer } from './types';
import { MS_PER_DAY, DEADLINE_DAYS, DEPARTMENTS, STATUS_COLORS } from './constants';
import { getSmartResponseSummary } from './services/geminiService';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CITIZEN);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([
    { id: 'off_1', name: 'Ramesh Singh', level: 1, department: 'Infrastructure & Roads', activeComplaints: 0, warnings: 0, score: 95 },
    { id: 'off_2', name: 'Suresh Kumar', level: 2, department: 'Infrastructure & Roads', activeComplaints: 0, warnings: 0, score: 88 },
    { id: 'off_3', name: 'Inspector Verma', level: 3, department: 'Public Safety', activeComplaints: 0, warnings: 0, score: 99 },
  ]);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1 sec = 1 day in sim

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', department: DEPARTMENTS[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Background Processor: Simulation logic to check for escalations
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setComplaints(prev => prev.map(comp => {
        if (comp.status === ComplaintStatus.CLOSED) return comp;

        // Auto progress increment simulation
        const timePassed = now - comp.createdAt;
        const totalTime = comp.deadline - comp.createdAt;
        let newProgress = (timePassed / totalTime) * 100;

        // Escalation Logic
        if (now > comp.deadline && comp.currentLevel < 3) {
          const nextLevel = (comp.currentLevel + 1) as 1 | 2 | 3;
          const warning: ActionLog = {
            id: Math.random().toString(36).substr(2, 9),
            complaintId: comp.id,
            officerId: comp.assignedOfficerId,
            actionType: 'Warning',
            description: `Auto-escalated from L${comp.currentLevel} due to inactivity. Warning issued.`,
            createdAt: now
          };

          return {
            ...comp,
            currentLevel: nextLevel,
            status: ComplaintStatus.ESCALATED,
            deadline: now + (DEADLINE_DAYS * MS_PER_DAY),
            escalated: true,
            progress: 60, // Boost progress on escalation as per requirements
            actionLogs: [...comp.actionLogs, warning]
          };
        }

        return { ...comp, progress: Math.min(newProgress, 99) };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulationRunning]);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const now = Date.now();
    const newComplaint: Complaint = {
      id: `COMP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      title: formData.title,
      description: formData.description,
      department: formData.department,
      userId: 'user-123',
      currentLevel: 1,
      assignedOfficerId: 'off_1',
      status: ComplaintStatus.ASSIGNED,
      progress: 0,
      createdAt: now,
      deadline: now + (DEADLINE_DAYS * MS_PER_DAY),
      escalated: false,
      actionLogs: []
    };

    // AI Summary
    const summary = await getSmartResponseSummary(formData.description);
    newComplaint.description += `\n\n[AI Assessment]: ${summary}`;

    setComplaints([newComplaint, ...complaints]);
    setIsSubmitting(false);
    setShowForm(false);
    setFormData({ title: '', description: '', department: DEPARTMENTS[0] });
  };

  const updateComplaintStatus = (id: string, newStatus: ComplaintStatus, progressBoost: number = 0) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: newStatus,
          progress: Math.min(100, c.progress + progressBoost),
          viewedAt: newStatus === ComplaintStatus.VIEWED ? Date.now() : c.viewedAt,
          respondedAt: newStatus === ComplaintStatus.IN_PROGRESS ? Date.now() : c.respondedAt,
        };
      }
      return c;
    }));
  };

  const closeComplaint = (id: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: ComplaintStatus.CLOSED, progress: 100 } : c));
  };

  return (
    <Layout userRole={userRole} onRoleChange={setUserRole}>
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            {userRole === UserRole.CITIZEN ? 'Citizen Portal' : 'Officer Command Center'}
          </h2>
          <p className="text-slate-500 font-medium">
            {userRole === UserRole.CITIZEN 
              ? 'Submit and track your public grievances in real-time.' 
              : `Managing ${userRole.replace('_', ' ')} operations and assignments.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              isSimulationRunning ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Clock className={`w-4 h-4 ${isSimulationRunning ? 'animate-pulse' : ''}`} />
            {isSimulationRunning ? 'Simulation On (7 days = 7s)' : 'Real-time Mode'}
          </button>
          
          {userRole === UserRole.CITIZEN && (
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              New Complaint
            </button>
          )}
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Filed</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{complaints.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">In Progress</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">
            {complaints.filter(c => c.status !== ComplaintStatus.CLOSED).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Resolved</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">
            {complaints.filter(c => c.status === ComplaintStatus.CLOSED).length}
          </p>
        </div>
      </div>

      {/* Main Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 text-white relative">
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
              <h3 className="text-2xl font-bold mb-2">Submit New Complaint</h3>
              <p className="text-blue-100">Please provide detailed information about the issue.</p>
            </div>
            <form onSubmit={handleCreateComplaint} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                >
                  {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g., Road Potholes at Central Avenue"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Detailed description of the problem..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Processing...' : 'Submit Grievance'}
                {!isSubmitting && <ChevronRight className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold text-slate-800">Recent Complaints</h3>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ID or Title" 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {complaints.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-slate-300" />
            </div>
            <h4 className="text-xl font-bold text-slate-600 mb-2">No active complaints</h4>
            <p className="text-slate-400 max-w-xs mx-auto">Complaints filed by citizens will appear here for tracking and processing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {complaints.map(complaint => (
              <div 
                key={complaint.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                  complaint.status === ComplaintStatus.CLOSED ? 'border-green-100 opacity-80' : 'border-slate-100 hover:shadow-md'
                }`}
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black bg-slate-100 text-slate-600 px-2 py-1 rounded">#{complaint.id}</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[complaint.status]}`}>
                          {complaint.status}
                        </span>
                        {complaint.escalated && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                            <AlertTriangle className="w-3 h-3" />
                            Escalated L{complaint.currentLevel}
                          </span>
                        )}
                      </div>
                      <h4 className="text-2xl font-bold text-slate-900 mb-2">{complaint.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users className="w-4 h-4" /> {complaint.department}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4" /> 
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end">
                      <div className="text-right mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned Officer</p>
                        <p className="text-lg font-bold text-slate-800">
                          {officers.find(o => o.level === complaint.currentLevel)?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
                  </div>

                  <div className="space-y-6">
                    <ProgressBar 
                      progress={complaint.progress} 
                      label="Resolution Workflow" 
                      isEscalated={complaint.status === ComplaintStatus.ESCALATED} 
                    />

                    {/* Officer Actions Bar */}
                    {userRole !== UserRole.CITIZEN && 
                     userRole.includes(complaint.currentLevel.toString()) && 
                     complaint.status !== ComplaintStatus.CLOSED && (
                      <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4">
                        {complaint.status === ComplaintStatus.ASSIGNED && (
                          <button 
                            onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.VIEWED, 10)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                          >
                            <Info className="w-5 h-5" /> Mark as Viewed
                          </button>
                        )}
                        {(complaint.status === ComplaintStatus.VIEWED || complaint.status === ComplaintStatus.ESCALATED) && (
                          <button 
                            onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.IN_PROGRESS, 40)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                          >
                            <AlertTriangle className="w-5 h-5" /> Start Progress
                          </button>
                        )}
                        {complaint.status === ComplaintStatus.IN_PROGRESS && (
                          <button 
                            onClick={() => closeComplaint(complaint.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/20"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Resolve & Close
                          </button>
                        )}
                        
                        {userRole === UserRole.OFFICER_L3 && (
                          <div className="flex gap-2 ml-auto">
                            <button className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-all">
                              Suspend L1/L2
                            </button>
                            <button className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-500/20">
                              Dismiss Officer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* History Logs */}
                  {complaint.actionLogs.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <h5 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                        <History className="w-4 h-4" /> Activity Log
                      </h5>
                      <div className="space-y-3">
                        {complaint.actionLogs.map(log => (
                          <div key={log.id} className="flex gap-3 text-sm">
                            <div className="mt-1">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{log.actionType}</p>
                              <p className="text-slate-500">{log.description}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
