// src/components/ProjectDropdown.tsx
import React, { useContext, useEffect, useState } from 'react';
import { AppDataContext, ProjectItem } from '../context/AppDataContext';
import { supabase } from '../supabaseClient';

export default function ProjectDropdown() {
  const {
    projects,
    setProjects,
    selectedPortfolio,
    selectedProject,
    setSelectedProject,
    setTasks,
    setSelectedTask,
  } = useContext(AppDataContext)!;
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!selectedPortfolio) {
      console.log("selected portfolio not available");
      setLoading(false);
      return;
    }

    // Query the "projects" table from Supabase filtered by portfolio id
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', selectedPortfolio.team_id);

    if (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
      return;
    }
    const projectData: ProjectItem[] = data || [];
    setProjects(projectData);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPortfolio]);

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedItem = projects.find((item) => item.project_id == selectedId) || null;
    // Clear tasks and reset selected project
    setTasks([]);
    setSelectedTask(null);
    setSelectedProject(selectedItem);
  };

  if (loading) {
    return <div>Loading project...</div>;
  }

  return (
    <select 
  id="project" 
  value={selectedProject ? selectedProject.project_id : ""} 
  onChange={handleSelectionChange} 
  className="w-full p-2.5 border border-purple-500 rounded-lg text-base font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition appearance-none"
>
  <option value="" disabled className="text-gray-400">
    Select a Project
  </option>
  {projects.map((item) => (
    <option
      key={item.project_id}
      value={item.project_id}
      className="text-base text-gray-800"
    >
      {item.name}
    </option>
  ))}
</select>

  );
}