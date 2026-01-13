import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Share2, 
  Link2, 
  Copy, 
  ExternalLink,
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Music,
  Users,
  TrendingUp,
  BarChart3,
  Send,
  Sparkles,
  FileText,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  CheckCircle2,
  Zap,
  Target,
  Eye,
  MessageSquare,
  Heart
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduledFor: Date;
  status: "scheduled" | "posted" | "failed";
}

const SOCIAL_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "bg-black" },
  { id: "tiktok", name: "TikTok", icon: Music, color: "bg-black" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "bg-red-500" },
];

export default function PromotionHub() {
  const [activeTab, setActiveTab] = useState("smart-links");
  const [smartLinkUrl, setSmartLinkUrl] = useState("");
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  // Smart Link form
  const [linkTitle, setLinkTitle] = useState("");
  const [linkArtist, setLinkArtist] = useState("");
  const [linkType, setLinkType] = useState<"single" | "album" | "presave">("single");
  
  // EPK form
  const [epkBio, setEpkBio] = useState("");
  const [epkPressQuotes, setEpkPressQuotes] = useState("");
  
  // Social scheduler
  const [postContent, setPostContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "twitter"]);

  const generateSmartLink = () => {
    if (!linkTitle || !linkArtist) {
      toast({
        title: "Missing information",
        description: "Please fill in the track title and artist name",
        variant: "destructive"
      });
      return;
    }

    const slug = `${linkArtist.toLowerCase().replace(/\s+/g, '-')}-${linkTitle.toLowerCase().replace(/\s+/g, '-')}`;
    const url = `https://aura.link/${slug}`;
    setSmartLinkUrl(url);
    
    toast({
      title: "Smart Link Created! 🔗",
      description: "Your link is ready to share"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard"
    });
  };

  const schedulePost = () => {
    if (!postContent || !selectedDate) {
      toast({
        title: "Missing information",
        description: "Please add content and select a date",
        variant: "destructive"
      });
      return;
    }

    const newPosts: ScheduledPost[] = selectedPlatforms.map(platform => ({
      id: Math.random().toString(36).substr(2, 9),
      platform,
      content: postContent,
      scheduledFor: selectedDate,
      status: "scheduled"
    }));

    setScheduledPosts([...scheduledPosts, ...newPosts]);
    setPostContent("");
    setSelectedDate(undefined);
    
    toast({
      title: "Posts Scheduled! 📅",
      description: `${newPosts.length} posts scheduled for ${format(selectedDate, "PPP")}`
    });
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Promotion Hub</h1>
              <p className="text-muted-foreground">Smart links, EPK, social scheduling & more</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="smart-links" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Smart Links
            </TabsTrigger>
            <TabsTrigger value="epk" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              EPK
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Social Scheduler
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Smart Links Tab */}
          <TabsContent value="smart-links">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Create Smart Link
                  </CardTitle>
                  <CardDescription>
                    One link that works everywhere - fans choose their preferred platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Track/Album Title *</Label>
                    <Input 
                      placeholder="e.g., Midnight Dreams"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Artist Name *</Label>
                    <Input 
                      placeholder="e.g., DJ Aura"
                      value={linkArtist}
                      onChange={(e) => setLinkArtist(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Link Type</Label>
                    <div className="flex gap-2 mt-2">
                      {(["single", "album", "presave"] as const).map(type => (
                        <Button
                          key={type}
                          variant={linkType === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLinkType(type)}
                          className="capitalize"
                        >
                          {type === "presave" ? "Pre-Save" : type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" onClick={generateSmartLink}>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Smart Link
                  </Button>

                  {smartLinkUrl && (
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Your Smart Link</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input value={smartLinkUrl} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(smartLinkUrl)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Link Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    {/* Mock smart link preview */}
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="w-24 h-24 rounded-lg bg-muted mx-auto mb-4 flex items-center justify-center">
                          <Music className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="font-bold text-lg">{linkTitle || "Track Title"}</h3>
                        <p className="text-muted-foreground">{linkArtist || "Artist Name"}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {["Spotify", "Apple Music", "YouTube Music", "SoundCloud"].map(platform => (
                        <Button key={platform} variant="outline" className="w-full justify-start">
                          <Music className="w-4 h-4 mr-2" />
                          Listen on {platform}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EPK Tab */}
          <TabsContent value="epk">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Electronic Press Kit</CardTitle>
                    <CardDescription>
                      Professional media kit for press, venues, and booking agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Artist Bio</Label>
                      <Textarea 
                        placeholder="Tell your story... (3-4 paragraphs recommended)"
                        value={epkBio}
                        onChange={(e) => setEpkBio(e.target.value)}
                        rows={6}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Profile Photo</Label>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload high-res photo</p>
                        </div>
                      </div>
                      <div>
                        <Label>Logo</Label>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload logo (PNG)</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Press Quotes / Reviews</Label>
                      <Textarea 
                        placeholder='"Amazing production quality" - Music Blog&#10;"One of the best new Amapiano producers" - DJ Magazine'
                        value={epkPressQuotes}
                        onChange={(e) => setEpkPressQuotes(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button className="flex-1">
                        <Globe className="w-4 h-4 mr-2" />
                        Publish EPK
                      </Button>
                      <Button variant="outline">
                        <Copy className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Listeners</span>
                      <span className="font-bold">12.5K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Streams</span>
                      <span className="font-bold">250K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Social Following</span>
                      <span className="font-bold">8.2K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Releases</span>
                      <span className="font-bold">12</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">EPK Sections</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { name: "Bio", complete: !!epkBio },
                      { name: "Photos", complete: false },
                      { name: "Music", complete: true },
                      { name: "Press", complete: !!epkPressQuotes },
                      { name: "Contact", complete: false },
                      { name: "Social Links", complete: true },
                    ].map(section => (
                      <div key={section.name} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                        <span>{section.name}</span>
                        {section.complete ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Badge variant="outline" className="text-xs">Incomplete</Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Social Scheduler Tab */}
          <TabsContent value="social">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Post</CardTitle>
                    <CardDescription>
                      Schedule posts across multiple platforms at once
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Platforms</Label>
                      <div className="flex gap-2 mt-2">
                        {SOCIAL_PLATFORMS.map(platform => (
                          <Button
                            key={platform.id}
                            variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => togglePlatform(platform.id)}
                            className={selectedPlatforms.includes(platform.id) ? platform.color : ""}
                          >
                            <platform.icon className="w-4 h-4 mr-2" />
                            {platform.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Content</Label>
                      <Textarea 
                        placeholder="What's on your mind? Add your caption here..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        rows={4}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {postContent.length} characters
                        </span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Generate with AI
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Schedule Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input type="time" defaultValue="12:00" />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button className="flex-1" onClick={schedulePost}>
                        <Clock className="w-4 h-4 mr-2" />
                        Schedule Post
                      </Button>
                      <Button variant="outline">
                        <Send className="w-4 h-4 mr-2" />
                        Post Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Scheduled Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Scheduled Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scheduledPosts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No scheduled posts yet</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {scheduledPosts.map(post => (
                            <div key={post.id} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="capitalize">
                                  {post.platform}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(post.scheduledFor, "PPP 'at' p")}
                                </span>
                              </div>
                              <p className="text-sm line-clamp-2">{post.content}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Best Times to Post</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { day: "Monday", time: "7:00 PM", engagement: "High" },
                      { day: "Wednesday", time: "12:00 PM", engagement: "Medium" },
                      { day: "Friday", time: "6:00 PM", engagement: "Very High" },
                      { day: "Saturday", time: "10:00 AM", engagement: "High" },
                    ].map(slot => (
                      <div key={slot.day} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <div>
                          <span className="font-medium">{slot.day}</span>
                          <span className="text-muted-foreground ml-2">{slot.time}</span>
                        </div>
                        <Badge variant={slot.engagement === "Very High" ? "default" : "secondary"}>
                          {slot.engagement}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Ideas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      "Behind the scenes studio footage",
                      "Snippet of your new track",
                      "Thank your fans milestone post",
                      "Collaboration announcement",
                      "Live performance clip",
                    ].map((idea, i) => (
                      <Button key={i} variant="ghost" className="w-full justify-start text-left h-auto py-2">
                        <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{idea}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Smart Link Clicks", value: "1,234", change: "+12%", icon: Link2 },
                { label: "EPK Views", value: "89", change: "+5%", icon: Eye },
                { label: "Social Engagement", value: "3.2K", change: "+18%", icon: Heart },
                { label: "New Followers", value: "156", change: "+8%", icon: Users },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="w-5 h-5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-green-500">
                        {stat.change}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Midnight Dreams", clicks: 456, platform: "Spotify" },
                      { name: "Summer Vibes EP", clicks: 312, platform: "Apple Music" },
                      { name: "Pre-Save Campaign", clicks: 289, platform: "Multiple" },
                    ].map((link, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-sm">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium">{link.name}</p>
                            <p className="text-xs text-muted-foreground">Top: {link.platform}</p>
                          </div>
                        </div>
                        <span className="font-mono">{link.clicks} clicks</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audience Geography</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { country: "South Africa", percentage: 45 },
                      { country: "Nigeria", percentage: 20 },
                      { country: "United Kingdom", percentage: 15 },
                      { country: "United States", percentage: 12 },
                      { country: "Other", percentage: 8 },
                    ].map(geo => (
                      <div key={geo.country}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{geo.country}</span>
                          <span>{geo.percentage}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${geo.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
