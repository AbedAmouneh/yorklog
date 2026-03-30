import ProjectsPanel from '../Admin/ProjectsPanel.jsx';

export default function Projects() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-navy-900">Projects</h1>
        <p className="text-sm text-slate-400 mt-0.5">Create and manage projects, task types, and employee assignments</p>
      </div>
      <ProjectsPanel />
    </div>
  );
}
