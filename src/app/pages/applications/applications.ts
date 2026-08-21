import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Application, Contract } from '../../services/api';
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
  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);

  // Señal conectada al servicio para el badge y el banner de alerta
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

  acceptAndCreateContract(app: Application): void {
    const currentUserId = Number(this.currentUser?.id);
    const targetJobId = Number(app.jobId || app.job?.id);

    if (!app.id || !targetJobId || !currentUserId) return;

    this.isActionLoading.set(true);

    // 1. Aceptar postulación
    this.apiService.updateApplicationStatus(app.id, 'ACCEPTED').subscribe({
      next: () => {
        // 2. Crear contrato con el payload esperado
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
            // Actualizar el contador de notificaciones de inmediato
            this.notificationService.checkNotifications();
            this.isActionLoading.set(false);
            alert('¡Contrato formalizado con éxito!');
          },
          error: (err) => {
            this.isActionLoading.set(false);
            alert(err.error?.message || 'Error al generar el contrato.');
          }
        });
      },
      error: (err) => {
        this.isActionLoading.set(false);
        alert(err.error?.message || 'Error al actualizar postulación.');
      }
    });
  }

  openReview(contract: Contract): void {
    this.selectedContractForReview = contract;
  }

  onReviewSuccess(): void {
    this.selectedContractForReview = null;
    alert('¡Reseña registrada con éxito!');
  }

  logout(): void {
    this.authService.logout();
  }
}
