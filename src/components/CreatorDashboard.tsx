import React, { useState } from 'react';
import { useCreatorWallet } from '@/hooks/useCreatorWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Music, 
  Users, 
  Download,
  Eye,
  Heart,
  BarChart3
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface CreatorDashboardProps {
  userId: string;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ userId }) => {
  const { wallet, earnings, loading, formatCurrency, getEarningsByType, getTotalEarningsThisMonth } = useCreatorWallet(userId);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner message="Loading your creator dashboard..." />
      </div>
    );
  }

  const earningsByType = getEarningsByType();
  const monthlyEarnings = getTotalEarningsThisMonth();

  const stats = [
    {
      title: "Total Balance",
      value: wallet ? formatCurrency(wallet.balance_cents) : "$0.00",
      icon: DollarSign,
      change: "+12.5%",
      changeType: "increase" as const
    },
    {
      title: "This Month",
      value: formatCurrency(monthlyEarnings),
      icon: TrendingUp,
      change: "+8.2%",
      changeType: "increase" as const
    },
    {
      title: "Total Earned",
      value: wallet ? formatCurrency(wallet.total_earned_cents) : "$0.00",
      icon: BarChart3,
      change: "All time",
      changeType: "neutral" as const
    },
    {
      title: "Transactions",
      value: earnings.length.toString(),
      icon: Music,
      change: "Last 30 days",
      changeType: "neutral" as const
    }
  ];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold">Creator Dashboard</h2>
        <p className="text-muted-foreground">Track your earnings and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${
                    stat.changeType === 'increase' ? 'text-green-600' : 
                    'text-muted-foreground'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings Breakdown</CardTitle>
                <CardDescription>Revenue by source type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(earningsByType).map(([type, data]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {data.count} transactions
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(data.total)}
                      </span>
                    </div>
                    <Progress value={(data.total / (wallet?.total_earned_cents || 1)) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your creator account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
                <Button className="w-full" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button className="w-full" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Profile
                </Button>
                <Button className="w-full" variant="outline">
                  <Music className="w-4 h-4 mr-2" />
                  Upload New Track
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>Your latest transactions and earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnings.slice(0, 10).map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {earning.earning_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(earning.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {earning.post_id ? 'From track interaction' : 'Direct transaction'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        +{formatCurrency(earning.amount_cents)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,345</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,456</div>
                <p className="text-xs text-muted-foreground">+15.3% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remix Count</CardTitle>
                <Music className="h-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>Configure how you receive your earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Stripe Connect</h4>
                    <p className="text-sm text-muted-foreground">
                      {wallet?.stripe_account_id ? 'Connected' : 'Connect your Stripe account to receive payouts'}
                    </p>
                  </div>
                  <Button variant={wallet?.stripe_account_id ? "outline" : "default"}>
                    {wallet?.stripe_account_id ? 'Manage' : 'Connect'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Minimum Payout</h4>
                  <p className="text-sm text-muted-foreground">$10.00</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Next Payout</h4>
                  <p className="text-sm text-muted-foreground">
                    Available balance: {wallet ? formatCurrency(wallet.balance_cents) : '$0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorDashboard;