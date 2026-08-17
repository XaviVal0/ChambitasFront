import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  email: string;
  name?: string;
}

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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000';

  // --- USERS ---
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`);
  }

  getUser(id: number | string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}`);
  }

  updateUser(id: number | string, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/users/${id}`, data);
  }

  // --- SKILLS ---
  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.API_URL}/skills`);
  }

  createSkill(skill: Skill): Observable<Skill> {
    return this.http.post<Skill>(`${this.API_URL}/skills`, skill);
  }

  // --- USER SKILLS ---
  getUserSkills(): Observable<UserSkill[]> {
    return this.http.get<UserSkill[]>(`${this.API_URL}/user-skills`);
  }

  assignSkillToUser(data: { userId: number; skillId: number }): Observable<UserSkill> {
    return this.http.post<UserSkill>(`${this.API_URL}/user-skills`, data);
  }

  removeUserSkill(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/user-skills/${id}`);
  }
}
