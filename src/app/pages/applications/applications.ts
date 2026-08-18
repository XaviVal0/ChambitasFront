import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Application, Contract } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-applications',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './applications.html',
  styleUrl: './applications.css',
})
export class Applications implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  applications = signal<Application[]>([]);
  contracts = signal<Contract[]>([]);
  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);

  currentUser = this.authService.getCurrentUser();

  ngOnInit(): void {
    this.loadData();
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
    if (!app.id || !app.jobId || !currentUserId) return;

    this.isActionLoading.set(true);

    // 1. Aceptar postulación
    this.apiService.updateApplicationStatus(app.id, 'ACCEPTED').subscribe({
      next: () => {
        // 2. Crear contrato con el DTO exacto: { matchId, jobId, userId }
        const contractPayload = {
          matchId: Number(app.id),
          jobId: Number(app.jobId),
          userId: currentUserId
        };

        this.apiService.createContract(contractPayload).subscribe({
          next: (contractCreated) => {
            this.contracts.update((list) => [...list, contractCreated]);
            this.applications.update((list) =>
              list.map(a => a.id === app.id ? { ...a, status: 'ACCEPTED' } : a)
            );
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

  logout(): void {
    this.authService.logout();
  }
}
