
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from '@/context/AuthContext';
import { Badge } from "@/components/ui/badge";
import { WifiOff } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const isOffline = !navigator.onLine;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <Card className="w-[450px] shadow-xl text-center">
        <CardHeader>
          <img
            src="/SAIL.png"
            alt="SAIL Logo"
            className="mx-auto mb-4 h-20 w-auto"
          />
          <CardTitle className="text-3xl font-bold">SAIL PLC Visualizer</CardTitle>
          <CardDescription className="text-lg">
            Real-time and historical PLC data visualization dashboard
          </CardDescription>
          {isOffline && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 mt-2 mx-auto flex items-center gap-1 px-2 py-1">
              <WifiOff size={14} />
              Offline Mode Available
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button className="w-full bg-industrial-blue hover:bg-industrial-blue-light" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button className="w-full" variant="outline" onClick={() => navigate('/register')}>
              Create account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
