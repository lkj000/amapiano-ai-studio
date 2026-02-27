import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Globe, 
  Music, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
  FileAudio,
  Users,
  DollarSign,
  ChevronRight,
  Rocket,
  Link2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Platform {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  status: "pending" | "approved" | "live" | "error";
}

const PLATFORMS: Platform[] = [
  { id: "spotify", name: "Spotify", icon: "🎵", enabled: true, status: "pending" },
  { id: "apple", name: "Apple Music", icon: "🍎", enabled: true, status: "pending" },
  { id: "youtube", name: "YouTube Music", icon: "▶️", enabled: true, status: "pending" },
  { id: "tiktok", name: "TikTok", icon: "🎵", enabled: true, status: "pending" },
  { id: "amazon", name: "Amazon Music", icon: "📦", enabled: true, status: "pending" },
  { id: "deezer", name: "Deezer", icon: "🎧", enabled: true, status: "pending" },
  { id: "tidal", name: "Tidal", icon: "🌊", enabled: false, status: "pending" },
  { id: "soundcloud", name: "SoundCloud", icon: "☁️", enabled: false, status: "pending" },
];

const GENRES = [
  "Amapiano", "Afrobeats", "House", "Deep House", "Electronic", 
  "Hip Hop", "R&B", "Pop", "Dance", "Gqom"
];

/**
 * Deterministic CRC-style hash — mirrors the implementation in useDistribution.ts.
 * Returns an unsigned 32-bit integer derived from the input string.
 */
function crc32Hash(str: string): number {
  let crc = 0xffffffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Generate a deterministic UPC-A code (12 digits with check digit). */
function generateUPC(seed: string): string {
  const hash = crc32Hash(seed);
  const body = hash.toString().padStart(11, '0').slice(0, 11);
  let odd = 0, even = 0;
  for (let i = 0; i < 11; i++) {
    const d = parseInt(body[i], 10);
    if (i % 2 === 0) odd += d; else even += d;
  }
  const checkDigit = (10 - ((odd * 3 + even) % 10)) % 10;
  return body + checkDigit;
}

/** Generate a deterministic ISRC code (ZA-AB1-YY-NNNNN). */
function generateISRC(seed: string): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const hash = crc32Hash(seed);
  const designation = (hash % 100000).toString().padStart(5, '0');
  return `ZA-AB1-${year}-${designation}`;
}

