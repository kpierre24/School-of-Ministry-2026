// Amplified Bible (AMP) Scriptures Dataset & Search Engine
// Tailored for HTEIM School of Ministry curriculum & students

export interface AmpVerse {
  verse: number;
  text: string;
}

export interface AmpChapter {
  chapter: number;
  verses: AmpVerse[];
}

export interface AmpBook {
  id: string; // e.g., '2ti', 'eph', 'rom', 'mat', 'psa'
  name: string; // e.g., '2 Timothy'
  testament: 'OT' | 'NT';
  category: 'Gospels' | 'Epistles' | 'Pastoral' | 'Prophecy' | 'Wisdom' | 'Law' | 'History' | 'Acts';
  chapters: AmpChapter[];
}

export const AMP_BIBLE_BOOKS: AmpBook[] = [
  // --- PASTORAL & EPISTLES (CORE SOM SCRIPTURES) ---
  {
    id: '2ti',
    name: '2 Timothy',
    testament: 'NT',
    category: 'Pastoral',
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 6, text: "That is why I remind you to fan into flame the gracious gift of God, [that inner fire—the special endowment] which is in you through the laying on of my hands [with their prophetic declarations]." },
          { verse: 7, text: "For God did not give us a spirit of timidity or cowardice or fear, but [He has given us a spirit] of power and of love and of sound judgment and personal discipline [abilities that result in a calm, well-balanced mind and self-control]." },
          { verse: 13, text: "Hold fast and follow the pattern of sound doctrine and wholesome teachings which you have heard from me, in the faith and love which are in Christ Jesus." },
          { verse: 14, text: "Carefully guard and protect [as a precious deposit] that excellent and priceless truth which has been entrusted to you by the Holy Spirit who dwells within us." }
        ]
      },
      {
        chapter: 2,
        verses: [
          { verse: 1, text: "So you, my son, be strong [constantly strengthened and empowered] in the grace that is [to be found only] in Christ Jesus." },
          { verse: 2, text: "The things which you have heard from me in the presence of many witnesses, entrust to reliable and faithful men who will also be capable and qualified to teach others." },
          { verse: 3, text: "Take your share of hardship as a good soldier of Christ Jesus." },
          { verse: 4, text: "No soldier in active service entangles himself in the affairs of civilian life, so that he may please the one who enlisted him." },
          { verse: 15, text: "Study and do your utmost to present yourself approved unto God, a workman that needeth not to be ashamed, accurately handling and skillfully teaching the word of truth." },
          { verse: 19, text: "Nevertheless, the firm foundation of God [which He has laid] stands firm and unshakable, bearing this seal: 'The Lord knows those who are His,' and, 'Let everyone who names the name of the Lord stand away from wickedness.'" },
          { verse: 20, text: "Now in a large house there are not only vessels and objects of gold and silver, but also vessels and objects of wood and of earthenware, and some are for honorable (noble, good) use and some for dishonorable (ignoble, common)." },
          { verse: 21, text: "Therefore, if anyone cleanses himself from these things [which are dishonorable—disobedient, sinful], he will be a vessel for honor, sanctified [set apart for a special purpose and made holy], useful to the Master, prepared for every good work." },
          { verse: 22, text: "Run away from youthful lusts and pursue righteousness, faith, love, and peace with those who call on the Lord out of a pure heart." },
          { verse: 24, text: "The Lord's servant must not be quarrelsome, but kind to everyone [mild-tempered, preserving the bond of peace]; he must be a skilled teacher, patient and forbearing when wronged." }
        ]
      },
      {
        chapter: 3,
        verses: [
          { verse: 1, text: "But understand this: in the last days dangerous times [of great stress and trouble] will come [difficult days that will be hard to bear]." },
          { verse: 5, text: "holding to a form of [outward] godliness (religion), although they have denied its power [for their conduct nullifies their claim of faith]. Avoid such people and keep far away from them." },
          { verse: 16, text: "All Scripture is God-breathed [given by divine inspiration] and is profitable for instruction, for conviction [of sin], for correction [of error and restoration to obedience], for training in righteousness [learning to live in conformity to God's will, both publicly and privately—behaving honorably with personal integrity and moral courage];" },
          { verse: 17, text: "so that the man of God may be complete and proficient, outfitted and thoroughly equipped for every good work." }
        ]
      },
      {
        chapter: 4,
        verses: [
          { verse: 2, text: "preach the word [as an official messenger]; be ready in season and out of season [when the opportunity is convenient and when it is not, whether the hearer is welcoming or not]; correct, reprimand, and encourage with utmost patience and all instruction." },
          { verse: 5, text: "As for you, be calm and sober-minded in all things, endure hardship, do the work of an evangelist, fulfill [all the duties of] your ministry." },
          { verse: 7, text: "I have fought the good [worthy, honorable, and noble] fight, I have finished the race, I have kept the faith [firmly guarding the gospel against error]." }
        ]
      }
    ]
  },
  {
    id: '1ti',
    name: '1 Timothy',
    testament: 'NT',
    category: 'Pastoral',
    chapters: [
      {
        chapter: 3,
        verses: [
          { verse: 1, text: "This is a faithful and trustworthy saying: if any man sets his heart on being an overseer (bishop), he desires an honorable and noble work." },
          { verse: 2, text: "Now an overseer must be above reproach and beyond criticism, the husband of one wife, temperate, sensible, respectable, hospitable, able to teach," },
          { verse: 13, text: "For those who have served well as deacons obtain for themselves a good standing and great confidence in the faith which is in Christ Jesus." }
        ]
      },
      {
        chapter: 4,
        verses: [
          { verse: 12, text: "Let no one look down on your youthfulness, but rather in speech, conduct, love, faith and purity, show yourself an example of those who believe." },
          { verse: 14, text: "Do not neglect the spiritual gift within you, [that special endowment], which was bestowed on you through prophetic utterance with the laying on of hands by the eldership." },
          { verse: 15, text: "Practice and work hard on these things; be absorbed in them [completely occupied in your ministry], so that your progress will be evident to all." },
          { verse: 16, text: "Pay close attention to yourself [concentrate on your personal integrity] and to your teaching; persevere in these things [hold to them], for as you do this you will save both yourself and those who hear you." }
        ]
      }
    ]
  },
  {
    id: 'eph',
    name: 'Ephesians',
    testament: 'NT',
    category: 'Epistles',
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 17, text: "[I always pray] that the God of our Lord Jesus Christ, the Father of glory, may grant to you a spirit of wisdom and of revelation [that gives you a deep and personal and intimate insight] into the true knowledge of Him [for we know the Father through the Son]." },
          { verse: 18, text: "And [I pray] that the eyes of your heart [the very center and core of your being] may be enlightened [flooded with light by the Holy Spirit], so that you will know and cherish the hope [the divine guarantee, the confident expectation] to which He has called you, the riches of His glorious inheritance in the saints," },
          { verse: 19, text: "and [so that you can begin to know] what the immeasurable and unlimited and surpassing greatness of His active, spiritual power is in us who believe. These are in accordance with the working of His mighty strength." }
        ]
      },
      {
        chapter: 4,
        verses: [
          { verse: 11, text: "And [His gifts to the church were varied and] He Himself appointed some to be apostles [special messengers, representatives], some prophets [who speak a new message from God to the people], some evangelists [who spread the good news of salvation], and some pastors and teachers [to shepherd and guide and instruct]," },
          { verse: 12, text: "for the equipping of the saints (God's people) for the work of ministry, for the building up of the body of Christ [the church];" },
          { verse: 13, text: "until we all reach oneness in the faith and in the knowledge of the Son of God, [growing until we become] a mature man [the fullness of development], reaching to the measure of the stature of the fullness of Christ and the completeness found in Him." },
          { verse: 15, text: "But speaking the truth in love [in all things—both our speech and our lives expressing His truth], let us grow up in all things into Him [following His example] who is the Head—Christ." },
          { verse: 16, text: "From Him the whole body [the church, in all its various parts], joined and knitted firmly together by what every joint supplies, when each part is working properly, causes the body to grow and mature, building itself up in [unselfish] love." }
        ]
      },
      {
        chapter: 6,
        verses: [
          { verse: 10, text: "Finally, be strong in the Lord [draw your strength from Him and be empowered through your union with Him] and in the power of His [boundless] might." },
          { verse: 11, text: "Put on the full armor of God [for His precepts are like the splendid armor of a heavily-armed soldier], so that you may be able to successfully stand up against all the schemes and the strategies and the deceits of the devil." },
          { verse: 12, text: "For our struggle is not against flesh and blood [contending only with physical opponents], but against the rulers, against the powers, against the world forces of this [present] darkness, against the spiritual forces of wickedness in the heavenly (supernatural) places." },
          { verse: 13, text: "Therefore, put on the complete armor of God, so that you will be able to [successfully] resist and stand your ground in the evil day [of danger], and having done everything [that the crisis demands], to stand firm [in your place, fully prepared, immovable, victorious]." },
          { verse: 17, text: "And take the helmet of salvation, and the sword that the Spirit wields, which is the Word of God." },
          { verse: 18, text: "With all prayer and petition pray [with specific requests] at all times [on every occasion and in every season] in the Spirit, and with this in view, stay alert with all perseverance and petition for all the saints (God's people)." }
        ]
      }
    ]
  },
  {
    id: 'rom',
    name: 'Romans',
    testament: 'NT',
    category: 'Epistles',
    chapters: [
      {
        chapter: 8,
        verses: [
          { verse: 1, text: "Therefore there is now no condemnation [no guilty verdict, no punishment] for those who are in Christ Jesus [who believe in Him as personal Savior and Lord]." },
          { verse: 14, text: "For all who are being led by the Spirit of God are sons of God." },
          { verse: 16, text: "The Spirit Himself testifies and confirms together with our spirit [assuring us] that we are children of God;" },
          { verse: 26, text: "In the same way the Spirit [comes to us and] helps us in our weakness. We do not know what prayer to offer or how to offer it as we should, but the Spirit Himself [knows our need and at the right time] intercedes on our behalf with sighs and groanings too deep for words." },
          { verse: 28, text: "And we know [with great confidence] that God [who is deeply concerned about us] causes all things to work together [as a plan] for good for those who love God, to those who are called according to His plan and purpose." },
          { verse: 31, text: "What then shall we say to all these things? If God is for us, who can be [successful] against us?" },
          { verse: 37, text: "Yet in all these things we are more than conquerors and gain an overwhelming victory through Him who loved us [so much that He died for us]." }
        ]
      },
      {
        chapter: 12,
        verses: [
          { verse: 1, text: "Therefore I urge you, brothers and sisters, by the mercies of God, to present your bodies [dedicating all of yourselves, set apart] as a living sacrifice, holy and well-pleasing to God, which is your rational (logical, intelligent) act of worship." },
          { verse: 2, text: "And do not be conformed to this world [any longer with its superficial values and customs], but be transformed and progressively changed [as you mature spiritually] by the renewing of your mind [focusing on godly values and ethical attitudes], so that you may prove [for yourselves] what the will of God is, that which is good and acceptable and perfect [in His plan and purpose for you]." },
          { verse: 3, text: "For by the grace [of God] given to me I say to everyone of you not to think more highly of himself [and of his importance and ability] than he ought to think; but to think so as to have sound judgment, as God has apportioned to each a degree of faith [and a purpose designed for service]." },
          { verse: 6, text: "Since we have gifts that differ according to the grace given to us, each of us is to use them accordingly: if [someone has the gift of] prophecy, [let him use a proportion to his faith and] in agreement with the [ancient] Scriptures;" },
          { verse: 7, text: "if [someone has the gift of] practical service, let him give himself to serving; or he who teaches, to his teaching;" },
          { verse: 8, text: "or he who encourages, to his encouragement; he who gives, with generosity; he who leads, with zeal; he who shows mercy, with cheerfulness." }
        ]
      }
    ]
  },
  {
    id: '1co',
    name: '1 Corinthians',
    testament: 'NT',
    category: 'Epistles',
    chapters: [
      {
        chapter: 12,
        verses: [
          { verse: 1, text: "Now about the spiritual gifts [the special endowments of supernatural energy], brothers and sisters, I do not want you to be uninformed." },
          { verse: 4, text: "Now there are [distinctive] varieties of spiritual gifts [special abilities given by the grace and extraordinary power of the Holy Spirit operating in believers], but it is the same Spirit [who grants them and empowers believers]." },
          { verse: 7, text: "But to each one is given the manifestation of the Spirit [the outward evidence of the Spirit's presence and operation] for the common good and profit [of the whole church]." },
          { verse: 8, text: "To one is given through the Spirit the [utterance of] wisdom, and to another the [utterance of] knowledge according to the same Spirit;" },
          { verse: 9, text: "to another [special, wonder-working] faith by the same Spirit, and to another the gifts of healing by the one Spirit;" },
          { verse: 10, text: "and to another the working of miracles, and to another prophecy [foretelling future events or speaking by divine inspiration], and to another the discernment of spirits [the ability to distinguish between the divine, the human, and the demonic], to another various kinds of [unknown] tongues, and to another the interpretation of tongues." },
          { verse: 28, text: "And God has appointed in the church, first apostles [special messengers], second prophets [inspired preachers and expounders], third teachers, then wonder-workers (miracle workers), then those with gifts of healings, helps, administration, and kinds of [different] languages." }
        ]
      },
      {
        chapter: 13,
        verses: [
          { verse: 1, text: "If I speak with the tongues of men and of angels, but have not love [for others], I have become a noisy gong or a clanging cymbal." },
          { verse: 2, text: "And if I have prophetic powers [and the gift of interpreting the divine will and purpose], and understand all secret truths and mysteries and possess all knowledge, and if I have [sufficient] faith so that I can remove mountains, but have not love, I am nothing." },
          { verse: 13, text: "And now there remain: faith [abiding trust in God and His promises], hope [confident expectation of eternal salvation], love [unselfish love for others growing out of God's love for me]—these three; but the greatest of these is love." }
        ]
      },
      {
        chapter: 14,
        verses: [
          { verse: 1, text: "Pursue [this] love [with all your might, eagerly make it your aim], yet earnestly desire and cultivate the spiritual gifts [to be used for believers], but especially that you may prophesy [to speak by divine inspiration and preach the gospel with power]." },
          { verse: 3, text: "On the other hand, the one who prophesies speaks to men for their upbuilding and constructive spiritual progress, and encouragement, and consolation." },
          { verse: 40, text: "But all things must be done in a proper (fitting) and orderly way." }
        ]
      }
    ]
  },
  {
    id: 'act',
    name: 'Acts',
    testament: 'NT',
    category: 'Acts',
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 8, text: "But you will receive power and ability when the Holy Spirit comes upon you; and you will be My witnesses [to tell people about Me] both in Jerusalem, and in all Judea, and Samaria, and even to the ends of the earth." }
        ]
      },
      {
        chapter: 2,
        verses: [
          { verse: 1, text: "When the day of Pentecost had come, they were all together in one place." },
          { verse: 2, text: "Suddenly there came from heaven a noise like a violent rushing wind, and it filled the whole house where they were sitting." },
          { verse: 4, text: "And they were all filled [that is, diffused throughout their being] with the Holy Spirit and began to speak in other tongues (languages), as the Spirit was giving them the ability to speak." },
          { verse: 17, text: "'And it shall come to pass in the last days,' says God, 'That I will pour out My Spirit on all mankind; and your sons and your daughters shall prophesy, and your young men shall see visions, and your old men shall dream dreams;'" },
          { verse: 18, text: "'Even on My bondservants, both men and women, I will in those days pour out My Spirit, and they shall prophesy.'" },
          { verse: 42, text: "They were continually and faithfully devoting themselves to the instruction of the apostles and to fellowship, to the breaking of bread and to prayer." }
        ]
      },
      {
        chapter: 10,
        verses: [
          { verse: 38, text: "how God anointed Jesus of Nazareth with the Holy Spirit and with power, and how He went about doing good and healing all who were oppressed by the devil, for God was with Him." }
        ]
      }
    ]
  },
  {
    id: 'mat',
    name: 'Matthew',
    testament: 'NT',
    category: 'Gospels',
    chapters: [
      {
        chapter: 5,
        verses: [
          { verse: 14, text: "You are the light of the [Christ-less] world. A city set on a hill cannot be hidden;" },
          { verse: 16, text: "Let your light shine before men in such a way that they may see your good deeds and moral excellence, and recognize and honor and glorify your Father who is in heaven." }
        ]
      },
      {
        chapter: 6,
        verses: [
          { verse: 33, text: "But first and most importantly seek (aim at, strive after) His kingdom and His righteousness [His way of doing and being right—the attitude and character of God], and all these things will be given to you also." }
        ]
      },
      {
        chapter: 28,
        verses: [
          { verse: 18, text: "Jesus came up and said to them, 'All authority (all power of absolute rule) in heaven and on earth has been given to Me.'" },
          { verse: 19, text: "Go therefore and make disciples of all the nations [help the people to learn of Me, believe in Me, and obey My words], baptizing them in the name of the Father and of the Son and of the Holy Spirit," },
          { verse: 20, text: "teaching them to observe everything that I have commanded you; and lo, I am with you always [remaining with you perpetually—regardless of circumstance, and on every occasion], even to the end of the age." }
        ]
      }
    ]
  },
  {
    id: 'joh',
    name: 'John',
    testament: 'NT',
    category: 'Gospels',
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 1, text: "In the beginning [before all time] was the Word (Christ), and the Word was with God, and the Word was God Himself." },
          { verse: 12, text: "But to as many as did receive and welcome Him, He gave the right [the authority, the privilege] to become children of God, that is, to those who believe in (adhere to, trust in, and rely on) His name—" },
          { verse: 14, text: "And the Word (Christ) became flesh and lived among us; and we [actually] saw His glory, glory as belongs to the [One and] only begotten Son of the Father, the [unconquerable, eternal] Son, full of grace and truth." }
        ]
      },
      {
        chapter: 3,
        verses: [
          { verse: 16, text: "For God so [greatly] loved and dearly prized the world, that He [even] gave His [One and] only begotten Son, so that whoever believes and trusts in Him [as Savior] shall not perish, but have eternal life." }
        ]
      },
      {
        chapter: 14,
        verses: [
          { verse: 12, text: "I assure you and most solemnly say to you, anyone who believes in Me [as Savior] will also do the things that I do; and he will do even greater things than these [in extent and outreach], because I am going to the Father." },
          { verse: 16, text: "And I will ask the Father, and He will give you another Helper (Comforter, Advocate, Intercessor—Counselor, Strengthener, Standby), to be with you forever—" },
          { verse: 26, text: "But the Helper (Comforter, Advocate, Intercessor—Counselor, Strengthener, Standby), the Holy Spirit, whom the Father will send in My name [in My place, to represent Me and act on My behalf], He will teach you all things. And He will help you remember everything that I have told you." }
        ]
      },
      {
        chapter: 15,
        verses: [
          { verse: 5, text: "I am the Vine; you are the branches. The one who remains in Me and I in him bears much fruit, for [otherwise] apart from Me [that is, cut off from vital union with Me] you can do nothing." },
          { verse: 16, text: "You have not chosen Me, but I have chosen you and I have appointed and placed and purposefully planted you, so that you would go and bear fruit and keep on bearing, and that your fruit will remain and be lasting, so that whatever you ask of the Father in My name He may give to you." }
        ]
      }
    ]
  },
  {
    id: 'phi',
    name: 'Philippians',
    testament: 'NT',
    category: 'Epistles',
    chapters: [
      {
        chapter: 4,
        verses: [
          { verse: 6, text: "Do not be anxious or worried about anything, but in everything [every circumstance and situation] by prayer and petition with thanksgiving, continue to make your [specific] requests known to God." },
          { verse: 7, text: "And the peace of God [that peace which transcends all understanding, that tranquil state of a soul assured of its salvation through Christ, and so fearing nothing from God and being content with its earthly lot of whatever sort that is, that peace] which surpasses all comprehension will guard your hearts and your minds in Christ Jesus." },
          { verse: 8, text: "Finally, believers, whatever is true, whatever is honorable and worthy of respect, whatever is right and confirmed by God's word, whatever is pure and wholesome, whatever is lovely and brings peace, whatever is admirable and of good repute; if there is any excellence, if there is anything worthy of praise, think on these things [weigh and take account of them]." },
          { verse: 13, text: "I can do all things [which He has called me to do] through Him who strengthens and empowers me [to fulfill His purpose—I am self-sufficient in Christ's sufficiency; I am ready for anything and equal to anything through Him who infuses me with inner strength and confident peace]." },
          { verse: 19, text: "And my God will liberally supply (fill until full) your every need according to His riches in glory in Christ Jesus." }
        ]
      }
    ]
  },
  {
    id: 'heb',
    name: 'Hebrews',
    testament: 'NT',
    category: 'Epistles',
    chapters: [
      {
        chapter: 11,
        verses: [
          { verse: 1, text: "Now faith is the assurance (title deed, confirmation) of things hoped for (divinely guaranteed), and the evidence of things not seen [the conviction of their reality—faith comprehends as fact what cannot be experienced by the physical senses]." },
          { verse: 6, text: "But without faith it is impossible to [walk with God and] please Him, for whoever comes [near] to God must [necessarily] believe that God exists and that He is a rewarder of those who earnestly and diligently seek Him." }
        ]
      },
      {
        chapter: 12,
        verses: [
          { verse: 1, text: "Therefore, since we are surrounded by so great a cloud of witnesses [who by faith have borne testimony to the truth of God's absolute faithfulness], stripping off every unnecessary weight and the sin which so easily and cleverly entangles us, let us run with endurance and active persistence the race that is set before us," },
          { verse: 2, text: "[looking away from all that will distract us and] focusing our eyes on Jesus, who is the Author and Perfecter of faith [the first incentive for our belief and the One who brings our faith to its maturity]." }
        ]
      }
    ]
  },
  {
    id: '1pe',
    name: '1 Peter',
    testament: 'NT',
    category: 'Epistles',
    chapters: [
      {
        chapter: 2,
        verses: [
          { verse: 9, text: "But you are a chosen race, a royal priesthood, a consecrated nation, a [special] people for God's own possession, so that you may proclaim the excellencies [the wonderful deeds and virtues and perfections] of Him who called you out of darkness into His marvelous light." }
        ]
      },
      {
        chapter: 5,
        verses: [
          { verse: 2, text: "shepherd and guide and protect the flock of God among you, exercising oversight not under compulsion, but voluntarily, according to the will of God; not for sordid gain, but with enthusiasm [with a willing spirit];" },
          { verse: 3, text: "not domineering [as arrogant, dictatorial, and overbearing persons] over those in your charge, but being examples of Christian living to the flock." },
          { verse: 7, text: "casting all your cares [all your anxieties, all your worries, and all your concerns, once and for all] on Him, for He cares about you [with deepest affection, and watches over you very carefully]." },
          { verse: 8, text: "Be sober [well balanced and self-disciplined], be alert and cautious at all times. That enemy of yours, the devil, prowls around like a roaring lion [fiercely hungry], seeking someone to devour." }
        ]
      }
    ]
  },
  // --- OLD TESTAMENT FOUNDATIONS ---
  {
    id: 'isa',
    name: 'Isaiah',
    testament: 'OT',
    category: 'Prophecy',
    chapters: [
      {
        chapter: 40,
        verses: [
          { verse: 29, text: "He gives strength to the weary, and to him who has no might He increases power." },
          { verse: 31, text: "But those who wait for the Lord [who expect, look for, and hope in Him] will gain new strength and renew their power; they will lift up their wings [and rise up close to God] like eagles [rising toward the sun]; they will run and not become weary, they will walk and not grow tired." }
        ]
      },
      {
        chapter: 53,
        verses: [
          { verse: 5, text: "But He was wounded for our transgressions, He was crushed for our wickedness [our sin, our injustice, our wrongdoing]; the punishment [required] for our well-being fell on Him, and by His stripes (wounds) we are healed." }
        ]
      },
      {
        chapter: 61,
        verses: [
          { verse: 1, text: "The Spirit of the Lord God is upon me, because the Lord has anointed me to preach good news to the humble and afflicted; He has sent me to bind up the [wounds of the] brokenhearted, to proclaim release [from confinement and condemnation] to the [physical and spiritual] captives and freedom to prisoners," },
          { verse: 2, text: "to proclaim the acceptable year of the Lord [the year of His favor] and the day of vengeance and retribution of our God, to comfort all who mourn," },
          { verse: 3, text: "to grant to those who mourn in Zion the following: to give them a turban instead of dust [on their heads], the oil of joy instead of mourning, the garment [expressive] of praise instead of a disheartened spirit. So they will be called the trees of righteousness [strong and magnificent, distinguished for integrity, justice, and right standing with God], the planting of the Lord, that He may be glorified." }
        ]
      }
    ]
  },
  {
    id: 'jer',
    name: 'Jeremiah',
    testament: 'OT',
    category: 'Prophecy',
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 5, text: "Before I formed you in the womb I knew [and] approved of you [as My chosen instrument], and before you were born I separated and set you apart, consecrating you; [and] I appointed you as a prophet to the nations." },
          { verse: 9, text: "Then the Lord stretched out His hand and touched my mouth, and the Lord said to me, 'Behold, I have put My words in your mouth.'" }
        ]
      },
      {
        chapter: 29,
        verses: [
          { verse: 11, text: "'For I know the plans and thoughts that I have for you,' says the Lord, 'plans for peace and well-being and not for disaster, to give you a future and a hope.'" },
          { verse: 12, text: "Then you will call on Me and you will come and pray to Me, and I will hear [and heed] you." },
          { verse: 13, text: "Then [with a deep longing] you will seek Me and require Me [as a vital necessity] and [you will] find Me when you search for Me with all your heart." }
        ]
      },
      {
        chapter: 33,
        verses: [
          { verse: 3, text: "'Call to Me and I will answer you, and tell you [and even show you] great and mighty things, [things which have been confined and hidden], which you do not know and understand and cannot distinguish.'" }
        ]
      }
    ]
  },
  {
    id: 'psa',
    name: 'Psalms',
    testament: 'OT',
    category: 'Wisdom',
    chapters: [
      {
        chapter: 23,
        verses: [
          { verse: 1, text: "The Lord is my Shepherd [to feed, to guide and to shield me], I shall not want." },
          { verse: 2, text: "He lets me lie down in green pastures; He leads me beside the still and quiet waters." },
          { verse: 3, text: "He refreshes and restores my soul (life); He leads me in the paths of righteousness for His name's sake." },
          { verse: 4, text: "Even though I walk through the [sunless] valley of the shadow of death, I fear no evil, for You are with me; Your rod [to protect] and Your staff [to guide], they comfort and console me." },
          { verse: 5, text: "You prepare a table before me in the presence of my enemies. You have anointed and refreshed my head with oil; my cup overflows." },
          { verse: 6, text: "Surely goodness and mercy and unfailing love shall follow me all the days of my life, and I will dwell [forever] in the house and the presence of the Lord." }
        ]
      },
      {
        chapter: 91,
        verses: [
          { verse: 1, text: "He who dwells in the shelter of the Most High will remain secure and rest in the shadow of the Almighty [whose power no enemy can withstand]." },
          { verse: 2, text: "I will say of the Lord, 'He is my refuge and my fortress, my God, in whom I trust [with great confidence, and on whom I rely]!'" },
          { verse: 11, text: "For He will command His angels in regard to you, to protect and defend and guard you in all your ways [of obedience and service]." }
        ]
      },
      {
        chapter: 119,
        verses: [
          { verse: 105, text: "Your word is a lamp to my feet and a light to my path." },
          { verse: 130, text: "The unfolding of Your words gives light; it gives understanding to the simple." }
        ]
      }
    ]
  },
  {
    id: 'pro',
    name: 'Proverbs',
    testament: 'OT',
    category: 'Wisdom',
    chapters: [
      {
        chapter: 3,
        verses: [
          { verse: 5, text: "Trust in and rely confidently on the Lord with all your heart and do not rely on your own insight or understanding." },
          { verse: 6, text: "In all your ways know and acknowledge and recognize Him, and He will make your paths straight and smooth [removing obstacles that block your way]." }
        ]
      },
      {
        chapter: 4,
        verses: [
          { verse: 20, text: "My son, pay attention to my words and be willing to learn; open your ears to my sayings." },
          { verse: 22, text: "For they are life to those who find them, and healing and health to all their body." },
          { verse: 23, text: "Watch over your heart with all diligence, for from it flow the springs of life." }
        ]
      }
    ]
  },
  {
    id: 'jos',
    name: 'Joshua',
    testament: 'OT',
    category: 'History',
    chapters: [
      {
        chapter: 1,
        verses: [
          { verse: 8, text: "This Book of the Law shall not depart from your mouth, but you shall read [and meditate on] it day and night, so that you may be careful to do [everything] in accordance with all that is written in it; for then you will make your way prosperous, and then you will be successful." },
          { verse: 9, text: "Have I not commanded you? Be strong and courageous! Do not be terrified or dismayed (intimidated), for the Lord your God is with you wherever you go." }
        ]
      }
    ]
  },
  {
    id: 'joe',
    name: 'Joel',
    testament: 'OT',
    category: 'Prophecy',
    chapters: [
      {
        chapter: 2,
        verses: [
          { verse: 28, text: "'It shall come about after this that I will pour out My Spirit on all mankind; and your sons and your daughters will prophesy, your old men will dream dreams, your young men will see visions.'" }
        ]
      }
    ]
  }
];

