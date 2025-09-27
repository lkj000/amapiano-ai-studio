import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { LanguageSelector } from './LanguageSelector';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { toast } from "sonner";
import { 
  Music, 
  Search, 
  Headphones, 
  Grid3X3, 
  Volume2,
  Menu,
  X,
  Sparkles,
  Crown,
  ShoppingCart,
  LogOut,
  Settings,
  User as UserIcon,
  Brain,
  Users,
  DollarSign
} from "lucide-react";

interface NavigationProps {
  user: User | null;
}

const Navigation: React.FC<NavigationProps> = ({ user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { subscription_tier, openCustomerPortal } = useSubscription(user);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleBillingPortal = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      toast.error('You need to have an active subscription to access the billing portal. Please subscribe first.');
    }
  };

const navItems = [
    { path: "/", label: "Home", icon: Sparkles },
    { path: "/generate", label: "Generate", icon: Music },
    { path: "/social", label: "Social", icon: Users },
    { path: "/analyze", label: "Analyze", icon: Search },
    { path: "/samples", label: "Samples", icon: Headphones },
    { path: "/patterns", label: "Patterns", icon: Grid3X3 },
    { path: "/daw", label: "DAW", icon: Volume2 },
    { path: "/aura808", label: "Aura 808", icon: Music },
    { path: "/aura", label: "AURA-X", icon: Brain },
    { path: "/ai-hub", label: "AI Hub", icon: Brain },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-primary hidden sm:block">
              Amapiano AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth/User Section */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector variant="minimal" />
            {user ? (
              <>
                <SubscriptionBadge tier={subscription_tier} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.email}</p>
                        <SubscriptionBadge tier={subscription_tier} className="w-fit" />
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/creator-hub" className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Creator Hub
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/subscription" className="flex items-center">
                        <Crown className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/marketplace" className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Marketplace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBillingPortal}>
                      <Settings className="mr-2 h-4 w-4" />
                      Billing Portal
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="btn-glow">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-4 space-y-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
                      Signed in as {user.email}
                    </div>
                    <Link
                      to="/subscription"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                    >
                      <Crown className="w-5 h-5" />
                      Subscription
                    </Link>
                    <Link
                      to="/marketplace"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Marketplace
                    </Link>
                    <Button
                      onClick={handleBillingPortal}
                      variant="ghost"
                      className="w-full justify-start gap-3 text-left text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Settings className="w-5 h-5" />
                      Billing Portal
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      className="w-full justify-start gap-3 text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full btn-glow">
                      <UserIcon className="w-4 w-4 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navigation;