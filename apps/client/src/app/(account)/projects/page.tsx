'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/urls';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProjects()
      .then(res => setProjects(res.projects || []))
      .catch(err => {
        console.warn("Failed to fetch projects from server:", err);
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Recently';
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return dateString; // e.g. "2 hours ago"
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (Math.abs(daysDifference) < 1) {
      const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60));
      return rtf.format(hoursDifference, 'hour');
    }
    
    if (Math.abs(daysDifference) > 30) {
      return rtf.format(Math.round(daysDifference / 30), 'month');
    }
    
    return rtf.format(daysDifference, 'day');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-cream-200">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-noir-900">Saved Projects</h2>
          <p className="text-xs text-noir-500 uppercase tracking-wider mt-0.5">Resume editing anytime</p>
        </div>
        <Link href="/configure" className="bg-noir-950 text-cream-50 px-4 py-2 rounded-sm text-xs uppercase tracking-wider font-semibold hover:bg-noir-900 transition-colors">
          + New Project
        </Link>
      </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-cream-200 rounded-sm overflow-hidden animate-pulse">
                <div className="aspect-square bg-cream-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-cream-200 rounded w-3/4"></div>
                  <div className="h-3 bg-cream-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.length === 0 ? (
              <div className="col-span-full py-12 text-center text-noir-500 bg-white border border-cream-200 rounded-sm">
                No projects found. Start creating your first photobook!
              </div>
            ) : (
              projects.map(project => (
                <div key={project.id} className="bg-white border border-cream-200 rounded-sm overflow-hidden group">
                  <div className="aspect-square bg-cream-100 relative">
                    {(project.coverUrl || project.coverImage) ? (
                      <img src={normalizeImageUrl(project.coverUrl || project.coverImage)} alt={project.title} className="w-full h-full object-cover" />
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
                    <p className="text-xs text-noir-500">Last edited {formatRelativeTime(project.updatedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
    </div>
  );
}
