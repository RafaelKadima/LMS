// Tipos compartilhados entre apps

// ===========================================
// Enums
// ===========================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FRANCHISE_ADMIN = 'franchise_admin',
  STORE_MANAGER = 'store_manager',
  LEARNER = 'learner',
}

export enum Cargo {
  MECANICO = 'mecanico',
  ATENDENTE = 'atendente',
  GERENTE = 'gerente',
  PROPRIETARIO = 'proprietario',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum LessonType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  QUIZ = 'quiz',
  SCORM = 'scorm',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum VideoProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum XAPIEventStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

// ===========================================
// User & Auth
// ===========================================

export interface User {
  id: string;
  keycloakId: string;
  email: string;
  name: string;
  franchiseId: string;
  storeId?: string;
  cargo: Cargo;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  franchise_id: string;
  store_id?: string;
  cargo: Cargo;
  roles: UserRole[];
  iat: number;
  exp: number;
}

// ===========================================
// Franchise & Store
// ===========================================

export interface Franchise {
  id: string;
  name: string;
  cnpj: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  franchiseId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// Course & Content
// ===========================================

export interface Course {
  id: string;
  franchiseId?: string; // null = global
  title: string;
  description: string;
  thumbnailUrl?: string;
  status: CourseStatus;
  targetCargos: Cargo[];
  isRequired: boolean;
  durationMinutes: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  type: LessonType;
  durationSeconds: number;
  order: number;
  // Video specific
  videoUrl?: string;
  manifestUrl?: string;
  thumbnailUrl?: string;
  processingStatus?: VideoProcessingStatus;
  // Document specific
  documentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// Tracks (Trilhas)
// ===========================================

export interface Track {
  id: string;
  franchiseId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  targetCargos: Cargo[];
  isRequired: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackItem {
  id: string;
  trackId: string;
  courseId: string;
  order: number;
}

// ===========================================
// Enrollments & Progress
// ===========================================

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  lastPositionSeconds: number;
  secondsWatched: number;
  percentComplete: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// Gamification
// ===========================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: BadgeCriteria;
  points: number;
  createdAt: Date;
}

export interface BadgeCriteria {
  type: 'courses_completed' | 'streak_days' | 'total_hours' | 'specific_course';
  value: number;
  courseId?: string;
}

export interface BadgeAward {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: Date;
}

// ===========================================
// xAPI Events
// ===========================================

export interface XAPIEvent {
  id: string;
  userId: string;
  statementJson: string;
  status: XAPIEventStatus;
  attempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

// ===========================================
// DTOs
// ===========================================

export interface HeartbeatDto {
  lessonId: string;
  currentTime: number;
  duration: number;
  playbackRate: number;
  event: 'playing' | 'paused' | 'seeked' | 'ended';
}

export interface CompleteDto {
  lessonId: string;
  finalTime: number;
  totalWatched: number;
}

export interface CatalogCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  durationMinutes: number;
  lessonsCount: number;
  progress?: number;
  isRequired: boolean;
  targetCargos: Cargo[];
}

export interface CourseDetail extends Course {
  modules: (Module & { lessons: Lesson[] })[];
  enrollment?: Enrollment;
}

export interface ContinueWatchingItem {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  thumbnailUrl?: string;
  lastPosition: number;
  duration: number;
  percentComplete: number;
  updatedAt: Date;
}

// ===========================================
// API Responses
// ===========================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
