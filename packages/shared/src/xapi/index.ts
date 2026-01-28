// xAPI Statement builders e constantes

// ===========================================
// Verbs (ADL Registry)
// ===========================================

export const XAPI_VERBS = {
  INITIALIZED: {
    id: 'http://adlnet.gov/expapi/verbs/initialized',
    display: { 'pt-BR': 'iniciou', 'en-US': 'initialized' },
  },
  PLAYED: {
    id: 'https://w3id.org/xapi/video/verbs/played',
    display: { 'pt-BR': 'reproduziu', 'en-US': 'played' },
  },
  PAUSED: {
    id: 'https://w3id.org/xapi/video/verbs/paused',
    display: { 'pt-BR': 'pausou', 'en-US': 'paused' },
  },
  SEEKED: {
    id: 'https://w3id.org/xapi/video/verbs/seeked',
    display: { 'pt-BR': 'navegou', 'en-US': 'seeked' },
  },
  COMPLETED: {
    id: 'http://adlnet.gov/expapi/verbs/completed',
    display: { 'pt-BR': 'completou', 'en-US': 'completed' },
  },
  TERMINATED: {
    id: 'http://adlnet.gov/expapi/verbs/terminated',
    display: { 'pt-BR': 'encerrou', 'en-US': 'terminated' },
  },
  PASSED: {
    id: 'http://adlnet.gov/expapi/verbs/passed',
    display: { 'pt-BR': 'passou', 'en-US': 'passed' },
  },
  FAILED: {
    id: 'http://adlnet.gov/expapi/verbs/failed',
    display: { 'pt-BR': 'reprovou', 'en-US': 'failed' },
  },
} as const;

// ===========================================
// Activity Types
// ===========================================

export const XAPI_ACTIVITY_TYPES = {
  VIDEO: 'https://w3id.org/xapi/video/activity-type/video',
  COURSE: 'http://adlnet.gov/expapi/activities/course',
  MODULE: 'http://adlnet.gov/expapi/activities/module',
  ASSESSMENT: 'http://adlnet.gov/expapi/activities/assessment',
} as const;

// ===========================================
// Extensions
// ===========================================

export const XAPI_EXTENSIONS = {
  // Video extensions
  TIME: 'https://w3id.org/xapi/video/extensions/time',
  TIME_FROM: 'https://w3id.org/xapi/video/extensions/time-from',
  TIME_TO: 'https://w3id.org/xapi/video/extensions/time-to',
  PROGRESS: 'https://w3id.org/xapi/video/extensions/progress',
  PLAYED_SEGMENTS: 'https://w3id.org/xapi/video/extensions/played-segments',
  LENGTH: 'https://w3id.org/xapi/video/extensions/length',
  COMPLETION_THRESHOLD: 'https://w3id.org/xapi/video/extensions/completion-threshold',
  // Custom extensions
  FRANCHISE_ID: 'https://motochefe.com/xapi/extensions/franchise_id',
  STORE_ID: 'https://motochefe.com/xapi/extensions/store_id',
  CARGO: 'https://motochefe.com/xapi/extensions/cargo',
  PLAYBACK_RATE: 'https://motochefe.com/xapi/extensions/playback_rate',
} as const;

// ===========================================
// Statement Types
// ===========================================

export interface XAPIActor {
  mbox?: string;
  account?: {
    homePage: string;
    name: string;
  };
  name?: string;
  objectType?: 'Agent';
}

export interface XAPIVerb {
  id: string;
  display: Record<string, string>;
}

export interface XAPIObject {
  id: string;
  objectType?: 'Activity';
  definition?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
    type?: string;
    extensions?: Record<string, unknown>;
  };
}

export interface XAPIResult {
  score?: {
    scaled?: number;
    raw?: number;
    min?: number;
    max?: number;
  };
  success?: boolean;
  completion?: boolean;
  duration?: string;
  extensions?: Record<string, unknown>;
}

export interface XAPIContext {
  registration?: string;
  instructor?: XAPIActor;
  team?: {
    objectType: 'Group';
    name: string;
    member: XAPIActor[];
  };
  contextActivities?: {
    parent?: XAPIObject[];
    grouping?: XAPIObject[];
    category?: XAPIObject[];
  };
  extensions?: Record<string, unknown>;
}

export interface XAPIStatement {
  id?: string;
  actor: XAPIActor;
  verb: XAPIVerb;
  object: XAPIObject;
  result?: XAPIResult;
  context?: XAPIContext;
  timestamp?: string;
  stored?: string;
  authority?: XAPIActor;
}

// ===========================================
// Statement Builders
// ===========================================

