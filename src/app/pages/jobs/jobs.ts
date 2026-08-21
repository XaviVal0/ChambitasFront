import { Component, inject, OnInit, signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Job } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Application,Contract } from '../../services/api';


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

  allJobs = signal<Job[]>([]);
  applications = signal<Application[]>([]);
  contracts = signal<Contract[]>([]);

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  showCreateModal = signal<boolean>(false);
  showApplyModal = signal<boolean>(false);

  currentUser = this.authService.getCurrentUser();

  newJob = {
    title: '',
    description: '',
    price: null as number | null
  };

  selectedJobForApply: Job | null = null;
  applicationMessage: string = '';

  // Filtro reactivo inteligente
  visibleJobs = computed(() => {
    const currentUserId = Number(this.currentUser?.id);
    const jobs = this.allJobs();
    const myApps = this.applications();
    const contractsList = this.contracts();

    // IDs de trabajos donde el usuario actual ya se postuló o tiene contrato
    const jobsImWorkingOn = new Set([
      ...myApps.filter(a => Number(a.userId || a.workerId) === currentUserId).map(a => Number(a.jobId)),
      ...contractsList.filter(c => Number(c.userId) === currentUserId).map(c => Number(c.jobId))
    ]);

    // IDs de trabajos que ya fueron finalizados
    const completedJobIds = new Set(
      contractsList.filter(c => c.status === 'COMPLETED').map(c => Number(c.jobId))
    );

    return jobs.filter(job => {
      const jobId = Number(job.id);
      const isOwner = Number(job.userId) === currentUserId;
      const isWorkingOrApplied = jobsImWorkingOn.has(jobId);
      const isCompleted = completedJobIds.has(jobId);

      // 1. El dueño siempre ve sus chambas
      if (isOwner) return true;

      // 2. Si ya está finalizada, no se le muestra a terceros
      if (isCompleted) return false;

      // 3. Si el usuario está postulado/trabajando en ella, la ve
      if (isWorkingOrApplied) return true;

      // 4. Si está vigente/disponible (status != CLOSED/COMPLETED), cualquier usuario la ve
      return !job.status || job.status === 'OPEN' || job.status === 'PENDING';
    });
  });

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Cargar trabajos, postulaciones y contratos para cruzar estados
    this.apiService.getJobs().subscribe({
      next: (jobsData) => {
        this.allJobs.set(jobsData);
        this.apiService.getApplications().subscribe({
          next: (apps) => this.applications.set(apps),
          error: () => {}
        });
        this.apiService.getContracts().subscribe({
          next: (contracts) => this.contracts.set(contracts),
          error: () => {}
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al obtener las ofertas.');
        this.isLoading.set(false);
      }
    });
  }

  // Comprueba si el usuario autenticado es el creador
  isJobOwner(job: Job): boolean {
    return Number(job.userId) === Number(this.currentUser?.id);
  }

  // Comprueba si ya se postuló a esta chamba
  hasAlreadyApplied(jobId?: number): boolean {
    if (!jobId) return false;
    const currentUserId = Number(this.currentUser?.id);
    return this.applications().some(
      a => Number(a.jobId) === Number(jobId) && Number(a.userId || a.workerId) === currentUserId
    );
  }

  openCreateModal(): void {
    this.newJob = { title: '', description: '', price: null };
    this.showCreateModal.set(true);
  }

  saveJob(): void {
    const currentUserId = Number(this.currentUser?.id);

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
        this.allJobs.update((list) => [created, ...list]);
        this.isSubmitting.set(false);
        this.showCreateModal.set(false);
        alert('¡Chamba publicada con éxito!');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'No se pudo publicar la oferta.');
      }
    });
  }

  openApplyModal(job: Job): void {
    if (this.isJobOwner(job)) {
      alert('No puedes postularte a una chamba que tú mismo publicaste.');
      return;
    }
    this.selectedJobForApply = job;
    this.applicationMessage = '';
    this.showApplyModal.set(true);
  }

  submitApplication(): void {
    const currentUserId = Number(this.currentUser?.id);

    if (!this.selectedJobForApply?.id || !currentUserId) {
      alert('No se pudo identificar tu sesión.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      jobId: Number(this.selectedJobForApply.id),
      userId: currentUserId,
      message: this.applicationMessage.trim()
    };

    this.apiService.applyToJob(payload).subscribe({
      next: (newApp) => {
        this.applications.update((list) => [...list, newApp]);
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
