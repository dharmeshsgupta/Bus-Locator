import { User } from './auth';

export interface Student extends User {
  enrollmentNumber: string;
  address?: string;
  pickupStopId?: string;
  routeId?: string;
  idCardIssued?: boolean;
}

export interface StudentResponse {
  data: Student;
}

export interface StudentsListResponse {
  data: Student[];
  total: number;
}
