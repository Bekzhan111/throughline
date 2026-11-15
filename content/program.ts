export type Idea = {
  id: string;
  book: string;
  author: string;
  chapter: number;
  chapterTitle: string;
  text: string;
};

export type Paragraph = { text: string; cites: string[] };

export type Lesson = {
  day: number;
  week: 1 | 2 | 3;
  title: string;
  minutes: number;
  summary: string;
  paragraphs: Paragraph[];
  action: string;
  questions: string[];
  disagreement?: {
    a: { author: string; text: string; cite: string };
    b: { author: string; text: string; cite: string };
    tie: string;
  };
};

export const books = [
  { slug: "housel", title: "The Psychology of Money", author: "Morgan Housel", color: "#1D3FD6" },
  { slug: "sethi", title: "I Will Teach You to Be Rich", author: "Ramit Sethi", color: "#B4381F" },
  { slug: "collins", title: "The Simple Path to Wealth", author: "JL Collins", color: "#0F7A5C" },
  { slug: "stanley", title: "The Millionaire Next Door", author: "Thomas Stanley & William Danko", color: "#8A6A12" },
  { slug: "ramsey", title: "The Total Money Makeover", author: "Dave Ramsey", color: "#2B2F38" },
  { slug: "bogle", title: "The Little Book of Common Sense Investing", author: "John C. Bogle", color: "#5B21B6" },
  { slug: "robin", title: "Your Money or Your Life", author: "Vicki Robin & Joe Dominguez", color: "#0E6C8A" },
  { slug: "perkins", title: "Die With Zero", author: "Bill Perkins", color: "#9B2C5E" },
] as const;

