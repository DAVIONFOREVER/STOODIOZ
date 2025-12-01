
import React from 'react';
import { supabase } from '../../lib/supabaseClient';

const LogoutButton = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-slate-400 hover:text-white font-semibold text-sm transition-colors"
    >
      Sign Out
    </button>
  );
};

export default LogoutButton;
