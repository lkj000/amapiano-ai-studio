import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Star, TrendingUp, Loader2 } from 'lucide-react';
import { useProjectTemplates } from '@/hooks/useProjectTemplates';
import type { DawProjectDataV2 } from '@/types/daw';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProjectTemplatesDialogProps {
  currentProject?: DawProjectDataV2;
  onLoadTemplate: (projectData: DawProjectDataV2) => void;
}

const ProjectTemplatesDialog: React.FC<ProjectTemplatesDialogProps> = ({
  currentProject,
  onLoadTemplate,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveGenre, setSaveGenre] = useState('');
  const [saving, setSaving] = useState(false);

  const { templates, loading, useTemplate, saveAsTemplate } = useProjectTemplates();

  const handleUseTemplate = async (templateId: string) => {
    const projectData = await useTemplate(templateId);
    if (projectData) {
      onLoadTemplate(projectData);
      setOpen(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentProject || !saveName || !saveDescription || !saveGenre) return;

    setSaving(true);
    await saveAsTemplate(saveName, saveDescription, saveGenre, currentProject);
    setSaving(false);
    setSaveName('');
    setSaveDescription('');
    setSaveGenre('');
    setActiveTab('browse');
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.genre]) {
      acc[template.genre] = [];
    }
    acc[template.genre].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Project Templates</DialogTitle>
          <DialogDescription>
            Start with professional templates or save your own
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Templates</TabsTrigger>
            <TabsTrigger value="save">Save as Template</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No templates available yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[450px]">
                {Object.entries(groupedTemplates).map(([genre, genreTemplates]) => (
                  <div key={genre} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{genre}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {genreTemplates.map((template) => (
                        <Card
                          key={template.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  {template.name}
                                  {template.is_featured && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  )}
                                </CardTitle>
                                <CardDescription className="text-sm mt-1">
                                  {template.description}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {template.bpm} BPM
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="w-3 h-3" />
                                {template.usage_count} uses
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="save" className="mt-4">
            <ScrollArea className="h-[450px]">
              <div className="space-y-4 pr-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="My Amapiano Template"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="template-genre">Genre</Label>
                  <Input
                    id="template-genre"
                    placeholder="Amapiano"
                    value={saveGenre}
                    onChange={(e) => setSaveGenre(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    placeholder="Describe this template..."
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSaveTemplate}
                  disabled={!saveName || !saveDescription || !saveGenre || saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Save Template
                    </>
                  )}
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectTemplatesDialog;
