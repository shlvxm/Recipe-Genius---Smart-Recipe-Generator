
import React from 'react';
import { House, Bookmark, Settings, Search, ShoppingBasket, LogOut, MessageSquareHeart, Instagram, Ghost } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  onUploadClick?: () => void;
  onLogout: () => void;
  activeTab: 'home' | 'saved' | 'explore' | 'shopping' | 'settings' | 'feedback';
  setActiveTab: (tab: 'home' | 'saved' | 'explore' | 'shopping' | 'settings' | 'feedback') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onUploadClick, onLogout, activeTab, setActiveTab }) => {
  const userName = user?.name || 'Chef';
  const userAvatar = user?.avatar || `https://i.pravatar.cc/100?u=${userName}`;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-white dark:bg-[#111811] group/design-root overflow-x-hidden transition-colors duration-300" style={{ fontFamily: '"Work Sans", "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="gap-1 px-4 md:px-6 flex flex-1 justify-center py-5">
          {/* Sidebar Navigation */}
          <aside className="layout-content-container hidden md:flex flex-col w-64 lg:w-80 shrink-0">
            <div className="flex h-full min-h-[700px] flex-col justify-between bg-white dark:bg-[#111811] p-4 transition-colors">
              <div className="flex flex-col gap-6">
                {/* Branding */}
                <div className="flex items-center gap-4 text-[#111811] dark:text-white mb-2">
                  <div className="size-6">
                    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">RecipeGenius</h2>
                </div>

                {/* Profile Widget */}
                <div 
                  className="flex gap-3 items-center px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1c211c] p-2 rounded-xl transition-colors"
                  onClick={() => setActiveTab('settings')}
                >
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-[#f0f4f0] dark:border-[#2a302a]"
                    style={{ backgroundImage: `url("${userAvatar}")` }}
                  ></div>
                  <div className="flex flex-col">
                    <h1 className="text-[#181411] dark:text-white text-base font-bold leading-none">{userName}</h1>
                    <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mt-1">View Profile</p>
                  </div>
                </div>

                <nav className="flex flex-col gap-2">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'home' ? 'bg-[#f4f2f0] dark:bg-[#1c211c]' : 'hover:bg-[#f4f2f0] dark:hover:bg-[#1c211c]'}`}
                  >
                    <House size={24} className="text-[#181411] dark:text-white" />
                    <p className="text-[#181411] dark:text-white text-sm font-medium leading-normal">Home</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'explore' ? 'bg-[#f4f2f0] dark:bg-[#1c211c]' : 'hover:bg-[#f4f2f0] dark:hover:bg-[#1c211c]'}`}
                  >
                    <Search size={24} className="text-[#181411] dark:text-white" />
                    <p className="text-[#181411] dark:text-white text-sm font-medium leading-normal">Explore</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'saved' ? 'bg-[#f4f2f0] dark:bg-[#1c211c]' : 'hover:bg-[#f4f2f0] dark:hover:bg-[#1c211c]'}`}
                  >
                    <Bookmark size={24} className={activeTab === 'saved' ? 'fill-[#181411] dark:fill-white text-[#181411] dark:text-white' : 'text-[#181411] dark:text-white'} />
                    <p className="text-[#181411] dark:text-white text-sm font-medium leading-normal">Saved Recipes</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('shopping')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'shopping' ? 'bg-[#f4f2f0] dark:bg-[#1c211c]' : 'hover:bg-[#f4f2f0] dark:hover:bg-[#1c211c]'}`}
                  >
                    <ShoppingBasket size={24} className="text-[#181411] dark:text-white" />
                    <p className="text-[#181411] dark:text-white text-sm font-medium leading-normal">Shopping List</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('feedback')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'feedback' ? 'bg-[#f4f2f0] dark:bg-[#1c211c]' : 'hover:bg-[#f4f2f0] dark:hover:bg-[#1c211c]'}`}
                  >
                    <MessageSquareHeart size={24} className="text-[#181411] dark:text-white" />
                    <p className="text-[#181411] dark:text-white text-sm font-medium leading-normal">Feedback</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-[#f4f2f0] dark:bg-[#1c211c]' : 'hover:bg-[#f4f2f0] dark:hover:bg-[#1c211c]'}`}
                  >
                    <Settings size={24} className="text-[#181411] dark:text-white" />
                    <p className="text-[#181411] dark:text-white text-sm font-medium leading-normal">Settings</p>
                  </button>
                </nav>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={onUploadClick}
                  className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#13ec13] text-[#111811] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#11e011] transition-all"
                >
                  <span className="truncate">New Recipe</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors"
                >
                  <LogOut size={20} />
                  <span>Log Out</span>
                </button>

                {/* Footer Credits */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a302a]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Developed by cvam</p>
                  <div className="flex gap-4">
                    <a href="https://instagram.com/tryshivam" target="_blank" rel="noopener noreferrer" title="Instagram: tryshivam" className="text-gray-400 hover:text-[#13ec13] transition-colors">
                      <Instagram size={18} />
                    </a>
                    <a href="https://snapchat.com/add/shlvxm" target="_blank" rel="noopener noreferrer" title="Snapchat: shlvxm" className="text-gray-400 hover:text-[#13ec13] transition-colors">
                      <Ghost size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="layout-content-container flex flex-col max-w-[960px] flex-1 min-w-0 bg-white dark:bg-[#111811] transition-colors">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
