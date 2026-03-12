import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HorseDTO } from '../../models/horse.model';
import { FeedSchedChangeRequestDTO } from '../../models/feed-sched-change-request.model';
import { HorseService } from '../../services/horse.service';
import { FeedSchedService } from '../../services/feed-sched.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.css']
})
export class RequestsPage implements OnInit {
  loading = true;
  error = '';
  pendingCount = 0;

  horseRequests: HorseDTO[] = [];
  feedSchedRequests: FeedSchedChangeRequestDTO[] = [];

  toastMessage = '';
  toastVisible = false;

  constructor(
    private horseService: HorseService,
    private feedSchedService: FeedSchedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  loadRequests(): void {
    this.loading = true;
    this.error = '';

    this.horseService.getRequests().subscribe({
      next: (horses) => {
        this.horseRequests = horses;
        this.updatePendingCount();
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a ló kéréseket.';
        this.loading = false;
      }
    });

    this.feedSchedService.getChangeRequests().subscribe({
      next: (requests) => {
        this.feedSchedRequests = requests;
        this.updatePendingCount();
      },
      error: () => {
        this.error = 'Nem sikerült betölteni az etetési kéréseket.';
      }
    });
  }

  private updatePendingCount(): void {
    this.pendingCount = (this.horseRequests?.length || 0) + (this.feedSchedRequests?.length || 0);
  }

  approveHorseRequest(horse: HorseDTO): void {
    if (!horse.id) return;
    this.horseService.approveRequest(horse.id).subscribe({
      next: () => {
        this.horseRequests = this.horseRequests.filter(h => h.id !== horse.id);
        this.showToast(`A(z) ${horse.horseName} jóváhagyva.`);
      },
      error: () => this.showToast('Nem sikerült jóváhagyni a kérést.')
    });
  }

  rejectHorseRequest(horse: HorseDTO): void {
    if (!horse.id) return;
    this.horseService.rejectRequest(horse.id).subscribe({
      next: () => {
        this.horseRequests = this.horseRequests.filter(h => h.id !== horse.id);
        this.showToast(`A(z) ${horse.horseName} elutasítva.`);
      },
      error: () => this.showToast('Nem sikerült elutasítani a kérést.')
    });
  }

  approveFeedSchedRequest(request: FeedSchedChangeRequestDTO): void {
    if (!request.id) return;
    this.feedSchedService.approveChangeRequest(request.id).subscribe({
      next: () => {
        this.feedSchedRequests = this.feedSchedRequests.filter(r => r.id !== request.id);
        this.showToast('Etetési kérés jóváhagyva.');
      },
      error: () => this.showToast('Nem sikerült jóváhagyni a kérést.')
    });
  }

  rejectFeedSchedRequest(request: FeedSchedChangeRequestDTO): void {
    if (!request.id) return;
    this.feedSchedService.rejectChangeRequest(request.id).subscribe({
      next: () => {
        this.feedSchedRequests = this.feedSchedRequests.filter(r => r.id !== request.id);
        this.showToast('Etetési kérés elutasítva.');
      },
      error: () => this.showToast('Nem sikerült elutasítani a kérést.')
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }
}
