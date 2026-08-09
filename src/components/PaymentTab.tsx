import React, { useState, useEffect, useMemo, useRef } from 'react';
import hteimLogoAsset from '../assets/hteim_logo.png';
import { logActivity } from '../lib/auditLogger';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  Plus,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Download,
  ExternalLink,
  Settings,
  Sparkles,
  RefreshCw,
  Printer,
  X,
  User,
  BookOpen,
  PieChart,
  ShieldAlert,
  ArrowUpRight,
  Receipt,
  Paperclip,
  Trash2,
  Eye,
  UploadCloud,
  MessageSquare,
  Phone,
  Mail,
  Share2,
  Loader2
} from 'lucide-react';
import { PaymentRecord } from '../types';
import { generateTuitionReceiptPDF, generateStudentAccountStatementPDF } from '../lib/pdfReceiptGenerator';
import { BulkPaymentReminderModal } from './BulkPaymentReminderModal';
import { uploadToSupabaseStorage } from '../lib/supabaseClient';

interface PaymentTabProps {
  availableStudents: { name: string; email?: string }[];
  isAdmin: boolean;
  currentStudentName?: string;
  userRole?: string;
  payments?: PaymentRecord[];
  setPayments?: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  onDeleteStudent?: (studentName: string) => void;
  onRestoreStudent?: (studentName: string) => void;
}

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    "id": "pay-sheet-1",
    "studentName": "Afeshia Burke",
    "studentId": "HTEIM-2026-1226",
    "email": "afeshiajones16@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 600,
    "status": "Partial",
    "lastPaymentDate": "8th april 2026",
    "paymentMethod": "Cash",
    "notes": "Google Sheet Record #1. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $400 on 8th June 2026, $200 on 8th april 2026."
  },
  {
    "id": "pay-sheet-2",
    "studentName": "Afi Thompson",
    "studentId": "HTEIM-2026-1160",
    "email": "Afireforestation2016@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #2. Country: Tobago. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-3",
    "studentName": "ANNE-MARIE DAVIS",
    "studentId": "HTEIM-2026-1108",
    "email": "annejazz2014@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 600,
    "status": "Partial",
    "lastPaymentDate": "22/03/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #3. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $400 on 20/05/2026, $200 on 22/03/2026."
  },
  {
    "id": "pay-sheet-4",
    "studentName": "Atiya Williams",
    "studentId": "HTEIM-2026-1370",
    "email": "atiyaw79@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 1200,
    "status": "Paid In Full",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Scholarship",
    "notes": "Google Sheet Record #4. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $1200 on ."
  },
  {
    "id": "pay-sheet-5",
    "studentName": "Beverly Selkridge",
    "studentId": "HTEIM-2026-1683",
    "email": "marilynmitchell603@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 700,
    "status": "Partial",
    "lastPaymentDate": "19/04/2026",
    "paymentMethod": "Credit Card",
    "notes": "Google Sheet Record #5. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $700 on 19/04/2026."
  },
  {
    "id": "pay-sheet-6",
    "studentName": "Candy Webb",
    "studentId": "HTEIM-2026-911",
    "email": "candywebb4321@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 1000,
    "status": "Partial",
    "lastPaymentDate": "April 13th 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #6. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $1000 on April 13th 2026."
  },
  {
    "id": "pay-sheet-7",
    "studentName": "Claudia Cashe",
    "studentId": "HTEIM-2026-1207",
    "email": "claudiacashe@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "April 12 2026",
    "paymentMethod": "Cash",
    "notes": "Google Sheet Record #7. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on April 12 2026."
  },
  {
    "id": "pay-sheet-8",
    "studentName": "Denise Edwards",
    "studentId": "HTEIM-2026-1346",
    "email": "Deniseedwards6561@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #8. Country: Tobago. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-9",
    "studentName": "Dessel Williams",
    "studentId": "HTEIM-2026-1474",
    "email": "desselwill@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #9. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-10",
    "studentName": "Felicia Williams",
    "studentId": "HTEIM-2026-1551",
    "email": "wfelicia399@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 1200,
    "status": "Paid In Full",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Scholarship",
    "notes": "Google Sheet Record #10. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $1200 on ."
  },
  {
    "id": "pay-sheet-11",
    "studentName": "Ingrid Bonval-Butcher",
    "studentId": "HTEIM-2026-2009",
    "email": "hbonval@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 800,
    "status": "Partial",
    "lastPaymentDate": "26/05/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #11. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $300 on , $300 on 03/05/2026, $200 on 26/05/2026."
  },
  {
    "id": "pay-sheet-13",
    "studentName": "Javier Marks",
    "studentId": "HTEIM-2026-1151",
    "email": "Michael.marix@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #13. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-14",
    "studentName": "Jerzelle Whiteman",
    "studentId": "HTEIM-2026-1690",
    "email": "Jerzellewhiteman@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #14. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on ."
  },
  {
    "id": "pay-sheet-15",
    "studentName": "JESSICA FIDDLER",
    "studentId": "HTEIM-2026-1052",
    "email": "Jessicafiddler76@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "26/04/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #15. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $100 on 30/05/2026, $100 on 26/04/2026."
  },
  {
    "id": "pay-sheet-16",
    "studentName": "Josanne Pompey",
    "studentId": "HTEIM-2026-1384",
    "email": "Josieorrpompey1@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "19th April 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #16. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on 19th April 2026."
  },
  {
    "id": "pay-sheet-17",
    "studentName": "Jovanka Williams",
    "studentId": "HTEIM-2026-1580",
    "email": "jovankaw@yahoo.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #17. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-18",
    "studentName": "Julie-Ann Fernandes-Charles",
    "studentId": "HTEIM-2026-2536",
    "email": "juliefernandes866@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "April 8th 2026",
    "paymentMethod": "Credit Card",
    "notes": "Google Sheet Record #18. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on April 8th 2026."
  },
  {
    "id": "pay-sheet-19",
    "studentName": "Kadijah Daniel",
    "studentId": "HTEIM-2026-1305",
    "email": "kadijahbenjamin82@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #19. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-20",
    "studentName": "Kristy Alexander",
    "studentId": "HTEIM-2026-1594",
    "email": "Kryssi2010@hotmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 700,
    "status": "Partial",
    "lastPaymentDate": "6th April 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #20. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $500 on 8th June 2026, $200 on 6th April 2026."
  },
  {
    "id": "pay-sheet-21",
    "studentName": "Leslie Inniss",
    "studentId": "HTEIM-2026-1266",
    "email": "Leslie.inniss.serv@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 500,
    "status": "Partial",
    "lastPaymentDate": "April 12th 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #21. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $500 on April 12th 2026."
  },
  {
    "id": "pay-sheet-22",
    "studentName": "Lynton Pompey",
    "studentId": "HTEIM-2026-1310",
    "email": "mr.lpompey@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "19/04/2026",
    "paymentMethod": "Cash",
    "notes": "Google Sheet Record #22. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on 19/04/2026."
  },
  {
    "id": "pay-sheet-23",
    "studentName": "Marlene Walker-Castle",
    "studentId": "HTEIM-2026-2003",
    "email": "info. mercedessolutions@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "14th April 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #23. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on 14th April 2026."
  },
  {
    "id": "pay-sheet-25",
    "studentName": "Mishael Daniel",
    "studentId": "HTEIM-2026-1328",
    "email": "Mishaeldaniel06@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #25. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-26",
    "studentName": "Natalie Webb Lewis",
    "studentId": "HTEIM-2026-1666",
    "email": "Nwl317@yahoo.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #26. Country: United States . Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-27",
    "studentName": "Natasha Williams",
    "studentId": "HTEIM-2026-1570",
    "email": "tashmcfash12@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #27. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-28",
    "studentName": "Paula Massiah Blount",
    "studentId": "HTEIM-2026-1901",
    "email": "Blountpaula@rocketmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #28. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-29",
    "studentName": "Regina Joseph- Gonzales",
    "studentId": "HTEIM-2026-2159",
    "email": "profesoragonzales91@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 400,
    "status": "Partial",
    "lastPaymentDate": "19th April 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #29. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $400 on 19th April 2026."
  },
  {
    "id": "pay-sheet-30",
    "studentName": "Rennie Bowles",
    "studentId": "HTEIM-2026-1261",
    "email": "Parenz_360@yahoo.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "April 12th 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #30. Country: Tobago. Role: Student. Enrollment Status: Active. Payment History: $200 on April 12th 2026."
  },
  {
    "id": "pay-sheet-31",
    "studentName": "Richard Roberts",
    "studentId": "HTEIM-2026-1470",
    "email": "rrobertslionheart@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #31. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-32",
    "studentName": "Roxanne Sealey",
    "studentId": "HTEIM-2026-1374",
    "email": "roxannesealey1971@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 1000,
    "status": "Partial",
    "lastPaymentDate": "April 14th 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #32. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $1000 on April 14th 2026."
  },
  {
    "id": "pay-sheet-33",
    "studentName": "Shellon Liddell",
    "studentId": "HTEIM-2026-1455",
    "email": "uvanie@yahoo.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #33. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-34",
    "studentName": "Stacey Waithe",
    "studentId": "HTEIM-2026-1259",
    "email": "educatingintruth@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 1200,
    "status": "Paid In Full",
    "lastPaymentDate": "April 8th 2026",
    "paymentMethod": "Scholarship",
    "notes": "Google Sheet Record #34. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $1200 on April 8th 2026."
  },
  {
    "id": "pay-sheet-35",
    "studentName": "Susan Spark",
    "studentId": "HTEIM-2026-1067",
    "email": "Susane.spark999@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 700,
    "status": "Partial",
    "lastPaymentDate": "26/4/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #35. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $500 on 8/6/2026, $200 on 26/4/2026."
  },
  {
    "id": "pay-sheet-36",
    "studentName": "Sybris Walker-Castle",
    "studentId": "HTEIM-2026-1931",
    "email": "Info.mercedessolutions@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #36. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-37",
    "studentName": "Tricia Worrell",
    "studentId": "HTEIM-2026-1379",
    "email": "triciarhworrell@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #37. Country: Barbados. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-38",
    "studentName": "Whitney Tracey Seelochan",
    "studentId": "HTEIM-2026-2338",
    "email": "Whitneytrace@live.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 1200,
    "status": "Paid In Full",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #38. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $1200 on ."
  },
  {
    "id": "pay-sheet-39",
    "studentName": "Zahra Andrews",
    "studentId": "HTEIM-2026-1258",
    "email": "zahra.andrews21@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #39. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-40",
    "studentName": "Ruth Vernon",
    "studentId": "HTEIM-2026-1083",
    "email": "ruthvernon829@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #40. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-41",
    "studentName": "Catherine Vidale",
    "studentId": "HTEIM-2026-2749",
    "email": "Vidalecathrine@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 700,
    "status": "Partial",
    "lastPaymentDate": "25/04/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #41. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $500 on 30/05/2026, $200 on 25/04/2026."
  },
  {
    "id": "pay-sheet-42",
    "studentName": "Jennylyn Dickson",
    "studentId": "HTEIM-2026-1602",
    "email": "divajenny@yahoo.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "22/04/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #42. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on 22/04/2026."
  },
  {
    "id": "pay-sheet-43",
    "studentName": "Niomi. Laverne Joseph Marksman",
    "studentId": "HTEIM-2026-2810",
    "email": "lovernejosephempress@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 800,
    "status": "Partial",
    "lastPaymentDate": "26/04/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #43. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $400 on 24.06.2026, $200 on 03/05/2026, $200 on 26/04/2026."
  },
  {
    "id": "pay-sheet-44",
    "studentName": "Kathleen Joseph-Sandy",
    "studentId": "HTEIM-2026-2017",
    "email": "akilsandy09@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "23/04/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #44. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on 23/04/2026."
  },
  {
    "id": "pay-sheet-45",
    "studentName": "Kabrina Morris-Jack",
    "studentId": "HTEIM-2026-1786",
    "email": "Kabrinamo@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #45. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-46",
    "studentName": "Tessa Phipps",
    "studentId": "HTEIM-2026-1172",
    "email": "tcoggins218@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #46. Country: St. Kitts. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-47",
    "studentName": "Wendy Woodruffe",
    "studentId": "HTEIM-2026-1496",
    "email": "woodruffe23saftey@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "14th April 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #47. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on 14th April 2026."
  },
  {
    "id": "pay-sheet-48",
    "studentName": "Quacy Marecheau",
    "studentId": "HTEIM-2026-1454",
    "email": "Marecheauq@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #48. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-49",
    "studentName": "RACQUEL GUMBS",
    "studentId": "HTEIM-2026-939",
    "email": "redeemedrh1976@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #49. Country: St. Kitts. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-50",
    "studentName": "Colette Blackburne Joseph",
    "studentId": "HTEIM-2026-2418",
    "email": "cbburne@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 1200,
    "status": "Paid In Full",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Scholarship",
    "notes": "Google Sheet Record #50. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $1200 on ."
  },
  {
    "id": "pay-sheet-51",
    "studentName": "Kemrolene Opadeyi",
    "studentId": "HTEIM-2026-1677",
    "email": "K_bowens@hotmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #51. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-52",
    "studentName": "Jovanka Williams",
    "studentId": "HTEIM-2026-1580",
    "email": "jovanwilliams@hotmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #52. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-53",
    "studentName": "Paula Massiah Blount",
    "studentId": "HTEIM-2026-1901",
    "email": "Blountpaula@rocketmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #53. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-54",
    "studentName": "Jenetta Pierre",
    "studentId": "HTEIM-2026-1362",
    "email": "jenetta.pierre04@gmail.com",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 200,
    "status": "Partial",
    "lastPaymentDate": "12th April 2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #54. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $200 on 12th April 2026."
  },
  {
    "id": "pay-sheet-55",
    "studentName": "Keyshana Gomes",
    "studentId": "HTEIM-2026-1359",
    "email": "keyshanagomes14@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #55. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-56",
    "studentName": "Shellon Massiah",
    "studentId": "HTEIM-2026-1467",
    "email": "massiahshellon@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #56. Country: Guyana. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-57",
    "studentName": "Diana Selkridge",
    "studentId": "HTEIM-2026-1431",
    "email": "diana.selkridge@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #57. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-58",
    "studentName": "Krystal Mohammed",
    "studentId": "HTEIM-2026-1586",
    "email": "krystalmoh02@gmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #58. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-59",
    "studentName": "Vikash Ramnarace",
    "studentId": "HTEIM-2026-1552",
    "email": "houseofmorax@hotmail.com",
    "moduleTrack": "General Ministry Studies (On Hold)",
    "totalTuition": 1200,
    "amountPaid": 0,
    "status": "Pending Review",
    "lastPaymentDate": "N/A",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #59. Country: Trinidad. Role: Student. Enrollment Status: Inactive."
  },
  {
    "id": "pay-sheet-60",
    "studentName": "Francisca Swift",
    "studentId": "HTEIM-2026-1463",
    "email": "francisca.swift@hteim.edu",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 1200,
    "status": "Paid In Full",
    "lastPaymentDate": "30/05/2026",
    "paymentMethod": "Scholarship",
    "notes": "Google Sheet Record #60. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $700 on , $500 on 30/05/2026."
  },
  {
    "id": "pay-sheet-61",
    "studentName": "Racine Roy",
    "studentId": "HTEIM-2026-940",
    "email": "racine.roy@hteim.edu",
    "moduleTrack": "Active Ministry Module",
    "totalTuition": 1200,
    "amountPaid": 500,
    "status": "Partial",
    "lastPaymentDate": "26/4/2026",
    "paymentMethod": "Bank Transfer",
    "notes": "Google Sheet Record #61. Country: Trinidad. Role: Student. Enrollment Status: Active. Payment History: $500 on 26/4/2026."
  }
];