export const ideas: Record<string, Idea> = {
  "housel-1": { id: "housel-1", book: "The Psychology of Money", author: "Morgan Housel", chapter: 1, chapterTitle: "No One's Crazy", text: "People's money behavior comes from the world they grew up in, not from a spreadsheet." },
  "housel-2": { id: "housel-2", book: "The Psychology of Money", author: "Morgan Housel", chapter: 2, chapterTitle: "Luck & Risk", text: "The same outcome can be luck or risk. Judge the decision, not only the result." },
  "housel-3": { id: "housel-3", book: "The Psychology of Money", author: "Morgan Housel", chapter: 3, chapterTitle: "Never Enough", text: "Moving the finish line every time you get a raise is how people with money still feel broke." },
  "housel-5": { id: "housel-5", book: "The Psychology of Money", author: "Morgan Housel", chapter: 5, chapterTitle: "Getting Wealthy vs. Staying Wealthy", text: "Getting money rewards risk. Keeping it rewards survival and room for error." },
  "housel-7": { id: "housel-7", book: "The Psychology of Money", author: "Morgan Housel", chapter: 7, chapterTitle: "Freedom", text: "The highest dividend of money is control over your time." },
  "housel-9": { id: "housel-9", book: "The Psychology of Money", author: "Morgan Housel", chapter: 9, chapterTitle: "Wealth is What You Don't See", text: "Wealth is income you did not spend. The car and the watch are the opposite of a balance sheet." },
  "housel-10": { id: "housel-10", book: "The Psychology of Money", author: "Morgan Housel", chapter: 10, chapterTitle: "Save Money", text: "Savings rate matters more than investment return for most working people, and you do not need a specific reason to save." },
  "housel-11": { id: "housel-11", book: "The Psychology of Money", author: "Morgan Housel", chapter: 11, chapterTitle: "Reasonable > Rational", text: "A plan you can keep on a bad month beats a perfect plan you abandon." },
  "housel-16": { id: "housel-16", book: "The Psychology of Money", author: "Morgan Housel", chapter: 16, chapterTitle: "You & Me", text: "Copying someone else's investment only works if you share their timeline." },
  "sethi-1": { id: "sethi-1", book: "I Will Teach You to Be Rich", author: "Ramit Sethi", chapter: 1, chapterTitle: "Optimize Your Credit Cards", text: "Credit cards are a tool. Pay the statement in full, and the score follows the habit." },
  "sethi-4": { id: "sethi-4", book: "I Will Teach You to Be Rich", author: "Ramit Sethi", chapter: 4, chapterTitle: "Conscious Spending", text: "Spend extravagantly on what you love and cut mercilessly on what you don't. A budget that bans joy fails." },
  "sethi-5": { id: "sethi-5", book: "I Will Teach You to Be Rich", author: "Ramit Sethi", chapter: 5, chapterTitle: "Save While Sleeping", text: "The day the paycheck lands, money should already be moving to savings and bills before you can spend it." },
  "sethi-3": { id: "sethi-3", book: "I Will Teach You to Be Rich", author: "Ramit Sethi", chapter: 3, chapterTitle: "Get Ready to Invest", text: "Fill the match at work before you get clever. The match is part of your pay." },
  "collins-1": { id: "collins-1", book: "The Simple Path to Wealth", author: "JL Collins", chapter: 1, chapterTitle: "Debt: The Unacceptable Burden", text: "High-interest debt is an emergency because it compounds against you." },
  "collins-2": { id: "collins-2", book: "The Simple Path to Wealth", author: "JL Collins", chapter: 2, chapterTitle: "Why you need F-You Money", text: "A cash cushion is the freedom to leave a bad job or a bad month without panic." },
  "collins-index": { id: "collins-index", book: "The Simple Path to Wealth", author: "JL Collins", chapter: 8, chapterTitle: "Why I can't pick winning stocks and you can't either", text: "Own the whole market through a broad index fund. Picking winners is a game most people lose after costs." },
  "stanley-2": { id: "stanley-2", book: "The Millionaire Next Door", author: "Thomas Stanley & William Danko", chapter: 2, chapterTitle: "Frugal Frugal Frugal", text: "Most millionaires in the study lived below their income for a long time. Income was not the whole story." },
  "stanley-4": { id: "stanley-4", book: "The Millionaire Next Door", author: "Thomas Stanley & William Danko", chapter: 4, chapterTitle: "You Aren't What You Drive", text: "A visible purchase is a poor proxy for net worth." },
  "ramsey-6": { id: "ramsey-6", book: "The Total Money Makeover", author: "Dave Ramsey", chapter: 6, chapterTitle: "Save $1,000 Fast", text: "A small starter emergency fund comes before attacking every debt, so one surprise does not create a new card balance." },
  "ramsey-7": { id: "ramsey-7", book: "The Total Money Makeover", author: "Dave Ramsey", chapter: 7, chapterTitle: "The Debt Snowball", text: "Pay minimums on everything, then throw extra money at the smallest balance first so you finish one debt and keep going." },
  "bogle-4": { id: "bogle-4", book: "The Little Book of Common Sense Investing", author: "John C. Bogle", chapter: 4, chapterTitle: "How Most Investors Turn a Winner's Game into a Loser's Game", text: "Costs, trading, and taxes quietly take the market's return away from the person who tries to beat it." },
  "bogle-2": { id: "bogle-2", book: "The Little Book of Common Sense Investing", author: "John C. Bogle", chapter: 2, chapterTitle: "Rational Exuberance", text: "Over long periods, business earnings, not forecasts, are what you are buying." },
  "robin-2": { id: "robin-2", book: "Your Money or Your Life", author: "Vicki Robin & Joe Dominguez", chapter: 2, chapterTitle: "Being in the Present — Tracking Your Life Energy", text: "Money is life energy. The hours you traded for the paycheck are the real price of a purchase." },
  "robin-6": { id: "robin-6", book: "Your Money or Your Life", author: "Vicki Robin & Joe Dominguez", chapter: 6, chapterTitle: "The American Dream — on a Shoestring", text: "Lowering spending you do not value buys back time, which is the point of the money." },
  "perkins-2": { id: "perkins-2", book: "Die With Zero", author: "Bill Perkins", chapter: 2, chapterTitle: "Invest in Experiences", text: "Some spending is worth more at a specific age. Delaying every pleasure until retirement can waste the years it was for." },
};

