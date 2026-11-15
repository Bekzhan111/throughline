export type CheckItem = {
  prompt: string;
  choices: string[];
  answer: number;
  idea: string;
};

export const checks: Record<number, CheckItem[]> = {
  1: [
    {
      prompt: "Where do most money habits come from?",
      choices: ["The world you grew up in", "A missing spreadsheet", "A low credit score"],
      answer: 0,
      idea: "housel-1",
    },
    {
      prompt: "What beats a perfect plan you abandon?",
      choices: ["A plan you can still follow on a bad month", "A higher salary", "A louder goal"],
      answer: 0,
      idea: "housel-11",
    },
    {
      prompt: "How should you treat a past spending habit?",
      choices: ["As a trained habit, not a character flaw", "As proof you cannot change", "As a reason to skip a plan"],
      answer: 0,
      idea: "housel-1",
    },
  ],
  2: [
    {
      prompt: "What should you judge when someone got rich on one bet?",
      choices: ["Whether the decision is repeatable", "Only the result", "How confident they sound"],
      answer: 0,
      idea: "housel-2",
    },
    {
      prompt: "What quietly takes the market's return away?",
      choices: ["Costs, trading, and taxes", "Owning a broad fund", "Waiting a year"],
      answer: 0,
      idea: "bogle-4",
    },
    {
      prompt: "A coworker's winning stock story is a dangerous teacher because…",
      choices: ["The same swing can be luck or risk", "Stocks are always a bad idea", "Paychecks are luck"],
      answer: 0,
      idea: "housel-2",
    },
  ],
  3: [
    {
      prompt: "What keeps people with money feeling broke?",
      choices: ["Moving the finish line with every raise", "Writing a number down", "Paying rent"],
      answer: 0,
      idea: "housel-3",
    },
    {
      prompt: "What is 'enough' in this lesson?",
      choices: ["A number and a life, written while you are calm", "The next apartment", "Whatever a friend spends"],
      answer: 0,
      idea: "housel-3",
    },
    {
      prompt: "Lowering spending you do not value mainly buys…",
      choices: ["Time back", "A higher credit score", "A reason to never spend"],
      answer: 0,
      idea: "robin-6",
    },
  ],
  4: [
    {
      prompt: "Getting money and keeping money reward different things. Keeping it rewards…",
      choices: ["Survival and room for error", "A bigger bet", "A louder forecast"],
      answer: 0,
      idea: "housel-5",
    },
    {
      prompt: "What is a cash cushion for?",
      choices: ["Leaving a bad month or a bad job without panic", "Beating the market this year", "Replacing an index fund"],
      answer: 0,
      idea: "collins-2",
    },
    {
      prompt: "A plan with no slack is a plan that…",
      choices: ["Gets abandoned at the first surprise", "Compounds faster", "Needs no review"],
      answer: 0,
      idea: "housel-5",
    },
  ],
  5: [
    {
      prompt: "For most people still building the first pile, what matters more than the fund they pick?",
      choices: ["The savings rate they control", "Next year's market", "A named goal before any transfer"],
      answer: 0,
      idea: "housel-10",
    },
    {
      prompt: "When should money move to savings?",
      choices: ["The day the paycheck lands", "After you see what is left", "Once a year"],
      answer: 0,
      idea: "sethi-5",
    },
    {
      prompt: "Do you need a specific reason to save?",
      choices: ["No. Options later is a complete reason", "Yes, or the transfer does not count", "Only if the market is down"],
      answer: 0,
      idea: "housel-10",
    },
  ],
  6: [
    {
      prompt: "Who keeps more of the market's return?",
      choices: ["A patient owner who pays low costs", "Someone who guesses the top", "Someone who trades every headline"],
      answer: 0,
      idea: "bogle-4",
    },
    {
      prompt: "What is the default way to own the market in this course?",
      choices: ["A broad index fund", "A single stock that already won", "A forecast of next quarter"],
      answer: 0,
      idea: "collins-index",
    },
    {
      prompt: "Over long periods, what are you actually buying?",
      choices: ["Business earnings, not a forecast", "Tomorrow's headline", "Someone else's timeline"],
      answer: 0,
      idea: "bogle-2",
    },
  ],
  7: [
    {
      prompt: "What should happen the moment a paycheck lands?",
      choices: ["A slice already leaves for savings and known bills", "You wait to see what is left", "You decide at the register"],
      answer: 0,
      idea: "sethi-5",
    },
    {
      prompt: "Which transfer is the stronger system?",
      choices: ["A reasonable amount that runs automatically", "A heroic amount you cancel", "Whatever willpower is left on Friday"],
      answer: 0,
      idea: "housel-11",
    },
    {
      prompt: "People who end up with money and look ordinary tend to…",
      choices: ["Live on less than they earn for a long time", "Look rich first", "Wait for a perfect motive"],
      answer: 0,
      idea: "stanley-2",
    },
  ],
  8: [
    {
      prompt: "What is the starter emergency fund for?",
      choices: ["Stopping one surprise from becoming a new card balance", "Replacing retirement savings", "Buying the dip"],
      answer: 0,
      idea: "ramsey-6",
    },
    {
      prompt: "Where should that cash live?",
      choices: ["A separate savings account you can reach in a day", "A stock you might have to sell at a bad time", "The checking account you spend from"],
      answer: 0,
      idea: "collins-2",
    },
    {
      prompt: "After the starter pile, the fuller cushion is often…",
      choices: ["A few months of must-pay bills", "One year of wants", "Whatever is left in checking"],
      answer: 0,
      idea: "collins-2",
    },
  ],
  9: [
    {
      prompt: "Why is high-interest debt an emergency?",
      choices: ["It compounds against you", "It lowers your savings rate on paper only", "It is illegal to pay slowly"],
      answer: 0,
      idea: "collins-1",
    },
    {
      prompt: "What do the snowball and the avalanche share?",
      choices: ["Minimums on everything, extra money at one balance", "Paying only the card you like", "Waiting until you feel ready"],
      answer: 0,
      idea: "ramsey-7",
    },
    {
      prompt: "When should you pick the smallest balance first?",
      choices: ["When a quick win is what keeps you from quitting", "When you want the mathematically slower path for its own sake", "When the rate is already zero"],
      answer: 0,
      idea: "ramsey-7",
    },
  ],
  10: [
    {
      prompt: "A credit card stays a tool, not a loan, when you…",
      choices: ["Pay the statement in full", "Pay the minimum and chase the score", "Open cards so you can spend more"],
      answer: 0,
      idea: "sethi-1",
    },
    {
      prompt: "What follows the habit of paying on time and in full?",
      choices: ["The score", "A reason to carry a balance", "A higher interest rate"],
      answer: 0,
      idea: "sethi-1",
    },
    {
      prompt: "Carrying a balance means the card is…",
      choices: ["A high-interest loan", "A raise", "An emergency fund"],
      answer: 0,
      idea: "sethi-1",
    },
  ],
  11: [
    {
      prompt: "Which budget lasts?",
      choices: ["Spend freely on a few loves and cut what you do not value", "Ban every pleasure", "Track nothing and hope"],
      answer: 0,
      idea: "sethi-4",
    },
    {
      prompt: "In this lesson, the real price of a purchase is…",
      choices: ["The hours of life energy you traded", "Only the sticker", "What a friend would think"],
      answer: 0,
      idea: "robin-2",
    },
    {
      prompt: "Guilt is a bad accountant because…",
      choices: ["A plan built on shame gets dropped", "Spending you love is always waste", "Bills should be ignored"],
      answer: 0,
      idea: "sethi-4",
    },
  ],
  12: [
    {
      prompt: "What usually moves a month more than a small daily cut?",
      choices: ["A raise or a recurring bill you actually deal with", "Looking richer", "A new budget app"],
      answer: 0,
      idea: "stanley-2",
    },
    {
      prompt: "A visible purchase is a poor proxy for…",
      choices: ["Net worth", "Income this week", "The interest rate on a card"],
      answer: 0,
      idea: "stanley-4",
    },
    {
      prompt: "A raise that disappears into lifestyle…",
      choices: ["Was not a raise you kept", "Is the point of earning more", "Replaces the payday split"],
      answer: 0,
      idea: "housel-3",
    },
  ],
  13: [
    {
      prompt: "What is the unglamorous core, in order?",
      choices: ["Payday split, cash pile, one debt, cards paid in full", "Pick stocks, then budget", "Invest first, plug leaks later"],
      answer: 0,
      idea: "sethi-5",
    },
    {
      prompt: "Investing on top of a leaking month…",
      choices: ["Does not fix the leak", "Is the fastest way to a cushion", "Replaces the starter fund"],
      answer: 0,
      idea: "collins-1",
    },
    {
      prompt: "The starter cash pile exists so that…",
      choices: ["One surprise does not create a new card balance", "You can skip the payday transfer", "You can time the market"],
      answer: 0,
      idea: "ramsey-6",
    },
  ],
  14: [
    {
      prompt: "What does a broad index fund own?",
      choices: ["A slice of many businesses, at a low cost", "One company you researched", "A forecast"],
      answer: 0,
      idea: "collins-index",
    },
    {
      prompt: "The edge most people can keep is…",
      choices: ["Low cost and staying invested", "Beating the cleverest trader every year", "Trading the loud weeks"],
      answer: 0,
      idea: "bogle-4",
    },
    {
      prompt: "Copying someone else's investment fails when…",
      choices: ["You do not share their timeline", "The fund is broad", "You hold through a loud week"],
      answer: 0,
      idea: "housel-16",
    },
  ],
  15: [
    {
      prompt: "What should you capture at work before you get clever?",
      choices: ["The full match", "A single stock tip", "A new credit card"],
      answer: 0,
      idea: "sethi-3",
    },
    {
      prompt: "The account type is…",
      choices: ["A container. The behavior is still the payday transfer", "A reason to pause saving for a month of research", "More important than the match"],
      answer: 0,
      idea: "sethi-5",
    },
    {
      prompt: "What goes inside the container?",
      choices: ["A broad fund you understand", "Whatever beat the market last month", "The emergency cash"],
      answer: 0,
      idea: "collins-index",
    },
  ],
  16: [
    {
      prompt: "What should decide your mix?",
      choices: ["When you need the money", "A stranger's timeline", "Last month's winner"],
      answer: 0,
      idea: "housel-16",
    },
    {
      prompt: "If a drop of about a third would make you sell, you…",
      choices: ["Own too much stock for your nerves", "Should buy more immediately", "Have the optimal mix by definition"],
      answer: 0,
      idea: "housel-11",
    },
    {
      prompt: "Room for error in the mix is…",
      choices: ["How the plan survives a bad stretch", "Pessimism you should ignore", "A reason to trade weekly"],
      answer: 0,
      idea: "housel-5",
    },
  ],
  17: [
    {
      prompt: "Wealth, in this lesson, is…",
      choices: ["Income you did not spend", "The car and the watch", "What you posted"],
      answer: 0,
      idea: "housel-9",
    },
    {
      prompt: "A useful test before a big buy is…",
      choices: ["Would I still want it if nobody knew?", "Will anyone see it?", "Does it look like a net-worth statement?"],
      answer: 0,
      idea: "housel-9",
    },
    {
      prompt: "What you drive is a poor stand-in for…",
      choices: ["What you are worth", "What you enjoy", "What the car cost"],
      answer: 0,
      idea: "stanley-4",
    },
  ],
  18: [
    {
      prompt: "Why spend on some experiences before you are old?",
      choices: ["Some experiences are worth more at a specific age", "Saving is a mistake", "Rent can wait"],
      answer: 0,
      idea: "perkins-2",
    },
    {
      prompt: "What is not allowed to pay for that memory?",
      choices: ["Rent, the debt payment, or the match", "The spending you already chose on purpose", "Money that was allowed to be spent"],
      answer: 0,
      idea: "sethi-5",
    },
    {
      prompt: "The guardrail is…",
      choices: ["The system you already built", "Skipping every pleasure", "A new book"],
      answer: 0,
      idea: "perkins-2",
    },
  ],
  19: [
    {
      prompt: "The highest dividend of money, once you are past panic, is…",
      choices: ["Control over your time", "A larger treadmill", "More objects"],
      answer: 0,
      idea: "housel-7",
    },
    {
      prompt: "Spending you do not value, once cut, buys…",
      choices: ["Hours back", "A higher score by itself", "A reason to skip cash"],
      answer: 0,
      idea: "robin-6",
    },
    {
      prompt: "The crossover in this lesson is…",
      choices: ["The month must-pay bills are covered by what you already saved", "A yacht", "The next raise"],
      answer: 0,
      idea: "collins-2",
    },
  ],
  20: [
    {
      prompt: "How many lines are on the one-page plan?",
      choices: ["Six", "A new book for each blank", "Only the fund ticker"],
      answer: 0,
      idea: "sethi-5",
    },
    {
      prompt: "A short plan you use beats…",
      choices: ["A complete plan you only admire", "The payday transfer", "Writing anything down"],
      answer: 0,
      idea: "housel-11",
    },
    {
      prompt: "A blank line means…",
      choices: ["That is the next piece of work, not a reason to add another book", "The plan has failed", "Skip that part forever"],
      answer: 0,
      idea: "housel-11",
    },
  ],
  21: [
    {
      prompt: "What do you need to remember from the eight books?",
      choices: ["The order of the system", "Every author's wording", "A new summary next month"],
      answer: 0,
      idea: "housel-1",
    },
    {
      prompt: "Where does owning the market sit in the order?",
      choices: ["After the match, and after the leaks are plugged", "Before any cash or debt work", "Instead of paying cards in full"],
      answer: 0,
      idea: "bogle-4",
    },
    {
      prompt: "Next month the product is…",
      choices: ["The same page, followed again", "Another stack of books", "A louder goal"],
      answer: 0,
      idea: "housel-11",
    },
  ],
};
