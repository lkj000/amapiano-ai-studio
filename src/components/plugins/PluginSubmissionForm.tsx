import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Code, Package, DollarSign, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const pluginSubmissionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  category: z.string().min(1, 'Category is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z'),
  price_cents: z.number().min(0, 'Price must be 0 or greater'),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(10, 'Maximum 10 tags'),
  changelog: z.string().min(10, 'Changelog is required'),
});

export function PluginSubmissionForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    version: '1.0.0',
    price_cents: 0,
    tags: [] as string[],
    changelog: '',
    wasmUrl: '',
    vst3Url: '',
    previewUrl: '',
    imageUrl: '',
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const categories = [
    { value: 'instrument', label: 'Instrument' },
    { value: 'effect', label: 'Effect' },
    { value: 'dynamics', label: 'Dynamics' },
    { value: 'modulation', label: 'Modulation' },
    { value: 'utility', label: 'Utility' },
  ];

  const subcategories = {
    instrument: ['Synthesizer', 'Sampler', 'Drum Machine', 'Bass', 'Piano'],
    effect: ['Reverb', 'Delay', 'Chorus', 'Flanger', 'Phaser'],
    dynamics: ['Compressor', 'Limiter', 'Gate', 'Expander'],
    modulation: ['LFO', 'Arpeggiator', 'Sequencer'],
    utility: ['Mixer', 'Analyzer', 'Tuner', 'Oscilloscope'],
  };

  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    try {
      pluginSubmissionSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to submit a plugin');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create marketplace item first
      const { data: marketplaceItem, error: marketplaceError } = await supabase
        .from('marketplace_items')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || null,
          price_cents: formData.price_cents,
          seller_id: user.id,
          tags: formData.tags,
          download_url: formData.wasmUrl || null,
          preview_url: formData.previewUrl || null,
          image_url: formData.imageUrl || null,
          active: false, // Not active until approved
        })
        .select()
        .single();

      if (marketplaceError) throw marketplaceError;

      // Create plugin submission
      const { error: submissionError } = await supabase
        .from('plugin_submissions')
        .insert({
          marketplace_item_id: marketplaceItem.id,
          submitter_id: user.id,
          version: formData.version,
          changelog: formData.changelog,
          wasm_url: formData.wasmUrl || null,
          vst3_url: formData.vst3Url || null,
          plugin_data: {
            name: formData.name,
            category: formData.category,
            tags: formData.tags,
          },
          approval_status: 'pending',
        });

      if (submissionError) throw submissionError;

      toast.success('Plugin submitted successfully! Awaiting approval.');
      setSubmissionSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        subcategory: '',
        version: '1.0.0',
        price_cents: 0,
        tags: [],
        changelog: '',
        wasmUrl: '',
        vst3Url: '',
        previewUrl: '',
        imageUrl: '',
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit plugin');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Submission Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your plugin has been submitted for review. Our team will review it within 2-3 business days.
            You'll receive an email notification once it's approved.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Security scan for malicious code</li>
              <li>Performance testing</li>
              <li>Quality assurance review</li>
              <li>Approval notification via email</li>
            </ul>
          </div>
          <Button onClick={() => setSubmissionSuccess(false)}>Submit Another Plugin</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Submit Plugin to Marketplace
          </CardTitle>
          <CardDescription>
            Share your plugin with the community and start earning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plugin Name *</Label>
              <Input
                id="name"
                placeholder="Amapiano Synth Pro"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Professional synthesizer optimized for Amapiano production..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category && subcategories[formData.category as keyof typeof subcategories]?.map(sub => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Version & Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="1.0.0"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (USD) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="19.99"
                  className="pl-9"
                  value={formData.price_cents / 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_cents: Math.round(parseFloat(e.target.value) * 100) }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags *</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tag (e.g., amapiano, bass, synth)"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wasmUrl">WASM URL *</Label>
              <Input
                id="wasmUrl"
                placeholder="https://example.com/plugin.wasm"
                value={formData.wasmUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, wasmUrl: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vst3Url">VST3 URL (optional)</Label>
              <Input
                id="vst3Url"
                placeholder="https://example.com/plugin.vst3"
                value={formData.vst3Url}
                onChange={(e) => setFormData(prev => ({ ...prev, vst3Url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previewUrl">Preview Audio URL (optional)</Label>
              <Input
                id="previewUrl"
                placeholder="https://example.com/preview.mp3"
                value={formData.previewUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, previewUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Cover Image URL (optional)</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/cover.png"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>
          </div>

          {/* Changelog */}
          <div className="space-y-2">
            <Label htmlFor="changelog">Changelog *</Label>
            <Textarea
              id="changelog"
              placeholder="Initial release with core features..."
              rows={3}
              value={formData.changelog}
              onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Package className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-sm space-y-2">
                <p className="font-medium">Submission Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Plugin must be functional and tested</li>
                  <li>WASM binary is required</li>
                  <li>All code will be scanned for security</li>
                  <li>Review typically takes 2-3 business days</li>
                  <li>Price can be updated after approval</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </form>
  );
}