export default function ReleaseManager() {
  const [step, setStep] = useState(1);
  const [releaseDate, setReleaseDate] = useState<Date>();
  const [platforms, setPlatforms] = useState(PLATFORMS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('anonymous');

  // Fetch current user ID for deterministic code generation
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setUserId(data.user.id);
    });
  }, []);
  
  // Track details
  const [trackTitle, setTrackTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [featuredArtists, setFeaturedArtists] = useState("");
  const [genre, setGenre] = useState("Amapiano");
  const [subgenre, setSubgenre] = useState("");
  const [isExplicit, setIsExplicit] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [isrc, setIsrc] = useState("");
  const [upc, setUpc] = useState("");
  
  // Splits
  const [splits, setSplits] = useState([
    { name: "Primary Artist", role: "Artist", percentage: 80 },
    { name: "", role: "Producer", percentage: 20 }
  ]);

  const togglePlatform = (platformId: string) => {
    setPlatforms(platforms.map(p => 
      p.id === platformId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleSubmitRelease = async () => {
    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    toast({
      title: "Release submitted! 🚀",
      description: `"${trackTitle}" is now being distributed to ${platforms.filter(p => p.enabled).length} platforms`
    });
    setStep(5);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Upload Your Music</h2>
              <p className="text-muted-foreground">Start by uploading your mastered track and artwork</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Audio Upload */}
              <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
                <CardContent className="p-8">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <FileAudio className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-1">Audio File</p>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      WAV or FLAC, 16-bit or 24-bit, 44.1kHz or higher
                    </p>
                    <input type="file" accept="audio/*" className="hidden" />
                    <Button variant="outline">Choose File</Button>
                  </label>
                </CardContent>
              </Card>

              {/* Artwork Upload */}
              <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
                <CardContent className="p-8">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-1">Cover Artwork</p>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      3000x3000 pixels, JPG or PNG
                    </p>
                    <input type="file" accept="image/*" className="hidden" />
                    <Button variant="outline">Choose File</Button>
                  </label>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="text-sm">
                <span className="font-medium">Pro tip:</span> Need artwork? Use our AI generator in the Creator Hub
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Track Details</h2>
              <p className="text-muted-foreground">Add metadata for your release</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Track Title *</Label>
                  <Input 
                    placeholder="Enter track title"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Primary Artist *</Label>
                  <Input 
                    placeholder="Artist name"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Featured Artists</Label>
                  <Input 
                    placeholder="Artist 1, Artist 2..."
                    value={featuredArtists}
                    onChange={(e) => setFeaturedArtists(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Genre *</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subgenre</Label>
                    <Input 
                      placeholder="e.g., Private School"
                      value={subgenre}
                      onChange={(e) => setSubgenre(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>ISRC Code</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Auto-generate or enter existing"
                      value={isrc}
                      onChange={(e) => setIsrc(e.target.value)}
                    />
                    <Button variant="outline" onClick={() => setIsrc(generateISRC(`${userId}:${trackTitle}:${Date.now()}`))}>
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    International Standard Recording Code for tracking
                  </p>
                </div>

                <div>
                  <Label>UPC/EAN Code</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="For album releases"
                      value={upc}
                      onChange={(e) => setUpc(e.target.value)}
                    />
                    <Button variant="outline" onClick={() => setUpc(generateUPC(`${userId}:${trackTitle}:${Date.now()}`))}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="explicit"
                      checked={isExplicit}
                      onCheckedChange={(checked) => setIsExplicit(checked as boolean)}
                    />
                    <Label htmlFor="explicit">Explicit Content</Label>
                  </div>
                </div>

                <div>
                  <Label>Lyrics (Optional)</Label>
                  <Textarea 
                    placeholder="Add lyrics for better discoverability..."
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose Platforms</h2>
              <p className="text-muted-foreground">Select where your music will be distributed</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platforms.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    platform.enabled
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="text-3xl mb-2">{platform.icon}</div>
                  <p className="font-medium text-sm">{platform.name}</p>
                  {platform.enabled && (
                    <CheckCircle2 className="w-4 h-4 text-primary mx-auto mt-2" />
                  )}
                </button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Release Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label>Release Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {releaseDate ? format(releaseDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={releaseDate}
                          onSelect={setReleaseDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label>Release Time</Label>
                    <Select defaultValue="midnight">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="midnight">Midnight (Local)</SelectItem>
                        <SelectItem value="friday">Friday at Midnight</SelectItem>
                        <SelectItem value="custom">Custom Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Platforms typically need 2-3 weeks for review before release
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Royalty Splits</h2>
              <p className="text-muted-foreground">Define how earnings will be shared</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                {splits.map((split, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <Input 
                        placeholder="Name"
                        value={split.name}
                        onChange={(e) => {
                          const newSplits = [...splits];
                          newSplits[index].name = e.target.value;
                          setSplits(newSplits);
                        }}
                      />
                    </div>
                    <div className="w-32">
                      <Select value={split.role} onValueChange={(value) => {
                        const newSplits = [...splits];
                        newSplits[index].role = value;
                        setSplits(newSplits);
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Artist">Artist</SelectItem>
                          <SelectItem value="Producer">Producer</SelectItem>
                          <SelectItem value="Songwriter">Songwriter</SelectItem>
                          <SelectItem value="Featured">Featured</SelectItem>
                          <SelectItem value="Label">Label</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 flex items-center gap-2">
                      <Input 
                        type="number"
                        value={split.percentage}
                        onChange={(e) => {
                          const newSplits = [...splits];
                          newSplits[index].percentage = parseInt(e.target.value) || 0;
                          setSplits(newSplits);
                        }}
                        className="text-center"
                      />
                      <span>%</span>
                    </div>
                  </div>
                ))}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSplits([...splits, { name: "", role: "Songwriter", percentage: 0 }])}
                >
                  + Add Collaborator
                </Button>

                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="font-medium">Total</span>
                  <span className={`font-bold ${splits.reduce((a, b) => a + b.percentage, 0) === 100 ? "text-green-500" : "text-red-500"}`}>
                    {splits.reduce((a, b) => a + b.percentage, 0)}%
                  </span>
                </div>

                {splits.reduce((a, b) => a + b.percentage, 0) !== 100 && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Splits must equal 100%
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Release Submitted!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              "{trackTitle}" is now being reviewed and will be distributed to {platforms.filter(p => p.enabled).length} platforms.
            </p>

            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Release Date</span>
                  <span className="font-medium">{releaseDate ? format(releaseDate, "PPP") : "TBD"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Platforms</span>
                  <span className="font-medium">{platforms.filter(p => p.enabled).length} selected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="secondary">In Review</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => window.location.href = "/promote"}>
                <Share2 className="w-4 h-4 mr-2" />
                Create Promo Campaign
              </Button>
              <Button onClick={() => setStep(1)}>
                <Rocket className="w-4 h-4 mr-2" />
                Submit Another Release
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Release Manager</h1>
              <p className="text-muted-foreground">Distribute your music to 150+ streaming platforms</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {step < 5 && (
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <button
                  onClick={() => setStep(s)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                </button>
                {s < 4 && (
                  <div className={`w-16 h-1 ${s < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {renderStep()}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                Back
              </Button>
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitRelease}
                  disabled={isSubmitting || splits.reduce((a, b) => a + b.percentage, 0) !== 100}
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Submit Release
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
