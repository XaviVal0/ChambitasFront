import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Application, Contract, Job } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Notification } from '../../services/notification';
import { ReviewModal } from '../../components/review-modal/review-modal';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [RouterLink, ReviewModal],
  templateUrl: './applications.html',
  styleUrl: './applications.css',
})
export class Applications implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(Notification);

  applications = signal<Application[]>([]);
  contracts = signal<Contract[]>([]);
  myJobs = signal<Job[]>([]);
  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);

  notificationCount = this.notificationService.pendingCount;
  currentUser = this.authService.getCurrentUser();
  selectedContractForReview: Contract | null = null;

  ngOnInit(): void {
    this.loadData();
    this.notificationService.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  loadData(): void {
    this.isLoading.set(true);
    // Cargar ofertas creadas por el usuario para validar permisos de autor
    this.apiService.getJobs().subscribe({
      next: (jobs) => {
        const currentUserId = Number(this.currentUser?.id);
        this.myJobs.set(jobs.filter(j => Number(j.userId) === currentUserId));
        this.loadApplicationsAndContracts();
      },
      error: () => this.loadApplicationsAndContracts()
    });
  }

  loadApplicationsAndContracts(): void {
    this.apiService.getApplications().subscribe({
      next: (data) => {
        this.applications.set(data);
        this.loadContracts();
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadContracts(): void {
    this.apiService.getContracts().subscribe({
      next: (data) => {
        this.contracts.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // Comprueba si el usuario autenticado es el autor de la chamba
  isJobOwner(jobId?: number): boolean {
    if (!jobId) return false;
    return this.myJobs().some(j => Number(j.id) === Number(jobId));
  }

  acceptAndCreateContract(app: Application): void {
    const currentUserId = Number(this.currentUser?.id);
    const targetJobId = Number(app.jobId || app.job?.id);

    if (!app.id || !targetJobId || !currentUserId) return;

    this.isActionLoading.set(true);

    // 1. Aceptar la postulación
    this.apiService.updateApplicationStatus(app.id, 'ACCEPTED').subscribe({
      next: () => {
        // 2. Generar el contrato formal
        const contractPayload = {
          matchId: Number(app.id),
          jobId: targetJobId,
          userId: currentUserId
        };

        this.apiService.createContract(contractPayload).subscribe({
          next: (contractCreated) => {
            this.contracts.update((list) => [...list, contractCreated]);
            this.applications.update((list) =>
              list.map(a => a.id === app.id ? { ...a, status: 'ACCEPTED' } : a)
            );
            this.notificationService.checkNotifications();
            this.isActionLoading.set(false);
            alert('¡Contrato formalizado con éxito! La chamba está en curso.');
          },
          error: (err) => {
            this.isActionLoading.set(false);
            alert(err.error?.message || 'Error al formalizar el contrato.');
          }
        });
      },
      error: (err) => {
        this.isActionLoading.set(false);
        alert(err.error?.message || 'Error al procesar la postulación.');
      }
    });
  }

  // Abrir modal para finalizar y calificar
  openFinishAndReview(contract: Contract): void {
    this.selectedContractForReview = contract;
  }

  // Se ejecuta tras calificar con éxito en el ReviewModal
  onReviewSuccess(): void {
    if (this.selectedContractForReview?.id) {
      const contractId = this.selectedContractForReview.id;
      // Actualizar el estado local del contrato a FINALIZADO
      this.contracts.update(list =>
        list.map(c => c.id === contractId ? { ...c, status: 'COMPLETED' } : c)
      );
    }
    this.selectedContractForReview = null;
    alert('¡Chamba finalizada y calificación enviada con éxito!');
  }

  logout(): void {
    this.authService.logout();
  }
}
