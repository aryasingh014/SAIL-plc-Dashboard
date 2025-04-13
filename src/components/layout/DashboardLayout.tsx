
import React, { ReactNode } from 'react';
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
import { useAuthContext } from '@/context/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile, signOut, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // For mobile view, we use a drawer for navigation
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Mobile header */}
        <header className="border-b border-border py-2 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Drawer open={openMobile} onOpenChange={setOpenMobile}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[85%]">
                <div className="px-4 py-4">
                  <div className="mb-4">
                    <h1 className="text-xl font-bold">SAIL PLC</h1>
                    <p className="text-sm opacity-70">Monitoring System</p>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <nav className="space-y-1">
                    <Link to="/dashboard">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setOpenMobile(false)}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/parameters">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setOpenMobile(false)}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Parameters
                      </Button>
                    </Link>
                    <Link to="/history">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setOpenMobile(false)}>
                        <History className="mr-2 h-4 w-4" />
                        History
                      </Button>
                    </Link>
                    <Link to="/alerts">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setOpenMobile(false)}>
                        <Bell className="mr-2 h-4 w-4" />
                        Alerts
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link to="/settings">
                        <Button variant="ghost" className="w-full justify-start" onClick={() => setOpenMobile(false)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                    )}
                  </nav>
                  
                  <Separator className="my-3" />
                  
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
            <h1 className="text-base font-semibold">SAIL PLC</h1>
          </div>
        </header>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto p-3">
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
              <h1 className="text-lg font-bold">SAIL PLC</h1>
              <p className="text-xs opacity-70">Monitoring System</p>
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
              {isAdmin && (
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
          <header className="border-b py-2 px-4 hidden md:flex items-center">
            <SidebarTrigger />
            <h2 className="ml-2 text-base font-medium">SAIL PLC Monitoring</h2>
          </header>
          
          <div className="overflow-auto p-4 h-[calc(100vh-48px)]">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
