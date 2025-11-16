import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HorseDTO } from '../../models/horse.model';
import { HorseService } from '../../services/horse.service';

@Component({
  selector: 'app-horse-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './horse-profile.html',
  styleUrls: ['./horse-profile.css']
})
export class HorseProfilePage implements OnInit {
    horse?: HorseDTO;
    loading = true;
    error = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private horseService: HorseService
    ) {}

    ngOnInit(): void {
        const navHorse = this.router.getCurrentNavigation()?.extras.state?.['horse'] as HorseDTO | undefined;
        if (navHorse) {
            this.horse = navHorse;
            this.loading = false;
            return;
        }

        const horseName = this.route.snapshot.paramMap.get('horseName');
        if (!horseName) {
            this.error = 'Nincs kiválasztott ló.';
            this.loading = false;
            return;
        }

        this.fetchHorse(horseName);
    }

    private fetchHorse(horsename: string): void {
        this.horseService.getAll().subscribe({
            next: (horses) => {
                this.horse = horses.find((horse) => horse.horseName === horsename);
                if (!this.horse) {
                    this.error = 'Nem található ló ezzel a névvel.';
                }
                this.loading = false;
            },
            error: () => {
                this.error = 'Nem sikerült betölteni a ló adatait.';
                this.loading = false;
            }
        });
    }

    goBack(): void {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.router.navigate(['/horses']);
        }
    }

    getSexLabel(sex: string | null | undefined): string {
    switch (sex) {
        case 'G': return 'Herélt';
        case 'M': return 'Csődör';
        case 'F': return 'Kanca';
        default: return 'Ismeretlen';
    }
}

}