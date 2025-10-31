import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Palette, Plus, Search, Download, Upload, Globe, FileAudio } from "lucide-react";

const CulturalStyleCatalog = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    styleName: "",
    region: "",
    description: "",
    characteristics: "",
    culturalContext: "",
    consent: false,
    attribution: false,
    preservation: false,
  });

  const styleProfiles = [
    {
      id: "amp-log-drum-001",
      name: "Private School Log Drum",
      region: "South Africa",
      preservation: 96,
      authenticity: 94,
      samples: 423,
      characteristics: ["Syncopated rhythm", "808 kick patterns", "Sub-bass emphasis"],
      contributors: 87,
    },
    {
      id: "amp-piano-002",
      name: "Amapiano Piano Motifs",
      region: "South Africa",
      preservation: 93,
      authenticity: 91,
      samples: 356,
      characteristics: ["Jazz-influenced chords", "Repetitive patterns", "Melodic hooks"],
      contributors: 62,
    },
    {
      id: "amp-bass-003",
      name: "Deep House Bass",
      region: "Pan-African",
      preservation: 95,
      authenticity: 93,
      samples: 289,
      characteristics: ["Rolling basslines", "Minimal movement", "Groove-focused"],
      contributors: 54,
    },
    {
      id: "amp-vocal-004",
      name: "Vocal Samples & Chants",
      region: "Multiple regions",
      preservation: 89,
      authenticity: 87,
      samples: 198,
      characteristics: ["Call-response", "Local languages", "Percussive vocals"],
      contributors: 41,
    },
  ];

  const culturalMetrics = {
    totalStyles: 47,
    totalSamples: 12847,
    activeContributors: 847,
    regions: 8,
    avgPreservation: 92.4,
    avgAuthenticity: 90.1,
  };

  const addNewStyle = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.consent || !formData.attribution || !formData.preservation) {
      toast({
        title: "Consent Required",
        description: "Please agree to all ethical data collection principles",
        variant: "destructive",
      });
      return;
    }

    if (!formData.styleName || !formData.region || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Style Contribution Submitted",
      description: "Your cultural style profile will be reviewed by the research team",
    });
    
    setIsDialogOpen(false);
    setFormData({
      styleName: "",
      region: "",
      description: "",
      characteristics: "",
      culturalContext: "",
      consent: false,
      attribution: false,
      preservation: false,
    });
  };

  const exportCatalog = () => {
    toast({
      title: "Catalog Exported",
      description: "Cultural style profiles saved for research",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Cultural Style Catalog
              </CardTitle>
              <CardDescription>
                Preserving Amapiano musical heritage through ethical data collection
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addNewStyle} className="gap-2">
                <Plus className="w-4 h-4" />
                Contribute Style
              </Button>
              <Button variant="outline" onClick={exportCatalog} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search cultural styles, regions, characteristics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Styles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{culturalMetrics.totalStyles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Samples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{culturalMetrics.totalSamples.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{culturalMetrics.activeContributors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{culturalMetrics.regions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preservation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{culturalMetrics.avgPreservation}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Authenticity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{culturalMetrics.avgAuthenticity}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Style Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {styleProfiles.map((style) => (
          <Card key={style.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{style.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Globe className="w-3 h-3" />
                    {style.region}
                  </CardDescription>
                </div>
                <Badge>{style.samples} samples</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Preservation</div>
                  <div className="text-2xl font-bold">{style.preservation}%</div>
                  <Progress value={style.preservation} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Authenticity</div>
                  <div className="text-2xl font-bold">{style.authenticity}%</div>
                  <Progress value={style.authenticity} />
                </div>
              </div>

              {/* Characteristics */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Characteristics</div>
                <div className="flex flex-wrap gap-1">
                  {style.characteristics.map((char, idx) => (
                    <Badge key={idx} variant="outline">
                      {char}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contributors */}
              <div className="text-sm text-muted-foreground">
                {style.contributors} community contributors
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Apply Style
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ethical Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Ethical Data Collection Principles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Upload className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Community Consent</h4>
              <p className="text-sm text-muted-foreground">
                All style profiles require explicit consent from cultural practitioners and community members
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Globe className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Attribution & Credit</h4>
              <p className="text-sm text-muted-foreground">
                Contributors are recognized and can opt for attribution in generated works
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Palette className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Cultural Preservation</h4>
              <p className="text-sm text-muted-foreground">
                Styles are documented with cultural context to prevent misappropriation and ensure authentic representation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ethical Data Collection Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Contribute Cultural Style
            </DialogTitle>
            <DialogDescription>
              Help preserve musical heritage by contributing authentic cultural style profiles with full ethical consent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="styleName">Style Name *</Label>
                <Input
                  id="styleName"
                  placeholder="e.g., Private School Log Drum"
                  value={formData.styleName}
                  onChange={(e) => setFormData({ ...formData, styleName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region/Origin *</Label>
                <Input
                  id="region"
                  placeholder="e.g., South Africa, Johannesburg"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the musical style, its origins, and cultural significance..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="characteristics">Key Characteristics</Label>
                <Input
                  id="characteristics"
                  placeholder="e.g., Syncopated rhythm, 808 kick patterns, Sub-bass emphasis (comma separated)"
                  value={formData.characteristics}
                  onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="culturalContext">Cultural Context</Label>
                <Textarea
                  id="culturalContext"
                  placeholder="Provide cultural background, traditional uses, community significance..."
                  value={formData.culturalContext}
                  onChange={(e) => setFormData({ ...formData, culturalContext: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg flex items-start gap-3">
                <FileAudio className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">Audio Samples</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload audio samples demonstrating this style (optional, for research validation)
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Samples
                  </Button>
                </div>
              </div>
            </div>

            {/* Ethical Consent */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Ethical Data Collection Consent *</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="consent"
                    checked={formData.consent}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, consent: checked as boolean })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="consent" className="font-semibold text-sm cursor-pointer">
                      Community Consent
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I confirm that I have explicit consent from the cultural community to share this style profile, 
                      or I am an authorized representative of the community.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="attribution"
                    checked={formData.attribution}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, attribution: checked as boolean })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="attribution" className="font-semibold text-sm cursor-pointer">
                      Attribution & Credit
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I agree that contributors will be recognized and can opt for attribution in works using this style. 
                      Cultural origins will be properly documented.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="preservation"
                    checked={formData.preservation}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, preservation: checked as boolean })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="preservation" className="font-semibold text-sm cursor-pointer">
                      Cultural Preservation
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I understand this style will be documented with cultural context to prevent misappropriation 
                      and ensure authentic representation in AI-generated music.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1"
              >
                Submit Contribution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CulturalStyleCatalog;
