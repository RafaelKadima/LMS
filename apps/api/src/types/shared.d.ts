// Type declarations for @motochefe/shared
declare module '@motochefe/shared' {
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

  export function buildPlayedStatement(
    params: BuilderParams,
    currentTime: number,
    duration: number
  ): XAPIStatement;

  export function buildPausedStatement(
    params: BuilderParams,
    currentTime: number,
    duration: number
  ): XAPIStatement;

  export function buildSeekedStatement(
    params: BuilderParams,
    timeFrom: number,
    timeTo: number,
    duration: number
  ): XAPIStatement;

  export function buildCompletedStatement(
    params: BuilderParams,
    duration: number,
    totalWatched: number
  ): XAPIStatement;
}
