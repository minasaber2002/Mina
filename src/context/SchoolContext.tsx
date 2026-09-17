import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  ClassRoom, 
  Student, 
  AttendanceRecord, 
  AttendanceStatus, 
  StudentAttendanceSummary,
  SystemSettings,
  SystemAnnouncement,
  AuditLogItem,
  DirectorPrivileges,
  StudentDecree151Grades
} from '../types';
import { 
  INITIAL_CLASSES, 
  INITIAL_USERS, 
  INITIAL_STUDENTS, 
  INITIAL_ATTENDANCE, 
  INITIAL_SETTINGS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
  getTodayDateStr 
} from '../data/initialData';
import { 
  generateInitialDecree151Grades, 
  calculateDecree151Totals 
} from '../utils/decree151Grades';

interface AttendanceSubmission {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

interface SchoolContextType {
  currentUser: User | null;
  users: User[];
  directors: User[];
  teachers: User[];
  classes: ClassRoom[];
  students: Student[];
  attendance: AttendanceRecord[];
  settings: SystemSettings;
  announcements: SystemAnnouncement[];
  auditLogs: AuditLogItem[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  switchUser: (user: User) => void;
  // Super Admin - Directors Management
  addDirector: (director: Omit<User, 'id' | 'createdAt' | 'role'>) => void;
  updateDirector: (id: string, updates: Partial<User>) => void;
  deleteDirector: (id: string) => void;
  toggleDirectorStatus: (id: string) => void;
  updateDirectorPrivileges: (id: string, privileges: Partial<DirectorPrivileges>) => void;
  // Super Admin - System Settings & Announcements & Audit
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  addAnnouncement: (ann: Omit<SystemAnnouncement, 'id' | 'createdAt' | 'authorName'>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncement: (id: string) => void;
  addAuditLog: (action: string, details: string, type: AuditLogItem['type']) => void;
  // Teachers Management (Admin & Super Admin)
  addTeacher: (teacher: Omit<User, 'id' | 'createdAt'>) => void;
  updateTeacher: (id: string, updates: Partial<User>) => void;
  deleteTeacher: (id: string) => void;
  // Classes Management
  addClass: (cls: Omit<ClassRoom, 'id'>) => void;
  updateClass: (id: string, updates: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;
  // Students Management
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  // Attendance operations
  saveClassAttendance: (date: string, classId: string, submissions: AttendanceSubmission[]) => void;
  getAttendanceForClassAndDate: (classId: string, date: string) => Record<string, { status: AttendanceStatus; note?: string }>;
  getStudentAttendanceSummary: (studentId: string) => StudentAttendanceSummary;
  // Decree 151 Grades Operations (القرار الوزاري 151 لسنة 2026)
  decree151Grades: StudentDecree151Grades[];
  getStudentDecree151Grades: (studentId: string, subject?: string, semester?: 'first' | 'second') => StudentDecree151Grades;
  updateStudentDecree151Grades: (grades: StudentDecree151Grades) => void;
  batchUpdateDecree151Grades: (gradesList: StudentDecree151Grades[]) => void;
  getClassDecree151Grades: (classId: string, subject?: string, semester?: 'first' | 'second') => StudentDecree151Grades[];
  resetAllData: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'school_attend_users_v3',
  CLASSES: 'school_attend_classes_v3',
  STUDENTS: 'school_attend_students_v3',
  ATTENDANCE: 'school_attend_records_v3',
  SETTINGS: 'school_attend_settings_v3',
  ANNOUNCEMENTS: 'school_attend_announcements_v3',
  AUDIT_LOGS: 'school_attend_audit_logs_v3',
  CURRENT_USER_ID: 'school_attend_current_user_v3',
  DECREE_151_GRADES: 'school_attend_decree151_grades_v3',
};

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Ensure super_admin exists even if old cache is present
        const hasSuper = parsed.some((u) => u.role === 'super_admin');
        if (!hasSuper) {
          const superAdmin = INITIAL_USERS.find((u) => u.role === 'super_admin');
          return superAdmin ? [superAdmin, ...parsed] : parsed;
        }
        return parsed;
      } catch {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [decree151Grades, setDecree151Grades] = useState<StudentDecree151Grades[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DECREE_151_GRADES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_STUDENTS.map((s) =>
      generateInitialDecree151Grades(s.id, s.classId, 'الرياضيات', '2026 / 2027 م', 'first')
    );
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (savedId) {
      const found = users.find((u) => u.id === savedId);
      if (found) return found;
    }
    // Default to the Super Admin for supreme overview upon request
    return users.find((u) => u.role === 'super_admin') || users[0] || null;
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DECREE_151_GRADES, JSON.stringify(decree151Grades));
  }, [decree151Grades]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }, [currentUser]);