function p(text: string, cites: string[]): Paragraph {
  return { text, cites };
}

export const lessons: Lesson[] = [
  {
    day: 1, week: 1, minutes: 12,
    title: "Nobody is crazy with money",
    summary: "Your habits came from a life, not from a lack of discipline.",
    paragraphs: [
      p("The first move is to stop treating your past spending as a character flaw. The way you use money was trained by what you saw: a layoff, a parent who never talked about bills, a first job that paid in cash. Two reasonable people can look at the same paycheck and do opposite things.", ["housel-1"]),
      p("That does not mean every habit is worth keeping. It means the next twenty days are about a system, not a speech. You will not shame yourself into a plan you can still follow on a tired Thursday.", ["housel-1", "housel-11"]),
    ],
    action: "Write one sentence: the money habit you copied from someone else, and whether you still want it.",
    questions: [
      "Where did your current money habits actually come from?",
      "Which habit still fits your life, and which one are you done copying?",
      "What will you write down tonight, in one sentence?",
    ],
  },
  {
    day: 2, week: 1, minutes: 12,
    title: "Luck and risk travel together",
    summary: "Judge the decision you can repeat, not the one lucky result.",
    paragraphs: [
      p("A coworker who bought one stock and won is a dangerous teacher. The same swing can be luck on the way up and risk on the way down. If you copy the story without copying the odds, you are betting your rent on someone else's anecdote.", ["housel-2"]),
      p("For a working adult, the repeatable decision is boring on purpose: save first, avoid high-interest debt, own a broad market, leave it alone. The result of one year is not the verdict.", ["housel-2", "bogle-4"]),
    ],
    action: "Name one money story you have been copying. Write whether it was a decision you could repeat, or a result you cannot.",
    questions: [
      "What money win have you been tempted to copy?",
      "Was that a repeatable decision, or a result?",
      "What boring decision will you keep instead?",
    ],
  },
  {
    day: 3, week: 1, minutes: 11,
    title: "Name your enough",
    summary: "A finish line that moves with every raise keeps you feeling broke.",
    paragraphs: [
      p("If 'enough' is always the next salary, the next apartment, the next car, you can earn more and feel poorer. Enough is a number and a life, written down while you are calm.", ["housel-3"]),
      p("This is not a vow of poverty. It is the line past which more spending does not buy more of the life you actually want. Without that line, every later lesson about saving becomes a fight.", ["housel-3", "robin-6"]),
    ],
    action: "Write a monthly 'enough' number for spending that is not rent and not debt. One number.",
    questions: [
      "What does enough look like in your actual month, not in a fantasy?",
      "Which expense grew just because your income grew?",
      "What number will you write down?",
    ],
  },
  {
    day: 4, week: 1, minutes: 12,
    title: "Getting wealthy and staying wealthy",
    summary: "Survival beats a clever bet you cannot repeat.",
    paragraphs: [
      p("Getting ahead often takes a risk: a career move, a concentrated bet, a season of long hours. Staying ahead takes the opposite skill. You need cash and humility so one bad quarter does not wipe out ten good ones.", ["housel-5"]),
      p("Room for error is not pessimism. It is how a plan survives the month the car breaks or the hours get cut. A plan with no slack is a plan that will be abandoned.", ["housel-5", "collins-2"]),
    ],
    action: "Look at your cash buffer. Write how many weeks of must-pay bills it covers today.",
    questions: [
      "How many weeks of must-pay bills could you cover in cash right now?",
      "What single surprise would break the plan you have today?",
      "What will you write down as your current buffer?",
    ],
  },
  {
    day: 5, week: 1, minutes: 12,
    title: "The highest return is saving",
    summary: "For most paychecks, the savings rate beats the clever investment.",
    paragraphs: [
      p("Investment returns get the attention. For someone still building the first pile, the amount you keep matters more than the fund you pick. You control the savings rate on Friday. You do not control next year's market.", ["housel-10"]),
      p("You also do not need a perfect reason. 'I might want options later' is a complete reason to move money before you spend it. Waiting for a named goal is how the money never leaves the checking account.", ["housel-10", "sethi-5"]),
    ],
    action: "Pick a percent of the next paycheck to move the day it lands. Write the percent.",
    questions: [
      "What percent of the next paycheck can leave before you spend anything?",
      "What excuse have you been using to wait?",
      "What percent will you commit to?",
    ],
  },
  {
    day: 6, week: 1, minutes: 12,
    title: "Time, not timing",
    summary: "Costs and guessing quietly eat the market's return.",
    paragraphs: [
      p("A broad stock market has been a winner's game for patient owners and a loser's game for people who trade, pay high fees, and guess the top. The return you keep is the market's return minus costs, taxes, and your own fidgeting.", ["bogle-4", "collins-index"]),
      p("You do not need a forecast to start. You need a simple default you will not abandon the week the news is loud. We will name the accounts in week three. Today the point is only this: time in the market is the strategy.", ["bogle-2", "housel-16"]),
    ],
    action: "Write the one rule you will follow when markets drop: hold, or sell. Decide it now.",
    questions: [
      "What do you usually do when the news says the market is in trouble?",
      "Why is guessing the top expensive even when you are sometimes right?",
      "What rule will you write down for the next drop?",
    ],
  },
  {
    day: 7, week: 2, minutes: 12,
    title: "Pay yourself first: automate before you spend",
    summary: "The paycheck should split itself before you touch it.",
    paragraphs: [
      p("Willpower at the register is a weak system. The stronger one runs on payday. The moment the paycheck lands, a slice leaves for savings and a slice covers the bills you already know. What remains is what you may spend. If you wait until the end of the month to 'see what's left,' what is left is usually nothing.", ["sethi-5"]),
      p("Saving does not require a perfect motive. Building the transfer is the point. A reasonable automatic amount you keep beats a heroic amount you set up once and cancel.", ["housel-10", "housel-11"]),
      p("People who look ordinary and end up with money tend to live on less than they earn for a long time. The transfer is how that happens without a monthly argument.", ["stanley-2"]),
    ],
    action: "Schedule one automatic transfer on your next payday. Name the amount and the destination.",
    questions: [
      "Your paycheck lands on Friday. What should happen before you spend anything?",
      "What amount can move automatically without making rent late?",
      "Where will that money go, and when will you turn the transfer on?",
    ],
  },
  {
    day: 8, week: 2, minutes: 11,
    title: "Emergency fund: how big, and where to keep it",
    summary: "Cash you can reach is what keeps a surprise from becoming debt.",
    paragraphs: [
      p("Start smaller than the internet argues about. A starter pile, about a thousand dollars, exists so a broken tire does not become a credit-card balance. Then you attack high-interest debt. Then you build a fuller cushion, often three to six months of must-pay bills.", ["ramsey-6", "collins-2"]),
      p("Keep it boring and separate from spending money. A savings account you can transfer in a day is the point. An investment you might have to sell at a bad time is not an emergency fund.", ["collins-2", "housel-5"]),
    ],
    action: "Open or name the account that holds your starter fund, and set the target in dollars.",
    questions: [
      "What surprise in the last year turned into debt?",
      "How big is the starter pile you will build before you get fancy?",
      "Which account will hold it?",
    ],
  },
  {
    day: 9, week: 2, minutes: 13,
    title: "Killing debt: snowball vs. avalanche",
    summary: "The math and the habit disagree. Pick the one you will finish.",
    paragraphs: [
      p("High-interest debt grows while you sleep. Every month you carry a card balance, you are paying for the privilege of having spent yesterday's money. That part is not controversial.", ["collins-1"]),
      p("The order of attack is where the books split. One method pays the smallest balance first so you finish a debt and feel the win. The other pays the highest interest first so you waste less money. Both require the same engine: minimums on everything, and every extra dollar at one balance until it is gone.", ["ramsey-7", "collins-1"]),
    ],
    disagreement: {
      a: { author: "Dave Ramsey", text: "Attack the smallest balance first. The quick win keeps you in the fight.", cite: "ramsey-7" },
      b: { author: "JL Collins", text: "High-interest debt is the emergency. Attack the expensive balance first.", cite: "collins-1" },
      tie: "Housel's tie-breaker: a reasonable plan you finish beats a rational plan you quit. If you already abandon budgets, take the smallest balance. If you will follow a spreadsheet, take the highest rate.",
    },
    action: "List your debts with balance and interest rate. Circle the one you will hit first, and say which method you chose.",
    questions: [
      "Which debt is the most expensive, and which is the smallest?",
      "Which order will you actually stick with for six months?",
      "What extra amount, above the minimums, goes at that one debt this month?",
    ],
  },
  {
    day: 10, week: 2, minutes: 10,
    title: "Credit scores without the myths",
    summary: "The score follows the habit of paying the full statement.",
    paragraphs: [
      p("A credit card is not a raise. If you pay the statement in full, you keep the convenience and you do not pay interest. If you carry a balance, the card is a high-interest loan with a friendly app.", ["sethi-1"]),
      p("The useful habits are dull: pay on time, pay in full, and do not open cards so you can spend more. Chasing a score with tricks while carrying a balance is the myth.", ["sethi-1", "collins-1"]),
    ],
    action: "Turn on autopay for the full statement balance, or write the date you will pay it by hand every month.",
    questions: [
      "Do you pay the statement in full today, or only the minimum?",
      "What changes if the full balance leaves on its own?",
      "When will autopay be on?",
    ],
  },
  {
    day: 11, week: 2, minutes: 12,
    title: "A budget that runs itself",
    summary: "Spend freely on a few loves. Cut the rest without a speech.",
    paragraphs: [
      p("A budget that bans every pleasure lasts until Friday. The version that lasts names a few things you will spend on without guilt, and cuts the subscriptions and habits you do not even like. Guilt is a bad accountant.", ["sethi-4"]),
      p("Track it once in hours, not only in dollars. A purchase costs the life energy you traded for the paycheck. Some purchases are worth the hours. Many are not, and you only see that when you look.", ["robin-2", "robin-6"]),
    ],
    action: "Name two spends you will protect and two you will cancel or cap this week.",
    questions: [
      "What do you love spending on, even if it looks impractical?",
      "What do you pay for and barely notice?",
      "Which two will you cut this week?",
    ],
  },
  {
    day: 12, week: 2, minutes: 12,
    title: "Negotiating salary and recurring bills",
    summary: "A higher income you keep is worth more than a coupon.",
    paragraphs: [
      p("Cutting lattes is visible and small. A raise, a retained client, or a bill you actually call about can move the month more. People who build wealth tend to care about the gap between income and spending, not about looking rich.", ["stanley-2", "stanley-4"]),
      p("Ask with a number and a record of what you did. Then, the day the extra money arrives, send it through the same payday split. A raise that disappears into lifestyle was not a raise.", ["sethi-5", "housel-3"]),
    ],
    action: "Pick one: a raise conversation, or one recurring bill to call about. Write the date.",
    questions: [
      "Which number in your month is big enough to be worth an awkward conversation?",
      "If more money arrives, what stops it from vanishing?",
      "What will you schedule, and for when?",
    ],
  },
  {
    day: 13, week: 2, minutes: 8,
    title: "Week 2 review: talk it through",
    summary: "Say the system out loud before you add investing.",
    paragraphs: [
      p("You now have the unglamorous core: payday split, a starter cash pile, one debt to attack, cards paid in full, and a few spends you chose on purpose. If one of those is still a wish, that is the work. Investing on top of a leaking month does not fix the leak.", ["sethi-5", "ramsey-6", "collins-1"]),
    ],
    action: "Say your system in four beats: payday transfer, cash pile, debt target, card rule.",
    questions: [
      "Walk me through what happens on payday, in order.",
      "Which piece is still not real: the transfer, the cash, the debt, or the card?",
      "What is the single action you will finish before next week?",
    ],
  },
  {
    day: 14, week: 3, minutes: 12,
    title: "Index funds in plain English",
    summary: "Own the market. Skip the contest.",
    paragraphs: [
      p("A broad index fund is a way to own a slice of many businesses at once, at a low cost. You will not beat the cleverest trader in a single year. Over a working life, low cost and staying invested is the edge most people can actually keep.", ["bogle-4", "collins-index"]),
      p("The point of the fund is not excitement. Excitement is expensive. You already decided, on day 6, what you will do when the news is loud.", ["bogle-2", "housel-16"]),
    ],
    action: "Write the kind of fund you will use as the default: a broad stock index. Name it if you already have one.",
    questions: [
      "In one sentence, what does an index fund own?",
      "What cost are you avoiding by not trading?",
      "What is your default fund, even if you have not opened it yet?",
    ],
  },
  {
    day: 15, week: 3, minutes: 12,
    title: "401(k), IRA, Roth: what to open first",
    summary: "Take the match. Then keep the rest simple.",
    paragraphs: [
      p("If your job offers a match, that match is pay you lose by waiting. Contribute at least enough to get all of it before you hunt for a clever account. Then use a tax-advantaged account you understand, and put the broad fund inside it.", ["sethi-3", "collins-index"]),
      p("The account type is a container. The behavior is the same payday transfer from week two, aimed at the container. Do not pause the transfer while you research the perfect fund for a month.", ["sethi-5", "bogle-4"]),
    ],
    action: "Check whether your job matches contributions. If it does, write the percent that captures the full match.",
    questions: [
      "Does your job match, and are you taking all of it?",
      "What percent captures the full match?",
      "When will you set that percent, if it is not set?",
    ],
  },
  {
    day: 16, week: 3, minutes: 11,
    title: "How much risk can you sleep with?",
    summary: "Your timeline decides the mix, not a stranger's.",
    paragraphs: [
      p("A portfolio is a promise about when you need the money. Someone retiring next year and someone with thirty years of paychecks should not hold the same mix. Copying a loud opinion without sharing their timeline is how people sell at the bottom.", ["housel-16", "housel-5"]),
      p("If a drop of a third would make you sell, you own too much stock for your nerves, even if a chart says you are young. Reasonable beats optimal.", ["housel-11", "bogle-4"]),
    ],
    action: "Write your real timeline: when you might need this money. Then write whether a 30% drop would make you sell.",
    questions: [
      "When do you actually need this money?",
      "Would a 30% drop make you sell?",
      "What mix lets you sleep and stay invested?",
    ],
  },
  {
    day: 17, week: 3, minutes: 11,
    title: "Wealth is what you don't see",
    summary: "The visible purchase is not the balance sheet.",
    paragraphs: [
      p("Wealth is the money you did not spend. The car, the watch, and the trip you posted are the money that left. People who look rich and people who are rich are often different households.", ["housel-9", "stanley-4"]),
      p("This is a useful test before a big buy: if I did not tell anyone, would I still want it? If the answer is only yes because someone will see it, the purchase is a costume.", ["housel-9", "stanley-2"]),
    ],
    action: "Pick one upcoming purchase over $100. Apply the test: would you still want it if nobody knew?",
    questions: [
      "What recent purchase was partly for other people to see?",
      "What money did you keep that nobody can see?",
      "Which upcoming buy fails the test?",
    ],
  },
  {
    day: 18, week: 3, minutes: 12,
    title: "Spend on memories, not just margins",
    summary: "Some money is for a specific season of your life.",
    paragraphs: [
      p("Saving for a future you is wise. Refusing every experience until you are old can waste the years that experience was for. A hike with your kids at eight is not the same purchase as the same trip at sixty-eight.", ["perkins-2"]),
      p("The guardrail is the system you already built. You do not raid rent, the debt payment, or the match for a memory. You spend on purpose from the money that was allowed to be spent.", ["perkins-2", "sethi-4", "sethi-5"]),
    ],
    action: "Name one experience worth paying for in the next year, and the spending category it comes from.",
    questions: [
      "What experience is worth more now than later?",
      "Which part of the system is not allowed to pay for it?",
      "What will you name, and what pays for it?",
    ],
  },
  {
    day: 19, week: 3, minutes: 12,
    title: "Freedom as the real return",
    summary: "The point of the pile is control of your time.",
    paragraphs: [
      p("The best thing money buys, once you are past panic, is the ability to choose your time: leave a bad room, take a walk, be home. A larger number with no control is a bigger treadmill.", ["housel-7"]),
      p("Every dollar you lower in spending you do not value buys hours back. That is the same idea as the cushion: options. The crossover is not a yacht. It is the month your must-pay bills are covered by what you already saved.", ["robin-6", "collins-2"]),
    ],
    action: "Write what you want the money to buy you in time, not in objects. One sentence.",
    questions: [
      "What would you do with a Tuesday if money were not the reason you couldn't?",
      "Which bill, once covered, would change that Tuesday?",
      "What sentence will you keep as the point of the plan?",
    ],
  },
  {
    day: 20, week: 3, minutes: 12,
    title: "Your one-page money plan",
    summary: "One page you can follow without rereading eight books.",
    paragraphs: [
      p("The page has six lines. Payday split. Starter cash target. The one debt you are attacking, and the method. Cards paid in full. The percent that captures the match, in a broad fund. The sentence about what the money is for.", ["sethi-5", "ramsey-7", "sethi-3", "housel-7"]),
      p("If a line is blank, that is tomorrow's work, not a reason to add a ninth book. A short plan you use beats a complete plan you admire.", ["housel-11"]),
    ],
    action: "Fill the six lines. Leave a blank where you do not know yet, and circle it.",
    questions: [
      "Read me your six lines, including the blanks.",
      "Which blank matters most in the next thirty days?",
      "What will you do this week to fill it?",
    ],
  },
  {
    day: 21, week: 3, minutes: 10,
    title: "Final recap",
    summary: "The course was a system, not a stack of opinions.",
    paragraphs: [
      p("You do not need to remember eight authors. You need the order. See your habits without shame. Save before you spend. Keep cash for surprises. Kill one debt on purpose. Pay cards in full. Own the market simply, after the match. Spend on a few things you chose, including a life that happens before you are old.", ["housel-1", "sethi-5", "ramsey-6", "bogle-4", "perkins-2"]),
      p("Next month is the same page, followed again. That repetition is the product. Another summary is not.", ["housel-11"]),
    ],
    action: "Put the one-page plan where you will see it on the next payday.",
    questions: [
      "Say the order without looking, as far as you can.",
      "Which step is still fragile?",
      "Where will the one-page plan live so payday sees it?",
    ],
  },
];

export const topics = [
  { id: "fin", label: "Personal finance", ready: true },
  { id: "inv", label: "Investing basics", ready: false },
  { id: "neg", label: "Negotiation", ready: false },
  { id: "hab", label: "Habits", ready: false },
  { id: "pro", label: "Productivity", ready: false },
  { id: "lead", label: "First-time manager", ready: false },
  { id: "com", label: "Hard conversations", ready: false },
  { id: "slp", label: "Better sleep", ready: false },
];

export function lessonByDay(day: number) {
  return lessons.find((lesson) => lesson.day === day);
}

export function ideaById(id: string) {
  return ideas[id];
}

export function citesForLesson(lesson: Lesson) {
  const ids = new Set(lesson.paragraphs.flatMap((paragraph) => paragraph.cites));
  if (lesson.disagreement) {
    ids.add(lesson.disagreement.a.cite);
    ids.add(lesson.disagreement.b.cite);
  }
  return [...ids].map((id) => ideas[id]).filter(Boolean);
}
