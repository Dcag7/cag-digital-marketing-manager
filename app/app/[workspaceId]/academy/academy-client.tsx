'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, BookOpen, PlayCircle, CheckCircle, Lock, Clock,
  TrendingUp, Target, DollarSign, Users, Zap, BarChart3,
  Lightbulb, AlertTriangle, ArrowRight, Star, Award
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
}

const CURRICULUM: Module[] = [
  {
    id: 'fundamentals',
    title: 'Digital Marketing Fundamentals',
    description: 'Learn the core concepts of digital advertising',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    level: 'beginner',
    lessons: [
      { id: 'f1', title: 'What is Digital Marketing?', duration: '10 min', completed: true, locked: false },
      { id: 'f2', title: 'The Customer Journey & Funnel', duration: '15 min', completed: true, locked: false },
      { id: 'f3', title: 'Key Metrics: ROAS, CPA, CTR Explained', duration: '20 min', completed: false, locked: false },
      { id: 'f4', title: 'Attribution Models: How Conversions Are Tracked', duration: '15 min', completed: false, locked: false },
      { id: 'f5', title: 'Setting Goals & KPIs', duration: '10 min', completed: false, locked: false },
    ],
  },
  {
    id: 'meta-ads',
    title: 'Meta Ads Mastery',
    description: 'Master Facebook & Instagram advertising',
    icon: Target,
    color: 'from-blue-600 to-indigo-600',
    level: 'intermediate',
    lessons: [
      { id: 'm1', title: 'Meta Ads Account Structure', duration: '15 min', completed: false, locked: false },
      { id: 'm2', title: 'Campaign Objectives: When to Use Each', duration: '20 min', completed: false, locked: false },
      { id: 'm3', title: 'Audience Targeting Deep Dive', duration: '25 min', completed: false, locked: false },
      { id: 'm4', title: 'Custom & Lookalike Audiences', duration: '20 min', completed: false, locked: false },
      { id: 'm5', title: 'Ad Placements & Formats', duration: '15 min', completed: false, locked: false },
      { id: 'm6', title: 'Budgeting Strategies: Daily vs Lifetime', duration: '15 min', completed: false, locked: false },
      { id: 'm7', title: 'Reading the Ads Manager Dashboard', duration: '20 min', completed: false, locked: false },
      { id: 'm8', title: 'When to Scale vs Pause Campaigns', duration: '25 min', completed: false, locked: false },
    ],
  },
  {
    id: 'creative',
    title: 'Creative That Converts',
    description: 'Design ads that stop the scroll and drive action',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    level: 'intermediate',
    lessons: [
      { id: 'c1', title: 'The Psychology of Scroll-Stopping Creative', duration: '15 min', completed: false, locked: false },
      { id: 'c2', title: 'Hook, Story, Offer Framework', duration: '20 min', completed: false, locked: false },
      { id: 'c3', title: 'Video Ads: Best Practices', duration: '25 min', completed: false, locked: false },
      { id: 'c4', title: 'Static Image Ads That Work', duration: '15 min', completed: false, locked: false },
      { id: 'c5', title: 'Carousel & Collection Ads', duration: '15 min', completed: false, locked: false },
      { id: 'c6', title: 'A/B Testing Creative', duration: '20 min', completed: false, locked: false },
      { id: 'c7', title: 'UGC & Influencer Content', duration: '15 min', completed: false, locked: false },
    ],
  },
  {
    id: 'copywriting',
    title: 'Copywriting for Ads',
    description: 'Write compelling ad copy that sells',
    icon: Lightbulb,
    color: 'from-yellow-500 to-orange-500',
    level: 'intermediate',
    lessons: [
      { id: 'w1', title: 'Understanding Your Customer Avatar', duration: '15 min', completed: false, locked: false },
      { id: 'w2', title: 'Headlines That Hook', duration: '20 min', completed: false, locked: false },
      { id: 'w3', title: 'Pain Points & Benefits', duration: '15 min', completed: false, locked: false },
      { id: 'w4', title: 'Call-to-Action Formulas', duration: '10 min', completed: false, locked: false },
      { id: 'w5', title: 'Primary Text, Headline, Description', duration: '15 min', completed: false, locked: false },
      { id: 'w6', title: 'Testing Copy Variations', duration: '15 min', completed: false, locked: false },
    ],
  },
  {
    id: 'optimization',
    title: 'Campaign Optimization',
    description: 'Advanced techniques to maximize performance',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    level: 'advanced',
    lessons: [
      { id: 'o1', title: 'Reading Campaign Data Like a Pro', duration: '25 min', completed: false, locked: false },
      { id: 'o2', title: 'Identifying Winning & Losing Elements', duration: '20 min', completed: false, locked: false },
      { id: 'o3', title: 'Budget Allocation Strategies', duration: '20 min', completed: false, locked: false },
      { id: 'o4', title: 'Scaling Winners: Horizontal vs Vertical', duration: '25 min', completed: false, locked: false },
      { id: 'o5', title: 'Troubleshooting Poor Performance', duration: '20 min', completed: false, locked: false },
      { id: 'o6', title: 'Seasonality & Planning', duration: '15 min', completed: false, locked: false },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    description: 'Turn data into actionable insights',
    icon: BarChart3,
    color: 'from-red-500 to-rose-500',
    level: 'advanced',
    lessons: [
      { id: 'a1', title: 'Setting Up Proper Tracking', duration: '25 min', completed: false, locked: false },
      { id: 'a2', title: 'Meta Pixel & Conversions API', duration: '30 min', completed: false, locked: false },
      { id: 'a3', title: 'UTM Parameters & GA4', duration: '20 min', completed: false, locked: false },
      { id: 'a4', title: 'Building Custom Reports', duration: '20 min', completed: false, locked: false },
      { id: 'a5', title: 'Calculating True ROAS & Profit', duration: '25 min', completed: false, locked: false },
      { id: 'a6', title: 'Weekly & Monthly Reporting Rhythm', duration: '15 min', completed: false, locked: false },
    ],
  },
];

const QUICK_GUIDES = [
  {
    title: 'When to Scale a Campaign',
    description: 'ROAS > 3x for 3+ days, consistent daily spend, 50+ conversions',
    icon: TrendingUp,
    color: 'text-green-400',
  },
  {
    title: 'When to Pause a Campaign',
    description: 'ROAS < 1x after R500+ spend, no conversions in 7 days, CPM spiking',
    icon: AlertTriangle,
    color: 'text-red-400',
  },
  {
    title: 'Healthy Metrics Benchmarks',
    description: 'CTR > 1%, CPM < R150, CPC < R15, Frequency < 3',
    icon: Target,
    color: 'text-blue-400',
  },
  {
    title: 'Budget Rules',
    description: 'Start with 2-3x target CPA daily, scale 20% max per day',
    icon: DollarSign,
    color: 'text-yellow-400',
  },
];

interface AcademyClientProps {
  workspaceId: string;
}

export function AcademyClient({ workspaceId }: AcademyClientProps) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Calculate progress
  const totalLessons = CURRICULUM.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = CURRICULUM.reduce(
    (sum, m) => sum + m.lessons.filter(l => l.completed).length, 
    0
  );
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'advanced': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return '';
    }
  };

  if (selectedLesson && selectedModule) {
    return (
      <LessonView 
        module={selectedModule}
        lesson={selectedLesson} 
        onBack={() => setSelectedLesson(null)}
        onComplete={() => {
          // Mark as completed (in real app, save to DB)
          setSelectedLesson(null);
        }}
      />
    );
  }

  if (selectedModule) {
    return (
      <ModuleView 
        module={selectedModule} 
        onBack={() => setSelectedModule(null)}
        onSelectLesson={setSelectedLesson}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Growth Academy</h1>
            <p className="text-muted-foreground">
              Master digital marketing from basics to advanced strategies
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-5 w-5 text-yellow-400" />
            <span className="font-semibold">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <Progress value={progressPercent} className="w-32 h-2" />
        </div>
      </div>

      {/* Quick Reference Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Quick Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_GUIDES.map((guide, i) => (
            <Card key={i} className="bg-card/50 hover:bg-card transition-colors">
              <CardContent className="pt-4">
                <guide.icon className={`h-6 w-6 ${guide.color} mb-2`} />
                <h3 className="font-semibold text-sm mb-1">{guide.title}</h3>
                <p className="text-xs text-muted-foreground">{guide.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Course Modules */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-400" />
          Training Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURRICULUM.map((module) => {
            const moduleCompleted = module.lessons.filter(l => l.completed).length;
            const moduleProgress = Math.round((moduleCompleted / module.lessons.length) * 100);
            const Icon = module.icon;
            
            return (
              <Card 
                key={module.id} 
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => setSelectedModule(module)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${module.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant="outline" className={getLevelBadge(module.level)}>
                      {module.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{module.lessons.length} lessons</span>
                    <span>{moduleCompleted}/{module.lessons.length} completed</span>
                  </div>
                  <Progress value={moduleProgress} className="h-1.5" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Module Detail View
function ModuleView({ 
  module, 
  onBack, 
  onSelectLesson 
}: { 
  module: Module; 
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
}) {
  const Icon = module.icon;
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        ← Back to Academy
      </Button>
      
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{module.title}</h1>
          <p className="text-muted-foreground">{module.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {module.lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => !lesson.locked && onSelectLesson(lesson)}
              disabled={lesson.locked}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                lesson.locked 
                  ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                  : 'hover:bg-muted/50 cursor-pointer'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                lesson.completed 
                  ? 'bg-green-500/20 text-green-400' 
                  : lesson.locked 
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/20 text-primary'
              }`}>
                {lesson.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : lesson.locked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{lesson.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{lesson.duration}</span>
                </div>
              </div>
              {!lesson.locked && (
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Lesson View (placeholder - would have actual content)
function LessonView({ 
  module,
  lesson, 
  onBack,
  onComplete
}: { 
  module: Module;
  lesson: Lesson; 
  onBack: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        ← Back to {module.title}
      </Button>
      
      <div>
        <Badge variant="outline" className="mb-2">{module.title}</Badge>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <Clock className="h-4 w-4" />
          <span>{lesson.duration}</span>
        </div>
      </div>

      <Card className="min-h-[400px]">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-[350px] text-center">
            <PlayCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lesson Content</h3>
            <p className="text-muted-foreground max-w-md">
              This is where the lesson content would appear - videos, text, 
              interactive exercises, and quizzes.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Content coming soon! We're building comprehensive training materials.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Previous
        </Button>
        <Button onClick={onComplete} className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Mark as Complete
        </Button>
      </div>
    </div>
  );
}
