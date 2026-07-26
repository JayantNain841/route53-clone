'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Bell,
  HelpCircle,
  Settings,
  Terminal,
  User,
  LogOut,
  Globe,
  Moon,
  Sun,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function Header() {
  const { user, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const accountName = user?.email?.split('@')[0] || 'admin';
  const accountId = '1234-5678-9012';
  const { preference, theme, setPreference, toggleTheme } = useTheme();

  return (
    <header
      className="h-[50px] app-header always-dark-header flex items-center justify-between fixed top-0 left-0 right-0 z-50 select-none"
      style={{ fontFamily: "'Inter', 'Amazon Ember', Arial, sans-serif", backgroundColor: 'var(--aws-navy)', color: '#fff' }}
    >
      {/* ── LEFT: Services + Logo ── */}
      <div className="flex items-center h-full">
        {/* Services Menu Button */}
        <button className="h-full px-4 flex items-center gap-1.5 text-white hover:bg-white/10 transition-colors text-[13px] font-normal border-r border-white/10">
          <div className="flex flex-col gap-[3px]">
            <span className="w-3.5 h-[1.5px] bg-white block" />
            <span className="w-3.5 h-[1.5px] bg-white block" />
            <span className="w-3.5 h-[1.5px] bg-white block" />
          </div>
          <span className="ml-1">Services</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        {/* AWS Logo */}
        <div className="flex items-center gap-1.5 px-4 h-full border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
          {/* AWS Orange Cube Logo */}
          <svg width="32" height="20" viewBox="0 0 60 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.576 15.6c-.48 1.68-.96 3.36-1.44 5.04H14.4l-1.44-5.04H11.52l-1.44 5.04h-.72L7.92 15.6H6.48l2.16 7.2h1.68L11.76 17.76l1.44 5.04h1.68l2.16-7.2h-1.44zM24.24 15.6L21.36 22.8h1.44l.72-1.92h2.88l.72 1.92h1.44L25.68 15.6h-1.44zm-.24 4.08l1.08-2.88 1.08 2.88h-2.16zM35.28 17.04c0-.72.48-1.2 1.2-1.2.48 0 .96.24 1.44.72l.96-.96c-.72-.72-1.44-1.08-2.4-1.08-1.68 0-2.88 1.08-2.88 2.64 0 3.12 4.08 2.16 4.08 4.08 0 .72-.48 1.2-1.44 1.2-.72 0-1.44-.24-1.92-.96l-.96.96c.72.96 1.68 1.44 2.88 1.44 1.68 0 3.12-1.08 3.12-2.64 0-3.36-4.08-2.4-4.08-4.2z" fill="#FF9900"/>
            <path d="M7.2 27.6c5.52 3.84 12.72 6 20.4 6 7.2 0 13.92-2.4 19.2-6.24.48-.48.24-1.2-.48-.96-5.76 2.16-12 3.36-18.72 3.36-6.48 0-12.48-1.2-18-3.36-.72-.24-1.2.48-.4.96v.24z" fill="#FF9900"/>
            <path d="M44.88 24.96c-.48-.48-2.4-.24-3.36-.12-.24 0-.24-.24-.12-.48.72-1.44 1.68-3.6 1.2-4.08s-2.64.24-3.84.96c-.24.12-.48 0-.48-.24.12-.72.48-2.4-.24-2.64-.72-.24-1.68 1.44-2.4 2.64-.24.24-.48.48-.72.48-3.12.96-5.04 1.44-6.72 1.44-.48 0-.96 0-1.44-.12-2.16-.48-3.36-1.44-3.36-1.44l-.72.48s1.68 1.44 4.08 2.16c.72.24 1.44.24 2.16.24 2.4 0 4.8-.72 7.68-1.68.48-.12 1.2-.48 1.68-.48.24 0 .48.24.24.48-.96 1.2-2.4 3.84-1.2 4.56 1.2.48 3.36-1.44 4.32-2.64.24-.24.48-.12.48.12 0 .96.24 2.88 1.2 3.12.96.24 1.92-1.44 2.88-3.12.24-.24.24-.36.96 0 .24.12.72.24 1.08.24.48 0 .72-.12.72-.48-.24-.72-.96-1.2-1.92-1.2z" fill="#FF9900"/>
          </svg>
          <div className="flex flex-col -mt-0.5">
            <span className="text-[10px] text-[#ff9900] font-bold leading-none tracking-widest">aws</span>
          </div>
          <span className="text-gray-400 text-[13px] ml-1">Route 53</span>
        </div>
      </div>

      {/* ── CENTER: Search Bar ── */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for services, features, blogs, docs, and more..."
            className="w-full aws-search-input text-[13px] text-gray-200 placeholder-gray-500 pl-9 pr-24 py-[5px] border focus:border-[#ff9900] focus:outline-none transition-colors"
            style={{ borderRadius: '2px' }}
            disabled
          />
          <div className="absolute right-2 flex items-center gap-1">
            <kbd className="text-[10px] text-gray-500 bg-[#232f3e] border border-gray-600 px-1 rounded">[</kbd>
            <kbd className="text-[10px] text-gray-500 bg-[#232f3e] border border-gray-600 px-1 rounded">Alt+S</kbd>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Controls ── */}
      <div className="flex items-center h-full">
        {/* CloudShell */}
        <button
          title="CloudShell"
          className="h-full px-3 flex items-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          title="Notifications"
          className="h-full px-3 flex items-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Support */}
        <button
          title="Support"
          className="h-full px-3 flex items-center gap-1 text-gray-300 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10 text-[13px]"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden lg:inline">Support</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        {/* Settings */}
        <div ref={settingsRef} className="relative h-full border-l border-white/10">
          <button
            onClick={() => { setSettingsOpen(!settingsOpen); setAccountOpen(false); setRegionOpen(false); }}
            title="Settings"
            className="h-full px-3 flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {settingsOpen && (
            <div className="absolute top-full right-0 mt-0 w-64 bg-white border border-gray-200 shadow-lg z-[100] animate-fadeIn settings-panel">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Current user settings</p>
              </div>
              <div className="px-3 py-3">
                <div className="mb-3">
                  <p className="text-[13px] text-gray-800 font-semibold">Visual mode - beta</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="radio"
                      name="visual-mode"
                      checked={preference === 'system'}
                      onChange={() => setPreference('system')}
                    />
                    <span>Browser default</span>
                  </label>

                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="radio"
                      name="visual-mode"
                      checked={preference === 'light'}
                      onChange={() => setPreference('light')}
                    />
                    <Sun className="w-4 h-4 text-yellow-500" />
                    <span>Light</span>
                  </label>

                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="radio"
                      name="visual-mode"
                      checked={preference === 'dark'}
                      onChange={() => setPreference('dark')}
                    />
                    <Moon className="w-4 h-4 text-gray-300" />
                    <span>Dark</span>
                  </label>
                </div>

                <div className="mt-3 border-t pt-3 text-[12px]">
                  <a className="text-blue-500 hover:underline">See all user settings</a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Region Switcher */}
        <div ref={regionRef} className="relative h-full border-l border-white/10">
          <button
            onClick={() => { setRegionOpen(!regionOpen); setAccountOpen(false); }}
            className="h-full px-3 flex items-center gap-1 text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-[13px]"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Global (Route 53)</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {regionOpen && (
            <div className="absolute top-full right-0 mt-0 w-56 bg-white border border-gray-200 shadow-lg z-[100] animate-fadeIn">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Region</p>
              </div>
              <div className="px-3 py-2">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[13px] text-gray-800">Global (Route 53)</span>
                  <span className="text-[11px] bg-[#e8f7e5] text-[#1d8102] border border-[#c3e6cb] px-2 py-0.5 font-semibold" style={{borderRadius:'10px'}}>Active</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Route 53 is a global service and operates from all regions.</p>
              </div>
            </div>
          )}
        </div>

        {/* Account Dropdown */}
        <div ref={accountRef} className="relative h-full border-l border-white/10">
          <button
            onClick={() => { setAccountOpen(!accountOpen); setRegionOpen(false); }}
            className="h-full px-3 flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-[13px]"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden md:inline max-w-[100px] truncate font-medium">{accountName}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {accountOpen && (
            <div className="absolute top-full right-0 mt-0 w-64 bg-white border border-gray-200 shadow-lg z-[100] animate-fadeIn">
              <div className="px-4 py-3 bg-[#f2f3f3] border-b border-gray-200">
                <p className="text-[12px] text-gray-500">Signed in as</p>
                <p className="text-[13px] font-semibold text-gray-800 mt-0.5 truncate">{user?.email || 'admin@example.com'}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Account: {accountId}</p>
              </div>

              <div className="py-1">
                {[
                  { label: 'Account', icon: User },
                  { label: 'Billing Dashboard', icon: ExternalLink },
                  { label: 'Security credentials', icon: Settings },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-200 py-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-gray-400" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
