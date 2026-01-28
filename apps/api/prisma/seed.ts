import { PrismaClient, Cargo, UserRole, CourseStatus, LessonType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash padrão para senha "123456" (apenas para desenvolvimento)
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // ==========================================
  // Franchise
  // ==========================================
  const franchise = await prisma.franchise.upsert({
    where: { slug: 'matriz-sp' },
    update: {},
    create: {
      name: 'MotoChefe Matriz São Paulo',
      cnpj: '00.000.000/0001-00',
      slug: 'matriz-sp',
      isActive: true,
    },
  });
  console.log('✅ Franchise created:', franchise.name);

  // ==========================================
  // Stores
  // ==========================================
  const store1 = await prisma.store.upsert({
    where: { id: 'store-1' },
    update: {},
    create: {
      id: 'store-1',
      franchiseId: franchise.id,
      name: 'Loja Centro',
      city: 'São Paulo',
      state: 'SP',
      isActive: true,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { id: 'store-2' },
    update: {},
    create: {
      id: 'store-2',
      franchiseId: franchise.id,
      name: 'Loja Zona Sul',
      city: 'São Paulo',
      state: 'SP',
      isActive: true,
    },
  });
  console.log('✅ Stores created:', 2);

  // ==========================================
  // Users
  // ==========================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@motochefe.com.br' },
    update: {},
    create: {
      email: 'admin@motochefe.com.br',
      passwordHash: defaultPasswordHash,
      name: 'Administrador',
      franchiseId: franchise.id,
      cargo: Cargo.proprietario,
      role: UserRole.super_admin,
      isActive: true,
    },
  });

  const mecanico = await prisma.user.upsert({
    where: { email: 'joao@motochefe.com.br' },
    update: {},
    create: {
      email: 'joao@motochefe.com.br',
      passwordHash: defaultPasswordHash,
      name: 'João Silva',
      franchiseId: franchise.id,
      storeId: store1.id,
      cargo: Cargo.mecanico,
      role: UserRole.learner,
      isActive: true,
    },
  });

  const atendente = await prisma.user.upsert({
    where: { email: 'maria@motochefe.com.br' },
    update: {},
    create: {
      email: 'maria@motochefe.com.br',
      passwordHash: defaultPasswordHash,
      name: 'Maria Santos',
      franchiseId: franchise.id,
      storeId: store2.id,
      cargo: Cargo.atendente,
      role: UserRole.learner,
      isActive: true,
    },
  });
  console.log('✅ Users created:', 3);

  // ==========================================
  // Course 1: Onboarding
  // ==========================================
  const course1 = await prisma.course.upsert({
    where: { id: 'course-onboarding' },
    update: {},
    create: {
      id: 'course-onboarding',
      franchiseId: null, // Global
      title: 'Bem-vindo à MotoChefe',
      description:
        'Conheça a história, valores e cultura da MotoChefe. Este curso é obrigatório para todos os novos colaboradores.',
      status: CourseStatus.published,
      targetCargos: [Cargo.mecanico, Cargo.atendente, Cargo.gerente, Cargo.proprietario],
      isRequired: true,
      durationMinutes: 30,
      order: 1,
    },
  });

  const module1_1 = await prisma.module.upsert({
    where: { id: 'module-1-1' },
    update: {},
    create: {
      id: 'module-1-1',
      courseId: course1.id,
      title: 'Nossa História',
      order: 1,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-1-1-1' },
    update: {},
    create: {
      id: 'lesson-1-1-1',
      moduleId: module1_1.id,
      title: 'A Fundação da MotoChefe',
      description: 'Conheça como tudo começou em 1995',
      type: LessonType.video,
      durationSeconds: 300, // 5 min
      order: 1,
      // manifestUrl will be set after video processing
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-1-1-2' },
    update: {},
    create: {
      id: 'lesson-1-1-2',
      moduleId: module1_1.id,
      title: 'Nossos Valores',
      description: 'Os pilares que guiam nosso trabalho',
      type: LessonType.video,
      durationSeconds: 420, // 7 min
      order: 2,
    },
  });

  console.log('✅ Course 1 created: Onboarding (2 lessons)');

  // ==========================================
  // Course 2: Atendimento ao Cliente
  // ==========================================
  const course2 = await prisma.course.upsert({
    where: { id: 'course-atendimento' },
    update: {},
    create: {
      id: 'course-atendimento',
      franchiseId: null,
      title: 'Excelência no Atendimento',
      description:
        'Aprenda técnicas de atendimento ao cliente que fazem a diferença e fidelizam clientes.',
      status: CourseStatus.published,
      targetCargos: [Cargo.atendente, Cargo.gerente],
      isRequired: true,
      durationMinutes: 45,
      order: 2,
    },
  });

  const module2_1 = await prisma.module.upsert({
    where: { id: 'module-2-1' },
    update: {},
    create: {
      id: 'module-2-1',
      courseId: course2.id,
      title: 'Fundamentos do Atendimento',
      order: 1,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-2-1-1' },
    update: {},
    create: {
      id: 'lesson-2-1-1',
      moduleId: module2_1.id,
      title: 'Primeira Impressão',
      description: 'Como causar uma ótima primeira impressão',
      type: LessonType.video,
      durationSeconds: 480, // 8 min
      order: 1,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-2-1-2' },
    update: {},
    create: {
      id: 'lesson-2-1-2',
      moduleId: module2_1.id,
      title: 'Escuta Ativa',
      description: 'Técnicas para entender as necessidades do cliente',
      type: LessonType.video,
      durationSeconds: 600, // 10 min
      order: 2,
    },
  });

  console.log('✅ Course 2 created: Atendimento (2 lessons)');

  // ==========================================
  // Course 3: Mecânica Básica
  // ==========================================
  const course3 = await prisma.course.upsert({
    where: { id: 'course-mecanica' },
    update: {},
    create: {
      id: 'course-mecanica',
      franchiseId: null,
      title: 'Mecânica de Motos - Fundamentos',
      description:
        'Aprenda os fundamentos da mecânica de motocicletas, desde o motor até os freios.',
      status: CourseStatus.published,
      targetCargos: [Cargo.mecanico],
      isRequired: true,
      durationMinutes: 60,
      order: 3,
    },
  });

  const module3_1 = await prisma.module.upsert({
    where: { id: 'module-3-1' },
    update: {},
    create: {
      id: 'module-3-1',
      courseId: course3.id,
      title: 'Sistema de Motor',
      order: 1,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-3-1-1' },
    update: {},
    create: {
      id: 'lesson-3-1-1',
      moduleId: module3_1.id,
      title: 'Funcionamento do Motor 4 Tempos',
      description: 'Entenda cada fase do ciclo de combustão',
      type: LessonType.video,
      durationSeconds: 720, // 12 min
      order: 1,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'lesson-3-1-2' },
    update: {},
    create: {
      id: 'lesson-3-1-2',
      moduleId: module3_1.id,
      title: 'Troca de Óleo',
      description: 'Procedimento correto para troca de óleo',
      type: LessonType.video,
      durationSeconds: 540, // 9 min
      order: 2,
    },
  });

  console.log('✅ Course 3 created: Mecânica (2 lessons)');

  // ==========================================
  // Tracks (Trilhas)
  // ==========================================
  const trackOnboarding = await prisma.track.upsert({
    where: { id: 'track-onboarding' },
    update: {},
    create: {
      id: 'track-onboarding',
      franchiseId: null,
      title: 'Trilha de Onboarding',
      description: 'Trilha completa para novos colaboradores',
      targetCargos: [Cargo.mecanico, Cargo.atendente, Cargo.gerente],
      isRequired: true,
      order: 1,
    },
  });

  await prisma.trackItem.upsert({
    where: { id: 'track-item-1' },
    update: {},
    create: {
      id: 'track-item-1',
      trackId: trackOnboarding.id,
      courseId: course1.id,
      order: 1,
    },
  });

  await prisma.trackItem.upsert({
    where: { id: 'track-item-2' },
    update: {},
    create: {
      id: 'track-item-2',
      trackId: trackOnboarding.id,
      courseId: course2.id,
      order: 2,
    },
  });

  console.log('✅ Track created: Onboarding (2 courses)');

  // ==========================================
  // Badges
  // ==========================================
  await prisma.badge.upsert({
    where: { id: 'badge-first-course' },
    update: {},
    create: {
      id: 'badge-first-course',
      name: 'Primeiro Passo',
      description: 'Completou seu primeiro curso',
      imageUrl: '/badges/first-course.png',
      criteriaJson: { type: 'courses_completed', value: 1 },
      points: 100,
    },
  });

  await prisma.badge.upsert({
    where: { id: 'badge-five-courses' },
    update: {},
    create: {
      id: 'badge-five-courses',
      name: 'Estudante Dedicado',
      description: 'Completou 5 cursos',
      imageUrl: '/badges/five-courses.png',
      criteriaJson: { type: 'courses_completed', value: 5 },
      points: 500,
    },
  });

  console.log('✅ Badges created:', 2);

  // ==========================================
  // Enrollments (auto-enroll for required courses)
  // ==========================================
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: mecanico.id, courseId: course1.id } },
    update: {},
    create: {
      userId: mecanico.id,
      courseId: course1.id,
      status: 'active',
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: mecanico.id, courseId: course3.id } },
    update: {},
    create: {
      userId: mecanico.id,
      courseId: course3.id,
      status: 'active',
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: atendente.id, courseId: course1.id } },
    update: {},
    create: {
      userId: atendente.id,
      courseId: course1.id,
      status: 'active',
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: atendente.id, courseId: course2.id } },
    update: {},
    create: {
      userId: atendente.id,
      courseId: course2.id,
      status: 'active',
    },
  });

  console.log('✅ Enrollments created:', 4);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log('  - 1 Franchise (MotoChefe Matriz SP)');
  console.log('  - 2 Stores');
  console.log('  - 3 Users (1 admin, 1 mecânico, 1 atendente)');
  console.log('  - 3 Courses (6 lessons total)');
  console.log('  - 1 Track');
  console.log('  - 2 Badges');
  console.log('  - 4 Enrollments');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
