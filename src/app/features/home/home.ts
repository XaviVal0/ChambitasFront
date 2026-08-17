import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Skill } from '../../services/api';
import { AuthService } from '../../services/auth';
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  skills = signal<Skill[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchSkills();
  }

  fetchSkills(): void {
    this.isLoading.set(true);
    this.apiService.getSkills().subscribe({
      next: (data) => {
        this.skills.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('No se pudieron cargar las habilidades.');
        this.isLoading.set(false);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
