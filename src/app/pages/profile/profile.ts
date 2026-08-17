import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Skill, UserSkill } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  // Estados de datos
  allSkills = signal<Skill[]>([]);
  mySkills = signal<UserSkill[]>([]);
  isLoading = signal<boolean>(true);
  isAssigning = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Selector para asignar habilidad
  selectedSkillId: number | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Cargar catálogo general y asignaciones
    this.apiService.getSkills().subscribe({
      next: (skills) => {
        this.allSkills.set(skills);
        this.loadUserSkills();
      },
      error: () => {
        this.errorMessage.set('Error al cargar la información del perfil.');
        this.isLoading.set(false);
      }
    });
  }

  loadUserSkills(): void {
    this.apiService.getUserSkills().subscribe({
      next: (userSkills) => {
        this.mySkills.set(userSkills);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  assignSkill(): void {
    if (!this.selectedSkillId) return;

    this.isAssigning.set(true);

    // Asigna la habilidad (el backend infiere el usuario por el token JWT o payload)
    const payload = { userId: 1, skillId: Number(this.selectedSkillId) };

    this.apiService.assignSkillToUser(payload).subscribe({
      next: (newRelation) => {
        this.mySkills.update((list) => [...list, newRelation]);
        this.selectedSkillId = null;
        this.isAssigning.set(false);
      },
      error: (err) => {
        alert(err.error?.message || 'No se pudo asignar la habilidad.');
        this.isAssigning.set(false);
      }
    });
  }

  removeSkill(userSkillId: number | undefined): void {
    if (!userSkillId) return;

    this.apiService.removeUserSkill(userSkillId).subscribe({
      next: () => {
        this.mySkills.update((list) => list.filter((item) => item.id !== userSkillId));
      },
      error: (err) => {
        alert(err.error?.message || 'Error al desvincular la habilidad.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
