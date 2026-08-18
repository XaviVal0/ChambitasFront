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

  allSkills = signal<Skill[]>([]);
  mySkills = signal<UserSkill[]>([]);
  isLoading = signal<boolean>(true);
  isAssigning = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  selectedSkillId: number | null = null;

  currentUserId = this.authService.getCurrentUser()?.id;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.getSkills().subscribe({
      next: (skills) => {
        this.allSkills.set(skills);
        this.loadUserSkills();
      },
      error: () => {
        this.errorMessage.set('Error al cargar la información.');
        this.isLoading.set(false);
      }
    });
  }

  loadUserSkills(): void {
    this.apiService.getUserSkills().subscribe({
      next: (allUserSkills) => {
        if (this.currentUserId) {
          const filtered = allUserSkills.filter(
            (item: any) => item.userId === this.currentUserId || item.user?.id === this.currentUserId
          );
          this.mySkills.set(filtered);
        } else {
          this.mySkills.set(allUserSkills);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  assignSkill(): void {
    if (!this.selectedSkillId || !this.currentUserId) return;

    this.isAssigning.set(true);

    const payload = {
      userId: Number(this.currentUserId),
      skillId: Number(this.selectedSkillId)
    };

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
