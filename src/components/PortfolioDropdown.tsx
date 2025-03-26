// src/components/PortfolioDropdown.tsx
import React, { useContext, useEffect, useState } from 'react';
import { AppDataContext, PortfolioItem } from '../context/AppDataContext';
import { supabase } from '../supabaseClient';

export default function PortfolioDropdown() {
  const { portfolios, setPortfolios, selectedPortfolio, setSelectedPortfolio, setSelectedProject, setProjects } =
    useContext(AppDataContext)!;
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    // If teams are already loaded, no need to fetch again.
    if (portfolios.length > 0) {
      setLoading(false);
      return;
    }

    // Query the "teams" table from Supabase
    const { data, error } = await supabase
      .from('teams')
      .select('*');
    if (error) {
      console.error("Error fetching teams:", error);
      setLoading(false);
      return;
    }
    const teamsData: PortfolioItem[] = data || [];
    setPortfolios(teamsData);
    setLoading(false);
  };

  useEffect(() => {
      fetchTeams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedItem = portfolios.find((item) => item.team_id == selectedId) || null;
    setProjects([]);
    setSelectedProject(null);
    setSelectedPortfolio(selectedItem);
  };

  if (loading) {
    return <div>Loading portfolio...</div>;
  }

  return (
    <select 
  id="portfolio" 
  value={selectedPortfolio ? selectedPortfolio.team_id : ""} 
  onChange={handleSelectionChange} 
  className="w-full p-2.5 border border-purple-500 rounded-lg text-base font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition appearance-none"
>
  <option value="" disabled className="text-gray-400">
    Select a portfolio
  </option>
  {portfolios.map((item) => (
    <option
      key={item.team_id}
      value={item.team_id}
      className="text-base text-gray-800 appearance-none"
    >
      {item.name}
    </option>
  ))}
</select>



  );
}