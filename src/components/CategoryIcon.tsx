import {
  BookOpen, Landmark, FlaskConical, ScrollText, Brain, MessageSquareQuote,
  Baby, GraduationCap, Sparkles, Sprout, Wand2, Rocket, Ghost, Skull,
  Search as SearchIcon, Heart, Swords, Map, Zap, Drama, Smile, Bot,
  Mountain, MoonStar, Spade, Stars, Eye, Home as HomeIcon, Tv, Biohazard,
  Tent, User as UserIcon, Footprints, Building2, Radiation, Cog, Cpu,
  Medal, Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  novels: BookOpen,
  religion: Landmark,
  science: FlaskConical,
  history: ScrollText,
  psychology: Brain,
  philosophy: MessageSquareQuote,
  kids: Baby,
  school: GraduationCap,
  poetry: Sparkles,
  'self-help': Sprout,
  fantasy: Wand2,
  'sci-fi': Rocket,
  horror: Ghost,
  thriller: Skull,
  crime: SearchIcon,
  romance: Heart,
  'historical-fiction': Swords,
  adventure: Map,
  action: Zap,
  drama: Drama,
  comedy: Smile,
  robots: Bot,
  mythic: Mountain,
  'dark-fantasy': MoonStar,
  'dark-humor': Spade,
  'cosmic-horror': Stars,
  supernatural: Eye,
  'uncanny-valley': Drama,
  'gothic-horror': HomeIcon,
  'analog-horror': Tv,
  zombies: Biohazard,
  survival: Tent,
  biography: UserIcon,
  mystery: Footprints,
  dystopia: Building2,
  apocalyptic: Radiation,
  steampunk: Cog,
  cyberpunk: Cpu,
  military: Medal,
  sports: Trophy,
};

export const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = MAP[name] ?? BookOpen;
  return <Icon className={className} />;
};