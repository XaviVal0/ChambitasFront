import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Job } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css',
})
export class Jobs implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  jobs = signal<Job[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  showCreateModal = signal<boolean>(false);
  showApplyModal = signal<boolean>(false);

  newJob = {
    title: '',
    description: '',
    price: null as number | null
  };

  selectedJobForApply: Job | null = null;
  applicationMessage: string = '';

  ngOnInit(): void {
    this.fetchJobs();
  }

  fetchJobs(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService.getJobs().subscribe({
      next: (data) => {
        this.jobs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al obtener la lista de trabajos.');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.newJob = { title: '', description: '', price: null };
    this.showCreateModal.set(true);
  }

  saveJob(): void {
    const currentUser = this.authService.getCurrentUser();
    const currentUserId = Number(currentUser?.id);

    if (!this.newJob.title?.trim() || !this.newJob.description?.trim() || this.newJob.price === null) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      userId: currentUserId || 1,
      title: this.newJob.title.trim(),
      description: this.newJob.description.trim(),
      price: Number(this.newJob.price)
    };

    this.apiService.createJob(payload).subscribe({
      next: (created) => {
        this.jobs.update((list) => [created, ...list]);
        this.isSubmitting.set(false);
        this.showCreateModal.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'No se pudo publicar la oferta.');
      }
    });
  }

  openApplyModal(job: Job): void {
    this.selectedJobForApply = job;
    this.applicationMessage = '';
    this.showApplyModal.set(true);
  }

  submitApplication(): void {
    const currentUser = this.authService.getCurrentUser();
    const currentUserId = Number(currentUser?.id);

    if (!this.selectedJobForApply?.id || !currentUserId) {
      alert('No se pudo identificar tu sesión. Por favor inicia sesión nuevamente.');
      return;
    }

    this.isSubmitting.set(true);

    // Se envía 'userId' tal como lo exige el validador del backend
    const payload = {
      jobId: Number(this.selectedJobForApply.id),
      userId: currentUserId,
      message: this.applicationMessage.trim()
    };

    this.apiService.applyToJob(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showApplyModal.set(false);
        this.applicationMessage = '';
        alert('¡Te has postulado con éxito!');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'Error al enviar la postulación.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
