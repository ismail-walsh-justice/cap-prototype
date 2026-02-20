import {
  dayValues,
  getBetweenHouseholdsField,
  planLastMinuteChangesField,
  whereHandoverField,
  whereMostlyLive,
} from './fields';

export type WhichDays = {
  days?: dayValues[];
  describeArrangement?: string;
  noDecisionRequired?: boolean;
};

// Per-child answer structure for questions that can have different answers for each child
export type PerChildAnswer<T> = {
  // Default answer that applies to all children unless overridden
  default: T;
  // Optional per-child overrides, keyed by child index (0, 1, 2, etc.)
  byChild?: Record<number, T>;
};

// Answer type for howChangeDuringSchoolHolidays
export type HowChangeDuringSchoolHolidaysAnswer = {
  noDecisionRequired: boolean;
  answer?: string;
  notApplicable?: boolean; // This question does not apply to this child
};

export type GetBetweenHouseholdsAnswer = {
  noDecisionRequired: boolean;
  how?: getBetweenHouseholdsField;
  describeArrangement?: string;
  notApplicable?: boolean; // This question does not apply to this child
};

export type WhereHandoverAnswer = {
  noDecisionRequired: boolean;
  where?: whereHandoverField[];
  someoneElse?: string;
  notApplicable?: boolean; // This question does not apply to this child
};

export type WhatWillHappenAnswer = {
  noDecisionRequired: boolean;
  answer?: string;
  notApplicable?: boolean; // This question does not apply to this child
};

export type WhichScheduleAnswer = {
  noDecisionRequired: boolean;
  answer?: string;
};

export type MostlyLiveAnswer = {
  where: whereMostlyLive;
  describeArrangement?: string;
};

// Design mode for per-child answers
export type PerChildDesignMode = 'design1' | 'design2' | 'design3' | 'design4';

// Design 2: Per-child plan structure - a complete plan for each child
export type ChildPlan = {
  childIndex: number;
  childName: string;
  isComplete: boolean;
  copiedFromChildIndex?: number; // If this plan was copied from another child
  livingAndVisiting?: CAPSession['livingAndVisiting'];
  handoverAndHolidays?: Omit<NonNullable<CAPSession['handoverAndHolidays']>, 'howChangeDuringSchoolHolidays'> & {
    howChangeDuringSchoolHolidays?: HowChangeDuringSchoolHolidaysAnswer;
  };
  specialDays?: CAPSession['specialDays'];
  otherThings?: CAPSession['otherThings'];
  decisionMaking?: CAPSession['decisionMaking'];
};

export type CAPSession = {
  completedSteps?: string[];
  numberOfChildren: number;
  namesOfChildren: string[];
  initialAdultName: string;
  secondaryAdultName: string;
  // UR toggle: enable per-child PoC features (default false for current service)
  usePerChildPoC?: boolean;
  // Unique identifier for each plan attempt (timestamp when user clicks "Start now")
  planStartTime?: number;
  // Design mode toggle: 'design1' = inline per-child (default), 'design2' = task list level
  perChildDesignMode?: PerChildDesignMode;
  // Design 2 specific: which child's plan is currently being edited
  currentChildIndex?: number;
  // Design 2 specific: per-child plans
  childPlans?: ChildPlan[];
  livingAndVisiting?: {
    mostlyLive?: PerChildAnswer<MostlyLiveAnswer>;
    whichSchedule?: PerChildAnswer<WhichScheduleAnswer>;
    overnightVisits?: {
      willHappen: boolean;
      whichDays?: WhichDays;
    };
    daytimeVisits?: {
      willHappen: boolean;
      whichDays?: WhichDays;
    };
  };
  handoverAndHolidays?: {
    getBetweenHouseholds?: PerChildAnswer<GetBetweenHouseholdsAnswer>;
    whereHandover?: PerChildAnswer<WhereHandoverAnswer>;
    willChangeDuringSchoolHolidays?: {
      noDecisionRequired: boolean;
      willChange?: boolean;
    };
    // Updated to support per-child answers
    howChangeDuringSchoolHolidays?: PerChildAnswer<HowChangeDuringSchoolHolidaysAnswer>;
    itemsForChangeover?: {
      noDecisionRequired: boolean;
      answer?: string;
    };
  };
  specialDays?: {
    whatWillHappen?: PerChildAnswer<WhatWillHappenAnswer>;
  };
  otherThings?: {
    whatOtherThingsMatter?: {
      noDecisionRequired: boolean;
      answer?: string;
    };
  };
  decisionMaking?: {
    planLastMinuteChanges?: {
      options?: planLastMinuteChangesField[];
      anotherArrangementDescription?: string;
      noDecisionRequired: boolean;
    };
    planLongTermNotice?: {
      weeks?: number;
      otherAnswer?: string;
      noDecisionRequired: boolean;
    };
    planReview?: {
      months?: number;
      years?: number;
    };
  };
};
