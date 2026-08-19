import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Notification {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  pendingCount = signal<number>(0);
  private intervalId: any = null;

  startPolling(intervalMs: number = 15000): void {
    this.checkNotifications();
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.checkNotifications(), intervalMs);
    }
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkNotifications(): void {
    const currentUser = this.authService.getCurrentUser();
    const currentUserId = Number(currentUser?.id);

    if (!currentUserId) {
      this.pendingCount.set(0);
      return;
    }

    this.apiService.getJobs().subscribe({
      next: (jobs) => {
        const myJobIds = new Set(
          jobs.filter(j => Number(j.userId) === currentUserId).map(j => Number(j.id))
        );

        this.apiService.getApplications().subscribe({
          next: (apps) => {
            const pending = apps.filter(
              a => myJobIds.has(Number(a.jobId)) && (!a.status || a.status === 'PENDING')
            );
            this.pendingCount.set(pending.length);
          },
          error: () => {}
        });
      },
      error: () => {}
    });
  }
}
