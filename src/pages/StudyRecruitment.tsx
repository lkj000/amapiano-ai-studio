import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, Mail, MessageCircle, Users, Clock, Headphones, CheckCircle } from 'lucide-react';

export default function StudyRecruitment() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const studyUrl = `${window.location.origin}/user-study`;
  
  const copyLink = () => {
    navigator.clipboard.writeText(studyUrl);
    setCopied(true);
    toast({ title: "Link copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Invitation: Amapiano Authenticity Research Study");
    const body = encodeURIComponent(`Hi,

I'd like to invite you to participate in a research study on Amapiano music authenticity.

As a music producer or enthusiast, your input is valuable for understanding what makes Amapiano music feel authentic.

The study takes about 10 minutes and involves listening to audio pairs and rating their authenticity.

Participate here: ${studyUrl}

Thank you for your time!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`🎵 Help with Amapiano Research!\n\nI'm conducting a study on what makes Amapiano music authentic. Takes ~10 mins.\n\nParticipate: ${studyUrl}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Calling all music producers & Amapiano lovers! 🇿🇦🎵\n\nHelp research what makes Amapiano authentic. Takes ~10 mins.\n\n${studyUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="mb-2">PhD Research</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Recruit Study Participants</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Share the user study with music producers and Amapiano enthusiasts to collect A/B listening test data
          </p>
        </div>

        {/* Study Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">~10 minutes</div>
              <div className="text-sm text-muted-foreground">Study duration</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Headphones className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">A/B Blind Test</div>
              <div className="text-sm text-muted-foreground">Methodology</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">20-30 needed</div>
              <div className="text-sm text-muted-foreground">Target participants</div>
            </CardContent>
          </Card>
        </div>

        {/* Share Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Study Link
            </CardTitle>
            <CardDescription>
              Copy and share this link with potential participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={studyUrl} readOnly className="font-mono text-sm" />
              <Button onClick={copyLink} variant={copied ? "default" : "outline"}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={shareViaEmail} variant="outline" className="flex-1 min-w-[140px]">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button onClick={shareViaWhatsApp} variant="outline" className="flex-1 min-w-[140px]">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              <Button onClick={shareViaTwitter} variant="outline" className="flex-1 min-w-[140px]">
                <Share2 className="mr-2 h-4 w-4" />
                Twitter/X
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Target Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Ideal Participants</CardTitle>
            <CardDescription>
              Target these groups for more meaningful data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ Priority Targets</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Amapiano DJs and producers</li>
                  <li>• South African music producers</li>
                  <li>• Electronic music producers</li>
                  <li>• Music production educators</li>
                  <li>• Regular Amapiano listeners</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">○ Good Additions</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• General music producers</li>
                  <li>• Audio engineers</li>
                  <li>• Music enthusiasts</li>
                  <li>• African music fans</li>
                  <li>• Music technology students</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Outreach Message */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Outreach Message</CardTitle>
            <CardDescription>
              Copy and customize this message for forums, Discord, or direct messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p><strong>Subject:</strong> Help with Amapiano Music Research (10 min survey)</p>
              <p className="pt-2">Hey everyone! 👋</p>
              <p>I'm conducting academic research on what makes Amapiano music feel authentic. Looking for music producers and Amapiano fans to participate in a quick A/B listening test.</p>
              <p><strong>What's involved:</strong></p>
              <ul className="list-disc pl-5">
                <li>Listen to 3 pairs of audio tracks</li>
                <li>Rate authenticity on a 1-10 scale</li>
                <li>Select which sounds more "authentic Amapiano"</li>
              </ul>
              <p><strong>Takes about 10 minutes.</strong></p>
              <p>Your input helps improve AI-generated Amapiano music. All responses are anonymous.</p>
              <p className="pt-2"><strong>Link:</strong> {studyUrl}</p>
              <p>Thanks! 🙏</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                navigator.clipboard.writeText(`Hey everyone! 👋\n\nI'm conducting academic research on what makes Amapiano music feel authentic. Looking for music producers and Amapiano fans to participate in a quick A/B listening test.\n\nWhat's involved:\n• Listen to 3 pairs of audio tracks\n• Rate authenticity on a 1-10 scale\n• Select which sounds more "authentic Amapiano"\n\nTakes about 10 minutes.\n\nYour input helps improve AI-generated Amapiano music. All responses are anonymous.\n\nLink: ${studyUrl}\n\nThanks! 🙏`);
                toast({ title: "Message copied!" });
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Message
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild>
            <a href="/user-study">Take the Study Yourself</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/study-analytics">View Results & Analytics</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
