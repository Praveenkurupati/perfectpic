'use client';

import Link from 'next/link';

export default function ProjectsPage() {
  const projects = [
    { id: 'proj-1', title: 'Baby First Year', updated: '2 hours ago', status: 'Draft', cover: null },
    { id: 'proj-2', title: 'Japan 2025', updated: '3 months ago', status: 'Completed', cover: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=300&auto=format&fit=crop' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <h1 className="font-serif text-4xl">My Projects</h1>
          <button className="bg-noir-950 text-cream-50 px-6 py-2 rounded-sm text-sm font-medium hover:bg-noir-900">
            + New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projects.map(project => (
            <div key={project.id} className="bg-white border border-cream-200 rounded-sm overflow-hidden group">
              <div className="aspect-square bg-cream-100 relative">
                {project.cover ? (
                  <img src={project.cover} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cream-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm font-medium">
                  {project.status}
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <Link href={`/studio/${project.id}`} className="bg-white text-noir-900 px-6 py-2 rounded-sm text-sm font-medium hover:bg-cream-50">
                    {project.status === 'Draft' ? 'Continue Editing' : 'View / Edit'}
                  </Link>
                  <button className="text-white text-xs hover:underline">Duplicate</button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg leading-tight mb-1 truncate">{project.title}</h3>
                <p className="text-xs text-noir-500">Last edited {project.updated}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
