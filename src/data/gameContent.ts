export const WOULD_YOU_RATHER: [string, string][] = [
  ['Travel the world together for a year', 'Build our dream home together'],
  ['Never argue again', 'Always laugh until we cry'],
  ['A cozy night in', 'A spontaneous night out'],
  ['Relive our first date', 'Fast-forward to our 50th anniversary'],
  ['Have breakfast together every day', 'Have dinner together every day'],
  ['Get a surprise trip', 'Get a surprise handwritten letter'],
  ['Live by the sea', 'Live in the mountains'],
  ['Read each other’s minds for a day', 'Swap lives for a day'],
  ['Dance in the kitchen every night', 'Watch the sunrise every Sunday'],
  ['Have a movie night every week', 'Have a game night every week'],
  ['Cook together every day', 'Order in and never wash up'],
  ['Be stuck in an elevator together', 'Be stranded on an island together'],
  ['A tiny wedding with just us', 'A huge celebration with everyone'],
  ['Always know what the other is thinking', 'Always be surprised by each other'],
  ['Cuddle for an hour every day', 'Go on one big adventure every month'],
  ['Have a pet dog together', 'Have a pet cat together'],
  ['Only text each other in memes for a week', 'Only speak in song lyrics for a day'],
  ['Win a free holiday', 'Win a free home makeover'],
  ['Spend a rainy day in bed', 'Spend a sunny day outdoors'],
  ['Have a private chef', 'Have a private chauffeur'],
]

export const THIS_OR_THAT: [string, string][] = [
  ['Tea', 'Coffee'], ['Sunrise', 'Sunset'], ['Mountains', 'Beach'], ['Movies', 'Series'], ['Cook in', 'Eat out'],
  ['Sweet', 'Salty'], ['Early bird', 'Night owl'], ['Hugs', 'Kisses'], ['Plan it', 'Wing it'], ['Rain', 'Sunshine'],
  ['Texting', 'Calling'], ['City break', 'Countryside'], ['Dancing', 'Singing'], ['Pizza', 'Pasta'], ['Books', 'Podcasts'],
  ['Summer', 'Winter'], ['Road trip', 'Flight'], ['Cuddle on the sofa', 'Walk outside'], ['Surprise gift', 'Handmade gift'], ['Chocolate', 'Ice cream'],
  ['Photos', 'Videos'], ['Spicy', 'Mild'], ['Candlelight', 'Fairy lights'], ['Stay up late talking', 'Sleep in together'], ['Old songs', 'New songs'],
]

export interface McQ { q: string; options: string[] }
export const WHO_KNOWS: McQ[] = [
  { q: 'My ideal Sunday morning is…', options: ['Sleeping in', 'A long breakfast', 'A workout or walk', 'Doing absolutely nothing'] },
  { q: 'My comfort food is…', options: ['Something spicy', 'Something sweet', 'Pasta or pizza', 'Home-cooked classics'] },
  { q: 'When I’m stressed, I mostly…', options: ['Go quiet', 'Talk it out', 'Clean or organise', 'Eat or nap'] },
  { q: 'My dream holiday is…', options: ['Beach and nothing else', 'Mountains and views', 'A big city', 'A road trip'] },
  { q: 'My love language is mostly…', options: ['Words of affirmation', 'Quality time', 'Physical touch', 'Gifts or acts of service'] },
  { q: 'I’d most like to learn…', options: ['A musical instrument', 'A new language', 'To cook like a chef', 'To dance'] },
  { q: 'My biggest pet peeve is…', options: ['Being late', 'Loud chewing', 'Messy spaces', 'Being interrupted'] },
  { q: 'The movie genre I’d pick tonight…', options: ['Romcom', 'Thriller', 'Comedy', 'Something animated'] },
  { q: 'I’m happiest when…', options: ['I’m with you', 'I’m travelling', 'I’ve finished something big', 'I’m at home in comfy clothes'] },
  { q: 'My go-to karaoke style is…', options: ['Belt it out', 'Duet with you', 'Absolutely not', 'Sad ballads'] },
  { q: 'If I won the lottery, I’d first…', options: ['Buy a home', 'Travel everywhere', 'Help family', 'Save it all'] },
  { q: 'On a first date, I was most…', options: ['Nervous', 'Excited', 'Calm', 'Trying very hard to be cool'] },
]

export interface Trivia { q: string; options: string[]; answer: number }
export const TRIVIA: Trivia[] = [
  { q: 'Which flower is the classic symbol of romantic love?', options: ['Lily', 'Red rose', 'Sunflower', 'Tulip'], answer: 1 },
  { q: 'In which city is the famous “Love Lock” bridge, Pont des Arts?', options: ['Rome', 'Prague', 'Paris', 'Vienna'], answer: 2 },
  { q: 'The Taj Mahal was built in memory of…', options: ['A queen', 'A poet', 'A general', 'A princess’s pet'], answer: 0 },
  { q: 'What’s the most popular day for proposals?', options: ['Valentine’s Day', 'Christmas Eve', 'New Year’s Day', 'Midsummer'], answer: 1 },
  { q: 'Which planet is named after the Roman goddess of love?', options: ['Mars', 'Venus', 'Neptune', 'Mercury'], answer: 1 },
  { q: 'Romeo and Juliet is set in which Italian city?', options: ['Florence', 'Venice', 'Verona', 'Milan'], answer: 2 },
  { q: 'Which gemstone traditionally marks a 40th anniversary?', options: ['Ruby', 'Emerald', 'Sapphire', 'Pearl'], answer: 0 },
  { q: 'What is the gift for a 1st wedding anniversary?', options: ['Paper', 'Cotton', 'Silver', 'Wood'], answer: 0 },
  { q: 'Which hormone is nicknamed the “cuddle hormone”?', options: ['Cortisol', 'Oxytocin', 'Adrenaline', 'Insulin'], answer: 1 },
  { q: 'Which famous Bollywood film has the line “Palat!”?', options: ['Kabhi Khushi Kabhie Gham', 'Dilwale Dulhania Le Jayenge', 'Kal Ho Naa Ho', 'Veer-Zaara'], answer: 1 },
  { q: 'The word “amour” is French for…', options: ['Friend', 'Love', 'Home', 'Moon'], answer: 1 },
  { q: 'Which of these is said to be an aphrodisiac food?', options: ['Dark chocolate', 'Plain rice', 'Cabbage', 'Toast'], answer: 0 },
]