// Quick search in Amplified Bible
export interface ScriptureSearchResult {
  bookName: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

export function searchAmpBible(query: string): ScriptureSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const results: ScriptureSearchResult[] = [];
  const lowerQuery = trimmed.toLowerCase();

  // Check if query is a reference like "2 Tim 2:15" or "Ephesians 4:11" or "Romans 8:28"
  const refMatch = trimmed.match(/^([0-9]?\s*[A-Za-z]+)\s*(\d+)(?::(\d+))?$/);
  if (refMatch) {
    const rawBook = refMatch[1].toLowerCase().replace(/\s+/g, '');
    const reqChapter = parseInt(refMatch[2], 10);
    const reqVerse = refMatch[3] ? parseInt(refMatch[3], 10) : null;

    const matchedBook = AMP_BIBLE_BOOKS.find(b => {
      const bName = b.name.toLowerCase().replace(/\s+/g, '');
      const bId = b.id.toLowerCase();
      return bName.includes(rawBook) || rawBook.includes(bName) || bId.startsWith(rawBook);
    });

    if (matchedBook) {
      const ch = matchedBook.chapters.find(c => c.chapter === reqChapter);
      if (ch) {
        ch.verses.forEach(v => {
          if (!reqVerse || v.verse === reqVerse) {
            results.push({
              bookName: matchedBook.name,
              bookId: matchedBook.id,
              chapter: ch.chapter,
              verse: v.verse,
              text: v.text,
              reference: `${matchedBook.name} ${ch.chapter}:${v.verse} (AMP)`
            });
          }
        });
        if (results.length > 0) return results;
      }
    }
  }

  // Keyword / Text Search
  for (const book of AMP_BIBLE_BOOKS) {
    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        if (
          v.text.toLowerCase().includes(lowerQuery) ||
          book.name.toLowerCase().includes(lowerQuery) ||
          `${book.name} ${ch.chapter}:${v.verse}`.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            bookName: book.name,
            bookId: book.id,
            chapter: ch.chapter,
            verse: v.verse,
            text: v.text,
            reference: `${book.name} ${ch.chapter}:${v.verse} (AMP)`
          });
        }
        if (results.length >= 25) break;
      }
      if (results.length >= 25) break;
    }
    if (results.length >= 25) break;
  }

  return results;
}
