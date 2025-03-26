// src/pages/UrlMappingsPage.tsx
import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { AppDataContext } from '../context/AppDataContext';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';


interface UrlMapping {
  url_mapping_id: number;
  team_id: number | null;
  project_id: number | null;
  task_id: number | null;
  title: string;
  url: string | null;
  owner_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Team {
  team_id: number;
  name: string;
}

interface Project {
  project_id: number;
  name: string;
  team_id: number;
}

interface Task {
  task_id: number;
  title: string;
  project_id: number;
}

const UrlMappingsPage = () => {
  const { user } = useContext(AppDataContext)!;
  const [urlMappings, setUrlMappings] = useState<UrlMapping[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state for add/edit
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [editingMapping, setEditingMapping] = useState<UrlMapping | null>(null);

  // Dropdown states for form
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | ''>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | ''>('');

  // Full lists for lookup in table display
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  // Fetch URL mappings
  const fetchUrlMappings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('urlmappings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching URL mappings:', error);
    } else {
      setUrlMappings(data as UrlMapping[]);
    }
    setLoading(false);
  };

  // Save URL mappings to local storage whenever they change
  useEffect(() => {
    chrome.storage.local.set({ urlMappings }, () => {
      console.log("URL mappings saved to local storage");
    });
  }, [urlMappings]);

