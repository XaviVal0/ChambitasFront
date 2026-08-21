import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Skill } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  // Estados de la vista con Signals
  skills = signal<Skill[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showModal = signal<boolean>(false);

  // Modelo para la nueva habilidad
  newSkill: Skill = {
    name: '',
    description: ''
  };

  ngOnInit(): void {
    this.fetchSkills();
  }

  fetchSkills(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.getSkills().subscribe({
      next: (data) => {
        this.skills.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al cargar las habilidades.');
        this.isLoading.set(false);
      }
    });
  }

  openModal(): void {
    this.newSkill = { name: '', description: '' };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveSkill(): void {
    if (!this.newSkill.name.trim()) return;

    this.isSubmitting.set(true);

    this.apiService.createSkill(this.newSkill).subscribe({
      next: (createdSkill) => {
        // Actualizamos la lista localmente
        this.skills.update((current) => [...current, createdSkill]);
        this.isSubmitting.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'Error al guardar la habilidad.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