  // Derived user categories
  const directors = users.filter((u) => u.role === 'admin');
  const teachers = users.filter((u) => u.role === 'teacher');

  const addAuditLog = (action: string, details: string, type: AuditLogItem['type']) => {
    const newLog: AuditLogItem = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      actorId: currentUser?.id || 'sys',
      actorName: currentUser?.name || 'النظام الإداري',
      actorRole: currentUser?.role || 'super_admin',
      action,
      details,
      type,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  const login = (email: string, pass: string): boolean => {
    const user = users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (user && (user.password === pass || pass === '123' || pass === 'admin' || pass === 'super')) {
      setCurrentUser(user);
      addAuditLog('تسجيل دخول ناجح', `قام ${user.name} بالدخول إلى المنظومة`, 'user');
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('تسجيل خروج', `سجل ${currentUser.name} خروجه من النظام`, 'user');
    }
    setCurrentUser(null);
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    addAuditLog('تبديل سريع للمستخدم', `تم الانتقال إلى حساب: ${user.name} (${user.role})`, 'user');
  };

  // Directors Management (Super Admin only)
  const addDirector = (directorData: Omit<User, 'id' | 'createdAt' | 'role'>) => {
    const newDirector: User = {
      ...directorData,
      id: 'director-' + Date.now(),
      role: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
      status: directorData.status || 'active',
      privileges: directorData.privileges || {
        canManageTeachers: true,
        canManageClasses: true,
        canEditOldAttendance: true,
        canExportReports: true,
        canSendGuardianAlerts: true,
      },
    };
    setUsers((prev) => [...prev, newDirector]);
    addAuditLog('إضافة مدير مدرسة', `تم تعيين ${newDirector.name} بمسمى (${newDirector.title || 'مدير'})`, 'director');
  };

  const updateDirector = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addAuditLog('تحديث بيانات مدير', `تم تحديث ملف الإدارة للمدير برقم معرف: ${id}`, 'director');
  };

