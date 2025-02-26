const textPosts = [
  {
    title: 'Herb of Destiny',
    body: `<p>“I’m Towelie! The best towel in all the realms, man. And you, big guy, look like you need to chill.” Towelie held up the herb with one corner of his fabric. “Trust me, it’s premium stuff.”</p>
            `,
    createdAt: '2025-01-01',
    pictures: [],
  },
  {
    title: 'Doom 64: A Forgotten Classic That Defined a Generation',
    body: `<p>2496 Characters: Released on March 31, 1997, Doom 64 is a gem in the legendary Doom franchise, developed by Midway Games in collaboration with id Software for the Nintendo 64. While often overshadowed by its predecessors, Doom 64 stands out as a unique and ambitious entry, blending classic Doom gameplay with a fresh aesthetic and atmosphere tailored to the capabilities of its platform.</p>
            <p>Set after the events of Doom II: Hell on Earth, the game introduces a haunting narrative where a lone marine (the 'Doomguy') returns to Mars after the UAC's disastrous experiments with teleportation. Despite the eradication of the demons, the corpses of their kin begin to reanimate due to the influence of a mysterious entity, the 'Mother Demon.' Tasked with eradicating this menace, players traverse 32 levels of terror, battling hordes of enemies in labyrinthine environments while unraveling the secrets of the demon-infested outposts.</p>
            <p>What makes Doom 64 unique is its radical shift in tone and design. The game replaces the vibrant, colorful visuals of its predecessors with darker, moodier settings. The level designs are intricate, offering a more puzzle-focused approach than earlier entries, challenging players to explore every corner to unlock secrets and progress. The lighting effects, rendered using the Nintendo 64's hardware, enhance the eerie atmosphere, immersing players in a sense of dread and isolation.</p>
            <p>The arsenal in Doom 64 retains the series’ iconic weapons—such as the shotgun, chaingun, and rocket launcher—while introducing a new, powerful addition: the Unmaker. A demonic energy weapon, the Unmaker can be upgraded with demonic artifacts called Demon Keys, emphasizing the game’s focus on exploration and reward.</p>
            <p>The audio design also elevates the experience. Unlike the adrenaline-pumping metal-inspired MIDI tracks of the original games, Doom 64 employs an ambient, unsettling soundtrack composed by Aubrey Hodges. The music, combined with foreboding sound effects, creates an atmosphere more akin to survival horror than traditional first-person shooters.</p>
            <p>Despite critical acclaim upon release, Doom 64 struggled to gain widespread attention, largely due to its exclusivity on the Nintendo 64 and the waning popularity of the Doom series in the late 1990s. However, its legacy endured, with fans praising its unique atmosphere and gameplay innovations. The game's importance was cemented with its 2020 re-release for modern platforms, introducing it to a new generation of players.</p>
            `,
    createdAt: '2025-07-23',
    pictures: [],
  },
  {
    title:
      'A Very Long Title That Hopefully Will Span Three Lines or More, and I Hope I Will Never See an Actual Title Like This in Production',
    body: `<p>New Glenn safely reached its intended orbit during today's NG-1 mission, accomplishing our primary objective.</p>
            <p>New Glenn’s seven BE-4 engines ignited on January 16, 2025, at 2:03 a.m. EST (0703 UTC) from Launch Complex 36 at Cape Canaveral Space Force Station.</p>
            <p>The second stage is in its final orbit following two successful burns of the BE-3U engines. The Blue Ring Pathfinder is receiving data and performing well. We lost the booster during descent.</p>
            <p>“I’m incredibly proud New Glenn achieved orbit on its first attempt,” said Dave Limp, CEO, Blue Origin. “We knew landing our booster, So You’re Telling Me There’s a Chance, on the first try was an ambitious goal. We’ll learn a lot from today and try again at our next launch this spring. Thank you to all of Team Blue for this incredible milestone.”</p>
            `,
    createdAt: '2024-03-17',
    pictures: [],
  },
];

