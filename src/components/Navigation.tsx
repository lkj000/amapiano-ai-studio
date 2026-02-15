import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { LanguageSelector } from './LanguageSelector';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { PresenceIndicators } from '@/components/PresenceIndicators';
import { DeveloperModeToggle } from '@/components/DeveloperModeToggle';
import { useDeveloperModeStore } from '@/stores/developerModeStore';
import { 
  CORE_NAV_ITEMS, 
  NAV_CATEGORIES, 
  filterByRole, 
  filterCategoriesByRole,
  type NavItem,
  type NavCategory,
} from '@/components/navigation/NavigationConfig';
import { toast } from "sonner";
import { 
  Music, 
  Menu,
  X,
  Crown,
  ShoppingCart,
  LogOut,
  Settings,
  User as UserIcon,
  DollarSign,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface NavigationProps {
  user: User | null;
}

const Navigation: React.FC<NavigationProps> = ({ user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { subscription_tier, openCustomerPortal } = useSubscription(user);
  
  // Developer mode state
  const { 
    isDeveloperMode, 
    userRole, 
    expandedCategories, 
    toggleCategory,
    syncUserRole 
  } = useDeveloperModeStore();

  // Sync user role on mount/user change
  useEffect(() => {
    if (user?.id) {
      syncUserRole(user.id);
    }
  }, [user?.id, syncUserRole]);

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

  // Get filtered navigation items based on role
  const coreItems = filterByRole(CORE_NAV_ITEMS, userRole, isDeveloperMode);
  const categories = filterCategoriesByRole(userRole, isDeveloperMode);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const renderNavLink = (item: NavItem, onClick?: () => void) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClick}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
          isActive(item.path)
            ? "bg-primary text-primary-foreground shadow-glow"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0", item.path === '/dj-agent' && "animate-spin")} style={item.path === '/dj-agent' ? { animationDuration: '3s' } : undefined} />
        <span>{item.label}</span>
        {item.badge && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold",
            item.badge === 'new' && "bg-green-500/20 text-green-400",
            item.badge === 'beta' && "bg-purple-500/20 text-purple-400",
            item.badge === 'pro' && "bg-amber-500/20 text-amber-400",
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderCategory = (category: NavCategory, closeMobileMenu: () => void) => {
    const Icon = category.icon;
    const isExpanded = expandedCategories.includes(category.id);
    
    return (
      <Collapsible
        key={category.id}
        open={isExpanded}
        onOpenChange={() => toggleCategory(category.id)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span>{category.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-1">
          {category.items.map((item) => renderNavLink(item, closeMobileMenu))}
        </CollapsibleContent>
      </Collapsible>
    );
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

          {/* Desktop Navigation - Core items only */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-4xl mx-4 overflow-x-auto scrollbar-hide">
            {coreItems.slice(0, 6).map((item) => renderNavLink(item))}
          </div>

          {/* Auth/User Section & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <LanguageSelector variant="minimal" />
              {user && <WorkspaceSwitcher />}
              {user && <PresenceIndicators />}
              {/* Developer Mode Toggle */}
              <DeveloperModeToggle variant="icon" />
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
                    {isDeveloperMode && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
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

        {/* Mobile Navigation - Categorized */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {/* Quick Access */}
              <div className="pb-2 mb-2 border-b border-border/50">
                <p className="px-3 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Quick Access
                </p>
                {coreItems.map((item) => renderNavLink(item, () => setIsMobileMenuOpen(false)))}
              </div>
              
              {/* Categorized Navigation */}
              {categories.map((category) => renderCategory(category, () => setIsMobileMenuOpen(false)))}
              
              {/* Developer Mode Toggle for Mobile */}
              <div className="pt-2 mt-2 border-t border-border/50 px-3">
                <DeveloperModeToggle variant="compact" />
              </div>

              {/* User Section */}
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
                    {isDeveloperMode && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all active:bg-muted"
                      >
                        <Shield className="w-5 h-5" />
                        Admin Panel
                      </Link>
                    )}
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
