import { Component, inject, OnInit, signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Skill, UserSkill } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Job, Application, Contract } from '../../services/api';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  currentUser = this.authService.getCurrentUser();

  allSkills = signal<Skill[]>([]);
  myUserSkills = signal<UserSkill[]>([]);
  myJobs = signal<Job[]>([]);
  myApplications = signal<Application[]>([]);
  myContracts = signal<Contract[]>([]);

  isLoading = signal<boolean>(true);
  isAssigning = signal<boolean>(false);
  selectedSkillId = signal<number | null>(null);

  userInitials = computed(() => {
    const name = this.currentUser?.name || this.currentUser?.email || 'U';
    return name.slice(0, 2).toUpperCase();
  });

  availableSkills = computed(() => {
    const assignedIds = new Set(this.myUserSkills().map(us => Number(us.skillId)));
    return this.allSkills().filter(s => !assignedIds.has(Number(s.id)));
  });

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    const currentUserId = Number(this.currentUser?.id);
    if (!currentUserId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    this.apiService.getSkills().subscribe({
      next: (skills) => this.allSkills.set(skills),
      error: () => {}
    });

    this.apiService.getUserSkills().subscribe({
      next: (userSkills) => {
        this.myUserSkills.set(userSkills.filter(us => Number(us.userId) === currentUserId));
      },
      error: () => {}
    });

    this.apiService.getJobs().subscribe({
      next: (jobs) => {
        this.myJobs.set(jobs.filter(j => Number(j.userId) === currentUserId));
      },
      error: () => {}
    });

    this.apiService.getApplications().subscribe({
      next: (apps) => {
        this.myApplications.set(apps.filter(a => Number(a.userId || a.workerId) === currentUserId));
      },
      error: () => {}
    });

    this.apiService.getContracts().subscribe({
      next: (contracts) => {
        this.myContracts.set(contracts.filter(c => Number(c.userId) === currentUserId));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  addSkill(): void {
    const skillId = Number(this.selectedSkillId());
    const userId = Number(this.currentUser?.id);

    if (!skillId || !userId) return;

    this.isAssigning.set(true);

    this.apiService.assignSkillToUser({ userId, skillId }).subscribe({
      next: (newAssignment) => {
        const skillObj = this.allSkills().find(s => Number(s.id) === skillId);
        this.myUserSkills.update(list => [...list, { ...newAssignment, skill: skillObj }]);
        this.selectedSkillId.set(null);
        this.isAssigning.set(false);
      },
      error: (err) => {
        this.isAssigning.set(false);
        alert(err.error?.message || 'No se pudo vincular la habilidad.');
      }
    });
  }

  removeSkill(userSkillId?: number): void {
    if (!userSkillId) return;

    this.apiService.removeUserSkill(userSkillId).subscribe({
      next: () => {
        this.myUserSkills.update(list => list.filter(us => us.id !== userSkillId));
      },
      error: (err) => {
        alert(err.error?.message || 'Error al desvincular habilidad.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
