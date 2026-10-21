"use client";

import {
  Scan, ScanLine, Hand, Syringe, Radiation, FileText, Smile, Waves, Activity, ClipboardCheck,
  Heart, Flower2, Baby, Wind, User, Utensils, Droplets, Leaf, Fingerprint, HeartPulse, Sparkles,
  Ear, Ribbon, Microscope, Bone, PersonStanding, Eye, Footprints, Zap, Grip, Network, Bandage,
  Brush, Dna, Camera, Stethoscope, Flame, Brain, Droplet, TrendingUp, Stethoscope as _S,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Scan, ScanLine, Hand, Syringe, Radiation, FileText, Smile, Waves, Activity, ClipboardCheck,
  Heart, Flower2, Baby, Wind, User, Utensils, Droplets, Leaf, Fingerprint, HeartPulse, Sparkles,
  Ear, Ribbon, Microscope, Bone, PersonStanding, Eye, Footprints, Zap, Grip, Network, Bandage,
  Brush, Dna, Camera, Stethoscope, Flame, Brain, Droplet, TrendingUp,
};

export function SpecialtyIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] || Stethoscope;
  return <Icon className={className} aria-hidden />;
}