export const GUESS_PROMPTS = [
  'My favourite movie of all time', 'The first song I’d put on a road-trip playlist', 'What I’m craving right now', 'My most-used emoji',
  'A place I’d love to visit with you', 'The thing I’d buy with an unexpected ₹5000', 'My favourite thing about our relationship', 'The last thing I Googled',
  'What I wanted to be when I was ten', 'My guilty-pleasure show', 'The best meal I’ve ever had', 'A small thing that always makes me smile',
  'My favourite memory of us this year', 'What I’d order at my last meal', 'A word that describes you perfectly',
]

export const TRUTHS = [
  'What was your first impression of me?', 'What’s something you’ve always wanted to tell me but haven’t?', 'What’s your favourite memory of us?',
  'What’s the most embarrassing thing you’ve done to impress me?', 'When did you know you liked me?', 'What’s one thing I do that makes you melt?',
  'What’s a small habit of mine you secretly love?', 'What’s something you’re nervous about for our future?', 'If we could relive one day, which would it be?',
  'What’s the silliest thing we’ve argued about?', 'What song makes you think of me?', 'What’s one dream you haven’t told me about?',
  'What’s your favourite thing about my family or friends?', 'What do you think we’ll be doing in 10 years?', 'What’s the most romantic thing I’ve ever done for you?',
]
export const DARES = [
  'Give your partner a 60-second shoulder massage.', 'Say three things you love about them in a silly accent.', 'Slow dance with no music for 30 seconds.',
  'Write “I love you” on their hand using your finger.', 'Do your best impression of them.', 'Let them draw a tiny doodle on your arm.',
  'Send them a voice note singing their favourite song.', 'Recreate your first kiss… dramatically.', 'Compliment them without using the word “beautiful” or “handsome”.',
  'Feed them the next snack with your eyes closed.', 'Make up a 4-line poem about them, right now.', 'Take a goofy selfie together and keep it forever.',
  'Whisper something sweet in their ear.', 'Do 10 jumping jacks while saying why you love them.', 'Plan the next date out loud in 30 seconds.',
]

export const NEVER_HAVE_I_EVER = [
  'Never have I ever stayed up all night talking to you.', 'Never have I ever re-read our old messages.', 'Never have I ever pretended to like a song because you did.',
  'Never have I ever cried at a romantic movie.', 'Never have I ever got lost on purpose to spend more time with you.', 'Never have I ever stalked your old photos.',
  'Never have I ever fallen asleep on a call with you.', 'Never have I ever practised what to say before texting you.', 'Never have I ever kept something just because it reminded me of you.',
  'Never have I ever laughed so hard I couldn’t breathe with you.', 'Never have I ever pretended to be busy to see if you’d text first.', 'Never have I ever sung to you when you weren’t listening.',
  'Never have I ever forgotten something important because I was thinking of you.', 'Never have I ever told a friend “I think they’re the one”.',
]

export const FINISH_SENTENCE = [
  'My favourite thing about us is…', 'You always make me laugh when you…', 'The first time I saw you, I thought…', 'If I could take you anywhere right now, I’d take you to…',
  'I feel most loved when you…', 'One thing I never want to change about us is…', 'In ten years, I hope we’re…', 'My happiest memory with you is…',
  'You have no idea how much I love it when you…', 'The thing I admire most about you is…', 'When we’re 80, I’ll still remember…', 'Our song should be…',
]

export interface GameMeta { id: string; title: string; blurb: string; emoji: string }
export const GAMES: GameMeta[] = [
  { id: 'wyr', title: 'Would You Rather', blurb: 'Pick your side — then see if you matched.', emoji: '🤔' },
  { id: 'tot', title: 'This or That', blurb: 'Quick-fire choices. No overthinking.', emoji: '⚡' },
  { id: 'who', title: 'Who Knows Me Better?', blurb: 'Answer privately. Let your person guess.', emoji: '🔍' },
  { id: 'trivia', title: 'Couple Trivia', blurb: 'Romantic trivia — who’s the champion?', emoji: '🧠' },
  { id: 'guess', title: 'Guess My Answer', blurb: 'Think of something. They have to guess it.', emoji: '🎯' },
  { id: 'tod', title: 'Truth or Dare', blurb: 'Sweet, silly and a little daring.', emoji: '🎭' },
  { id: 'nhie', title: 'Never Have I Ever', blurb: 'Confess your cutest secrets.', emoji: '🙈' },
  { id: 'finish', title: 'Finish My Sentence', blurb: 'Complete the line. Reveal together.', emoji: '✍️' },
]
