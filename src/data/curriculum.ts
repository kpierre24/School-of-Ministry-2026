// HTEIM School of Ministry — Master Institutional Curriculum & Student Roster
// Official Academic Cohort 2025–2026 Definitions

export interface CurriculumRecord {
  name: string;
  classDay: string;
  timestamp: string;
  score: string;
  present: boolean;
  isDemo?: boolean;
  source?: string;
}

export interface ClassDayItem {
  id: string;
  name: string;
  date: string;
}

/**
 * Detects obsolete legacy class day IDs or duplicated placeholder names
 * (e.g. "School of the Pastors Pt 4", "School of the Pastors Pt 3", "Apostolic Pt 1", "Lesson 8 Assignment", etc.)
 * that were superseded by the canonical 16 Google Sheet tabs.
 */
export const isObsoleteLegacyClassDay = (idOrName: string | undefined | null): boolean => {
  if (!idOrName) return false;
  const normalized = idOrName.toLowerCase().trim();

  // Pattern matching for old naming conventions:
  // 1. School of the Pastors Pt 1..4 / Part 1..4
  if (/^school\s+of\s+the\s+pastors\s+(pt|part)\.?\s*\d+/i.test(normalized)) return true;
  // 2. Apostolic Pt 1..3 / Part 1..3
  if (/^apostolic\s+(pt|part)\.?\s*\d+/i.test(normalized)) return true;
  // 3. Lesson X Assignment / Lesson 1 Responses / Lesson 4 Assignment Part 2
  if (/^lesson\s+\d+\s+(assignment|responses)/i.test(normalized)) return true;

  const LEGACY_OBSOLETE_SET = new Set([
    'school of the pastors pt 4',
    'school of the pastors pt4',
    'school of the pastors pt 3',
    'school of the pastors pt3',
    'school of the pastors pt 2',
    'school of the pastors pt2',
    'school of the pastors pt 1',
    'school of the pastors pt1',
    'school of the pastors pt. 4',
    'school of the pastors pt. 3',
    'school of the pastors pt. 2',
    'school of the pastors pt. 1',
    'school of the pastors part 4',
    'school of the pastors part 3',
    'school of the pastors part 2',
    'school of the pastors part 1',
    'apostolic pt 3',
    'apostolic pt3',
    'apostolic pt 2',
    'apostolic pt2',
    'apostolic pt 1',
    'apostolic pt1',
    'apostolic pt. 3',
    'apostolic pt. 2',
    'apostolic pt. 1',
    'apostolic part 3',
    'apostolic part 2',
    'apostolic part 1',
    'lesson 8 assignment',
    'lesson 7 assignment',
    'lesson 6 assignment',
    'lesson 5 assignment',
    'lesson 4 assignment part 2',
    'lesson 4 assignment',
    'lesson 3 assignment',
    'lesson 2 assignment',
    'lesson 1 responses'
  ]);

  return LEGACY_OBSOLETE_SET.has(normalized);
};

/**
 * The 16 official curriculum class sessions & quiz lessons for the HTEIM School of Ministry course.
 */
export const CURRICULUM_CLASS_DAYS: ClassDayItem[] = [
  { id: "School of the Pastors Lesson 16", name: "School of the Pastors Lesson 16 (15/09/2026)", date: "2026-09-15" },
  { id: "School of the Pastors Lesson 15", name: "School of the Pastors Lesson 15 (08/09/2026)", date: "2026-09-08" },
  { id: "School of the Pastors Lesson 14", name: "School of the Pastors Lesson 14 (01/09/2026)", date: "2026-09-01" },
  { id: "School of the Pastors Lesson 13", name: "School of the Pastors Lesson 13 (18/08/2026)", date: "2026-08-18" },
  { id: "Apostolic Lesson 12", name: "Apostolic Lesson 12 (11/08/2026)", date: "2026-08-11" },
  { id: "Apostolic Lesson 11", name: "Apostolic Lesson 11 (04/08/2026)", date: "2026-08-04" },
  { id: "Apostolic Lesson 10", name: "Apostolic Lesson 10 (21/07/2026)", date: "2026-07-21" },
  { id: "Ministerial Ethics lesson 9", name: "Ministerial Ethics Lesson 9 (14/07/2026)", date: "2026-07-14" },
  { id: "Ministerial Ethics Lesson 8", name: "Ministerial Ethics Lesson 8 (30/06/2026)", date: "2026-06-30" },
  { id: "Evangelism Lesson 7", name: "Evangelism Lesson 7 (09/06/2026)", date: "2026-06-09" },
  { id: "Evangelism lesson 6", name: "Evangelism Lesson 6 (02/06/2026)", date: "2026-06-02" },
  { id: "Evangelism Lesson 5", name: "Evangelism Lesson 5 (26/05/2026)", date: "2026-05-26" },
  { id: "Evangelism Lesson 4", name: "Evangelism Lesson 4 (19/05/2026)", date: "2026-05-19" },
  { id: "Evangelism Lesson 3", name: "Evangelism Lesson 3 (12/05/2026)", date: "2026-05-12" },
  { id: "Evangelism Lesson 2", name: "Evangelism Lesson 2 (05/05/2026)", date: "2026-05-05" },
  { id: "Introduction", name: "Introduction (21/04/2026)", date: "2026-04-21" },
];

/**
 * The 59 enrolled students in the HTEIM School of Ministry active cohort.
 */
export const MASTER_ENROLLED_STUDENTS: string[] = [
  "Afeshia Burke",
  "Afi Thompson",
  "Alicia Noray Bowles",
  "Anne-Marie Davis",
  "Atiya Williams",
  "Beverly Selkridge",
  "Candy Webb",
  "Catherine Vidale",
  "Claudia Cashe",
  "Colette Blackburne-Joseph",
  "Denise Edwards",
  "Dessel Williams",
  "Diana Selkridge",
  "Felicia Williams",
  "Francisca Swift",
  "Ingrid Bonval-Butcher",
  "Javier Marks",
  "Jenetta Pierre",
  "Jennylyn Dickson",
  "Jerzelle Whiteman",
  "Jessica Fiddler",
  "Josanne Pompey",
  "Jovanka Williams",
  "Julie-Ann Fernandes-Charles",
  "Kabrina Morris-Jack",
  "Kadijah Daniel",
  "Kathleen Joseph-Sandy",
  "Kemrolene Bowens-Opadeyi",
  "Keyshana Gomes",
  "Kristy Alexander",
  "Krystal Mohammed",
  "Leslie Inniss",
  "Lynton Pompey",
  "Marlene Walker-Castle",
  "Mishael Daniel",
  "Natalie Webb Lewis",
  "Natasha Williams",
  "Nevillean Dundas",
  "Niomi Loverne Joseph Marksman",
  "Paula Massiah Blount",
  "Quacy Marecheau",
  "Racine Roy",
  "Racquel Gumbs",
  "Regina Joseph-Gonzales",
  "Rennie Bowles",
  "Richard Roberts",
  "Roxanne Sealey",
  "Ruth Vernon",
  "Shellon Liddell",
  "Stacey Waithe",
  "Susan Sparks",
  "Sybris Walker-Castle",
  "Tessa Phipps",
  "Tricia Worrell",
  "Vanessa Mohammed",
  "Vikash Ramnarace",
  "Wendy Woodruffe",
  "Whitney Tracey Seelochan",
  "Zahra Andrews"
];
