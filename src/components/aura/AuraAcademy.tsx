import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap, 
  BookOpen, 
  Play, 
  Clock, 
  Users, 
  Star,
  Trophy,
  Video,
  FileText,
  Target,
  Lightbulb,
  Music2,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

interface AuraAcademyProps {
  user: User | null;
}

interface Course {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  course_data: any;
  thumbnail_url: string | null;
  is_published: boolean;
  enrollment_count: number;
  created_at: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content_type: 'video' | 'article' | 'interactive' | 'project';
  content_data: any;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
}

interface Enrollment {
  id: string;
  course_id: string;
  progress_data: any;
  completion_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
}

export const AuraAcademy: React.FC<AuraAcademyProps> = ({ user }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('is_published', true)
        .order('enrollment_count', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_enrollments')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchLessons = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('academy_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('academy_enrollments')
        .insert([{
          user_id: user.id,
          course_id: courseId,
          progress_data: {},
          completion_percentage: 0
        }]);

      if (error) throw error;

      // Update enrollment count
      const course = courses.find(c => c.id === courseId);
      if (course) {
        await supabase
          .from('academy_courses')
          .update({ enrollment_count: course.enrollment_count + 1 })
          .eq('id', courseId);
      }

      await fetchEnrollments();
      await fetchCourses();

      toast({
        title: "Enrolled Successfully",
        description: "You're now enrolled in this course!",
      });
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewCourse = async (course: Course) => {
    setSelectedCourse(course);
    await fetchLessons(course.id);
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.course_id === courseId);
  };

  const getEnrollmentProgress = (courseId: string) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    return enrollment?.completion_percentage || 0;
  };

  // Sample courses data for demonstration
  const sampleCourses: Course[] = [
    {
      id: 'course-1',
      instructor_id: 'instructor-1',
      title: 'Amapiano Fundamentals: From Kwaito to Global Phenomenon',
      description: 'Learn the history, theory, and production techniques that define authentic amapiano music',
      difficulty_level: 'beginner',
      category: 'theory',
      course_data: {
        instructor_name: 'DJ Kabza De Small',
        total_lessons: 12,
        estimated_hours: 8,
        topics: ['History of Amapiano', 'Log Drum Patterns', 'Piano Techniques', 'Cultural Context']
      },
      thumbnail_url: null,
      is_published: true,
      enrollment_count: 1250,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'course-2',
      instructor_id: 'instructor-2',
      title: 'Private School Amapiano Production Masterclass',
      description: 'Master the soulful, jazz-influenced style of Private School amapiano with live instrumentation',
      difficulty_level: 'intermediate',
      category: 'production',
      course_data: {
        instructor_name: 'Kelvin Momo',
        total_lessons: 15,
        estimated_hours: 12,
        topics: ['Jazz Harmonies', 'Live Instruments', 'Emotional Arrangements', 'Soul Elements']
      },
      thumbnail_url: null,
      is_published: true,
      enrollment_count: 890,
      created_at: '2024-02-01T00:00:00Z'
    },
    {
      id: 'course-3',
      instructor_id: 'instructor-3',
      title: 'AI-Assisted Music Production: The Future of Amapiano',
      description: 'Integrate AI tools into your workflow while maintaining cultural authenticity',
      difficulty_level: 'advanced',
      category: 'ai_production',
      course_data: {
        instructor_name: 'Aura Team',
        total_lessons: 10,
        estimated_hours: 6,
        topics: ['AI Music Generation', 'Style Transfer', 'Cultural Preservation', 'Ethical AI Use']
      },
      thumbnail_url: null,
      is_published: true,
      enrollment_count: 567,
      created_at: '2024-03-01T00:00:00Z'
    }
  ];

  const displayCourses = courses.length > 0 ? courses : sampleCourses;
  const filteredCourses = displayCourses.filter(course => 
    selectedCategory === 'all' || course.category === selectedCategory
  );

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Aura Academy
          </CardTitle>
          <CardDescription>
            Please sign in to access the learning platform
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (selectedCourse) {
    return (
      <div className="space-y-6">
        {/* Course Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedCourse(null)}
          >
            ← Back to Academy
          </Button>
          <ChevronRight className="w-4 h-4" />
          <span>{selectedCourse.title}</span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{selectedCourse.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {selectedCourse.description}
                </CardDescription>
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="secondary">{selectedCourse.difficulty_level}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {selectedCourse.enrollment_count} students
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {selectedCourse.course_data.estimated_hours} hours
                  </div>
                </div>
              </div>
              {!isEnrolled(selectedCourse.id) ? (
                <Button onClick={() => enrollInCourse(selectedCourse.id)} disabled={loading}>
                  Enroll Now
                </Button>
              ) : (
                <Badge variant="default">Enrolled</Badge>
              )}
            </div>
            {isEnrolled(selectedCourse.id) && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{getEnrollmentProgress(selectedCourse.id).toFixed(0)}%</span>
                </div>
                <Progress value={getEnrollmentProgress(selectedCourse.id)} />
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedCourse.course_data.topics?.map((topic: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{topic}</h4>
                      <p className="text-sm text-muted-foreground">
                        Lesson {index + 1} • {Math.floor(Math.random() * 30 + 15)} minutes
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              )) || (
                <p className="text-muted-foreground">Course content loading...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            Aura Academy
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Learning Platform
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Master amapiano production with expert-led courses and cultural insights
          </p>
        </div>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">All Courses</TabsTrigger>
          <TabsTrigger value="my-learning">My Learning</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          {/* Category Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                {['all', 'theory', 'production', 'ai_production', 'business'].map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? 'All' : category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2">
                      {course.difficulty_level}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">4.8</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.enrollment_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.course_data.estimated_hours}h
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.course_data.total_lessons}
                    </div>
                  </div>

                  {course.course_data.instructor_name && (
                    <p className="text-sm text-muted-foreground">
                      by {course.course_data.instructor_name}
                    </p>
                  )}

                  {isEnrolled(course.id) ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{getEnrollmentProgress(course.id).toFixed(0)}%</span>
                      </div>
                      <Progress value={getEnrollmentProgress(course.id)} className="h-2" />
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => viewCourse(course)}
                      >
                        Continue Learning
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => viewCourse(course)}
                      >
                        View Course
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-learning" className="space-y-6">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
                <p className="text-muted-foreground mb-4">
                  Enroll in courses to track your progress and unlock achievements
                </p>
                <Button onClick={() => {
                  const coursesTab = document.querySelector('[value="courses"]') as HTMLButtonElement;
                  coursesTab?.click();
                }}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => {
                const course = displayCourses.find(c => c.id === enrollment.course_id);
                if (!course) return null;
                
                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </div>
                        <Badge variant={enrollment.completed_at ? "default" : "secondary"}>
                          {enrollment.completed_at ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{enrollment.completion_percentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={enrollment.completion_percentage} />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => viewCourse(course)}
                        >
                          Continue Learning
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  First Course
                </CardTitle>
                <CardDescription>Complete your first course</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant={enrollments.some(e => e.completed_at) ? "default" : "secondary"}>
                  {enrollments.some(e => e.completed_at) ? "Unlocked" : "Locked"}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music2 className="w-5 h-5 text-primary" />
                  Amapiano Expert
                </CardTitle>
                <CardDescription>Complete 5 amapiano courses</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Locked</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-accent" />
                  AI Pioneer
                </CardTitle>
                <CardDescription>Complete all AI production courses</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Locked</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};