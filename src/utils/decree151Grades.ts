import { StudentDecree151Grades, WeeklyGradeRecord } from '../types';

export interface Decree151WeekInfo {
  number: number;
  label: string;
  dateStr: string;
}

export const DECREE_151_WEEKS: Decree151WeekInfo[] = [
  { number: 1, label: 'الأسبوع الأول', dateStr: '12/9/2026' },
  { number: 2, label: 'الأسبوع الثاني', dateStr: '19/9/2026' },
  { number: 3, label: 'الأسبوع الثالث', dateStr: '26/9/2026' },
  { number: 4, label: 'الأسبوع الرابع', dateStr: '3/10/2026' },
  { number: 5, label: 'الأسبوع الخامس', dateStr: '10/10/2026' },
  { number: 6, label: 'الأسبوع السادس', dateStr: '17/10/2026' },
  { number: 7, label: 'الأسبوع السابع', dateStr: '24/10/2026' },
  { number: 8, label: 'الأسبوع الثامن', dateStr: '31/10/2026' },
  { number: 9, label: 'الأسبوع التاسع', dateStr: '7/11/2026' },
  { number: 10, label: 'الأسبوع العاشر', dateStr: '14/11/2026' },
  { number: 11, label: 'الأسبوع الحادي عشر', dateStr: '21/11/2026' },
  { number: 12, label: 'الأسبوع الثاني عشر', dateStr: '28/11/2026' },
  { number: 13, label: 'الأسبوع الثالث عشر', dateStr: '5/12/2026' },
  { number: 14, label: 'الأسبوع الرابع عشر', dateStr: '12/12/2026' },
  { number: 15, label: 'الأسبوع الخامس عشر', dateStr: '19/12/2026' },
  { number: 16, label: 'الأسبوع السادس عشر', dateStr: '26/12/2026' },
  { number: 17, label: 'الأسبوع السابع عشر', dateStr: '2/1/2027' },
];

/**
 * Calculates computed averages and final grand total out of 40
 * strictly according to Ministerial Decree 151
 */
export function calculateDecree151Totals(
  weeklyGrades: Record<number, WeeklyGradeRecord>,
  monthTest1?: number,
  monthTest2?: number,
  overrides?: {
    homeworkAvg?: number;
    classworkAvg?: number;
    weeklyAssessmentAvg?: number;
    behaviorAvg?: number;
  }
): {
  homeworkAvg: number;
  classworkAvg: number;
  weeklyAssessmentAvg: number;
  behaviorAvg: number;
  semesterActivitiesAvg: number;
  testsAvg: number;
  finalTotal: number;
} {
  const weeks = Object.values(weeklyGrades || {});

  // 1. Homework average (out of 5)
  let hwAvg = overrides?.homeworkAvg;
  if (hwAvg === undefined) {
    const hwValues = weeks.map((w) => w.homework).filter((v): v is number => typeof v === 'number');
    hwAvg = hwValues.length > 0 ? Number((hwValues.reduce((a, b) => a + b, 0) / hwValues.length).toFixed(1)) : 5;
  }

  // 2. Classwork notebook average (out of 5)
  let cwAvg = overrides?.classworkAvg;
  if (cwAvg === undefined) {
    const cwValues = weeks.map((w) => w.classwork).filter((v): v is number => typeof v === 'number');
    cwAvg = cwValues.length > 0 ? Number((cwValues.reduce((a, b) => a + b, 0) / cwValues.length).toFixed(1)) : 5;
  }

  // 3. Weekly assessment average (out of 10)
  let waAvg = overrides?.weeklyAssessmentAvg;
  if (waAvg === undefined) {
    const waValues = weeks.map((w) => w.weeklyAssessment).filter((v): v is number => typeof v === 'number');
    waAvg = waValues.length > 0 ? Number((waValues.reduce((a, b) => a + b, 0) / waValues.length).toFixed(1)) : 10;
  }

  // 4. Behavior & Attendance average (out of 5)
  let behAvg = overrides?.behaviorAvg;
  if (behAvg === undefined) {
    const behValues = weeks.map((w) => w.behavior).filter((v): v is number => typeof v === 'number');
    behAvg = behValues.length > 0 ? Number((behValues.reduce((a, b) => a + b, 0) / behValues.length).toFixed(1)) : 5;
  }

  // Clamping to max boundaries
  hwAvg = Math.min(5, Math.max(0, hwAvg));
  cwAvg = Math.min(5, Math.max(0, cwAvg));
  waAvg = Math.min(10, Math.max(0, waAvg));
  behAvg = Math.min(5, Math.max(0, behAvg));

  // Semester Activities Total = 5 + 5 + 10 + 5 = max 25
  const semesterActivitiesAvg = Number((hwAvg + cwAvg + waAvg + behAvg).toFixed(1));

  // Monthly Tests Average = (Test 1 + Test 2) / 2 = max 15
  const t1 = typeof monthTest1 === 'number' ? Math.min(15, Math.max(0, monthTest1)) : 14;
  const t2 = typeof monthTest2 === 'number' ? Math.min(15, Math.max(0, monthTest2)) : 15;
  const testsAvg = Number(((t1 + t2) / 2).toFixed(1));

  // Grand Final Total = Activities (25) + Tests (15) = max 40
  const finalTotal = Number((semesterActivitiesAvg + testsAvg).toFixed(1));

  return {
    homeworkAvg: hwAvg,
    classworkAvg: cwAvg,
    weeklyAssessmentAvg: waAvg,
    behaviorAvg: behAvg,
    semesterActivitiesAvg,
    testsAvg,
    finalTotal,
  };
}

/**
 * Generate initial realistic Decree 151 grades for a student
 */
export function generateInitialDecree151Grades(
  studentId: string,
  classId: string,
  subject = 'الرياضيات',
  academicYear = '2026 / 2027 م',
  semester: 'first' | 'second' = 'first'
): StudentDecree151Grades {
  // Deterministic variation based on studentId characters
  const charCodeSum = studentId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseGradeOffset = (charCodeSum % 3); // 0, 1, or 2

  const weeklyGrades: Record<number, WeeklyGradeRecord> = {};
  for (let w = 1; w <= 17; w++) {
    // Homework: 4 or 5
    const hw = Math.min(5, Math.max(3, 5 - ((w + baseGradeOffset) % 4 === 0 ? 1 : 0)));
    // Classwork: 4 or 5
    const cw = Math.min(5, Math.max(3, 5 - ((w + baseGradeOffset + 1) % 5 === 0 ? 1 : 0)));
    // Weekly assessment: 8, 9, or 10
    const wa = Math.min(10, Math.max(7, 10 - ((w + baseGradeOffset) % 3)));
    // Behavior: 5 or 4
    const beh = Math.min(5, Math.max(4, 5 - ((w + baseGradeOffset) % 7 === 0 ? 1 : 0)));

    weeklyGrades[w] = {
      weekNumber: w,
      dateStr: DECREE_151_WEEKS[w - 1]?.dateStr,
      homework: hw,
      classwork: cw,
      weeklyAssessment: wa,
      behavior: beh,
    };
  }

  const monthTest1 = Math.min(15, Math.max(11, 15 - baseGradeOffset));
  const monthTest2 = Math.min(15, Math.max(12, 15 - (baseGradeOffset % 2)));

  const totals = calculateDecree151Totals(weeklyGrades, monthTest1, monthTest2);

  return {
    id: `grade-${studentId}-${subject}-${semester}`,
    studentId,
    classId,
    subject,
    academicYear,
    semester,
    weeklyGrades,
    monthTest1,
    monthTest2,
    ...totals,
    updatedAt: Date.now(),
  };
}
