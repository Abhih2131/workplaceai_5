import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Upload, MessageSquare } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { MASTER_FILE_TEST_MODE } from '@/lib/config';

export default function Navbar() {
  const location = useLocation();
  const { isDemo, isMasterFileMode, employees } = useData();
  const hasData = employees.length > 0;

  const links = [
    ...(!MASTER_FILE_TEST_MODE ? [{ to: '/', label: 'Upload', icon: Upload }] : []),
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/chatbot', label: 'Chatbot', icon: MessageSquare },
  ];

  return (
    <nav className="bg-primary">
      <div className="container flex items-center justify-between h-16">
        <Link to={MASTER_FILE_TEST_MODE ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-people flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-people-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-primary-foreground">WorkplaceAI</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-primary-foreground'
                    : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {isMasterFileMode && hasData && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-people text-people-foreground">
              Test Mode
            </span>
          )}
          {isDemo && hasData && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-attrition text-attrition-foreground">
              Demo Mode
            </span>
          )}
          {hasData && !isDemo && !isMasterFileMode && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-joiners text-joiners-foreground">
              Live Data
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
