// Multi-Translation Bible Dataset for HTEIM School of Ministry
// Provides King James Version (KJV) and comparative verse datasets to complement the Amplified Bible (AMP)

export interface BibleVerseTranslation {
  verse: number;
  amp: string;
  kjv: string;
}

export interface BibleChapterMulti {
  chapter: number;
  verses: BibleVerseTranslation[];
}

export interface BibleBookMulti {
  id: string; // '2ti', 'eph', 'rom', 'mat', 'psa', 'heb', 'pro'
  name: string;
  testament: 'OT' | 'NT';
  category: string;
  chapters: BibleChapterMulti[];
}

export const MULTI_TRANSLATION_BOOKS: BibleBookMulti[] = [
  {
    id: '2ti',
    name: '2 Timothy',
    testament: 'NT',
    category: 'Pastoral Epistles',
    chapters: [
      {
        chapter: 1,
        verses: [
          {
            verse: 6,
            amp: "That is why I remind you to fan into flame the gracious gift of God, [that inner fire—the special endowment] which is in you through the laying on of my hands [with their prophetic declarations].",
            kjv: "Wherefore I put thee in remembrance that thou stir up the gift of God, which is in thee by the putting on of my hands."
          },
          {
            verse: 7,
            amp: "For God did not give us a spirit of timidity or cowardice or fear, but [He has given us a spirit] of power and of love and of sound judgment and personal discipline [abilities that result in a calm, well-balanced mind and self-control].",
            kjv: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind."
          },
          {
            verse: 13,
            amp: "Hold fast and follow the pattern of sound doctrine and wholesome teachings which you have heard from me, in the faith and love which are in Christ Jesus.",
            kjv: "Hold fast the form of sound words, which thou hast heard of me, in faith and love which is in Christ Jesus."
          },
          {
            verse: 14,
            amp: "Carefully guard and protect [as a precious deposit] that excellent and priceless truth which has been entrusted to you by the Holy Spirit who dwells within us.",
            kjv: "That good thing which was committed unto thee keep by the Holy Ghost which dwelleth in us."
          }
        ]
      },
      {
        chapter: 2,
        verses: [
          {
            verse: 1,
            amp: "So you, my son, be strong [constantly strengthened and empowered] in the grace that is [to be found only] in Christ Jesus.",
            kjv: "Thou therefore, my son, be strong in the grace that is in Christ Jesus."
          },
          {
            verse: 2,
            amp: "The things which you have heard from me in the presence of many witnesses, entrust to reliable and faithful men who will also be capable and qualified to teach others.",
            kjv: "And the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also."
          },
          {
            verse: 3,
            amp: "Take your share of hardship as a good soldier of Christ Jesus.",
            kjv: "Thou therefore endure hardness, as a good soldier of Jesus Christ."
          },
          {
            verse: 15,
            amp: "Study and do your utmost to present yourself approved unto God, a workman that needeth not to be ashamed, accurately handling and skillfully teaching the word of truth.",
            kjv: "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth."
          },
          {
            verse: 20,
            amp: "Now in a large house there are not only vessels and objects of gold and silver, but also vessels and objects of wood and of earthenware, and some are for honorable (noble, good) use and some for dishonorable (ignoble, common).",
            kjv: "But in a great house there are not only vessels of gold and of silver, but also of wood and of earth; and some to honour, and some to dishonour."
          },
          {
            verse: 21,
            amp: "Therefore, if anyone cleanses himself from these things [which are dishonorable—disobedient, sinful], he will be a vessel for honor, sanctified [set apart for a special purpose and made holy], useful to the Master, prepared for every good work.",
            kjv: "If a man therefore purge himself from these, he shall be a vessel unto honour, sanctified, and meet for the master's use, and prepared unto every good work."
          }
        ]
      },
      {
        chapter: 3,
        verses: [
          {
            verse: 16,
            amp: "All Scripture is God-breathed [given by divine inspiration] and is profitable for instruction, for conviction [of sin], for correction [of error and restoration to obedience], for training in righteousness [learning to live in conformity to God's will];",
            kjv: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:"
          },
          {
            verse: 17,
            amp: "so that the man of God may be complete and proficient, outfitted and thoroughly equipped for every good work.",
            kjv: "That the man of God may be perfect, throughly furnished unto all good works."
          }
        ]
      },
      {
        chapter: 4,
        verses: [
          {
            verse: 2,
            amp: "preach the word [as an official messenger—publicly proclaim the teachings of Christ]; be ready when the time is right and even when it is not [keep your sense of urgency, whether the opportunity seems favorable or unfavorable];",
            kjv: "Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine."
          },
          {
            verse: 5,
            amp: "As for you, be calm and sober-minded and steady in all situations, tolerate the hardship, do the work of an evangelist, fulfill [the duties of] your ministry.",
            kjv: "But watch thou in all things, endure afflictions, do the work of an evangelist, make full proof of thy ministry."
          }
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
        chapter: 4,
        verses: [
          {
            verse: 11,
            amp: "And [His gifts to the church were varied and] He Himself appointed some as apostles [special messengers, representatives], some as prophets [who speak a new message from God to the people], some as evangelists [who spread the good news of salvation], and some as pastors and teachers [to shepherd and guide and instruct],",
            kjv: "And he gave some, apostles; and some, prophets; and some, evangelists; and some, pastors and teachers;"
          },
          {
            verse: 12,
            amp: "and [His purpose in doing so was] for the equipping of the saints for the work of service and ministry, for building up the body of Christ [the church];",
            kjv: "For the perfecting of the saints, for the work of the ministry, for the edifying of the body of Christ:"
          },
          {
            verse: 13,
            amp: "until we all reach oneness in the faith and in the knowledge of the Son of God, [growing until we become] a mature man, [reaching] the measure of the full stature of Christ [which is His completeness and perfection].",
            kjv: "Till we all come in the unity of the faith, and of the knowledge of the Son of God, unto a perfect man, unto the measure of the stature of the fulness of Christ:"
          }
        ]
      },
      {
        chapter: 6,
        verses: [
          {
            verse: 10,
            amp: "In conclusion, be strong in the Lord [draw your strength from Him and be empowered through your union with Him] and in the power of His [boundless] might.",
            kjv: "Finally, my brethren, be strong in the Lord, and in the power of his might."
          },
          {
            verse: 11,
            amp: "Put on the full armor of God [for His precepts are like the splendid armor of a heavily-armed soldier], so that you may be able to [successfully] stand up against all the schemes and the strategies and the deceits of the devil.",
            kjv: "Put on the whole armour of God, that ye may be able to stand against the wiles of the devil."
          },
          {
            verse: 12,
            amp: "For our struggle is not against flesh and blood [contending only with physical opponents], but against the rulers, against the powers, against the world forces of this [present] darkness, against the spiritual forces of wickedness in the heavenly (supernatural) places.",
            kjv: "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places."
          }
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
        chapter: 12,
        verses: [
          {
            verse: 1,
            amp: "Therefore I urge you, brothers and sisters, by the mercies of God, to present your bodies [dedicating all of yourselves, set apart] as a living sacrifice, holy and well-pleasing to God, which is your rational (logical, intelligent) act of worship.",
            kjv: "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service."
          },
          {
            verse: 2,
            amp: "And do not be conformed to this world [any longer with its superficial values and customs], but be transformed and progressively changed [as you mature spiritually] by the renewing of your mind [focusing on godly values and ethical attitudes], so that you may prove [for yourselves] what the will of God is, that which is good and acceptable and perfect [in His plan and purpose for you].",
            kjv: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God."
          }
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
          {
            verse: 1,
            amp: "Now faith is the assurance (title deed, confirmation) of things hoped for (divinely guaranteed), and the evidence of things not seen [the conviction of their reality—faith comprehends as fact what cannot be experienced by the physical senses].",
            kjv: "Now faith is the substance of things hoped for, the evidence of things not seen."
          },
          {
            verse: 6,
            amp: "But without faith it is impossible to [walk with God and] please Him, for whoever comes [near] to God must [necessarily] believe that God exists and that He rewards those who [earnestly and diligently] seek Him.",
            kjv: "But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him."
          }
        ]
      }
    ]
  },
  {
    id: 'psa',
    name: 'Psalms',
    testament: 'OT',
    category: 'Wisdom & Poetry',
    chapters: [
      {
        chapter: 23,
        verses: [
          {
            verse: 1,
            amp: "The Lord is my Shepherd [to feed, to guide and to shield me], I shall not want.",
            kjv: "The LORD is my shepherd; I shall not want."
          },
          {
            verse: 2,
            amp: "He makes me lie down in green pastures; He leads me beside still and restful waters.",
            kjv: "He maketh me to lie down in green pastures: he leadeth me beside the still waters."
          },
          {
            verse: 3,
            amp: "He refreshes and restores my soul (life); He leads me in the paths of righteousness for His name's sake.",
            kjv: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."
          }
        ]
      },
      {
        chapter: 91,
        verses: [
          {
            verse: 1,
            amp: "He who dwells in the shelter of the Most High will remain secure and rest in the shadow of the Almighty [whose power no enemy can withstand].",
            kjv: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty."
          },
          {
            verse: 2,
            amp: "I will say of the Lord, 'He is my refuge and my fortress, my God, in whom I trust [with great confidence, and on whom I rely]!'",
            kjv: "I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust."
          }
        ]
      }
    ]
  }
];

export const getMultiTranslationVerse = (bookId: string, chapterNum: number, verseNum: number) => {
  const book = MULTI_TRANSLATION_BOOKS.find(b => b.id.toLowerCase() === bookId.toLowerCase());
  if (!book) return null;
  const chapter = book.chapters.find(c => c.chapter === chapterNum);
  if (!chapter) return null;
  return chapter.verses.find(v => v.verse === verseNum) || null;
};
