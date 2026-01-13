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
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { PresenceIndicators } from '@/components/PresenceIndicators';
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
  DollarSign,
  Shield,
  Radio,
  Activity,
  Disc3,
  Upload,
  Megaphone,
  Layers
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
    { path: "/studio", label: "Studio", icon: Layers },
    { path: "/master", label: "Master", icon: Disc3 },
    { path: "/release", label: "Release", icon: Upload },
    { path: "/promote", label: "Promote", icon: Megaphone },
    { path: "/social", label: "Social", icon: Users },
    { path: "/daw", label: "DAW", icon: Volume2 },
    { path: "/templates", label: "Templates", icon: Grid3X3 },
    { path: "/analyze", label: "Analyze", icon: Search },
    { path: "/samples", label: "Samples", icon: Headphones },
    { path: "/patterns", label: "Patterns", icon: Grid3X3 },
    { path: "/audio-editor", label: "Audio Editor", icon: Radio },
    { path: "/amapianorize", label: "Amapianorize", icon: Sparkles },
    { path: "/aura808", label: "Aura 808", icon: Music },
    { path: "/aura", label: "AURA-X", icon: Brain },
    { path: "/ai-hub", label: "AI Hub", icon: Brain },
    { path: "/research", label: "Research", icon: Brain },
    { path: "/performance", label: "Performance", icon: Activity },
    { path: "/level5-dashboard", label: "Level 5", icon: Shield },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border supports-[backdrop-filter]:bg-background/80">
      <nav className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-xl font-bold text-gradient-primary hidden xs:block">
              Amapiano AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-4xl mx-4 overflow-x-auto scrollbar-hide">
            {navItems.slice(0, 8).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth/User Section & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <LanguageSelector variant="minimal" />
              {user && <WorkspaceSwitcher />}
              {user && <PresenceIndicators />}
            </div>
            {user ? (
              <>
                <div className="hidden md:block">
                  <SubscriptionBadge tier={subscription_tier} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="text-xs sm:text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background z-50" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm truncate">{user.email}</p>
                        <SubscriptionBadge tier={subscription_tier} className="w-fit" />
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/creator-hub" className="flex items-center cursor-pointer">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Creator Hub
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/subscription" className="flex items-center cursor-pointer">
                        <Crown className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/marketplace" className="flex items-center cursor-pointer">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Marketplace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBillingPortal} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Billing Portal
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="btn-glow">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 sm:h-10 sm:w-10 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-4 space-y-2 border-t border-border mt-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-xs sm:text-sm text-muted-foreground">
                      <p className="font-medium truncate">{user.email}</p>
                      <SubscriptionBadge tier={subscription_tier} className="mt-1 w-fit" />
                    </div>
                    <Link
                      to="/subscription"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all active:bg-muted"
                    >
                      <Crown className="w-5 h-5" />
                      Subscription
                    </Link>
                    <Link
                      to="/marketplace"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all active:bg-muted"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Marketplace
                    </Link>
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all active:bg-muted"
                    >
                      <Shield className="w-5 h-5" />
                      Admin Panel
                    </Link>
                    <Button
                      onClick={() => {
                        handleBillingPortal();
                        setIsMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start gap-3 text-left text-muted-foreground hover:text-foreground hover:bg-muted h-auto py-2.5"
                    >
                      <Settings className="w-5 h-5" />
                      Billing Portal
                    </Button>
                    <Button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start gap-3 text-left h-auto py-2.5"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                      <Button variant="ghost" className="w-full justify-start gap-3">
                        <UserIcon className="w-5 h-5" />
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                      <Button className="w-full btn-glow justify-start gap-3">
                        <UserIcon className="w-5 h-5" />
                        Get Started
                      </Button>
                    </Link>
                  </div>
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