  // Fetch teams, all projects and tasks on mount
  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from('teams').select('*');
      if (error) {
        console.error('Error fetching teams:', error);
      } else {
        setTeams(data as Team[]);
      }
    };

    const fetchAllProjects = async () => {
      const { data, error } = await supabase.from('projects').select('*');
      if (error) {
        console.error('Error fetching all projects:', error);
      } else {
        setAllProjects(data as Project[]);
      }
    };

    const fetchAllTasks = async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) {
        console.error('Error fetching all tasks:', error);
      } else {
        setAllTasks(data as Task[]);
      }
    };

    fetchTeams();
    fetchAllProjects();
    fetchAllTasks();
    fetchUrlMappings();
  }, []);

  // When selectedTeam changes, fetch its projects for the form dropdown.
  useEffect(() => {
    const fetchProjects = async () => {
      if (selectedTeam !== '') {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('team_id', selectedTeam);
        if (error) {
          console.error('Error fetching projects:', error);
        } else {
          setProjects(data as Project[]);
          // If editing and the mapping's team matches, retain selectedProject.
          if (editingMapping && editingMapping.team_id === selectedTeam && editingMapping.project_id) {
            setSelectedProject(editingMapping.project_id);
          } else {
            // Otherwise, clear project and tasks.
            setSelectedProject('');
            setTasks([]);
            setSelectedTask('');
          }
        }
      } else {
        setProjects([]);
        // Clear dependent selections
        setSelectedProject('');
        setTasks([]);
        setSelectedTask('');
      }
    };
    fetchProjects();
  }, [selectedTeam, editingMapping]);

  // When selectedProject changes, fetch its tasks for the form dropdown.
  useEffect(() => {
    const fetchTasks = async () => {
      if (selectedProject !== '') {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', selectedProject);
        if (error) {
          console.error('Error fetching tasks:', error);
        } else {
          setTasks(data as Task[]);
          // If editing and the mapping's project matches, retain selectedTask.
          if (editingMapping && editingMapping.project_id === selectedProject && editingMapping.task_id) {
            setSelectedTask(editingMapping.task_id);
          } else {
            setSelectedTask('');
          }
        }
      } else {
        setTasks([]);
        setSelectedTask('');
      }
    };
    fetchTasks();
  }, [selectedProject, editingMapping]);

  // When editing, prefill form fields and dropdown selections.
  const handleEdit = (mapping: UrlMapping) => {
    setEditingMapping(mapping);
    setFormTitle(mapping.title);
    setFormUrl(mapping.url || '');
    setSelectedTeam(mapping.team_id !== null ? mapping.team_id : '');
    setSelectedProject(mapping.project_id !== null ? mapping.project_id : '');
    setSelectedTask(mapping.task_id !== null ? mapping.task_id : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('User not authenticated');
      return;
    }

    // Build mapping payload
    const payload = {
      title: formTitle,
      url: formUrl,
      owner_id: user.id,
      team_id: selectedTeam === '' ? null : selectedTeam,
      project_id: selectedProject === '' ? null : selectedProject,
      task_id: selectedTask === '' ? null : selectedTask,
    };

    if (editingMapping) {
      // Update existing mapping
      const { error } = await supabase
        .from('urlmappings')
        .update(payload)
        .eq('url_mapping_id', editingMapping.url_mapping_id);
      if (error) {
        console.error('Error updating mapping:', error);
      } else {
        setUrlMappings((prev) =>
          prev.map((mapping) =>
            mapping.url_mapping_id === editingMapping.url_mapping_id
              ? { ...mapping, ...payload }
              : mapping
          )
        );
        // Reset form
        setEditingMapping(null);
        resetForm();
      }
    } else {
      // Insert new mapping
      const { data, error } = await supabase
        .from('urlmappings')
        .insert(payload)
        .select(); // returns inserted row(s)
      if (error) {
        console.error('Error adding mapping:', error);
      } else if (data) {
        setUrlMappings((prev) => [data[0] as UrlMapping, ...prev]);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormUrl('');
    setSelectedTeam('');
    setSelectedProject('');
    setSelectedTask('');
    setEditingMapping(null);
  };

  const handleDelete = async (mapping: UrlMapping) => {
    if (window.confirm(`Delete mapping "${mapping.title}"?`)) {
      const { error } = await supabase
        .from('urlmappings')
        .delete()
        .eq('url_mapping_id', mapping.url_mapping_id);
      if (error) {
        console.error('Error deleting mapping:', error);
      } else {
        setUrlMappings((prev) =>
          prev.filter((m) => m.url_mapping_id !== mapping.url_mapping_id)
        );
      }
    }
  };

  return (
    <div className="p-4">
  <h1 className="text-2xl font-bold mb-6 text-gray-800">URL Mappings</h1>

  {/* Form to add or edit a URL mapping */}
  <form onSubmit={handleSubmit} className="mb-6 space-y-5">
    {/* Dropdown for Teams */}
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Team:</label>
      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value ? parseInt(e.target.value) : '')}
        className="w-full p-2.5 border border-purple-500 rounded-lg text-base font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition appearance-none"
        required
      >
        <option value="" className="text-gray-400">Select a team</option>
        {teams.map((team) => (
          <option key={team.team_id} value={team.team_id} className="text-base text-gray-800">
            {team.name}
          </option>
        ))}
      </select>
    </div>

    {/* Dropdown for Projects */}
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Project:</label>
      <select
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : '')}
        className="w-full p-2.5 border border-purple-500 rounded-lg text-base font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition appearance-none"
        required
        disabled={selectedTeam === ''}
      >
        <option value="" className="text-gray-400">Select a project</option>
        {projects.map((project) => (
          <option key={project.project_id} value={project.project_id} className="text-base text-gray-800">
            {project.name}
          </option>
        ))}
      </select>
    </div>

    {/* Dropdown for Tasks */}
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Task:</label>
      <select
        value={selectedTask}
        onChange={(e) => setSelectedTask(e.target.value ? parseInt(e.target.value) : '')}
        className="w-full p-2.5 border border-purple-500 rounded-lg text-base font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition appearance-none"
        required
        disabled={selectedProject === ''}
      >
        <option value="" className="text-gray-400">Select a task</option>
        {tasks.map((task) => (
          <option key={task.task_id} value={task.task_id} className="text-base text-gray-800">
            {task.title}
          </option>
        ))}
      </select>
    </div>

    {/* Fields for Title and URL */}
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Title:</label>
      <input
        type="text"
        value={formTitle}
        onChange={(e) => setFormTitle(e.target.value)}
        className="w-full p-2.5 border border-purple-500 rounded-lg text-base font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
        required
      />
    </div>
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">URL:</label>
      <input
        type="text"
        value={formUrl}
        onChange={(e) => setFormUrl(e.target.value)}
        placeholder="https://example.com"
        pattern="[Hh][Tt][Tt][Pp][Ss]?:\/\/(?:(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)(?:\.(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)*(?:\.(?:[a-zA-Z\u00a1-\uffff]{2,}))(?::\d{2,5})?(?:\/[^\s]*)?"
        className="w-full p-2.5 border border-purple-500 rounded-lg text-base font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
        required
      />
    </div>

    <div className="flex items-center gap-2">
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-150 ease-in-out hover:bg-purple-700 active:scale-95 cursor-pointer"
      >
        {editingMapping ? 'Update Mapping' : 'Add Mapping'}
      </button>
      {editingMapping && (
        <button
          type="button"
          onClick={resetForm}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      )}
    </div>
  </form>

  {/* Display list of URL mappings */}
  {loading ? (
    <p className="text-sm text-gray-600">Loading mappings...</p>
  ) : (
    <table className="w-full text-sm text-left text-gray-700 rounded-lg overflow-hidden shadow-sm border border-gray-200">
  <thead className="bg-purple-50 text-gray-700 uppercase text-xs font-semibold">
    <tr>
      <th className="px-3 py-2 border border-gray-300">Title</th>
      <th className="px-3 py-2 border border-gray-300">URL</th>
      <th className="px-3 py-2 border border-gray-300">Team</th>
      <th className="px-3 py-2 border border-gray-300">Project</th>
      <th className="px-3 py-2 border border-gray-300">Task</th>
      <th className="px-3 py-2 border border-gray-300">Actions</th>
    </tr>
  </thead>
  <tbody>
    {urlMappings.map((mapping) => {
      const teamName = teams.find((team) => team.team_id === mapping.team_id)?.name || '-';
      const projectName = allProjects.find((project) => project.project_id === mapping.project_id)?.name || '-';
      const taskTitle = allTasks.find((task) => task.task_id === mapping.task_id)?.title || '-';

      return (
        <tr key={mapping.url_mapping_id} className="hover:bg-purple-50 transition">
          <td className="px-3 py-2 border border-gray-300 align-middle">{mapping.title}</td>
          <td className="px-3 py-2 border border-gray-300 align-middle text-blue-600 hover:underline">
            <a href={mapping.url || '#'} target="_blank" rel="noopener noreferrer">
              {mapping.url}
            </a>
          </td>
          <td className="px-3 py-2 border border-gray-300 align-middle">{teamName}</td>
          <td className="px-3 py-2 border border-gray-300 align-middle">{projectName}</td>
          <td className="px-3 py-2 border border-gray-300 align-middle">{taskTitle}</td>
          <td className="px-3 py-2 border border-gray-300 align-middle">
            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(mapping)}
                title="Edit"
                className="text-yellow-500 hover:text-yellow-600 transition cursor-pointer"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(mapping)}
                title="Delete"
                className="text-red-500 hover:text-red-600 transition cursor-pointer"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </td>
        </tr>
      );
    })}
    {urlMappings.length === 0 && (
      <tr>
        <td colSpan={6} className="text-center px-4 py-6 text-gray-500 border border-gray-300">
          No URL mappings found.
        </td>
      </tr>
    )}
  </tbody>
</table>

  )}
</div>

  );
};

export default UrlMappingsPage;
