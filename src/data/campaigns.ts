// Seed data for the full campaign curriculum
// Inserted into SQLite on first launch

const t = (prompts: string[], difficulty: 'letter' | 'word' | 'sentence' = 'letter') =>
  JSON.stringify({ prompts, difficulty });

const p = (text: string, buttonText = 'Got it!') =>
  JSON.stringify({ text, buttonText });

export const SEED_CAMPAIGNS = [
  {
    title: 'Beginner Typist',
    description: 'Learn the basics of touch typing from the home row up',
    orderIndex: 0,
    stages: [
      // ── Stage 1: Getting Started ──────────────
      {
        title: 'Getting Started',
        description: 'Posture, hand placement, and your first keys',
        orderIndex: 0,
        lessons: [
          { type: 'video' as const, title: 'Welcome to TypeKids', contentRef: 'welcome', orderIndex: 0 },
          { type: 'prompt' as const, title: 'Hand Placement', contentRef: p('Place your fingers on the home row: A S D F for your left hand, J K L ; for your right hand. Feel the bumps on F and J!'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Home Row: J and K', contentRef: t(['j', 'k', 'j', 'k', 'jj', 'kk', 'jk', 'kj']), orderIndex: 2 },
          { type: 'typing' as const, title: 'Home Row: D and F', contentRef: t(['d', 'f', 'd', 'f', 'dd', 'ff', 'df', 'fd']), orderIndex: 3 },
          { type: 'typing' as const, title: 'Home Row: All Left', contentRef: t(['a', 's', 'd', 'f', 'as', 'df', 'sad', 'fad']), orderIndex: 4 },
          { type: 'typing' as const, title: 'Home Row: All Right', contentRef: t(['j', 'k', 'l', 'jk', 'kl', 'lk', 'jkl']), orderIndex: 5 },
        ],
      },
      // ── Stage 2: Home Row Mastery ─────────────
      {
        title: 'Home Row Mastery',
        description: 'Combine all home row keys into words',
        orderIndex: 1,
        lessons: [
          { type: 'prompt' as const, title: 'Combining Keys', contentRef: p('Now let\'s combine all the home row keys to type simple words. Keep your fingers on the home row!', 'Let\'s go!'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Simple Words', contentRef: t(['add', 'all', 'ask', 'dad', 'fall', 'lad', 'sad'], 'word'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Longer Words', contentRef: t(['flask', 'lass', 'glad', 'shall', 'salsa', 'flash'], 'word'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Home Row Phrases', contentRef: t(['a sad lad', 'all fall', 'dad shall ask', 'a glad lass'], 'word'), orderIndex: 3 },
          { type: 'typing' as const, title: 'Home Row Challenge', contentRef: t(['salad flask', 'glad dad falls', 'lass shall ask all'], 'word'), orderIndex: 4 },
        ],
      },
      // ── Stage 3: Top Row Introduction ─────────
      {
        title: 'Top Row Introduction',
        description: 'Reach up to the top row keys',
        orderIndex: 2,
        lessons: [
          { type: 'video' as const, title: 'Reaching the Top Row', contentRef: 'top-row-intro', orderIndex: 0 },
          { type: 'typing' as const, title: 'Top Row: E and I', contentRef: t(['e', 'i', 'ee', 'ii', 'ei', 'ie', 'eel', 'fie']), orderIndex: 1 },
          { type: 'typing' as const, title: 'Top Row: R and U', contentRef: t(['r', 'u', 'rr', 'uu', 'rue', 'fur', 'rule', 'rude']), orderIndex: 2 },
          { type: 'typing' as const, title: 'Top Row: T and Y', contentRef: t(['t', 'y', 'ty', 'yt', 'try', 'yet', 'tidy', 'kitty']), orderIndex: 3 },
          { type: 'typing' as const, title: 'Top Row: W, O, P', contentRef: t(['w', 'o', 'p', 'wow', 'pow', 'top', 'pot', 'row']), orderIndex: 4 },
          { type: 'typing' as const, title: 'Top Row: Q', contentRef: t(['q', 'qq', 'quit', 'quick', 'quiet', 'quote']), orderIndex: 5 },
        ],
      },
      // ── Stage 4: Top Row Words ────────────────
      {
        title: 'Top Row Words',
        description: 'Build words using home and top row keys',
        orderIndex: 3,
        lessons: [
          { type: 'typing' as const, title: 'Mixed Row Words 1', contentRef: t(['tire', 'fire', 'kite', 'like', 'ride', 'quite', 'write'], 'word'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Mixed Row Words 2', contentRef: t(['turtle', 'water', 'tower', 'power', 'pretty', 'little'], 'word'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Mixed Row Words 3', contentRef: t(['repeat', 'people', 'triple', 'proper', 'operate'], 'word'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Two Row Phrases', contentRef: t(['we like to write', 'a little turtle', 'quite a pretty kite'], 'sentence'), orderIndex: 3 },
        ],
      },
      // ── Stage 5: Bottom Row ───────────────────
      {
        title: 'Bottom Row',
        description: 'Learn the bottom row keys',
        orderIndex: 4,
        lessons: [
          { type: 'video' as const, title: 'The Bottom Row', contentRef: 'bottom-row-intro', orderIndex: 0 },
          { type: 'typing' as const, title: 'Bottom Row: Z and X', contentRef: t(['z', 'x', 'zz', 'xx', 'zx', 'xz', 'zip', 'fix']), orderIndex: 1 },
          { type: 'typing' as const, title: 'Bottom Row: C and V', contentRef: t(['c', 'v', 'cc', 'vv', 'cv', 'vc', 'cave', 'vice']), orderIndex: 2 },
          { type: 'typing' as const, title: 'Bottom Row: B, N, M', contentRef: t(['b', 'n', 'm', 'bn', 'nm', 'ban', 'man', 'bin']), orderIndex: 3 },
          { type: 'typing' as const, title: 'Bottom Row Words', contentRef: t(['box', 'mix', 'van', 'cab', 'numb', 'comb', 'move', 'vine'], 'word'), orderIndex: 4 },
          { type: 'typing' as const, title: 'Bottom Row Challenge', contentRef: t(['zen box', 'mix a combo', 'move the van', 'number five'], 'word'), orderIndex: 5 },
        ],
      },
      // ── Stage 6: All Rows Combined ────────────
      {
        title: 'All Rows Combined',
        description: 'Put it all together with full keyboard',
        orderIndex: 5,
        lessons: [
          { type: 'prompt' as const, title: 'Full Keyboard', contentRef: p('You now know all three rows! Time to combine everything. Keep your fingers on the home row and reach up or down as needed.', 'Let\'s do this!'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Easy Full Words', contentRef: t(['jump', 'duck', 'frog', 'bird', 'fish', 'bear', 'lion'], 'word'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Medium Full Words', contentRef: t(['zebra', 'monkey', 'giraffe', 'dolphin', 'penguin'], 'word'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Simple Sentences', contentRef: t(['the cat sat', 'a big red dog', 'jump over it', 'run and play'], 'sentence'), orderIndex: 3 },
          { type: 'typing' as const, title: 'Longer Sentences', contentRef: t(['the quick fox runs', 'a bird can fly high', 'kids love to play games'], 'sentence'), orderIndex: 4 },
          { type: 'typing' as const, title: 'Beginner Graduation', contentRef: t(['you did a great job', 'keep on typing every day', 'practice makes perfect'], 'sentence'), orderIndex: 5 },
        ],
      },
    ],
  },
  // ════════════════════════════════════════════════
  // CAMPAIGN 2: Intermediate Speed
  // ════════════════════════════════════════════════
  {
    title: 'Intermediate Speed',
    description: 'Build speed and accuracy with longer words and sentences',
    orderIndex: 1,
    stages: [
      {
        title: 'Common Words',
        description: 'Practice the most common English words',
        orderIndex: 0,
        lessons: [
          { type: 'typing' as const, title: 'Top 20 Words 1', contentRef: t(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'], 'word'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Top 20 Words 2', contentRef: t(['can', 'had', 'her', 'was', 'one', 'our', 'out', 'has'], 'word'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Common Phrases', contentRef: t(['i can do it', 'you are the best', 'we had fun today', 'she was not here'], 'sentence'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Daily Words', contentRef: t(['school', 'friend', 'house', 'water', 'happy', 'music', 'dance'], 'word'), orderIndex: 3 },
        ],
      },
      {
        title: 'Speed Building',
        description: 'Type faster with familiar words',
        orderIndex: 1,
        lessons: [
          { type: 'typing' as const, title: 'Quick Doubles', contentRef: t(['go go go', 'run run run', 'the the the', 'and and and'], 'sentence'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Short Sentences', contentRef: t(['the dog ran fast', 'she can jump high', 'we play all day', 'he reads a book'], 'sentence'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Medium Sentences', contentRef: t(['the cat sleeps on the mat', 'birds sing in the morning', 'we ride bikes after school'], 'sentence'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Speed Challenge', contentRef: t(['a quick brown fox jumps over the lazy dog', 'she sells sea shells by the sea shore'], 'sentence'), orderIndex: 3 },
        ],
      },
      {
        title: 'Accuracy Focus',
        description: 'Tricky letter combinations and similar words',
        orderIndex: 2,
        lessons: [
          { type: 'prompt' as const, title: 'Accuracy Matters', contentRef: p('Now we focus on accuracy. Take your time — being correct is more important than being fast!', 'Understood!'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Tricky Pairs: b/d', contentRef: t(['bad', 'dab', 'bed', 'deb', 'bid', 'dib', 'bud', 'dub'], 'word'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Tricky Pairs: p/q', contentRef: t(['pup', 'quip', 'push', 'quick', 'pull', 'quit', 'pond', 'quiz'], 'word'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Tricky Pairs: m/n', contentRef: t(['man', 'name', 'moon', 'noon', 'mine', 'nine', 'mane', 'main'], 'word'), orderIndex: 3 },
          { type: 'typing' as const, title: 'Mixed Tricky Words', contentRef: t(['queen', 'bridge', 'plumb', 'knock', 'wrist', 'sword'], 'word'), orderIndex: 4 },
        ],
      },
      {
        title: 'Space Bar Mastery',
        description: 'Practice smooth word transitions',
        orderIndex: 3,
        lessons: [
          { type: 'typing' as const, title: 'Two Word Phrases', contentRef: t(['big dog', 'red car', 'hot sun', 'cold ice', 'tall tree'], 'word'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Three Word Phrases', contentRef: t(['a big dog', 'the red car', 'one hot day', 'my best friend'], 'sentence'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Full Sentences', contentRef: t(['the sun is bright today', 'my dog likes to play fetch', 'we went to the park after school'], 'sentence'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Paragraph Practice', contentRef: t(['today is a great day to learn how to type faster and better'], 'sentence'), orderIndex: 3 },
        ],
      },
    ],
  },
  // ════════════════════════════════════════════════
  // CAMPAIGN 3: Advanced Typist
  // ════════════════════════════════════════════════
  {
    title: 'Advanced Typist',
    description: 'Master complex words, punctuation, and real-world text',
    orderIndex: 2,
    stages: [
      {
        title: 'Long Words',
        description: 'Tackle challenging multi-syllable words',
        orderIndex: 0,
        lessons: [
          { type: 'typing' as const, title: 'Six Letter Words', contentRef: t(['planet', 'garden', 'basket', 'rabbit', 'sunset', 'window'], 'word'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Seven Letter Words', contentRef: t(['kitchen', 'blanket', 'monster', 'brother', 'picture'], 'word'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Eight+ Letter Words', contentRef: t(['computer', 'elephant', 'butterfly', 'adventure', 'wonderful'], 'word'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Challenge Words', contentRef: t(['extraordinary', 'multiplication', 'approximately', 'communication'], 'word'), orderIndex: 3 },
        ],
      },
      {
        title: 'Real World Text',
        description: 'Type sentences you would see in books and school',
        orderIndex: 1,
        lessons: [
          { type: 'typing' as const, title: 'Book Sentences', contentRef: t(['once upon a time there lived a kind old man', 'the forest was dark and full of mystery'], 'sentence'), orderIndex: 0 },
          { type: 'typing' as const, title: 'School Sentences', contentRef: t(['the earth goes around the sun in one year', 'water freezes at zero degrees celsius'], 'sentence'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Everyday Writing', contentRef: t(['dear friend i hope you are doing well today', 'please remember to bring your homework tomorrow'], 'sentence'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Advanced Challenge', contentRef: t(['pack my box with five dozen liquor jugs', 'the five boxing wizards jump quickly at dawn'], 'sentence'), orderIndex: 3 },
        ],
      },
      {
        title: 'Speed Graduation',
        description: 'Final speed and accuracy challenges',
        orderIndex: 2,
        lessons: [
          { type: 'prompt' as const, title: 'Final Challenge', contentRef: p('This is the final stage! Show everything you have learned. Aim for speed AND accuracy!', 'Bring it on!'), orderIndex: 0 },
          { type: 'typing' as const, title: 'Sprint 1', contentRef: t(['the quick brown fox jumps over the lazy dog near the river bank'], 'sentence'), orderIndex: 1 },
          { type: 'typing' as const, title: 'Sprint 2', contentRef: t(['every good kid deserves a fun and exciting adventure with their best friends'], 'sentence'), orderIndex: 2 },
          { type: 'typing' as const, title: 'Sprint 3', contentRef: t(['learning to type well is one of the most useful skills you will ever develop'], 'sentence'), orderIndex: 3 },
          { type: 'typing' as const, title: 'Graduation Test', contentRef: t(['congratulations you have completed the advanced typing course keep practicing every day'], 'sentence'), orderIndex: 4 },
        ],
      },
    ],
  },
];

export async function seedDatabase(db: any): Promise<void> {
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
