// src/App.tsx
import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import { AppDataProvider, AppDataContext, AuthUser } from './context/AppDataContext';
import PortfolioDropdown from './components/PortfolioDropdown';
import ProjectDropdown from './components/ProjectDropdown';
import TaskDropdown from './components/TaskDropdown';
import SessionTimer from './components/SessionTimer';
import ScreenshotDisplay from './components/ScreenshotDisplay';
import UrlMappingsPage from './components/UrlMappingsPage';
import { HomeIcon, LinkIcon } from '@heroicons/react/24/solid';

function MainApp() {
  const { user, setUser } = useContext(AppDataContext)!;

  useEffect(() => {
    // Check for an authenticated user from Supabase
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const loggedInUser: AuthUser = {
          id: sessionUser.id,
          email: sessionUser.email || '',
        };
        setUser(loggedInUser);
      }
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      if (sessionUser) {
        const loggedInUser: AuthUser = {
          id: sessionUser.id,
          email: sessionUser.email || '',
        };
        setUser(loggedInUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, [setUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    chrome.storage.local.remove(['user'], () => {
      console.log("User removed from storage");
    });
    setUser(null);
  };

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="p-4 w-[640px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Time Tracking</h1>
        <button
          onClick={handleLogout}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-150 ease-in-out hover:bg-purple-700 active:scale-95 cursor-pointer"
        >
          Logout
        </button>
      </div>

      <SessionTimer />

      <div className="mt-6">
        <label htmlFor="portfolio" className="block mb-2 text-sm font-medium text-gray-700 tracking-wide">
          Select Portfolio
        </label>
        <PortfolioDropdown />
      </div>

      <div className="mt-4">
        <label htmlFor="project" className="block mb-2 text-sm font-medium text-gray-700 tracking-wide">
          Select Project
        </label>
        <ProjectDropdown />
      </div>

      <div className="mt-4">
        <label htmlFor="task" className="block mb-2 text-sm font-medium text-gray-700 tracking-wide">
          Select Task
        </label>
        <TaskDropdown />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Latest Screenshot</h2>
        <ScreenshotDisplay />
      </div>
    </div>
  );
}

// Wrapper for UrlMappingsPage to keep consistent styling
function UrlMappingsWrapper() {
  return (
    <div className="w-[640px]">
      <UrlMappingsPage />
    </div>
  );
}

// NavWrapper: Only shows nav if user is logged in
function NavWrapper() {
  const { user } = useContext(AppDataContext)!;

  if (!user) return null;

  return (
    <nav className="flex items-center p-3 bg-gray-100 shadow-md">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex items-center gap-2 px-4 py-2 mr-4 rounded transition-colors duration-300 ${
            isActive ? 'bg-purple-500 text-white' : 'text-dark hover:text-purple-500'
          }`
        }
      >
        <HomeIcon className="w-5 h-5" />
        Home
      </NavLink>
      <NavLink
        to="/url-mappings"
        className={({ isActive }) =>
          `flex items-center gap-2 px-4 py-2 rounded transition-colors duration-300 ${
            isActive ? 'bg-purple-500 text-white' : 'text-dark hover:text-purple-500'
          }`
        }
      >
        <LinkIcon className="w-5 h-5" />
        URL Mappings
      </NavLink>
    </nav>
  );
}

function App() {
  return (
    <AppDataProvider>
      <Router>
        <NavWrapper />
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/url-mappings" element={<UrlMappingsWrapper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppDataProvider>
  );
}

export default App;
