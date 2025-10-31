import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Palette, Plus, Search, Download, Upload, Globe } from "lucide-react";

const CulturalStyleCatalog = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

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
    toast({
      title: "Style Contribution",
      description: "Open ethical data collection form",
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
    </div>
  );
};

export default CulturalStyleCatalog;
