import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'http://localhost:3000';
  private readonly TOKEN_KEY = 'jwt_token';

  isLoggedIn = signal<boolean>(!!this.getToken());

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((res) => {
        if (res.access_token) {
          localStorage.setItem(this.TOKEN_KEY, res.access_token);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/users`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  getCurrentUser(): { id?: number; email?: string } | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    // Los JWT de NestJS suelen guardar el ID en .sub o en .id
    return {
      id: decodedPayload.sub || decodedPayload.id || decodedPayload.userId,
      email: decodedPayload.email || decodedPayload.username
    };
  } catch {
    return null;
  }
}
}
