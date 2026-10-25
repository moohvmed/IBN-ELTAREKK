export type UserRole = 'student' | 'tutor' | 'parent';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar: string;
  specializationOrGrade: string;
  loginMethod?: 'email' | 'phone' | 'gmail';
  googleEmail?: string;
  linkedParentPhone?: string;
  linkedParentName?: string;
  linkedStudentPhone?: string;
  linkedStudentName?: string;
  linkedStudentId?: string;
  nextSession?: {
    topic: string;
    tutorOrStudent: string;
    time: string;
    room: string;
  };
}

