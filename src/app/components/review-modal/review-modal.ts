import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Review } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-review-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './review-modal.html',
  styleUrl: './review-modal.css'
})
export class ReviewModal {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  @Input({ required: true }) contractId!: number;
  @Input({ required: true }) reviewedUserId!: number;
  @Input() jobTitle: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() reviewCreated = new EventEmitter<Review>();

  rating = signal<number>(5);
  hoverRating = signal<number>(0);
  comment: string = '';
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  setRating(value: number): void {
    this.rating.set(value);
  }

  setHover(value: number): void {
    this.hoverRating.set(value);
  }

  clearHover(): void {
    this.hoverRating.set(0);
  }

  submit(): void {
    const currentUser = this.authService.getCurrentUser();
    const reviewerId = Number(currentUser?.id);

    if (!this.comment.trim()) {
      this.errorMessage.set('Por favor escribe un breve comentario.');
      return;
    }

    if (!reviewerId || !this.contractId || !this.reviewedUserId) {
      this.errorMessage.set('Información incompleta para calificar.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: Review = {
      contractId: Number(this.contractId),
      reviewerId: reviewerId,
      reviewedUserId: Number(this.reviewedUserId),
      rating: Number(this.rating()),
      comment: this.comment.trim()
    };

    this.apiService.createReview(payload).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.reviewCreated.emit(created);
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Error al enviar la calificación.');
      }
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
