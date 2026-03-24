// Seed data for the initial campaign content
// This gets inserted into SQLite on first launch

export const SEED_CAMPAIGNS = [
  {
    title: 'Beginner Typist',
    description: 'Learn the basics of touch typing from the home row up',
    orderIndex: 0,
    stages: [
      {
        title: 'Getting Started',
        description: 'Posture, hand placement, and your first keys',
        orderIndex: 0,
        lessons: [
          { type: 'video' as const, title: 'Welcome to TypeKids', contentRef: 'welcome', orderIndex: 0 },
          { type: 'prompt' as const, title: 'Hand Placement', contentRef: JSON.stringify({ text: 'Place your fingers on the home row: A S D F for your left hand, J K L ; for your right hand. Feel the bumps on F and J!', buttonText: 'Got it!' }), orderIndex: 1 },
          { type: 'typing' as const, title: 'Home Row: J and K', contentRef: JSON.stringify({ prompts: ['j', 'k', 'j', 'k', 'jj', 'kk', 'jk', 'kj'], difficulty: 'letter' }), orderIndex: 2 },
          { type: 'typing' as const, title: 'Home Row: D and F', contentRef: JSON.stringify({ prompts: ['d', 'f', 'd', 'f', 'dd', 'ff', 'df', 'fd'], difficulty: 'letter' }), orderIndex: 3 },
          { type: 'typing' as const, title: 'Home Row: All Left', contentRef: JSON.stringify({ prompts: ['a', 's', 'd', 'f', 'as', 'df', 'sad', 'fad'], difficulty: 'letter' }), orderIndex: 4 },
          { type: 'typing' as const, title: 'Home Row: All Right', contentRef: JSON.stringify({ prompts: ['j', 'k', 'l', 'jk', 'kl', 'lk', 'jkl'], difficulty: 'letter' }), orderIndex: 5 },
        ],
      },
      {
        title: 'Home Row Mastery',
        description: 'Combine all home row keys into words',
        orderIndex: 1,
        lessons: [
          { type: 'prompt' as const, title: 'Combining Keys', contentRef: JSON.stringify({ text: 'Now let\'s combine all the home row keys to type simple words. Keep your fingers on the home row!', buttonText: 'Let\'s go!' }), orderIndex: 0 },
          { type: 'typing' as const, title: 'Simple Home Row Words', contentRef: JSON.stringify({ prompts: ['add', 'all', 'ask', 'dad', 'fall', 'lad', 'sad', 'salad'], difficulty: 'word' }), orderIndex: 1 },
          { type: 'typing' as const, title: 'More Home Row Words', contentRef: JSON.stringify({ prompts: ['flask', 'lass', 'glad', 'shall', 'salsa', 'flash'], difficulty: 'word' }), orderIndex: 2 },
          { type: 'typing' as const, title: 'Home Row Speed', contentRef: JSON.stringify({ prompts: ['a sad lad', 'all fall', 'dad shall ask', 'a glad lass'], difficulty: 'word' }), orderIndex: 3 },
        ],
      },
      {
        title: 'Top Row Introduction',
        description: 'Reach up to the top row keys',
        orderIndex: 2,
        lessons: [
          { type: 'prompt' as const, title: 'Reaching Up', contentRef: JSON.stringify({ text: 'Time to learn the top row! Your fingers will reach up from the home row and come back. Let\'s start with E and I.', buttonText: 'Ready!' }), orderIndex: 0 },
          { type: 'typing' as const, title: 'Top Row: E and I', contentRef: JSON.stringify({ prompts: ['e', 'i', 'ee', 'ii', 'ei', 'ie', 'eel', 'fie'], difficulty: 'letter' }), orderIndex: 1 },
          { type: 'typing' as const, title: 'Top Row: R and U', contentRef: JSON.stringify({ prompts: ['r', 'u', 'rr', 'uu', 'rue', 'fur', 'rule', 'rude'], difficulty: 'letter' }), orderIndex: 2 },
          { type: 'typing' as const, title: 'Top Row: T and Y', contentRef: JSON.stringify({ prompts: ['t', 'y', 'ty', 'yt', 'try', 'yet', 'tidy', 'kitty'], difficulty: 'letter' }), orderIndex: 3 },
          { type: 'typing' as const, title: 'Top Row Words', contentRef: JSON.stringify({ prompts: ['tire', 'fire', 'kite', 'like', 'ride', 'quite', 'write', 'turtle'], difficulty: 'word' }), orderIndex: 4 },
        ],
      },
    ],
  },
];

export async function seedDatabase(db: any): Promise<void> {
  // Check if already seeded
  const existing: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM campaigns');
  if (existing?.count > 0) return;

  for (const campaign of SEED_CAMPAIGNS) {
    const campaignResult = await db.runAsync(
      'INSERT INTO campaigns (title, description, order_index, total_stages) VALUES (?, ?, ?, ?)',
      [campaign.title, campaign.description, campaign.orderIndex, campaign.stages.length]
    );
    const campaignId = campaignResult.lastInsertRowId;

    for (const stage of campaign.stages) {
      const stageResult = await db.runAsync(
        'INSERT INTO stages (campaign_id, title, description, order_index, total_lessons) VALUES (?, ?, ?, ?, ?)',
        [campaignId, stage.title, stage.description, stage.orderIndex, stage.lessons.length]
      );
      const stageId = stageResult.lastInsertRowId;

      for (const lesson of stage.lessons) {
        await db.runAsync(
          'INSERT INTO lessons (stage_id, type, title, content_ref, order_index) VALUES (?, ?, ?, ?, ?)',
          [stageId, lesson.type, lesson.title, lesson.contentRef, lesson.orderIndex]
        );
      }
    }
  }
}
