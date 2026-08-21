import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Skill {
  id?: number;
  name: string;
  description?: string;
}

export interface UserSkill {
  id?: number;
  userId: number;
  skillId: number;
  skill?: Skill;
}

export interface Job {
  id?: number;
  userId: number;
  title: string;
  description: string;
  price: number;
  createdAt?: string;
  status?: string;
}

export interface Application {
  id?: number;
  jobId: number;
  userId?: number;
  workerId: number;
  status?: string;
  message?: string;
  job?: Job;
}

export interface Contract {
  id?: number;
  matchId: number;
  jobId: number;
  userId: number;
  job?: Job;
  status?: string;
}

export interface Review {
  id?: number;
  contractId: number;
  reviewerId: number;
  reviewedUserId: number;
  rating: number;
  comment: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000';

  // --- SKILLS & USER SKILLS ---
  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.API_URL}/skills`);
  }
  createSkill(skill: Skill): Observable<Skill> {
    return this.http.post<Skill>(`${this.API_URL}/skills`, skill);
  }
  getUserSkills(): Observable<UserSkill[]> {
    return this.http.get<UserSkill[]>(`${this.API_URL}/user-skills`);
  }
  assignSkillToUser(data: { userId: number; skillId: number }): Observable<UserSkill> {
    return this.http.post<UserSkill>(`${this.API_URL}/user-skills`, data);
  }
  removeUserSkill(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/user-skills/${id}`);
  }

  // --- JOBS ---
  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.API_URL}/jobs`);
  }
  createJob(job: { userId: number; title: string; description: string; price: number }): Observable<Job> {
    return this.http.post<Job>(`${this.API_URL}/jobs`, job);
  }

  // --- APPLICATIONS ---
  getApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.API_URL}/applications`);
  }
  applyToJob(data: { jobId: number; userId: number; message?: string }): Observable<Application> {
    return this.http.post<Application>(`${this.API_URL}/applications`, data);
  }
  updateApplicationStatus(id: number | string, status: string): Observable<Application> {
    return this.http.patch<Application>(`${this.API_URL}/applications/${id}`, { status });
  }

  // --- CONTRACTS ---
  getContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.API_URL}/contracts`);
  }
  createContract(contract: { matchId: number; jobId: number; userId: number }): Observable<Contract> {
    return this.http.post<Contract>(`${this.API_URL}/contracts`, contract);
  }

  // --- REVIEWS ---
  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.API_URL}/reviews`);
  }

  createReview(review: Review): Observable<Review> {
    return this.http.post<Review>(`${this.API_URL}/reviews`, review);
  }
}