const oneImagePosts = [
  /*
    {
        title: 'Corvette C8',
        body: `<p>626 Characters: The Corvette C8 is Chevrolet’s first mid-engine Corvette, marking a revolutionary shift in design and performance for the iconic sports car. Introduced in 2019, the C8 is powered by a 6.2L LT2 V8 engine, delivering up to 495 horsepower and 470 lb-ft of torque with the Z51 performance package. Paired with an 8-speed dual-clutch transmission, it sprints from 0 to 60 mph in just 2.9 seconds. The C8 combines cutting-edge aerodynamics, a driver-focused cockpit, and advanced tech, making it a blend of American muscle and precision engineering. Its affordability redefines expectations for supercar performance.</p>
        `,
        createdAt: '2024-09-04',
        pictures: ['images/corvette.jpg', 'images/booster.png']
    },
    */
  {
    title: 'Turkish Cat',
    body: '<p>The cat in the image is a relaxed, medium-sized tabby with a mix of brown, black, and gray fur. Its distinctive stripes and slightly ruffled coat give it a rugged yet charming look. With its eyes half-closed and front paws stretched out, it appears content while basking in the warmth of the setting sun. The soft glow of the sunlight enhances its fur, making it look even cozier. Resting on a weathered wooden bench with "BELEDİYESİ" inscribed on it, the cat seems to be a local street resident, enjoying the peaceful moment. The cat in the image is a relaxed, medium-sized tabby with a mix of brown, black, and gray fur. Its distinctive stripes and slightly ruffled coat give it a rugged yet charming look. With its eyes half-closed and front paws stretched out, it appears content while basking in the warmth of the setting sun. The soft glow of the sunlight enhances its fur, making it look even cozier. Resting on a weathered wooden bench with "BELEDİYESİ" inscribed on it.</p>',
    createdAt: '2024-05-29',
    pictures: [
      'images/cat.jpg',
      'images/booster.png',
      'images/fountain.jpg',
      'images/corvette.jpg',
    ],
  },
  {
    title: 'Super Heavy Booster Caught',
    body: '',
    createdAt: '2024-11-24',
    pictures: [
      'images/aurora.jpg',
      'images/deer.jpg',
      'images/cat.jpg',
      'images/booster.png',
    ],
  },
];

