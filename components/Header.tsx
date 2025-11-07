
import React from 'react';
import { ShieldCheckIcon, SunIcon, MoonIcon, SettingsIcon } from './Icons';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onOpenSettings: () => void;
    userState: string | null;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onOpenSettings, userState }) => {
  return (
    <header className="text-center relative">
      <div className="absolute top-0 right-0 z-10 flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open settings"
          >
            <SettingsIcon className="w-6 h-6" />
            {userState && <span className="text-xs font-semibold pr-1">{userState.split(' ').map(w => w[0]).join('')}</span>}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          </button>
      </div>
      <div className="flex justify-center items-center gap-3 animate-fade-in">
        <ShieldCheckIcon className="w-10 h-10 text-cyan-600 dark:text-cyan-500" />
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
          GST Validator
        </h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg animate-fade-in" style={{ animationDelay: '100ms' }}>
        make every bill honest
      </p>
    </header>
  );
};

export default Header;
