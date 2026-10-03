export type DateTag = 'home' | 'outside' | 'cheap' | 'romantic' | 'long-distance' | 'ten-min' | 'weekend' | 'food' | 'adventure'

export interface DateIdea { id: string; title: string; description: string; cost: 'Free' | '$' | '$$' | '$$$'; costNote: string; duration: string; place: 'At home' | 'Outside' | 'Online'; tags: DateTag[] }

export const DATE_FILTERS: { id: DateTag; label: string }[] = [
  { id: 'home', label: 'At home' }, { id: 'outside', label: 'Outside' }, { id: 'cheap', label: 'Cheap' }, { id: 'romantic', label: 'Romantic' },
  { id: 'long-distance', label: 'Long distance' }, { id: 'ten-min', label: '10-minute date' }, { id: 'weekend', label: 'Weekend' }, { id: 'food', label: 'Food' }, { id: 'adventure', label: 'Adventure' },
]

const i = (id: string, title: string, description: string, cost: DateIdea['cost'], costNote: string, duration: string, place: DateIdea['place'], tags: DateTag[]): DateIdea => ({ id, title, description, cost, costNote, duration, place, tags })

export const DATE_IDEAS: DateIdea[] = [
  i('home-pizza', 'Make-your-own pizza night', 'Dough, toppings, a playlist and zero judgement. Bonus points for a heart-shaped one.', '$', 'about $10', '2 hrs', 'At home', ['home', 'food', 'cheap', 'romantic']),
  i('home-blanket', 'Blanket fort cinema', 'Build a fort, string some lights, pick a film neither of you has seen.', 'Free', 'free', '3 hrs', 'At home', ['home', 'cheap', 'romantic']),
  i('home-dance', 'Living room slow dance', 'Pick three songs. Dim the lights. Dance badly on purpose.', 'Free', 'free', '10 min', 'At home', ['home', 'cheap', 'romantic', 'ten-min']),
  i('home-cook', 'Cook a dish from a country you’ve never visited', 'Pick a country at random and cook its most famous dish together.', '$$', 'about $20', '2.5 hrs', 'At home', ['home', 'food', 'adventure']),
  i('home-spa', 'At-home spa evening', 'Face masks, foot rubs and a candle. Phones in another room.', '$', 'about $8', '1.5 hrs', 'At home', ['home', 'romantic', 'cheap']),
  i('home-letters', 'Write each other letters', 'Ten minutes of silence, one pen each, then read them aloud.', 'Free', 'free', '30 min', 'At home', ['home', 'romantic', 'cheap', 'ten-min']),
  i('home-photos', 'Scrapbook your favourite photos', 'Print ten photos, grab glue and pens, and make a tiny album.', '$', 'about $12', '2 hrs', 'At home', ['home', 'romantic', 'weekend']),
  i('home-game', 'Board game tournament', 'Best of five. Loser makes tea. Winner chooses the next date.', 'Free', 'free', '2 hrs', 'At home', ['home', 'cheap']),
  i('home-breakfast', 'Breakfast in bed, but make it fancy', 'Wake up early, plate it beautifully, serve it with a flower.', '$', 'about $10', '1 hr', 'At home', ['home', 'food', 'romantic']),
  i('home-stars', 'Stargaze from the roof or balcony', 'Download a star map, bring a blanket and find a constellation.', 'Free', 'free', '1 hr', 'At home', ['home', 'romantic', 'cheap']),
  i('home-ten-quiz', '10 questions deeper', 'Ask each other ten questions you’ve never asked.', 'Free', 'free', '10 min', 'At home', ['home', 'ten-min', 'cheap', 'romantic']),
  i('out-sunset', 'Chase a sunset', 'Pick a high spot, pack chai, watch the sky change colour.', 'Free', 'free', '1.5 hrs', 'Outside', ['outside', 'cheap', 'romantic']),
  i('out-picnic', 'Surprise picnic', 'Pack their favourites, find a quiet spot, leave your phones in the bag.', '$', 'about $15', '2 hrs', 'Outside', ['outside', 'food', 'romantic', 'weekend']),
  i('out-walk', 'Walk with no destination', 'Turn left, turn right, follow whichever street looks prettier.', 'Free', 'free', '1 hr', 'Outside', ['outside', 'cheap', 'adventure']),
  i('out-market', 'Street-food crawl', 'Order one thing at every stall. Rate each out of ten.', '$', 'about $12', '2 hrs', 'Outside', ['outside', 'food', 'adventure']),
  i('out-bookstore', 'Bookstore swap', 'Each pick a book for the other. Read the first page aloud over coffee.', '$$', 'about $25', '2 hrs', 'Outside', ['outside', 'romantic']),
  i('out-hike', 'Sunrise hike', 'Alarm at an awful hour, view at a wonderful one.', 'Free', 'free', '4 hrs', 'Outside', ['outside', 'adventure', 'weekend', 'cheap']),
  i('out-rain', 'Dance in the rain', 'Next time it pours, go outside instead of in.', 'Free', 'free', '15 min', 'Outside', ['outside', 'cheap', 'romantic', 'ten-min']),
  i('out-museum', 'Museum, one rule', 'Each pick your favourite piece without telling the other, then compare.', '$$', 'about $20', '2 hrs', 'Outside', ['outside', 'romantic']),
  i('out-roadtrip', 'Spontaneous road trip', 'Fill the tank, pick a direction, stay wherever looks nice.', '$$$', 'about $120', 'A weekend', 'Outside', ['outside', 'adventure', 'weekend']),
  i('out-fair', 'Funfair photo-booth challenge', 'Rides, snacks, and a photo strip as proof.', '$$', 'about $30', '3 hrs', 'Outside', ['outside', 'adventure', 'romantic']),
  i('out-dinner', 'Dress-up dinner', 'Wear your best, book the nice table, no phones allowed.', '$$$', 'about $80', '2 hrs', 'Outside', ['outside', 'food', 'romantic']),
  i('out-boat', 'Row a boat on the lake', 'Take turns rowing, take turns being romantic.', '$$', 'about $20', '1 hr', 'Outside', ['outside', 'romantic', 'adventure']),
  i('out-bike', 'Cycle to a new neighbourhood', 'Explore, find a cafe you’ve never been to, and claim it as yours.', '$', 'about $8', '3 hrs', 'Outside', ['outside', 'adventure', 'food', 'weekend']),
  i('ld-movie', 'Synchronised movie night', 'Press play at the same second on a video call. Share snacks over the screen.', 'Free', 'free', '2 hrs', 'Online', ['long-distance', 'cheap', 'home']),
  i('ld-dinner', 'Cook the same recipe, together apart', 'Same recipe, two kitchens, one call. Compare results.', '$', 'about $10', '2 hrs', 'Online', ['long-distance', 'food', 'home']),
  i('ld-playlist', 'Build a shared playlist', 'Take turns adding songs that remind you of the other, and explain why.', 'Free', 'free', '45 min', 'Online', ['long-distance', 'cheap', 'romantic']),
  i('ld-sunset', 'Same sunset, different cities', 'Video call at golden hour and show each other the sky.', 'Free', 'free', '20 min', 'Online', ['long-distance', 'cheap', 'romantic', 'ten-min']),
  i('ld-mail', 'Send a surprise parcel', 'Little gifts, a handwritten note, and something that smells like home.', '$$', 'about $20', '1 hr', 'Online', ['long-distance', 'romantic']),
  i('ld-game', 'Online game night', 'Skribbl, chess, or a co-op game — loser sends a voice note of apology.', 'Free', 'free', '1.5 hrs', 'Online', ['long-distance', 'cheap']),
  i('ld-quick', '10-minute voice note date', 'Walk, talk and narrate your surroundings to each other.', 'Free', 'free', '10 min', 'Online', ['long-distance', 'ten-min', 'cheap']),
  i('ten-compliments', 'Ten compliments each', 'No repeats, no jokes (okay, a few jokes).', 'Free', 'free', '10 min', 'At home', ['ten-min', 'cheap', 'romantic', 'home']),
  i('ten-tea', 'Tea on the doorstep', 'Make tea, sit outside, talk about the best part of your day.', 'Free', 'free', '10 min', 'At home', ['ten-min', 'cheap', 'home', 'romantic']),
  i('ten-selfie', 'Recreate your first photo together', 'Same pose, same smile, a little older and a lot happier.', 'Free', 'free', '10 min', 'At home', ['ten-min', 'cheap', 'romantic']),
  i('ten-dessert', 'Dessert for dinner', 'Skip the main course. Share one enormous dessert, two spoons.', '$', 'about $8', '30 min', 'Outside', ['food', 'romantic', 'outside', 'ten-min']),
  i('wk-cabin', 'Weekend away', 'Book somewhere small and quiet. Leave the laptop at home.', '$$$', 'about $200', 'A weekend', 'Outside', ['weekend', 'romantic', 'adventure', 'outside']),
  i('wk-class', 'Take a class together', 'Pottery, salsa, sushi — somewhere you’ll both be beginners.', '$$', 'about $50', '3 hrs', 'Outside', ['weekend', 'adventure', 'food']),
  i('wk-camp', 'Camp under the stars', 'Tent, torch, marshmallows and a very long conversation.', '$$', 'about $40', 'A night', 'Outside', ['weekend', 'adventure', 'outside', 'romantic']),
  i('wk-diy', 'Paint each other’s portrait', 'Terrible art, wonderful memories. Frame the best one.', '$', 'about $15', '2 hrs', 'At home', ['weekend', 'home', 'cheap', 'romantic']),
  i('wk-bucket', 'Write a shared bucket list', 'Twenty things to do together this year, then book the first one.', 'Free', 'free', '1 hr', 'At home', ['weekend', 'home', 'cheap', 'romantic']),
  i('food-tasting', 'Chocolate tasting', 'Buy five bars, rate them blindfolded, crown a winner.', '$', 'about $15', '1 hr', 'At home', ['food', 'home', 'romantic']),
  i('food-brunch', 'Brunch somewhere new', 'Pick a cafe neither of you has tried and order the weirdest thing.', '$$', 'about $30', '2 hrs', 'Outside', ['food', 'outside', 'weekend']),
  i('food-bake', 'Bake something ambitious', 'Croissants, a layered cake — nothing simple. Laugh at the results.', '$', 'about $15', '3 hrs', 'At home', ['food', 'home', 'weekend']),
  i('adv-zip', 'Try something that scares you', 'Zip-lining, climbing wall, trampoline park — hold hands on the way up.', '$$$', 'about $60', '3 hrs', 'Outside', ['adventure', 'outside', 'weekend']),
  i('adv-geo', 'Geocaching hunt', 'Find hidden treasure in your own city with a free app.', 'Free', 'free', '2 hrs', 'Outside', ['adventure', 'outside', 'cheap']),
  i('adv-train', 'Ride the train to the last stop', 'Get on, get off at the end, discover whatever is there.', '$', 'about $10', '4 hrs', 'Outside', ['adventure', 'outside', 'cheap', 'weekend']),
]
