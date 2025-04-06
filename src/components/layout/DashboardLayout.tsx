
import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, History, Bell, Settings, LogOut, 
  LayoutDashboard, Menu
} from 'lucide-react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { DrawerContent, Drawer, DrawerTrigger } from "@/components/ui/drawer";

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
  const isMobile = useIsMobile();

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

  // For mobile view, we use a drawer for navigation
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Mobile header */}
        <header className="border-b border-border py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[85%]">
                <div className="px-4 py-6">
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold">Nexus PLC</h1>
                    <p className="text-sm opacity-70">Visualization Dashboard</p>
                  </div>
                  
                  <div className="p-4 bg-industrial-blue-light/20 rounded-lg mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-industrial-blue flex items-center justify-center text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.username}</p>
                        <p className="text-xs opacity-70 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <nav className="space-y-2">
                    <Link to="/dashboard">
                      <Button variant="ghost" className="w-full justify-start">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/parameters">
                      <Button variant="ghost" className="w-full justify-start">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Parameters
                      </Button>
                    </Link>
                    <Link to="/history">
                      <Button variant="ghost" className="w-full justify-start">
                        <History className="mr-2 h-4 w-4" />
                        History
                      </Button>
                    </Link>
                    <Link to="/alerts">
                      <Button variant="ghost" className="w-full justify-start">
                        <Bell className="mr-2 h-4 w-4" />
                        Alerts
                      </Button>
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/settings">
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                    )}
                  </nav>
                  
                  <Separator className="my-4" />
                  
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
            <h1 className="text-lg font-semibold">Nexus PLC</h1>
          </div>
        </header>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  // Desktop view with Sidebar
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="h-screen flex overflow-hidden w-full bg-background">
        <Sidebar variant="sidebar" collapsible="offcanvas">
          <SidebarHeader>
            <div className="p-2">
              <h1 className="text-lg font-bold">Nexus PLC</h1>
              <p className="text-xs opacity-70">Visualization Dashboard</p>
            </div>
            
            <div className="p-2 bg-sidebar-accent/20 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-full bg-sidebar-accent/20 flex items-center justify-center">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs opacity-70 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link to="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Parameters">
                  <Link to="/parameters">
                    <BarChart3 />
                    <span>Parameters</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="History">
                  <Link to="/history">
                    <History />
                    <span>History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Alerts">
                  <Link to="/alerts">
                    <Bell />
                    <span>Alerts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user.role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Settings">
                    <Link to="/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset>
          <header className="border-b py-3 px-4 hidden md:flex items-center">
            <SidebarTrigger />
            <h2 className="ml-2 text-lg font-semibold">Visualization Dashboard</h2>
          </header>
          
          <div className="overflow-auto p-4 h-[calc(100vh-56px)]">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
