// HTEIM School of Ministry — Production Institutional Constants
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
  The 14 official curriculum class sessions for the 2026 academic calendar.
 */
export const CURRICULUM_CLASS_DAYS: ClassDayItem[] = [
  { id: "School of the Pastors Pt2", name: "School of the Pastors Pt 2 (08/09/2026)", date: "2026-09-08" },
  { id: "School of the Pastors pt 1", name: "School of the Pastors Pt 1 (01/09/2026)", date: "2026-09-01" },
  { id: "Apostolic Pt 3", name: "Apostolic Pt 3 (25/08/2026)", date: "2026-08-25" },
  { id: "Apostolic Pt 2", name: "Apostolic Pt 2 (18/08/2026)", date: "2026-08-18" },
  { id: "Apostolic Pt 1", name: "Apostolic Pt 1 (11/08/2026)", date: "2026-08-11" },
  { id: "Lesson 8 Assignment", name: "Lesson 8 Assignment (30/06/2026)", date: "2026-06-30" },
  { id: "Lesson 7 Assignment", name: "Lesson 7 Assignment (23/06/2026)", date: "2026-06-23" },
  { id: "Lesson 6 Assignment", name: "Lesson 6 Assignment (16/06/2026)", date: "2026-06-16" },
  { id: "Lesson 5 Assignment", name: "Lesson 5 Assignment (09/06/2026)", date: "2026-06-09" },
  { id: "Lesson 4 Assignment Part 2", name: "Lesson 4 Assignment Part 2 (02/06/2026)", date: "2026-06-02" },
  { id: "Lesson 4 Assignment", name: "Lesson 4 Assignment (26/05/2026)", date: "2026-05-26" },
  { id: "Lesson 3 Assignment", name: "Lesson 3 Assignment (19/05/2026)", date: "2026-05-19" },
  { id: "Lesson 2 Assignment", name: "Lesson 2 Assignment (12/05/2026)", date: "2026-05-12" },
  { id: "Lesson 1 Responses", name: "Lesson 1 Responses (05/05/2026)", date: "2026-05-05" },
];

/**
  The 59 official enrolled students in the HTEIM School of Ministry active cohort.
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
  "Colette Blackburne Joseph",
  "Denise Edwards",
  "Dessel Williams",
  "Diana Selkridge",
  "Felicia Williams",
  "Francisca Swift",
  "Ingrid Bonval-Butcher",
  "Javier Marks",
  "Jeannine Lingo",
  "Jennyfer St. Flour",
  "John Pierre",
  "Judith Boodram",
  "Julie Charles",
  "Karen St. Louis",
  "Karlene Pierre",
  "Kathy - Ann Waithe",
  "Katrina Thomas",
  "Keilah Thomas",
  "Kernika Thomas",
  "Keshia Fleary",
  "Kewana P. Thomas",
  "Krystal Fleary",
  "Kymron Popo",
  "Lakeram Sookraj",
  "Lateisha Fleary",
  "Mahailet Thomas",
  "Marcella Thompson",
  "Marcia D'Arceuil",
  "Marcia Edwards",
  "Marsha D'Arceuil",
  "Maureen Vidale",
  "Melisia Thomas",
  "Mercia Sookraj",
  "Micah Popo",
  "Nadia Thomas",
  "Nadine Popo",
  "Naomi Thomas",
  "Nathalie Thomas",
  "Natasha Thomas",
  "Nicholas Thomas",
  "Nicole Popo",
  "Nigel Thomas",
  "O'Neil Thomas",
  "Patricia Thomas",
  "Paul Thomas",
  "Paula Thomas",
  "Pearl Thomas",
  "Peter Thomas",
  "Rachel Thomas",
  "Roxanne Thomas"
];