interface BuilderParams {
  userId: string;
  userEmail: string;
  userName: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  franchiseId: string;
  storeId?: string;
  cargo: string;
}

export function buildActor(email: string, name: string): XAPIActor {
  return {
    objectType: 'Agent',
    mbox: `mailto:${email}`,
    name,
  };
}

export function buildVideoObject(
  lessonId: string,
  lessonTitle: string,
  duration?: number
): XAPIObject {
  return {
    id: `https://motochefe.com/lessons/${lessonId}`,
    objectType: 'Activity',
    definition: {
      name: { 'pt-BR': lessonTitle },
      type: XAPI_ACTIVITY_TYPES.VIDEO,
      extensions: duration
        ? {
            [XAPI_EXTENSIONS.LENGTH]: duration,
          }
        : undefined,
    },
  };
}

export function buildContext(
  courseId: string,
  courseTitle: string,
  franchiseId: string,
  storeId?: string,
  cargo?: string
): XAPIContext {
  return {
    contextActivities: {
      parent: [
        {
          id: `https://motochefe.com/courses/${courseId}`,
          objectType: 'Activity',
          definition: {
            name: { 'pt-BR': courseTitle },
            type: XAPI_ACTIVITY_TYPES.COURSE,
          },
        },
      ],
    },
    extensions: {
      [XAPI_EXTENSIONS.FRANCHISE_ID]: franchiseId,
      ...(storeId && { [XAPI_EXTENSIONS.STORE_ID]: storeId }),
      ...(cargo && { [XAPI_EXTENSIONS.CARGO]: cargo }),
    },
  };
}

export function buildPlayedStatement(
  params: BuilderParams,
  currentTime: number,
  duration: number
): XAPIStatement {
  return {
    actor: buildActor(params.userEmail, params.userName),
    verb: XAPI_VERBS.PLAYED,
    object: buildVideoObject(params.lessonId, params.lessonTitle, duration),
    result: {
      extensions: {
        [XAPI_EXTENSIONS.TIME]: currentTime,
        [XAPI_EXTENSIONS.PROGRESS]: currentTime / duration,
      },
    },
    context: buildContext(
      params.courseId,
      params.courseTitle,
      params.franchiseId,
      params.storeId,
      params.cargo
    ),
    timestamp: new Date().toISOString(),
  };
}

export function buildPausedStatement(
  params: BuilderParams,
  currentTime: number,
  duration: number
): XAPIStatement {
  return {
    actor: buildActor(params.userEmail, params.userName),
    verb: XAPI_VERBS.PAUSED,
    object: buildVideoObject(params.lessonId, params.lessonTitle, duration),
    result: {
      extensions: {
        [XAPI_EXTENSIONS.TIME]: currentTime,
        [XAPI_EXTENSIONS.PROGRESS]: currentTime / duration,
      },
    },
    context: buildContext(
      params.courseId,
      params.courseTitle,
      params.franchiseId,
      params.storeId,
      params.cargo
    ),
    timestamp: new Date().toISOString(),
  };
}

export function buildSeekedStatement(
  params: BuilderParams,
  timeFrom: number,
  timeTo: number,
  duration: number
): XAPIStatement {
  return {
    actor: buildActor(params.userEmail, params.userName),
    verb: XAPI_VERBS.SEEKED,
    object: buildVideoObject(params.lessonId, params.lessonTitle, duration),
    result: {
      extensions: {
        [XAPI_EXTENSIONS.TIME_FROM]: timeFrom,
        [XAPI_EXTENSIONS.TIME_TO]: timeTo,
        [XAPI_EXTENSIONS.PROGRESS]: timeTo / duration,
      },
    },
    context: buildContext(
      params.courseId,
      params.courseTitle,
      params.franchiseId,
      params.storeId,
      params.cargo
    ),
    timestamp: new Date().toISOString(),
  };
}

export function buildCompletedStatement(
  params: BuilderParams,
  duration: number,
  totalWatched: number
): XAPIStatement {
  // Convert seconds to ISO 8601 duration
  const durationISO = `PT${Math.round(totalWatched)}S`;

  return {
    actor: buildActor(params.userEmail, params.userName),
    verb: XAPI_VERBS.COMPLETED,
    object: buildVideoObject(params.lessonId, params.lessonTitle, duration),
    result: {
      completion: true,
      duration: durationISO,
      extensions: {
        [XAPI_EXTENSIONS.TIME]: duration,
        [XAPI_EXTENSIONS.PROGRESS]: 1.0,
      },
    },
    context: buildContext(
      params.courseId,
      params.courseTitle,
      params.franchiseId,
      params.storeId,
      params.cargo
    ),
    timestamp: new Date().toISOString(),
  };
}
