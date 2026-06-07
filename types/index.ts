export type GoalStatus = 'active' | 'completed' | 'abandoned';
export type DailyStatus = 'pending' | 'completed' | 'skipped';
export type CommitmentStatus = 'active' | 'honored' | 'broken';

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  currentFocus: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  createdAt: Date | string;
  // legacy aliases for components not yet updated
  display_name?: string;
  current_focus?: string | null;
  profile_photo_url?: string | null;
}

export interface Sector {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  verificationCriteria: string | null;
  visionRequired: boolean;
  order: number;
  createdAt: Date | string;
  // legacy aliases
  user_id?: string;
  verification_criteria?: string | null;
  vision_required?: boolean;
  created_at?: string;
}

export interface YearlyGoal {
  id: string;
  userId: string;
  sectorId: string;
  year: number;
  text: string;
  status: GoalStatus;
  createdAt: Date | string;
  sector?: Sector;
  monthlyGoals?: MonthlyGoal[];
}

export interface MonthlyGoal {
  id: string;
  userId: string;
  yearlyGoalId: string;
  year: number;
  month: number;
  text: string;
  status: GoalStatus;
  createdAt: Date | string;
  yearlyGoal?: YearlyGoal;
  weeklyGoals?: WeeklyGoal[];
  // legacy
  yearly_goal_id?: string;
  monthly_goal_id?: string;
}

export interface WeeklyGoal {
  id: string;
  userId: string;
  monthlyGoalId: string;
  year: number;
  weekNumber: number;
  text: string;
  status: GoalStatus;
  createdAt: Date | string;
  monthlyGoal?: MonthlyGoal;
  dailyGoals?: DailyGoal[];
  // legacy
  monthly_goal_id?: string;
  week_number?: number;
  monthly_goal?: MonthlyGoal;
  daily_goals?: DailyGoal[];
}

export interface DailyGoal {
  id: string;
  userId: string;
  weeklyGoalId: string;
  date: Date | string;
  text: string;
  status: DailyStatus;
  proofImageUrl: string | null;
  verificationResultJson: VerificationResult | null;
  manualOverrideReason: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  weeklyGoal?: WeeklyGoal & {
    monthlyGoal?: MonthlyGoal & {
      yearlyGoal?: YearlyGoal & { sector?: Sector };
    };
  };
  // legacy (still used by existing components with snake_case)
  weekly_goal_id?: string;
  proof_image_url?: string | null;
  verification_result_json?: VerificationResult | null;
  manual_override_reason?: string | null;
  completed_at?: Date | string | null;
  created_at?: string;
  weekly_goal?: WeeklyGoal & {
    monthly_goal?: MonthlyGoal & {
      yearly_goal?: YearlyGoal & { sector?: Sector };
    };
  };
}

export interface VerificationResult {
  matches_goal: boolean;
  different_from_yesterday: boolean;
  confidence: number;
  reasoning: string;
  concerns: string[];
}

export interface AccountabilityCommitment {
  id: string;
  userId: string;
  sectorId: string | null;
  text: string;
  dateMade: Date | string;
  status: CommitmentStatus;
  notes: string | null;
  createdAt: Date | string;
  sector?: Sector;
  // legacy
  user_id?: string;
  sector_id?: string | null;
  date_made?: string;
  created_at?: string;
}

export interface SectorNote {
  id: string;
  userId: string;
  sectorId: string;
  date: Date | string;
  text: string;
  createdAt: Date | string;
  // legacy
  user_id?: string;
  sector_id?: string;
  created_at?: string;
}

export interface PersonalFact {
  id: string;
  userId: string;
  factType: string;
  content: string;
  createdAt: Date | string;
  // legacy
  user_id?: string;
  fact_type?: string;
  created_at?: string;
}

export interface Achievement {
  id: string;
  userId: string;
  date: Date | string;
  title: string;
  description: string | null;
  createdAt: Date | string;
  // legacy
  user_id?: string;
  created_at?: string;
}

export interface AlertSettings {
  id: string;
  userId: string;
  soundMutedGlobal: boolean;
  eveningAlertTime: string;
  createdAt: Date | string;
}

// Analytics types
export interface DailyCompletionDataPoint {
  date: string;
  rate: number;
  completed: number;
  total: number;
}

export interface SectorRadarDataPoint {
  sector: string;
  rate: number;
  fullMark: number;
}

export interface GoalWithProgress extends YearlyGoal {
  progress: number;
  monthly_progress: number;
  weekly_progress: number;
}
