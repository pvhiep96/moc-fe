'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { projectsApi } from '@/services/api';
import { getErrorMessage } from '@/utils/errorHandler';
import Link from 'next/link';
import LoadingScreen from '@/components/LoadingScreen';

type Project = {
  id: number;
  name: string;
  description: string;
  created_at: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsApi.getAllProjects();
        setProjects(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setTimeout(() => {
          setPageLoading(false);
          setTimeout(() => setShowContent(true), 300);
        }, 1000);
      }
    };

    fetchProjects();
  }, []);

  if (pageLoading) {
    return <LoadingScreen initialProgress={30} />;
  }

  const contentClasses = `fade-in ${showContent ? 'opacity-100' : 'opacity-0'}`;

  return (
    <div className={contentClasses}>
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back, {user?.name || 'User'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Account</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className="text-green-500">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Projects</span>
              <span>{projects.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/dashboard/projects/new" 
              className="bg-gray-800 hover:bg-gray-700 transition p-4 rounded text-center"
            >
              Create Project
            </Link>
            <Link 
              href="/dashboard/settings" 
              className="bg-gray-800 hover:bg-gray-700 transition p-4 rounded text-center"
            >
              Settings
            </Link>
            <Link 
              href="/dashboard/projects" 
              className="bg-gray-800 hover:bg-gray-700 transition p-4 rounded text-center"
            >
              All Projects
            </Link>
            <Link 
              href="/dashboard/help" 
              className="bg-gray-800 hover:bg-gray-700 transition p-4 rounded text-center"
            >
              Help
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Link 
            href="/dashboard/projects" 
            className="text-sm text-gray-400 hover:text-white transition"
          >
            View All →
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
            <p className="mt-4 text-gray-400">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-gray-400 mb-4">No projects found. Create your first project!</p>
            <Link 
              href="/dashboard/projects/new"
              className="inline-block border border-white px-4 py-2 hover:bg-white hover:text-black transition"
            >
              Create New Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <Link 
                key={project.id} 
                href={`/dashboard/projects/${project.id}`}
                className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition group"
              >
                <div className="h-40 bg-gray-800 relative">
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition bg-gradient-to-br from-blue-500 to-purple-600"></div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition">{project.name}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400 border border-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 