export const PaymentTab: React.FC<PaymentTabProps> = ({ 
  availableStudents, 
  isAdmin, 
  currentStudentName, 
  userRole = 'admin',
  payments: propPayments,
  setPayments: propSetPayments,
  onDeleteStudent,
  onRestoreStudent
}) => {
  const isStudent = userRole === 'student';

  // If not admin and not student, block view
  if (!isAdmin && !isStudent) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Admin Privileges Required</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The <strong>Student Tuition & Payment Analytics Dashboard</strong> is restricted exclusively to authorized HTEIM Administrators and Financial Officers.
        </p>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900">
          Please log in with an Administrator account to access financial ledgers, tuition status, and embedded analytics.
        </div>
      </div>
    );
  }

  // State Management
  const [localPayments, setLocalPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('hteim_student_payments');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        // Self-heal: If it contains old mock template data, reset to real student sheet data
        const hasOldMock = parsed.some((p: any) => p.id === 'pay-101' || p.studentName === 'Sister Maria Santos');
        if (hasOldMock) {
          localStorage.setItem('hteim_student_payments', JSON.stringify(INITIAL_PAYMENTS));
          return INITIAL_PAYMENTS;
        }

        // Self-heal: Merge/rename "Catherine Olivia Vidale-Lewis" to "Catherine Vidale"
        let modified = false;
        parsed = parsed.map((p: any) => {
          if (p.studentName === 'Catherine Olivia Vidale-Lewis' || p.studentName === 'Catherine Olivia Vidale Lewis') {
            modified = true;
            return {
              ...p,
              studentName: 'Catherine Vidale'
            };
          }
          return p;
        });

        // Deduplicate "Catherine Vidale" if multiple copies exist in stored state
        const cvRecords = parsed.filter((p: any) => p.studentName && p.studentName.toLowerCase().trim() === 'catherine vidale');
        if (cvRecords.length > 1) {
          modified = true;
          // Find the best master record (preferring predefined pay-sheet-41 or the one with studentId)
          const masterRecord = cvRecords.find((p: any) => p.id === 'pay-sheet-41') || cvRecords.find((p: any) => p.studentId) || cvRecords[0];
          
          const mergedRecord = {
            ...masterRecord,
            amountPaid: 700,
            status: 'Partial',
            notes: "Catherine Vidale paid $700 and owes $500."
          };

          // Filter out all "Catherine Vidale" records and push the merged one back in
          parsed = parsed.filter((p: any) => !p.studentName || p.studentName.toLowerCase().trim() !== 'catherine vidale');
          parsed.push(mergedRecord);
        } else if (cvRecords.length === 1) {
          // If only one record exists but has wrong payment amount/status, force correct it
          const cv = cvRecords[0];
          if (cv.amountPaid !== 700 || cv.status !== 'Partial') {
            modified = true;
            parsed = parsed.map((p: any) => {
              if (p.studentName && p.studentName.toLowerCase().trim() === 'catherine vidale') {
                return {
                  ...p,
                  amountPaid: 700,
                  status: 'Partial'
                };
              }
              return p;
            });
          }
        }

        if (modified) {
          localStorage.setItem('hteim_student_payments', JSON.stringify(parsed));
        }

        return parsed;
      } catch (e) {
        return INITIAL_PAYMENTS;
      }
    }
    return INITIAL_PAYMENTS;
  });

  const payments = propPayments !== undefined ? propPayments : localPayments;
  const setPayments = propSetPayments !== undefined ? propSetPayments : setLocalPayments;

  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'analytics'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid In Full' | 'Partial' | 'Past Due' | 'Pending Review'>('All');
  
  // Modals
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedPaymentForModal, setSelectedPaymentForModal] = useState<PaymentRecord | null>(null);
  
  // Payment Form State
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(300);
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentRecord['paymentMethod']>('Credit Card');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');
  const [receiptFileUrl, setReceiptFileUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Receipt Modal State
  const [receiptRecord, setReceiptRecord] = useState<PaymentRecord | null>(null);
  const [showReconciliationReport, setShowReconciliationReport] = useState(true);

  // New Student Tuition Agreement Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newTrack, setNewTrack] = useState('Pastoral & General Ministry');
  const [newTotalTuition, setNewTotalTuition] = useState(1200);
  const [newInitialPayment, setNewInitialPayment] = useState(0);

  // Bulk Payment Reminder Modal State
  const [showBulkReminderModal, setShowBulkReminderModal] = useState(false);

  // Student Removal Verification Modal State
  const [studentToRemove, setStudentToRemove] = useState<PaymentRecord | null>(null);
  const [showRemoveVerificationModal, setShowRemoveVerificationModal] = useState(false);
  const [removeVerificationInput, setRemoveVerificationInput] = useState('');
  const [removalReason, setRemovalReason] = useState('No longer a student / Withdrawn');
  const [customRemovalReason, setCustomRemovalReason] = useState('');
  const [showRemovedArchiveModal, setShowRemovedArchiveModal] = useState(false);

  // Archive of Removed / Excluded Student Records
  const [removedStudentRecords, setRemovedStudentRecords] = useState<{
    record: PaymentRecord;
    removedAt: string;
    reason: string;
    removedBy: string;
  }[]>(() => {
    const saved = localStorage.getItem('hteim_removed_payment_students');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Sync removed students with localStorage
  useEffect(() => {
    localStorage.setItem('hteim_removed_payment_students', JSON.stringify(removedStudentRecords));
  }, [removedStudentRecords]);

  const handleUpdatePaymentPhone = (studentId: string, phone: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === studentId || p.studentId === studentId) {
        return { ...p, phone };
      }
      return p;
    }));
  };

  const handleInitiateRemoveStudent = (p: PaymentRecord) => {
    setStudentToRemove(p);
    setRemoveVerificationInput('');
    setRemovalReason('No longer a student / Withdrawn');
    setCustomRemovalReason('');
    setShowRemoveVerificationModal(true);
  };

  const handleConfirmRemoveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToRemove) return;

    const inputClean = removeVerificationInput.trim().toUpperCase();
    const nameClean = studentToRemove.studentName.trim().toUpperCase();
    const isVerified = inputClean === 'REMOVE' || inputClean === nameClean;

    if (!isVerified) return;

    const finalReason = removalReason === 'Other' ? (customRemovalReason.trim() || 'Administrative removal') : removalReason;
    const actorName = userRole === 'admin' ? 'Administrator' : currentStudentName || 'Staff User';

    const removedEntry = {
      record: studentToRemove,
      removedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      reason: finalReason,
      removedBy: actorName
    };

    setRemovedStudentRecords(prev => [removedEntry, ...prev]);
    setPayments(prev => prev.filter(p => p.id !== studentToRemove.id));

    // Synchronize removal across the app (attendance records, student directory, etc.)
    if (onDeleteStudent) {
      onDeleteStudent(studentToRemove.studentName);
    }

    logActivity({
      actor: actorName,
      role: 'admin',
      actionCategory: 'Payment Entry',
      actionTitle: 'Student & Fees Removed',
      details: `Removed student "${studentToRemove.studentName}" (${studentToRemove.studentId}) and purged tuition schedule of $${studentToRemove.totalTuition} ($${studentToRemove.amountPaid} paid, $${studentToRemove.totalTuition - studentToRemove.amountPaid} balance). Reason: ${finalReason}.`,
      targetStudent: studentToRemove.studentName
    });

    setShowRemoveVerificationModal(false);
    setStudentToRemove(null);
    setRemoveVerificationInput('');
  };

  const handleRestoreRemovedStudent = (entryToRestore: { record: PaymentRecord; removedAt: string; reason: string; removedBy: string }) => {
    setPayments(prev => [entryToRestore.record, ...prev]);
    setRemovedStudentRecords(prev => prev.filter(r => r.record.id !== entryToRestore.record.id));

    if (onRestoreStudent) {
      onRestoreStudent(entryToRestore.record.studentName);
    }

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : currentStudentName || 'Staff User',
      role: 'admin',
      actionCategory: 'Payment Entry',
      actionTitle: 'Student Restored to Payment Schedule',
      details: `Restored student "${entryToRestore.record.studentName}" (${entryToRestore.record.studentId}) back to tuition ledger.`,
      targetStudent: entryToRestore.record.studentName
    });
  };

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('hteim_student_payments', JSON.stringify(payments));
  }, [payments]);

  // Ensure any newly added unique students are included in payments ledger (ignoring removed/archived students)
  useEffect(() => {
    if (availableStudents && availableStudents.length > 0) {
      setPayments(prev => {
        const newRecords: PaymentRecord[] = [];

        availableStudents.forEach((st, idx) => {
          if (!st || !st.name) return;
          const nameLower = st.name.toLowerCase().trim();

          // Check if student was explicitly removed/archived by admin
          const isArchived = removedStudentRecords.some(r => {
            const rName = r.record.studentName.toLowerCase().trim();
            if (rName === nameLower) return true;
            const n1 = nameLower.replace(/[^a-z]/g, '');
            const n2 = rName.replace(/[^a-z]/g, '');
            return n1 !== '' && n2 !== '' && (n1.includes(n2) || n2.includes(n1));
          });
          if (isArchived) return;

          // Check if there is any fuzzy match in existing ledger
          const alreadyExists = prev.some(p => {
            if (!p || !p.studentName) return false;
            const pName = p.studentName.toLowerCase().trim();
            if (pName === nameLower) return true;
            // Fuzzy match checks
            const n1 = nameLower.replace(/[^a-z]/g, '');
            const n2 = pName.replace(/[^a-z]/g, '');
            if (n1 === '' || n2 === '') return false;
            return n1.includes(n2) || n2.includes(n1) || (n1.substring(0, 6) === n2.substring(0, 6) && n1.length > 3);
          });

          if (st.name && !alreadyExists) {
            newRecords.push({
              id: `pay-auto-${Date.now()}-${idx}`,
              studentName: st.name,
              studentId: `HTEIM-2026-${Math.abs(st.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)).toString().substring(0, 4)}`,
              email: st.email || `${st.name.toLowerCase().replace(/\s+/g, '.')}@hteim.edu`,
              moduleTrack: 'Active Ministry Module',
              totalTuition: 1200,
              amountPaid: 0,
              status: 'Pending Review',
              lastPaymentDate: 'N/A',
              paymentMethod: 'Bank Transfer',
              notes: 'Form response submitted. No payment logged in master tuition sheet.'
            });
          }
        });

        return newRecords.length > 0 ? [...prev, ...newRecords] : prev;
      });
    }
  }, [availableStudents, removedStudentRecords]);

  // Financial Statistics
  const stats = useMemo(() => {
    const totalTuition = payments.reduce((acc, p) => acc + p.totalTuition, 0);
    const totalCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
    const totalOutstanding = Math.max(0, totalTuition - totalCollected);
    const paidInFullCount = payments.filter(p => p.status === 'Paid In Full').length;
    const pastDueCount = payments.filter(p => p.status === 'Past Due').length;
    const partialCount = payments.filter(p => p.status === 'Partial').length;
    const collectionRate = totalTuition > 0 ? Math.round((totalCollected / totalTuition) * 100) : 0;

    return {
      totalTuition,
      totalCollected,
      totalOutstanding,
      paidInFullCount,
      pastDueCount,
      partialCount,
      collectionRate,
      totalStudents: payments.length
    };
  }, [payments]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return payments.filter(p => {
      const matchesSearch = (p.studentName || '').toLowerCase().includes(q) ||
                            (p.studentId || '').toLowerCase().includes(q) ||
                            (p.moduleTrack || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  // Reconciliation Analysis between Attendance form and Tuition Google Sheet
  const reconciliationReport = useMemo(() => {
    const attendanceNames = availableStudents.map(s => s.name);
    const ledgerNames = payments.map(p => p.studentName);

    const normalizeName = (name: string) => {
      if (!name) return '';
      return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '')
        .trim();
    };

    const normalizedAttendance = attendanceNames.map(name => ({
      original: name,
      norm: normalizeName(name)
    }));

    const normalizedLedger = ledgerNames.map(name => ({
      original: name,
      norm: normalizeName(name)
    }));

    // Find students in attendance (Form responses) who are missing in the tuition ledger
    const missingInLedger = normalizedAttendance.filter(att => {
      if (!att.norm) return false;
      return !normalizedLedger.some(led => {
        return led.norm.includes(att.norm) || att.norm.includes(led.norm);
      });
    }).map(x => x.original);

    // Find students in ledger (Tuition sheet) who are missing in the attendance list (Form responses)
    const missingInAttendance = normalizedLedger.filter(led => {
      if (!led.norm) return false;
      return !normalizedAttendance.some(att => {
        return att.norm.includes(led.norm) || led.norm.includes(att.norm);
      });
    }).map(x => x.original);

    return {
      matchedCount: Math.max(0, attendanceNames.length - missingInLedger.length),
      missingInLedger,
      missingInAttendance
    };
  }, [availableStudents, payments]);

  // Handlers
  const handleFileProcess = async (file: File) => {
    setUploadError('');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload an image (JPEG, PNG, WEBP, GIF) or a PDF.');
      return;
    }
    // Limit size to 1.5MB to avoid exceeding local storage quota
    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('File is too large. Receipts must be under 1.5 MB to save successfully.');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadToSupabaseStorage('receipts', file.name, file);
      if (publicUrl) {
        setReceiptFileUrl(publicUrl);
        setReceiptFileName(file.name);
        setIsUploading(false);
      } else {
        // Fallback to Data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setReceiptFileUrl(reader.result);
            setReceiptFileName(file.name);
          }
          setIsUploading(false);
        };
        reader.onerror = () => {
          setUploadError('Failed to read the file.');
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Failed to upload receipt to Supabase Storage:", err);
      // Fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setReceiptFileUrl(reader.result);
          setReceiptFileName(file.name);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read the file.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFileUrl('');
    setReceiptFileName('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenRecordPayment = (p: PaymentRecord) => {
    setSelectedPaymentForModal(p);
    setPaymentAmountInput(Math.min(300, p.totalTuition - p.amountPaid));
    setPaymentMethodInput('Credit Card');
    setPaymentNotesInput('');
    setReceiptFileUrl(p.receiptUrl || '');
    setReceiptFileName(p.receiptName || '');
    setUploadError('');
    setShowRecordPaymentModal(true);
  };

  const handleConfirmAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForModal) return;

    const added = Number(paymentAmountInput) || 0;
    const newPaid = Math.min(selectedPaymentForModal.totalTuition, selectedPaymentForModal.amountPaid + added);
    const newStatus: PaymentRecord['status'] = newPaid >= selectedPaymentForModal.totalTuition ? 'Paid In Full' : 'Partial';

    setPayments(prev => prev.map(p => {
      if (p.id === selectedPaymentForModal.id) {
        return {
          ...p,
          amountPaid: newPaid,
          status: newStatus,
          lastPaymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: paymentMethodInput,
          notes: paymentNotesInput ? `${p.notes ? p.notes + ' | ' : ''}${paymentNotesInput}` : p.notes,
          receiptUrl: receiptFileUrl || p.receiptUrl,
          receiptName: receiptFileName || p.receiptName
        };
      }
      return p;
    }));

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : currentStudentName || 'Staff User',
      role: userRole === 'admin' ? 'admin' : 'teacher',
      actionCategory: 'Payment Entry',
      actionTitle: 'Tuition Payment Logged',
      details: `Collected $${added.toFixed(2)} via ${paymentMethodInput} for ${selectedPaymentForModal.studentName}. Updated paid total: $${newPaid.toFixed(2)}. Status: ${newStatus}.`,
      targetStudent: selectedPaymentForModal.studentName
    });

    setShowRecordPaymentModal(false);
    setSelectedPaymentForModal(null);
  };

  const handleAddStudentTuition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const nameClean = newStudentName.trim();
    const newRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      studentName: nameClean,
      studentId: `HTEIM-2026-${Math.abs(nameClean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)).toString().substring(0, 4)}`,
      email: `${nameClean.toLowerCase().replace(/\s+/g, '.')}@hteim.edu`,
      moduleTrack: newTrack,
      totalTuition: newTotalTuition,
      amountPaid: newInitialPayment,
      status: newInitialPayment >= newTotalTuition ? 'Paid In Full' : newInitialPayment > 0 ? 'Partial' : 'Pending Review',
      lastPaymentDate: newInitialPayment > 0 ? new Date().toISOString().split('T')[0] : 'N/A',
      paymentMethod: 'Credit Card',
      notes: 'New student enrollment tuition agreement logged.'
    };

    setPayments(prev => [newRecord, ...prev]);

    logActivity({
      actor: userRole === 'admin' ? 'Administrator' : 'Staff User',
      role: 'admin',
      actionCategory: 'Payment Entry',
      actionTitle: 'Student Tuition Agreement Created',
      details: `Created tuition ledger for ${nameClean} (${newTrack}). Total Tuition: $${newTotalTuition}, Initial Paid: $${newInitialPayment}.`,
      targetStudent: nameClean
    });

    setShowAddStudentModal(false);
    setNewStudentName('');
    setNewInitialPayment(0);
  };

  const handleExportCSV = () => {
    let csv = 'Student ID,Student Name,Email,Ministry Track,Total Tuition,Amount Paid,Balance Due,Status,Last Payment Date,Method,Notes\n';
    payments.forEach(p => {
      const balance = p.totalTuition - p.amountPaid;
      csv += `"${p.studentId}","${p.studentName}","${p.email || ''}","${p.moduleTrack}",$${p.totalTuition},$${p.amountPaid},$${balance},"${p.status}","${p.lastPaymentDate}","${p.paymentMethod}","${(p.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HTEIM_Tuition_Payment_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find current student payment record
  const studentPayment = useMemo(() => {
    if (!currentStudentName) return null;
    const nameLower = currentStudentName.toLowerCase().trim();
    return payments.find(p => {
      const pName = p.studentName.toLowerCase().trim();
      if (pName === nameLower) return true;
      const n1 = nameLower.replace(/[^a-z]/g, '');
      const n2 = pName.replace(/[^a-z]/g, '');
      if (n1 === '' || n2 === '') return false;
      return n1.includes(n2) || n2.includes(n1) || (n1.substring(0, 6) === n2.substring(0, 6) && n1.length > 3);
    });
  }, [payments, currentStudentName]);

  // If student role, return the student-specific payment view
  if (isStudent) {
    if (!studentPayment) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto my-12 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Tuition Record Not Found</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We couldn't locate a student tuition ledger matching your account name (<strong className="text-slate-800">{currentStudentName}</strong>).
          </p>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900">
            Please contact the HTEIM administration team to link your profile with the financial system.
          </div>
        </div>
      );
    }

    const outstandingBalance = Math.max(0, studentPayment.totalTuition - studentPayment.amountPaid);
    const progressPercent = Math.min(100, Math.round((studentPayment.amountPaid / studentPayment.totalTuition) * 100));

    return (
      <div className="material-screen space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8">
        {/* Student Welcome Banner */}
        <div className="material-banner border border-emerald-800/40 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-black tracking-tight">My Tuition & Payments</h2>
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Student: <strong className="text-white font-black">{studentPayment.studentName}</strong> • ID: <strong className="text-white font-mono">{studentPayment.studentId}</strong>
              </p>
            </div>

            <button
              onClick={() => setReceiptRecord(studentPayment)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer flex-shrink-0"
            >
              <Receipt className="w-4 h-4" /> View My Statement
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Total Tuition Fees</p>
              <p className="text-2xl font-black font-mono text-white mt-1">${studentPayment.totalTuition.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-300 mt-0.5">{studentPayment.moduleTrack}</p>
            </div>

            <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Total Amount Paid</p>
              <p className="text-2xl font-black font-mono text-emerald-300 mt-1">${studentPayment.amountPaid.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-200 mt-0.5">{progressPercent}% paid to date</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Balance Outstanding</p>
              <p className="text-2xl font-black font-mono text-white mt-1">${outstandingBalance.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-300 mt-0.5">Remaining tuition dues</p>
            </div>

            <div className={`backdrop-blur-md border rounded-2xl p-4 ${
              studentPayment.status === 'Paid In Full' ? 'bg-emerald-500/20 border-emerald-500/30' :
              studentPayment.status === 'Partial' ? 'bg-amber-500/20 border-amber-500/30' :
              'bg-slate-500/20 border-slate-500/30'
            }`}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Account Status</p>
              <p className={`text-2xl font-black mt-1 ${
                studentPayment.status === 'Paid In Full' ? 'text-emerald-300' :
                studentPayment.status === 'Partial' ? 'text-amber-300' : 'text-slate-300'
              }`}>{studentPayment.status}</p>
              <p className="text-[10px] text-emerald-200 mt-0.5">Tuition Ledger Standing</p>
            </div>
          </div>
        </div>

        {/* Progress Bar & Details Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Tuition Payment Progress
                </h3>
                <span className="text-xs font-black text-emerald-700 font-mono bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Ledger item details */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Tuition Account Overview</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Course Track</p>
                  <p className="font-extrabold text-slate-800">{studentPayment.moduleTrack}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Associated Email Address</p>
                  <p className="font-extrabold text-slate-800">{studentPayment.email || 'N/A'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Last Logged Payment Date</p>
                  <p className="font-extrabold text-slate-800 font-mono">{studentPayment.lastPaymentDate || 'N/A'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Last Used Payment Method</p>
                  <p className="font-extrabold text-slate-800">{studentPayment.paymentMethod || 'N/A'}</p>
                </div>
              </div>
            </div>

            {studentPayment.notes && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5 text-amber-900">
                <p className="font-extrabold uppercase text-[9px] text-amber-800 tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Finance Office Ledger Notes
                </p>
                <p className="font-medium leading-relaxed italic">
                  "{studentPayment.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Payment Actions & Help */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Payment Statement Action
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate, view, and print your official tuition payment statement and digital receipts logged in the master financial spreadsheet.
              </p>

              {studentPayment.receiptUrl && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
                  <p className="text-[10px] font-extrabold uppercase text-emerald-800 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> Attached Receipt File
                  </p>
                  <p className="text-[11px] text-slate-600 truncate font-mono">{studentPayment.receiptName || 'receipt_attached.file'}</p>
                  <a
                    href={studentPayment.receiptUrl}
                    download={studentPayment.receiptName || 'receipt_attached'}
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 hover:underline"
                  >
                    <Download className="w-3 h-3" /> Download Receipt File
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setReceiptRecord(studentPayment)}
                  className="py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Receipt className="w-4 h-4 text-emerald-400" /> View Statement
                </button>
                <button
                  onClick={() => generateTuitionReceiptPDF(studentPayment)}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4" /> PDF Receipt
                </button>
              </div>

              {outstandingBalance > 0 ? (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 text-[11px] text-blue-900 leading-normal font-medium space-y-1">
                  <p className="font-extrabold text-blue-950">How to pay?</p>
                  <p>To settle your outstanding balance of <strong className="font-bold">${outstandingBalance.toLocaleString()}</strong>, please contact the Financial Office or initiate a Bank Transfer.</p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-[11px] text-emerald-900 leading-normal font-medium space-y-1">
                  <p className="font-extrabold text-emerald-950 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tuition Fully Paid!
                  </p>
                  <p>Your account is in excellent standing with zero outstanding balance. Thank you for your diligence.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal display portal within student context */}
        {receiptRecord && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl my-auto flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp">
              <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400 shrink-0" /> Official Tuition Statement & Receipt
                </h3>
                <button
                  onClick={() => setReceiptRecord(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div id="printable-tuition-receipt" className="p-4 sm:p-8 space-y-4 sm:space-y-6 text-slate-800 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-4 gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <img 
                      src={hteimLogoAsset} 
                      alt="HTEIM Logo" 
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border border-amber-400 p-0.5 object-contain bg-white flex-shrink-0 shadow-xs"
                    />
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">HTEIM School of Ministry</h2>
                      <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Academic Financial Office • Official Statement</p>
                      <p className="text-[9px] sm:text-[10px] italic font-serif text-amber-900">"Bringing Heaven to Earth, Taking People to Heaven"</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right font-mono text-xs">
                    <p className="font-extrabold text-emerald-700">Receipt #{receiptRecord.id.toUpperCase()}</p>
                    <p className="text-slate-400 text-[10px]">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Student Name</p>
                    <p className="font-black text-slate-900 text-sm sm:text-base">{receiptRecord.studentName}</p>
                    <p className="font-mono text-emerald-700 text-xs font-bold">{receiptRecord.studentId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Enrolled Program Track</p>
                    <p className="font-bold text-slate-800">{receiptRecord.moduleTrack}</p>
                    <p className="text-slate-500 text-[11px] break-all">{receiptRecord.email}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Semester Academic Tuition</span>
                    <span className="font-mono">${receiptRecord.totalTuition.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Total Amount Paid To Date</span>
                    <span className="font-mono">${receiptRecord.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-xs sm:text-sm font-black text-slate-900">
                    <span>Balance Outstanding</span>
                    <span className="font-mono text-amber-700">${(receiptRecord.totalTuition - receiptRecord.amountPaid).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 italic font-medium">
                  Note: {receiptRecord.notes || 'All tuition payments support academic ministry training and resources.'}
                </div>

                {receiptRecord.receiptUrl && (
                  <div className="border-t border-slate-200 pt-4 space-y-2 print:hidden">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">Attached Payment Receipt</p>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={receiptRecord.receiptName}>
                          {receiptRecord.receiptName || 'receipt_attached.file'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        {receiptRecord.receiptUrl.startsWith('data:image/') && (
                          <button
                            type="button"
                            onClick={() => {
                              const w = window.open();
                              if (w) {
                                w.document.write(`<img src="${receiptRecord.receiptUrl}" style="max-width:100%; height:auto; margin:auto; display:block;" />`);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Full
                          </button>
                        )}
                        <a
                          href={receiptRecord.receiptUrl}
                          download={receiptRecord.receiptName || 'receipt_attached'}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    </div>
                    {receiptRecord.receiptUrl.startsWith('data:image/') && (
                      <div className="flex justify-center bg-slate-50 p-2 border border-slate-200 rounded-xl max-h-40 overflow-hidden mt-1">
                        <img
                          src={receiptRecord.receiptUrl}
                          alt="Receipt file"
                          className="max-h-36 object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Rockproxy Technology Mark */}
                <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  <span>Software Powered by <strong className="text-slate-800">Rockproxy Technologies</strong></span>
                  <span>•</span>
                  <span>Director: Kendell Pierre</span>
                  <span>•</span>
                  <span className="text-indigo-600">rockproxytechnologies@gmail.com</span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const studentRecords = payments.filter(p => p.studentName === receiptRecord.studentName || p.studentId === receiptRecord.studentId);
                    generateStudentAccountStatementPDF(
                      receiptRecord.studentName,
                      receiptRecord.studentId,
                      receiptRecord.email || '',
                      studentRecords.length > 0 ? studentRecords : [receiptRecord]
                    );
                  }}
                  className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" /> Account Statement PDF
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setReceiptRecord(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => generateTuitionReceiptPDF(receiptRecord)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="material-screen space-y-6 animate-fadeIn pb-28 sm:pb-24 md:pb-8">
      {/* Header Banner */}
      <div className="material-banner border border-emerald-800/40 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center shadow-lg font-black text-2xl flex-shrink-0">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black tracking-tight text-white">Student Tuition & Payment Analytics</h2>
                <span className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-400 text-slate-950 rounded-full flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3" /> Admin Portal
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 font-medium">
                HTEIM School of Ministry • Student Tuition Management Ledger & Financial Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Total Revenue Collected</p>
            <p className="text-2xl font-black font-mono text-white mt-1">${stats.totalCollected.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-300 mt-0.5">{stats.collectionRate}% of total tuition target</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Outstanding Balance</p>
            <p className="text-2xl font-black font-mono text-amber-300 mt-1">${stats.totalOutstanding.toLocaleString()}</p>
            <p className="text-[10px] text-amber-200 mt-0.5">{stats.pastDueCount} accounts past due</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Paid In Full</p>
            <p className="text-2xl font-black font-mono text-emerald-300 mt-1">{stats.paidInFullCount} / {stats.totalStudents}</p>
            <p className="text-[10px] text-emerald-300 mt-0.5">Students with 100% tuition clear</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Expected Total</p>
            <p className="text-2xl font-black font-mono text-white mt-1">${stats.totalTuition.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-300 mt-0.5">Full semester tuition value</p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`min-h-11 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" /> Tuition Ledger & Receipts ({payments.length})
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`min-h-11 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Financial Analytics Breakdown
          </button>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowBulkReminderModal(true)}
            className="col-span-2 sm:col-span-1 min-h-11 px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95 border border-emerald-400/30"
          >
            <MessageSquare className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>Send Bulk Reminders (WhatsApp & Email)</span>
            <span className="px-1.5 py-0.5 bg-emerald-400 text-slate-950 text-[10px] font-extrabold rounded-md ml-1">
              {payments.filter(p => p.totalTuition - p.amountPaid > 0).length} Due
            </span>
          </button>
          <button
            onClick={handleExportCSV}
            className="min-h-11 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {removedStudentRecords.length > 0 && (
            <button
              onClick={() => setShowRemovedArchiveModal(true)}
              className="min-h-11 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="View or restore previously removed students and fees"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Removed Archive</span>
              <span className="px-1.5 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-full ml-0.5">
                {removedStudentRecords.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="min-h-11 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" /> Log Tuition
          </button>
        </div>
      </div>

      {/* VIEW 2: Payment Ledger & Management Table */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">


          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, ID, or track..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {(['All', 'Paid In Full', 'Partial', 'Past Due', 'Pending Review'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`min-h-10 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Student & ID</th>
                  <th className="p-3.5">Ministry Track</th>
                  <th className="p-3.5 text-right">Total Tuition</th>
                  <th className="p-3.5 text-right">Amount Paid</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Last Payment</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredPayments.map(p => {
                  const balance = p.totalTuition - p.amountPaid;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <p className="font-extrabold text-slate-900 text-sm">{p.studentName}</p>
                        <p className="text-[10px] font-mono text-emerald-700 font-bold">{p.studentId}</p>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700">
                          {p.moduleTrack}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold">${p.totalTuition.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-emerald-700">${p.amountPaid.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                        {balance > 0 ? (
                          <span className="text-amber-600">${balance.toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-600">$0</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          p.status === 'Paid In Full'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : p.status === 'Partial'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : p.status === 'Past Due'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {p.status === 'Paid In Full' && <CheckCircle2 className="w-3 h-3" />}
                          {p.status === 'Past Due' && <AlertTriangle className="w-3 h-3" />}
                          {p.status === 'Partial' && <Clock className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        <p className="font-mono">{p.lastPaymentDate}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <p className="text-[10px] text-slate-400">{p.paymentMethod}</p>
                          {p.receiptUrl && (
                            <button 
                              type="button"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[9px] font-black uppercase cursor-pointer transition-colors"
                              title="Click to view attached receipt"
                              onClick={() => setReceiptRecord(p)}
                            >
                              <Paperclip className="w-2.5 h-2.5" /> Receipt
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {balance > 0 && (
                            <>
                              <a
                                href={`https://wa.me/${p.phone ? p.phone.replace(/[^0-9]/g, '') : '1868' + Math.abs(p.studentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))}?text=${encodeURIComponent(`Dear ${p.studentName},\n\nFriendly reminder from HTEIM School of Ministry regarding your tuition balance of $${balance}.\n\nTotal Tuition: $${p.totalTuition}\nAmount Paid: $${p.amountPaid}\nRemaining Balance: $${balance}\n\nPlease contact the Financial Office for payment arrangements.\n\nBlessings,\nHTEIM Administration`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Send WhatsApp Payment Reminder"
                              >
                                <MessageSquare className="w-3 h-3" /> WhatsApp
                              </a>

                              {p.email && (
                                <a
                                  href={`mailto:${p.email}?subject=${encodeURIComponent('💳 HTEIM School of Ministry - Tuition Balance Notice')}&body=${encodeURIComponent(`Dear ${p.studentName},\n\nGreetings from HTEIM School of Ministry!\n\nThis is a reminder regarding your tuition account balance:\n\n• Student ID: ${p.studentId}\n• Total Tuition: $${p.totalTuition}\n• Amount Paid: $${p.amountPaid}\n• Outstanding Balance: $${balance}\n\nPlease settle your balance at your earliest convenience.\n\nBlessings,\nHTEIM Finance Directorate`)}`}
                                  className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Send Email Payment Reminder"
                                >
                                  <Mail className="w-3 h-3" /> Email
                                </a>
                              )}

                              <button
                                onClick={() => handleOpenRecordPayment(p)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Record Tuition Payment"
                              >
                                <Plus className="w-3 h-3" /> Record
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setReceiptRecord(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Generate Receipt / Statement"
                          >
                            <Receipt className="w-3 h-3 text-indigo-600" /> Statement
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInitiateRemoveStudent(p)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Remove student and corresponding fees from payment schedule with verification"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      No tuition records match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* VIEW 3: Analytics Breakdown */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" /> Tuition Collection Progress
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-700">{stats.collectionRate}% Collected</span>
            </div>

            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${stats.collectionRate}%` }}
                title={`Collected: $${stats.totalCollected}`}
              />
              <div
                className="bg-amber-400 h-full transition-all"
                style={{ width: `${100 - stats.collectionRate}%` }}
                title={`Outstanding: $${stats.totalOutstanding}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <p className="text-[10px] font-bold uppercase text-emerald-800">Total Funds In Bank</p>
                <p className="text-xl font-black font-mono text-emerald-900 mt-1">${stats.totalCollected.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-[10px] font-bold uppercase text-amber-800">Remaining Receivables</p>
                <p className="text-xl font-black font-mono text-amber-900 mt-1">${stats.totalOutstanding.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Account Status Breakdown
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Paid In Full
                </span>
                <span className="font-mono font-black text-emerald-900">{stats.paidInFullCount} Students</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Active Installment Plans
                </span>
                <span className="font-mono font-black text-blue-900">{stats.partialCount} Students</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Past Due / Payment Notice
                </span>
                <span className="font-mono font-black text-rose-900">{stats.pastDueCount} Students</span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 2: Record Tuition Payment */}
      {showRecordPaymentModal && selectedPaymentForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <form onSubmit={handleConfirmAddPayment} className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md my-auto flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
            <div className="p-3.5 sm:p-4 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" /> Log Tuition Payment
              </h3>
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal(false)}
                className="p-1.5 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white cursor-pointer"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 text-xs text-slate-700 overflow-y-auto custom-scrollbar flex-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Student</p>
                <p className="font-black text-slate-900 text-sm">{selectedPaymentForModal.studentName}</p>
                <p className="text-[11px] font-mono text-emerald-700">{selectedPaymentForModal.studentId}</p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] font-bold">
                  <span>Total Tuition: ${selectedPaymentForModal.totalTuition}</span>
                  <span className="text-amber-700">Remaining: ${selectedPaymentForModal.totalTuition - selectedPaymentForModal.amountPaid}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Payment Amount Collected ($)
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedPaymentForModal.totalTuition - selectedPaymentForModal.amountPaid}
                  required
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-extrabold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer / Wire</option>
                  <option value="Zelle">Zelle / Electronic</option>
                  <option value="Check">Check</option>
                  <option value="Scholarship">Scholarship / Grant</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Payment Reference / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Check #4012, Transaction Ref ID..."
                  value={paymentNotesInput}
                  onChange={(e) => setPaymentNotesInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* Receipt Upload Block */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500">
                  Upload Receipt (Optional)
                </label>
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-3 sm:p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    dragActive 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : receiptFileUrl 
                        ? 'border-emerald-300 bg-emerald-50/10' 
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-3 animate-pulse" onClick={(e) => e.stopPropagation()}>
                      <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                      <p className="text-xs font-bold text-slate-700">Uploading receipt...</p>
                      <p className="text-[10px] text-slate-400">Please wait</p>
                    </div>
                  ) : receiptFileUrl ? (
                    <div className="w-full flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {receiptFileUrl.startsWith('data:image/') ? (
                        <img 
                          src={receiptFileUrl} 
                          alt="Receipt Preview" 
                          className="max-h-20 sm:max-h-24 rounded-lg object-contain border border-slate-200 shadow-xs" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-800 break-all max-w-[240px]">
                          {receiptFileName || 'receipt_attached'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Receipt Attached
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveReceipt}
                        className="mt-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove File
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">
                          <span className="text-emerald-700 hover:underline font-black">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          PNG, JPG, PDF (Max 1.5 MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {uploadError && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1 bg-rose-50 border border-rose-100 rounded-lg p-2 text-left">
                    ⚠️ {uploadError}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Confirm & Log Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Printable Official Tuition Receipt & Statement */}
      {receiptRecord && (
        <div className="modal-material-scrim fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="modal-material-dialog bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl my-auto flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp">
            <div className="modal-material-header p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400 shrink-0" /> Official Tuition Statement & Receipt
              </h3>
              <button
                onClick={() => setReceiptRecord(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-tuition-receipt" className="p-4 sm:p-8 space-y-4 sm:space-y-6 text-slate-800 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-4 gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <img 
                    src={hteimLogoAsset} 
                    alt="HTEIM Logo" 
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border border-amber-400 p-0.5 object-contain bg-white flex-shrink-0 shadow-xs"
                  />
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">HTEIM School of Ministry</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Academic Financial Office • Official Statement</p>
                    <p className="text-[9px] sm:text-[10px] italic font-serif text-amber-900">"Bringing Heaven to Earth, Taking People to Heaven"</p>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono text-xs">
                  <p className="font-extrabold text-emerald-700">Receipt #{receiptRecord.id.toUpperCase()}</p>
                  <p className="text-slate-400 text-[10px]">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Student Name</p>
                  <p className="font-black text-slate-900 text-sm sm:text-base">{receiptRecord.studentName}</p>
                  <p className="font-mono text-emerald-700 text-xs font-bold">{receiptRecord.studentId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Enrolled Program Track</p>
                  <p className="font-bold text-slate-800">{receiptRecord.moduleTrack}</p>
                  <p className="text-slate-500 text-[11px] break-all">{receiptRecord.email}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span>Semester Academic Tuition</span>
                  <span className="font-mono">${receiptRecord.totalTuition.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-700">
                  <span>Total Amount Paid To Date</span>
                  <span className="font-mono">${receiptRecord.amountPaid.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-xs sm:text-sm font-black text-slate-900">
                  <span>Balance Outstanding</span>
                  <span className="font-mono text-amber-700">${(receiptRecord.totalTuition - receiptRecord.amountPaid).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 italic font-medium">
                Note: {receiptRecord.notes || 'All tuition payments support academic ministry training and resources.'}
              </div>

              {receiptRecord.receiptUrl && (
                <div className="border-t border-slate-200 pt-4 space-y-2 print:hidden">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Attached Payment Receipt</p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={receiptRecord.receiptName}>
                        {receiptRecord.receiptName || 'receipt_attached.file'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      {receiptRecord.receiptUrl.startsWith('data:image/') && (
                        <button
                          type="button"
                          onClick={() => {
                            const w = window.open();
                            if (w) {
                              w.document.write(`<img src="${receiptRecord.receiptUrl}" style="max-width:100%; height:auto; margin:auto; display:block;" />`);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Full
                        </button>
                      )}
                      <a
                        href={receiptRecord.receiptUrl}
                        download={receiptRecord.receiptName || 'receipt_attached'}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                  {receiptRecord.receiptUrl.startsWith('data:image/') && (
                    <div className="flex justify-center bg-slate-50 p-2 border border-slate-200 rounded-xl max-h-40 overflow-hidden mt-1">
                      <img
                        src={receiptRecord.receiptUrl}
                        alt="Receipt file"
                        className="max-h-36 object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setReceiptRecord(null)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Add New Tuition Record */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <form onSubmit={handleAddStudentTuition} className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md my-auto flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400 shrink-0" /> Log Student Tuition Agreement
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 text-xs text-slate-700 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bro. Michael Brown"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Ministry Module Track
                </label>
                <select
                  value={newTrack}
                  onChange={(e) => setNewTrack(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="Pastoral & General Ministry">Pastoral & General Ministry</option>
                  <option value="Theological Hermeneutics">Theological Hermeneutics</option>
                  <option value="Homiletics & Expository Preaching">Homiletics & Expository Preaching</option>
                  <option value="Leadership & Christian Education">Leadership & Christian Education</option>
                  <option value="Systematic Theology">Systematic Theology</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Total Tuition ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={newTotalTuition}
                    onChange={(e) => setNewTotalTuition(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Initial Deposit ($)
                  </label>
                  <input
                    type="number"
                    value={newInitialPayment}
                    onChange={(e) => setNewInitialPayment(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Payment Reminder Modal */}
      <BulkPaymentReminderModal
        isOpen={showBulkReminderModal}
        onClose={() => setShowBulkReminderModal(false)}
        payments={payments}
        onUpdatePaymentPhone={handleUpdatePaymentPhone}
      />

      {/* Student Removal Verification Modal */}
      {showRemoveVerificationModal && studentToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-rose-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg my-auto flex flex-col overflow-hidden animate-scaleUp">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white flex items-center justify-between shrink-0 border-b border-rose-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white">Verify Student & Fee Removal</h3>
                  <p className="text-[10px] text-rose-200">Financial Ledger Purge Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRemoveVerificationModal(false);
                  setStudentToRemove(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRemoveStudent} className="p-5 space-y-4 text-xs text-slate-800 overflow-y-auto custom-scrollbar">
              
              {/* Warning Context */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <p className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  Are you sure you want to remove this student?
                </p>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  This will purge <strong>{studentToRemove.studentName}</strong> and their corresponding tuition fees from the active payment schedule and financial analytics.
                </p>
              </div>

              {/* Student Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{studentToRemove.studentName}</p>
                    <p className="font-mono text-emerald-700 text-xs font-bold">{studentToRemove.studentId}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-800 font-bold rounded-lg text-[10px]">
                    {studentToRemove.moduleTrack}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <p className="text-[9px] font-extrabold uppercase text-slate-400">Total Tuition</p>
                    <p className="font-mono font-black text-slate-900 mt-0.5">${studentToRemove.totalTuition.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <p className="text-[9px] font-extrabold uppercase text-slate-400">Amount Paid</p>
                    <p className="font-mono font-black text-emerald-700 mt-0.5">${studentToRemove.amountPaid.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <p className="text-[9px] font-extrabold uppercase text-slate-400">Balance Due</p>
                    <p className="font-mono font-black text-amber-600 mt-0.5">${(studentToRemove.totalTuition - studentToRemove.amountPaid).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Reason for Removal */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500">
                  Reason for Student Removal
                </label>
                <select
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="No longer a student / Withdrawn">No longer a student / Withdrawn</option>
                  <option value="Graduated / Completed Studies">Graduated / Completed Studies</option>
                  <option value="Transferred / Inactive">Transferred / Inactive</option>
                  <option value="Duplicate Record">Duplicate Record</option>
                  <option value="Administrative Correction">Administrative Correction</option>
                  <option value="Other">Other (Specify below)</option>
                </select>

                {removalReason === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom removal reason..."
                    value={customRemovalReason}
                    onChange={(e) => setCustomRemovalReason(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium mt-1 focus:ring-2 focus:ring-rose-500/20"
                  />
                )}
              </div>

              {/* Verification Code Input */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <label className="block text-[10px] font-extrabold uppercase text-rose-700">
                  Security Verification Step *
                </label>
                <p className="text-[11px] text-slate-600">
                  To confirm verification, please type <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">REMOVE</strong> or the student's full name (<strong className="text-slate-900">{studentToRemove.studentName}</strong>):
                </p>
                <input
                  type="text"
                  required
                  placeholder="Type REMOVE or student name..."
                  value={removeVerificationInput}
                  onChange={(e) => setRemoveVerificationInput(e.target.value)}
                  className="w-full p-2.5 bg-rose-50/50 border border-rose-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRemoveVerificationModal(false);
                    setStudentToRemove(null);
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    removeVerificationInput.trim().toUpperCase() !== 'REMOVE' &&
                    removeVerificationInput.trim().toLowerCase() !== studentToRemove.studentName.toLowerCase().trim()
                  }
                  className={`px-4 py-2.5 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    removeVerificationInput.trim().toUpperCase() === 'REMOVE' ||
                    removeVerificationInput.trim().toLowerCase() === studentToRemove.studentName.toLowerCase().trim()
                      ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Confirm Permanent Removal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Removed Students Archive Modal */}
      {showRemovedArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl my-auto flex flex-col max-h-[85vh] overflow-hidden animate-scaleUp">
            
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white">Removed Students & Fees Archive</h3>
                  <p className="text-[10px] text-slate-300">Audited List of Excluded & Purged Financial Records ({removedStudentRecords.length})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRemovedArchiveModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {removedStudentRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-xs text-slate-600">No removed student records found.</p>
                  <p className="text-[11px]">All active student tuition ledgers are currently in the primary schedule.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {removedStudentRecords.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{item.record.studentName}</span>
                          <span className="font-mono text-emerald-700 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {item.record.studentId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Track: <strong className="text-slate-800">{item.record.moduleTrack}</strong> • Tuition Fee: <strong className="text-slate-900">${item.record.totalTuition.toLocaleString()}</strong> (${item.record.amountPaid.toLocaleString()} paid)
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">Reason: {item.reason}</span>
                          <span>Removed on: {item.removedAt}</span>
                          <span>By: {item.removedBy}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreRemovedStudent(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                        title="Restore student and tuition record back to payment schedule"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Restore Record
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRemovedArchiveModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