const allPosts = [
  // Text Only Posts
  // Long Text Post
  {
    title: 'The Extensive History of Coffee Cultivation',
    body: `<p>Coffee cultivation has a rich and complex history, spanning centuries and continents. Originating in the highlands of Ethiopia, the coffee plant, specifically Coffea arabica, was initially used by indigenous populations for its energizing properties.  Legend has it that a goat herder named Kaldi noticed his goats becoming unusually lively after consuming berries from a particular tree.  Intrigued, he tried the berries himself and experienced a similar effect.</p>
            <p>From Ethiopia, coffee cultivation spread to Yemen in the 15th century, where Sufi monasteries embraced it to aid in religious rituals and stay awake during prayers.  Coffee houses, known as "qahveh khaneh," began to emerge in Mecca and Cairo, becoming centers of social and intellectual life.  These establishments, however, also faced periods of prohibition due to concerns about their potential for stimulating radical thought.</p>
            <p>By the 17th century, coffee had made its way to Europe, initially facing resistance and being labeled "the bitter invention of Satan" by some religious factions.  However, its popularity soared, and coffee houses became hubs of social interaction, business dealings, and intellectual discourse.  The demand for coffee fueled European colonial expansion, with the Dutch, French, and British establishing coffee plantations in their respective colonies in Asia, Africa, and the Americas.</p>
            <p>The conditions on these colonial plantations were often brutal, relying heavily on slave labor.  The Caribbean islands, particularly Saint-Domingue (modern-day Haiti), became major coffee producers under French rule. The Haitian Revolution, in part fueled by the harsh conditions of coffee cultivation, had a significant impact on the global coffee trade.</p>
            <p>Today, coffee is one of the most widely traded commodities in the world, with major producing regions including Brazil, Vietnam, Colombia, Indonesia, and Ethiopia.  The industry faces numerous challenges, including climate change, price volatility, and labor rights issues. Efforts are being made to promote sustainable and ethical coffee production, ensuring fair prices for farmers and minimizing environmental impact. The journey from a humble Ethiopian shrub to a global beverage is a testament to coffee's enduring appeal and its profound impact on history and culture. This is still under the 2500 character limit.</p>`,
    createdAt: '2024-10-26',
    pictures: [],
    qrCode: 'images/qr-code.png',
  },
  // Medium Text Post
  {
    title: 'The Benefits of Regular Exercise',
    body: `<p>Regular exercise is crucial for maintaining both physical and mental well-being.  Engaging in physical activity, even for short periods, can significantly improve cardiovascular health, strengthen muscles and bones, and boost overall mood.</p>
            <p>Cardiovascular exercise, such as running, swimming, or cycling, helps to lower blood pressure and improve cholesterol levels, reducing the risk of heart disease.  Strength training, using weights or resistance bands, builds muscle mass and increases bone density, which is particularly important for preventing osteoporosis.</p>
            <p>Beyond the physical benefits, exercise also has a profound impact on mental health.  It releases endorphins, which have mood-boosting effects and can help to alleviate symptoms of stress, anxiety, and depression.  Regular physical activity can also improve sleep quality and increase energy levels.  Finding an activity you enjoy, whether it's dancing, hiking, or team sports, is key to making exercise a sustainable part of your lifestyle. Aim for at least 150 minutes of moderate-intensity or 75 minutes of vigorous-intensity aerobic activity per week, along with muscle-strengthening activities twice a week.</p>`,
    createdAt: '2024-10-27',
    pictures: [],
  },
  // Short Text Post
  {
    title: 'Quick Recipe: Avocado Toast',
    body: `<p>This is a super simple recipe for avocado toast:</p>
            <ol>
                <li>Toast your favorite bread.</li>
                <li>Mash half an avocado with a fork.</li>
                <li>Spread the mashed avocado on the toast.</li>
                <li>Sprinkle with salt, pepper, and red pepper flakes (optional).</li>
                <li>Enjoy!</li>
            </ol>`,
    createdAt: '2024-10-28',
    pictures: [],
    qrCode: 'images/qr-code.png',
  },

  // One-Image Posts
  // No Text
  {
    title: 'Northern Lights Spectacle',
    body: ``,
    createdAt: '2024-11-01',
    pictures: ['images/booster.png'],
    qrCode: 'images/qr-code.png',
  },
  // Medium Text
  {
    title: 'Majestic Deer in Autumn Forest',
    body: `<p>A beautiful deer spotted in the forest during the peak of autumn colors. The vibrant foliage creates a stunning backdrop for this majestic creature.</p>`,
    createdAt: '2024-11-02',
    pictures: ['images/deer.jpg'],
    qrCode: 'images/qr-code.png',
  },
  // Up to Limit Text
  {
    title: "Street Cat's Nap",
    body: `<p>This adorable street cat found a cozy spot on a bench for an afternoon nap. The inscription "BELEDİYESİ" suggests this is somewhere in Turkey. The cat's relaxed posture and the warm sunlight create a peaceful scene. It's a reminder of the simple joys in life and the beauty of everyday moments. Even stray animals find moments of comfort and peace. The texture of the bench and the cat's fur contrast nicely. The soft sunlight filtering through creates a warm, inviting image. Finding beauty in the ordinary is a gift. This picture encapsulates that sentiment perfectly. I hope this cat finds a loving home. They deserve all the cuddles.</p>`,
    createdAt: '2024-11-03',
    pictures: ['images/cat.jpg'],
    qrCode: 'images/qr-code.png',
  },

  // Two-Image Posts
  // No Text
  {
    title: 'Launch and Landing',
    body: ``,
    createdAt: '2024-11-04',
    pictures: ['images/booster.png', 'images/corvette.jpg'],
    // qrCode: 'images/qr-code.png',
  },
  // Medium Text
  {
    title: 'City and Nature',
    body: `<p>Exploring the contrast between urban landscapes and natural beauty. A modern fountain in the city and a peaceful aurora borealis.</p>`,
    createdAt: '2024-11-05',
    pictures: ['images/fountain.jpg', 'images/aurora.jpg'],
    qrCode: 'images/qr-code.png',
  },
  // Up to Limit Text
  {
    title: 'Sports Car and Wildlife',
    body: `<p>Two very different subjects: a sleek, modern sports car and a wild deer in its natural habitat. The Corvette C8 represents human engineering and speed, while the deer embodies the grace and beauty of the natural world.  The contrast is striking, yet each subject holds its own unique appeal.  One is a symbol of power and performance, the other of tranquility and freedom.  It makes you think about the different aspects of life and the world around us. Which one do you prefer?  The roar of the engine or the silence of the forest? It's a tough choice! Both are captivating in their own way. The colors also play a big role. The vibrant red of the car against the muted tones of the forest.</p>`,
    createdAt: '2024-11-06',
    pictures: ['images/corvette.jpg', 'images/deer.jpg'],
    qrCode: 'images/qr-code.png',
  },

  // Three-Image Posts
  // No Text
  {
    title: 'Three Wonders',
    body: ``,
    createdAt: '2024-11-07',
    pictures: ['images/aurora.jpg', 'images/booster.png', 'images/cat.jpg'],
    qrCode: 'images/qr-code.png',
  },
  // Medium Text
  {
    title: 'A Mix of Scenes',
    body: `<p>A collection of images: a rocket booster, a relaxing cat, and a beautiful fountain.</p>`,
    createdAt: '2024-11-08',
    pictures: ['images/booster.png', 'images/cat.jpg', 'images/fountain.jpg'],
    qrCode: 'images/qr-code.png',
  },
  // Up to Limit Text
  {
    title: 'Nature, Technology, and Speed',
    body: `<p>These three images represent different facets of our world. The aurora borealis showcases the stunning beauty of nature's light show. The rocket booster symbolizes human innovation and our quest to explore space.  And the Corvette C8 represents the pinnacle of automotive engineering and design.  Each is impressive in its own right, and together they offer a diverse perspective on the world.  The raw power of nature, the ingenuity of humankind, and the pursuit of speed and performance. What a combination! It's amazing to think about all the different things that exist and how they can be captured in a single image. The colors, the textures, the emotions they evoke... photography is a powerful medium.</p>`,
    createdAt: '2024-11-09',
    pictures: [
      'images/aurora.jpg',
      'images/booster.png',
      'images/corvette.jpg',
    ],
  },

  // Four-Image Posts
  // No Text
  {
    title: 'Four Corners of the World',
    body: ``,
    createdAt: '2024-11-10',
    pictures: [
      'images/aurora.jpg',
      'images/booster.png',
      'images/cat.jpg',
      'images/corvette.jpg',
    ],
    qrCode: 'images/qr-code.png',
  },
  // Medium Text
  {
    title: 'A Visual Journey',
    body: `<p>From the northern lights to a street cat, a rocket, and a sports car – a diverse visual collection.</p>`,
    createdAt: '2024-11-11',
    pictures: [
      'images/deer.jpg',
      'images/fountain.jpg',
      'images/booster.png',
      'images/cat.jpg',
    ],
  },
  // Up to Limit Text
  {
    title: 'Contrasting Images, Shared Beauty',
    body: `<p>This set of four images presents a fascinating contrast.  We have the serene beauty of a deer in the forest, the dynamic energy of a city fountain, the raw power of a rocket booster, and the cozy charm of a napping street cat.  Each image tells a different story, yet they all share a common thread of visual appeal. The juxtaposition of nature, urban life, technology, and everyday moments creates a captivating narrative.  It's a reminder that beauty can be found in the most unexpected places.  And that sometimes, the most contrasting elements can create the most compelling compositions.  The play of light and shadow, the different textures and colors, all contribute to the overall impact. A wonderful visual feast!</p>`,
    createdAt: '2024-11-12',
    pictures: [
      'images/deer.jpg',
      'images/fountain.jpg',
      'images/booster.png',
      'images/cat.jpg',
    ],
    qrCode: 'images/qr-code.png',
  },
];

// module.exports = textPosts;
// module.exports = oneImagePosts;
module.exports = allPosts;
