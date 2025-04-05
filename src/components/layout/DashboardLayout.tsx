
import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, History, Bell, Settings, LogOut, 
  LayoutDashboard, AlertTriangle
} from 'lucide-react';

type User = {
  username: string;
  role: string;
  isAuthenticated: boolean;
};

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-industrial-blue text-white flex flex-col">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Nexus PLC</h1>
          <p className="text-sm opacity-70">Visualization Dashboard</p>
        </div>
        
        <div className="p-4 bg-industrial-blue-light/20">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs opacity-70 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
        
        <Separator className="bg-white/10" />
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/parameters">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <BarChart3 className="mr-2 h-4 w-4" />
              Parameters
            </Button>
          </Link>
          <Link to="/history">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </Link>
          <Link to="/alerts">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              <Bell className="mr-2 h-4 w-4" />
              Alerts
            </Button>
          </Link>
          {user.role === 'admin' && (
            <Link to="/settings">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
        </nav>
        
        <div className="p-4">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