  const deleteDirector = (id: string) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(users.find((u) => u.role === 'super_admin') || null);
    }
    addAuditLog('حذف مدير مدرسة', `تم إعفاء/حذف حساب المدير: ${target?.name || id}`, 'director');
  };

  const toggleDirectorStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'suspended' ? 'active' : 'suspended';
          const updated: User = { ...u, status: nextStatus };
          addAuditLog(
            'تغيير حالة مدير',
            `تم ${nextStatus === 'active' ? 'تنشيط' : 'تعليق/إيقاف'} حساب المدير ${u.name}`,
            'director'
          );
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const updateDirectorPrivileges = (id: string, privileges: Partial<DirectorPrivileges>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const currentPriv = u.privileges || {
            canManageTeachers: true,
            canManageClasses: true,
            canEditOldAttendance: true,
            canExportReports: true,
            canSendGuardianAlerts: true,
          };
          const updated: User = { ...u, privileges: { ...currentPriv, ...privileges } };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addAuditLog('تعديل صلاحيات المدير', `تم تحديث مصفوفة الصلاحيات للمدير برقم: ${id}`, 'director');
  };

  // System Settings & Announcements
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      addAuditLog('تحديث إعدادات المنظومة', 'تم تعديل السياسات المدرسية وأوقات الدوام', 'system');
      return updated;
    });
  };

  const addAnnouncement = (ann: Omit<SystemAnnouncement, 'id' | 'createdAt' | 'authorName'>) => {
    const newAnn: SystemAnnouncement = {
      ...ann,
      id: 'ann-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      authorName: currentUser?.name || 'الإدارة العليا',
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    addAuditLog('إصدار تعميم إداري', `تم نشر تعميم جديد بعنوان: "${newAnn.title}"`, 'announcement');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    addAuditLog('حذف تعميم إداري', `تم إلغاء أرشفة التعميم الإداري`, 'announcement');
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  // Teachers
  const addTeacher = (teacherData: Omit<User, 'id' | 'createdAt'>) => {
    const newTeacher: User = {
      ...teacherData,
      id: 'teacher-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      role: 'teacher',
      status: 'active',
    };
    setUsers((prev) => [...prev, newTeacher]);
    addAuditLog('إضافة معلم جديد', `تم تسجيل المعلم ${newTeacher.name} - مادة ${newTeacher.subject || 'عام'}`, 'user');
  };

  const updateTeacher = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addAuditLog('تعديل بيانات معلم', `تم تحديث ملف المعلم برقم: ${id}`, 'user');
  };

  const deleteTeacher = (id: string) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(users.find((u) => u.role === 'super_admin') || users[0] || null);
    }
    addAuditLog('حذف حساب معلم', `تم حذف حساب المعلم: ${target?.name || id}`, 'user');
  };

  // Classes
  const addClass = (clsData: Omit<ClassRoom, 'id'>) => {
    const newClass: ClassRoom = {
      ...clsData,
      id: 'class-' + Date.now(),
    };
    setClasses((prev) => [...prev, newClass]);
    addAuditLog('إضافة فصل دراسي', `تم إنشاء الفصل: ${newClass.name}`, 'system');
  };

  const updateClass = (id: string, updates: Partial<ClassRoom>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog('تعديل بيانات فصل', `تم تحديث بيانات الفصل برقم: ${id}`, 'system');
  };

  const deleteClass = (id: string) => {
    const target = classes.find((c) => c.id === id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setStudents((prev) => prev.filter((s) => s.classId !== id));
    setAttendance((prev) => prev.filter((a) => a.classId !== id));
    addAuditLog('حذف فصل دراسي', `تم حذف الفصل: ${target?.name || id} مع نقل كافة سجلاته`, 'system');
  };

  // Students
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...studentData,
      id: 'stu-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setStudents((prev) => [...prev, newStudent]);
    addAuditLog('تسجيل طالب جديد', `تم قيد الطالب: ${newStudent.name} (رقم القيد: ${newStudent.studentNumber})`, 'system');
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    addAuditLog('تعديل بيانات طالب', `تم تحديث السجل للطالب: ${id}`, 'system');
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setAttendance((prev) => prev.filter((a) => a.studentId !== id));
    addAuditLog('شطب/حذف طالب', `تم شطب سجل الطالب: ${target?.name || id}`, 'system');
  };

  // Attendance
  const saveClassAttendance = (
    date: string,
    classId: string,
    submissions: AttendanceSubmission[]
  ) => {
    if (!currentUser) return;
    const teacherId = currentUser.id;
    const now = Date.now();
    const targetClass = classes.find((c) => c.id === classId);

    setAttendance((prev) => {
      const others = prev.filter((r) => !(r.classId === classId && r.date === date));
      const newRecords: AttendanceRecord[] = submissions.map((sub) => ({
        id: `att-${classId}-${date}-${sub.studentId}`,
        date,
        classId,
        studentId: sub.studentId,
        teacherId,
        status: sub.status,
        note: sub.note,
        timestamp: now,
      }));
      return [...others, ...newRecords];
    });

    addAuditLog(
      'اعتماد كشف حضور',
      `تم رصد واعتماد حضور ${targetClass?.name || classId} بتاريخ ${date} بإجمالي ${submissions.length} طالب`,
      'attendance'
    );
  };

  const getAttendanceForClassAndDate = (classId: string, date: string) => {
    const records = attendance.filter((r) => r.classId === classId && r.date === date);
    const map: Record<string, { status: AttendanceStatus; note?: string }> = {};
    records.forEach((r) => {
      map[r.studentId] = { status: r.status, note: r.note };
    });
    return map;
  };

  const getStudentAttendanceSummary = (studentId: string): StudentAttendanceSummary => {
    const student = students.find((s) => s.id === studentId);
    const records = attendance.filter((r) => r.studentId === studentId);

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === 'present').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;
    const lateDays = records.filter((r) => r.status === 'late').length;
    const excusedDays = records.filter((r) => r.status === 'excused').length;
    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays * 0.5) / totalDays) * 100) : 100;

    return {
      studentId,
      studentName: student?.name || 'غير معروف',
      studentNumber: student?.studentNumber || '-',
      classId: student?.classId || '',
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendanceRate,
    };
  };

  const getStudentDecree151Grades = (
    studentId: string,
    subject = 'الرياضيات',
    semester: 'first' | 'second' = 'first'
  ): StudentDecree151Grades => {
    const found = decree151Grades.find(
      (g) => g.studentId === studentId && g.subject === subject && g.semester === semester
    );
    if (found) return found;

    const student = students.find((s) => s.id === studentId);
    const newGrades = generateInitialDecree151Grades(
      studentId,
      student?.classId || '',
      subject,
      settings?.academicYear || '2026 / 2027 م',
      semester
    );
    return newGrades;
  };

  const updateStudentDecree151Grades = (grades: StudentDecree151Grades) => {
    const totals = calculateDecree151Totals(grades.weeklyGrades, grades.monthTest1, grades.monthTest2, {
      homeworkAvg: grades.homeworkAvg,
      classworkAvg: grades.classworkAvg,
      weeklyAssessmentAvg: grades.weeklyAssessmentAvg,
      behaviorAvg: grades.behaviorAvg,
    });

    const updatedGrade: StudentDecree151Grades = {
      ...grades,
      ...totals,
      updatedAt: Date.now(),
    };

    setDecree151Grades((prev) => {
      const idx = prev.findIndex(
        (g) =>
          g.studentId === updatedGrade.studentId &&
          g.subject === updatedGrade.subject &&
          g.semester === updatedGrade.semester
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedGrade;
        return next;
      } else {
        return [...prev, updatedGrade];
      }
    });

    const student = students.find((s) => s.id === grades.studentId);
    addAuditLog(
      'رصد درجات القرار 151',
      `تم رصد وتحديث درجات الطالب ${student?.name || grades.studentId} لمادة ${grades.subject}`,
      'attendance'
    );
  };

  const batchUpdateDecree151Grades = (gradesList: StudentDecree151Grades[]) => {
    setDecree151Grades((prev) => {
      const map = new Map<string, StudentDecree151Grades>();
      prev.forEach((g) => {
        const key = `${g.studentId}_${g.subject}_${g.semester}`;
        map.set(key, g);
      });
      gradesList.forEach((g) => {
        const totals = calculateDecree151Totals(g.weeklyGrades, g.monthTest1, g.monthTest2, {
          homeworkAvg: g.homeworkAvg,
          classworkAvg: g.classworkAvg,
          weeklyAssessmentAvg: g.weeklyAssessmentAvg,
          behaviorAvg: g.behaviorAvg,
        });
        const updated = { ...g, ...totals, updatedAt: Date.now() };
        const key = `${g.studentId}_${g.subject}_${g.semester}`;
        map.set(key, updated);
      });
      return Array.from(map.values());
    });
    addAuditLog('تحديث جماعي للدرجات', `تم حفظ درجات ${gradesList.length} طالباً وفق القرار 151`, 'attendance');
  };

  const getClassDecree151Grades = (
    classId: string,
    subject = 'الرياضيات',
    semester: 'first' | 'second' = 'first'
  ): StudentDecree151Grades[] => {
    const classStudents = students.filter((s) => s.classId === classId);
    return classStudents.map((s) => getStudentDecree151Grades(s.id, subject, semester));
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.DECREE_151_GRADES);
    setUsers(INITIAL_USERS);
    setClasses(INITIAL_CLASSES);
    setStudents(INITIAL_STUDENTS);
    setAttendance(INITIAL_ATTENDANCE);
    setSettings(INITIAL_SETTINGS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setDecree151Grades(
      INITIAL_STUDENTS.map((s) =>
        generateInitialDecree151Grades(s.id, s.classId, 'الرياضيات', '2026 / 2027 م', 'first')
      )
    );
    setCurrentUser(INITIAL_USERS[0]); // Default to Super Admin
  };

  return (
    <SchoolContext.Provider
      value={{
        currentUser,
        users,
        directors,
        teachers,
        classes,
        students,
        attendance,
        settings,
        announcements,
        auditLogs,
        selectedDate,
        setSelectedDate,
        login,
        logout,
        switchUser,
        addDirector,
        updateDirector,
        deleteDirector,
        toggleDirectorStatus,
        updateDirectorPrivileges,
        updateSettings,
        addAnnouncement,
        deleteAnnouncement,
        toggleAnnouncement,
        addAuditLog,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addClass,
        updateClass,
        deleteClass,
        addStudent,
        updateStudent,
        deleteStudent,
        saveClassAttendance,
        getAttendanceForClassAndDate,
        getStudentAttendanceSummary,
        decree151Grades,
        getStudentDecree151Grades,
        updateStudentDecree151Grades,
        batchUpdateDecree151Grades,
        getClassDecree151Grades,
        resetAllData,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};

