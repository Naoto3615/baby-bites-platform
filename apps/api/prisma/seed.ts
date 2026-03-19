import {
  AuthProvider,
  FeedingStage,
  ReportStatus,
  ReportTargetType,
  UserRole,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { id: 'demo-user' },
    update: {
      displayName: 'デモ保護者',
      role: UserRole.PARENT,
      isActive: true,
      lastLoginAt: new Date(),
    },
    create: {
      id: 'demo-user',
      displayName: 'デモ保護者',
      role: UserRole.PARENT,
      isActive: true,
      lastLoginAt: new Date(),
      bio: '離乳食の時短レシピを探しています。',
    },
  });

  const moderatorUser = await prisma.user.upsert({
    where: { id: 'moderator-user' },
    update: {
      displayName: 'モデレーター',
      role: UserRole.MODERATOR,
      isActive: true,
      lastLoginAt: new Date(),
    },
    create: {
      id: 'moderator-user',
      displayName: 'モデレーター',
      role: UserRole.MODERATOR,
      isActive: true,
      lastLoginAt: new Date(),
      bio: 'コミュニティ運営担当',
    },
  });

  await prisma.user.upsert({
    where: { id: 'admin-user' },
    update: {
      displayName: '管理者',
      role: UserRole.ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
    },
    create: {
      id: 'admin-user',
      displayName: '管理者',
      role: UserRole.ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
      bio: 'サービス管理者',
    },
  });

  await prisma.userAuthProvider.upsert({
    where: {
      provider_providerUserId: {
        provider: AuthProvider.DEV,
        providerUserId: 'demo-user',
      },
    },
    update: {
      userId: demoUser.id,
      email: 'demo@example.com',
    },
    create: {
      userId: demoUser.id,
      provider: AuthProvider.DEV,
      providerUserId: 'demo-user',
      email: 'demo@example.com',
      rawProfile: {
        providerUserId: 'demo-user',
      },
    },
  });

  await prisma.userAuthProvider.upsert({
    where: {
      provider_providerUserId: {
        provider: AuthProvider.DEV,
        providerUserId: 'moderator-user',
      },
    },
    update: {
      userId: moderatorUser.id,
      email: 'moderator@example.com',
    },
    create: {
      userId: moderatorUser.id,
      provider: AuthProvider.DEV,
      providerUserId: 'moderator-user',
      email: 'moderator@example.com',
      rawProfile: {
        providerUserId: 'moderator-user',
      },
    },
  });

  const topicSeeds = [
    {
      name: '5〜6ヶ月のスタート相談',
      description: '初期離乳食で迷ったことを共有',
    },
    {
      name: 'アレルギー対応',
      description: '食材代替や進め方の情報交換',
    },
    {
      name: '時短レシピ',
      description: '忙しい日の離乳食アイデア',
    },
  ];

  for (const topic of topicSeeds) {
    await prisma.communityTopic.upsert({
      where: { name: topic.name },
      update: { description: topic.description },
      create: topic,
    });
  }

  let recipe = await prisma.recipe.findFirst({
    where: { title: 'にんじんとじゃがいものやわらかペースト' },
  });

  if (!recipe) {
    recipe = await prisma.recipe.create({
      data: {
        title: 'にんじんとじゃがいものやわらかペースト',
        description: '5〜6ヶ月向けの基本ペースト。冷凍ストック可能。',
        stage: FeedingStage.STAGE_5_6,
        prepMinutes: 10,
        cookMinutes: 15,
        servings: 4,
        allergens: [],
        authorId: demoUser.id,
        tags: {
          create: [{ value: '時短' }, { value: '冷凍保存' }],
        },
        ingredients: {
          create: [
            { name: 'にんじん', amount: '30g', order: 1 },
            { name: 'じゃがいも', amount: '40g', order: 2 },
            { name: '湯冷まし', amount: '適量', order: 3 },
          ],
        },
        steps: {
          create: [
            { order: 1, instruction: '野菜をやわらかく茹でる。' },
            { order: 2, instruction: 'すり鉢でなめらかになるまでつぶす。' },
            { order: 3, instruction: '湯冷ましで濃度を調整する。' },
          ],
        },
      },
    });
  }

  const starterTopic = await prisma.communityTopic.findUnique({
    where: { name: '5〜6ヶ月のスタート相談' },
  });

  if (starterTopic) {
    const existingPost = await prisma.communityPost.findFirst({
      where: {
        topicId: starterTopic.id,
        title: '離乳食の初日に何を準備しましたか？',
      },
    });

    const post =
      existingPost ??
      (await prisma.communityPost.create({
        data: {
          topicId: starterTopic.id,
          authorId: demoUser.id,
          title: '離乳食の初日に何を準備しましたか？',
          body: 'うちでは冷凍トレーと小鍋を先にそろえました。',
          stage: FeedingStage.STAGE_5_6,
        },
      }));

    const existingComment = await prisma.communityComment.findFirst({
      where: {
        postId: post.id,
        body: 'ブレンダーもあると便利でした。',
      },
    });

    if (!existingComment) {
      await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: moderatorUser.id,
          body: 'ブレンダーもあると便利でした。',
        },
      });
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: demoUser.id,
        targetType: ReportTargetType.COMMUNITY_POST,
        targetId: post.id,
      },
    });

    if (!existingReport) {
      await prisma.report.create({
        data: {
          reporterId: demoUser.id,
          targetType: ReportTargetType.COMMUNITY_POST,
          targetId: post.id,
          reason: '安全性に関する補足が必要',
          detail: '栄養士監修情報があると安心です。',
          status: ReportStatus.OPEN,
        },
      });
    }
  }

  if (recipe.coverImageUrl === null) {
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        coverImageUrl: '/uploads/recipes/sample-cover.png',
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
