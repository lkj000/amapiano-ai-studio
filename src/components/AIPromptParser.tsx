import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Wand2, Settings, CheckCircle } from "lucide-react";

interface ParsedPrompt {
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  instrumentation: string[];
  complexity: string;
  duration: number;
  originalPrompt: string;
}

interface AIPromptParserProps {
  prompt: string;
  onParsedChange: (parsed: ParsedPrompt) => void;
  className?: string;
}

export const AIPromptParser = ({ prompt, onParsedChange, className }: AIPromptParserProps) => {
  const [parsed, setParsed] = useState<ParsedPrompt | null>(null);
  const [isParsingActive, setIsParsingActive] = useState(true);

  // Simulate AI prompt parsing
  const parsePrompt = (text: string): ParsedPrompt => {
    const lowerText = text.toLowerCase();
    
    // Detect genre
    let genre = "Classic Amapiano";
    if (lowerText.includes("private school") || lowerText.includes("jazz")) {
      genre = "Private School Amapiano";
    } else if (lowerText.includes("vocal")) {
      genre = "Vocal Amapiano";
    } else if (lowerText.includes("deep")) {
      genre = "Deep Amapiano";
    }

    // Detect mood
    let mood = "energetic";
    if (lowerText.includes("soulful") || lowerText.includes("emotional")) {
      mood = "soulful";
    } else if (lowerText.includes("chill") || lowerText.includes("relaxed")) {
      mood = "chill";
    } else if (lowerText.includes("dark") || lowerText.includes("deep")) {
      mood = "dark";
    }

    // Detect BPM
    let bpm = 118;
    if (lowerText.includes("slow") || lowerText.includes("chill")) {
      bpm = 110;
    } else if (lowerText.includes("fast") || lowerText.includes("energetic")) {
      bpm = 125;
    } else if (lowerText.includes("115")) {
      bpm = 115;
    } else if (lowerText.includes("120")) {
      bpm = 120;
    }

    // Detect key
    let key = "F# minor";
    if (lowerText.includes("major")) {
      key = "C major";
    } else if (lowerText.includes("g minor") || lowerText.includes("gm")) {
      key = "G minor";
    }

    // Detect instrumentation
    const instrumentation: string[] = [];
    if (lowerText.includes("piano")) instrumentation.push("Piano");
    if (lowerText.includes("log drum") || lowerText.includes("bass")) instrumentation.push("Log Drums");
    if (lowerText.includes("sax") || lowerText.includes("saxophone")) instrumentation.push("Saxophone");
    if (lowerText.includes("vocal")) instrumentation.push("Vocals");
    if (lowerText.includes("percussion")) instrumentation.push("Percussion");
    if (lowerText.includes("guitar")) instrumentation.push("Guitar");

    // Default instrumentation if none detected
    if (instrumentation.length === 0) {
      instrumentation.push("Piano", "Log Drums", "Percussion");
    }

    // Detect complexity
    let complexity = "Intermediate";
    if (lowerText.includes("simple") || lowerText.includes("basic")) {
      complexity = "Simple";
    } else if (lowerText.includes("complex") || lowerText.includes("advanced") || lowerText.includes("sophisticated")) {
      complexity = "Advanced";
    }

    // Detect duration
    let duration = 180;
    if (lowerText.includes("short") || lowerText.includes("loop")) {
      duration = 60;
    } else if (lowerText.includes("long") || lowerText.includes("full")) {
      duration = 240;
    }

    return {
      genre,
      mood,
      bpm,
      key,
      instrumentation,
      complexity,
      duration,
      originalPrompt: text
    };
  };

  // Auto-parse when prompt changes
  useState(() => {
    if (prompt.trim() && isParsingActive) {
      const newParsed = parsePrompt(prompt);
      setParsed(newParsed);
      onParsedChange(newParsed);
    }
  });

  if (!prompt.trim() || !parsed) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-muted-foreground" />
            AI Prompt Analysis
          </CardTitle>
          <CardDescription className="text-xs">
            AI interpretation will appear as you type your prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Start typing to see AI analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-primary" />
          AI Prompt Analysis
          <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
        </CardTitle>
        <CardDescription className="text-xs">
          How the AI interprets your prompt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Genre:</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {parsed.genre}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Mood:</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {parsed.mood}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">BPM:</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {parsed.bpm}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Key:</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {parsed.key}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Complexity:</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {parsed.complexity}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {Math.floor(parsed.duration / 60)}:{String(parsed.duration % 60).padStart(2, '0')}
            </Badge>
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Instrumentation:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {parsed.instrumentation.map((instrument) => (
              <Badge key={instrument} variant="outline" className="text-xs">
                {instrument}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsParsingActive(!isParsingActive)}
            className="text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            {isParsingActive ? "Auto" : "Manual"} Parse
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newParsed = parsePrompt(prompt);
              setParsed(newParsed);
              onParsedChange(newParsed);
            }}
            className="text-xs"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Re-analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};