export type Role = 'super_admin' | 'admin' | 'teacher';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface DirectorPrivileges {
  canManageTeachers: boolean;
  canManageClasses: boolean;
  canEditOldAttendance: boolean;
  canExportReports: boolean;
  canSendGuardianAlerts: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  title?: string;
  status?: 'active' | 'suspended';
  privileges?: DirectorPrivileges;
  phone?: string;
  subject?: string;
  assignedClassIds: string[];
  avatar?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: number;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  details: string;
  type: 'attendance' | 'user' | 'director' | 'system' | 'announcement';
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  targetAudience: 'all' | 'directors' | 'teachers';
  createdAt: string;
  authorName: string;
  active: boolean;
}

export interface SystemSettings {
  schoolName: string;
  educationalDistrict: string;
  academicYear: string;
  schoolStartTime: string;
  lateToleranceMinutes: number;
  absenceWarningThreshold: number;
  criticalAbsenceThreshold: number;
  allowTeacherEditAfterHours: boolean;
  autoNotifyGuardians: boolean;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  section: string;
  academicYear: string;
}

export interface Student {
  id: string;
  name: string;
  studentNumber: string;
  classId: string;
  guardianName?: string;
  guardianPhone?: string;
  nationalId?: string;
  gender: 'male' | 'female';
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  studentId: string;
  teacherId: string;
  status: AttendanceStatus;
  note?: string;
  timestamp: number;
}

export interface AttendanceSession {
  id: string;
  date: string;
  classId: string;
  teacherId: string;
  subject?: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  updatedAt: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  studentNumber: string;
  classId: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
}

// ==========================================
// Ministerial Decree 151 of 2026 Grades
// نظام درجات وتقييم القرار الوزاري 151 لسنة 2026
// ==========================================

export interface WeeklyGradeRecord {
  weekNumber: number; // 1 to 17
  dateStr?: string;
  homework?: number; // كراس الواجب (من 5)
  classwork?: number; // كراسة الحصة (من 5)
  weeklyAssessment?: number; // التقييم الأسبوعي (من 10)
  behavior?: number; // المواظبة والسلوك (من 5)
}

export interface StudentDecree151Grades {
  id: string;
  studentId: string;
  classId: string;
  subject: string; // المادة
  academicYear: string; // 2026 / 2027 م
  semester: 'first' | 'second'; // الفصل الدراسي الأول أو الثاني
  weeklyGrades: Record<number, WeeklyGradeRecord>; // أسابيع 1 إلى 17
  monthTest1?: number; // اختبار الشهر الأول (من 15)
  monthTest2?: number; // اختبار الشهر الثاني (من 15)
  // Averaged / Computed Values
  homeworkAvg?: number; // متوسط كراس الواجب (من 5)
  classworkAvg?: number; // متوسط كراسة الحصة (من 5)
  weeklyAssessmentAvg?: number; // متوسط التقييم الأسبوعي (من 10)
  behaviorAvg?: number; // متوسط المواظبة والسلوك (من 5)
  semesterActivitiesAvg?: number; // متوسط الفصل الدراسي (أعمال السنة) من 25
  testsAvg?: number; // متوسط اختباري الشهرين من 15
  finalTotal?: number; // المجموع النهائي من 40
  updatedAt: number;
}

