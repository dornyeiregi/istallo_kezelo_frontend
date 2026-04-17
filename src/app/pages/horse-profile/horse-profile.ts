import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HorseDTO } from '../../models/horse.model';
import { HorseService } from '../../services/horse.service';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';
import { ShotDTO } from '../../models/shot.model';
import { ShotService } from '../../services/shot.service';
import { HorseShotService } from '../../services/horse-shot.service';
import { FormsModule } from '@angular/forms';
import { TreatmentDTO } from '../../models/treatment.model';
import { TreatmentService } from '../../services/treatment.service';
import { FarrierAppDTO, FarrierHorseDetailDTO } from '../../models/farrier-app.model';
import { FarrierAppService } from '../../services/farrier-app.service';
import { FeedSchedDTO } from '../../models/feed-sched.model';
import { FeedSchedChangeRequestDTO } from '../../models/feed-sched-change-request.model';
import { FeedSchedService } from '../../services/feed-sched.service';
import { HorseFeedSchedService } from '../../services/horse-feed-sched.service';
import { HorseFarrierAppService } from '../../services/horse-farrier-app.service';
import { HorseFarrierAppDTO } from '../../models/horse-farrier-app.model';
import { HorseTreatmentService } from '../../services/horse-treatment.service';
import { HorseTreatmentDTO } from '../../models/horse-treatment.model';
import { AuthService } from '../../services/auth.service';
import { forkJoin, Observable, of } from 'rxjs';
import { ItemService } from '../../services/item.service';
import { ItemDTO } from '../../models/item.model';
import { SettingsService } from '../../services/settings.service';
import { EmployeeAccessSettingsDTO } from '../../models/employee-access-settings.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-horse-profile',
  standalone: true,
  imports: [CommonModule, CrudMenuComponent, FormsModule],
  templateUrl: './horse-profile.html',
  styleUrls: ['./horse-profile.css']
})
export class HorseProfilePage implements OnInit {
    horse?: HorseDTO;
    loading = true;
    error = '';
    shots: ShotDTO[] = [];
    showAllShots = false;
    showVaccinationPopup = false;
    vaccinationOption: 'existing' | 'new' = 'existing';
    selectedShotId: number | null = null;
    allShots: ShotDTO[] = [];
    treatments: TreatmentDTO[] = [];
    showAllTreatments = false;
    showTreatmentPopup = false;
    treatmentOption: 'existing' | 'new' = 'existing';
    selectedTreatmentId: number | null = null;
    allTreatments: TreatmentDTO[] = [];
    farrierApps: FarrierAppDTO[] = [];
    showAllFarrierApps = false;
    showFarrierPopup = false;
    farrierOption: 'existing' | 'new' = 'existing';
    selectedFarrierAppId: number | null = null;
    allFarrierApps: FarrierAppDTO[] = [];
    farrierShoeCount: number = 4;
    farrierNote: string = '';
    feedScheds: FeedSchedDTO[] = [];
    showAllFeedScheds = false;
    showFeedEditor = false;
    feedEditorError = '';
    feedChangePending = false;
    feedChangeMessage = '';
    pendingFeedRequestsForHorse: FeedSchedChangeRequestDTO[] = [];
    feedToastMessage = '';
    feedToastVisible = false;
    expandedFeedSchedId: number | null = null;
    items: ItemDTO[] = [];
    feedEditorItems: ItemDTO[] = [];
    private allowedFeedItemIds = new Set<number>();
    horsesForFeed: HorseDTO[] = [];
    otherHorsesForFeed: HorseDTO[] = [];
    feedEditor = this.createEmptyFeedEditor();
    employeeAccess: EmployeeAccessSettingsDTO = {
      viewShots: false,
      viewTreatments: false,
      viewFarrierApps: false
    };
    canViewShots = true;
    canViewTreatments = true;
    canViewFarrierApps = true;


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private horseService: HorseService,
        private shotService: ShotService,
        private horseShotService: HorseShotService,
        private treatmentService: TreatmentService,
        private farrierAppService: FarrierAppService,
        private feedSchedService: FeedSchedService,
        private horseFeedSchedService: HorseFeedSchedService,
        private itemService: ItemService,
        private horseFarrierAppService: HorseFarrierAppService,
        private horseTreatmentService: HorseTreatmentService,
        private authService: AuthService,
        private settingsService: SettingsService,
        private userService: UserService
    ) {}

    ngOnInit(): void {
        this.resolveEmployeeAccess();
        const navHorse = this.router.getCurrentNavigation()?.extras.state?.['horse'] as HorseDTO | undefined;
        if (navHorse) {
            this.horse = navHorse;
            this.populateOwnerPhone(navHorse);
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

    private resolveEmployeeAccess(): void {
      if (!this.authService.hasAnyRole(['EMPLOYEE', 'ROLE_EMPLOYEE'])) {
        this.canViewShots = true;
        this.canViewTreatments = true;
        this.canViewFarrierApps = true;
        return;
      }
      this.settingsService.getEmployeeAccess().subscribe({
        next: (settings) => {
          this.employeeAccess = settings;
          this.canViewShots = !!settings.viewShots;
          this.canViewTreatments = !!settings.viewTreatments;
          this.canViewFarrierApps = !!settings.viewFarrierApps;
        },
        error: () => {
          this.canViewShots = false;
          this.canViewTreatments = false;
          this.canViewFarrierApps = false;
        }
      });
    }

    private fetchHorse(horsename: string): void {
      this.horseService.getByName(horsename).subscribe({
        next: (horse) => {
          this.horse = horse;
          this.populateOwnerPhone(horse);
          if (this.canViewShots) this.loadShots(this.horse.id!);
          if (this.canViewTreatments) this.loadTreatments(this.horse.id!);
          if (this.canViewFarrierApps) this.loadFarrierApps(this.horse.id!);
          this.loadFeedScheds(this.horse.id!);
          this.loading = false;
        },
        error: () => {
          this.error = 'Nem található ló ezzel a névvel.';
          this.loading = false;
        }
      });
    }

    private populateOwnerPhone(horse: HorseDTO): void {
      if (!horse.ownerId) return;
      this.userService.getById(horse.ownerId).subscribe({
        next: (user) => {
          if (this.horse) {
            this.horse.ownerPhone = user.phone || '';
          }
        }
      });
    }


    frequencyLabels: { [key: string]: string } = {
      'DAY': 'Nap',
      'DAYS': 'Nap',
      'NAP': 'Nap',

      'WEEK': 'Hét',
      'WEEKS': 'Hét',
      'HET': 'Hét',

      'MONTH': 'Hónap',
      'MONTHS': 'Hónap',

      'YEAR': 'Év',
      'YEARS': 'Év',
      'EV': 'Év'
    };


    loadShots(horseId: number): void {
      this.shotService.getAllOfHorseById(horseId).subscribe({
        next: (data) => {
          this.shots = data.sort((a, b) =>
            new Date(b.date!).getTime() - new Date(a.date!).getTime()
          );
        },
        error: () => {
          console.error("Nem sikerült betölteni az oltásokat.");
        }
      });
    }

    loadTreatments(horseId: number): void {
      this.treatmentService.getAllOfHorseById(horseId).subscribe({
        next: (data) => {
          this.treatments = data.sort((a, b) =>
            new Date(b.date!).getTime() - new Date(a.date!).getTime()
          );
        },
        error: () => {
          console.error("Nem sikerült betölteni a kezeléseket.");
        }
      });
    }

    loadFarrierApps(horseId: number): void {
      this.farrierAppService.getAllOfHorseById(horseId).subscribe({
        next: (data) => {
          this.farrierApps = data.sort((a, b) =>
            new Date(b.appointmentDate!).getTime() - new Date(a.appointmentDate!).getTime()
          );
        },
        error: () => {
          console.error("Nem sikerült betölteni a patkolási időpontokat.");
        }
      });
    }

    getFarrierHorseDetail(app: FarrierAppDTO): FarrierHorseDetailDTO | null {
      const horseId = this.horse?.id;
      if (!horseId || !app.horseDetails) return null;
      return app.horseDetails.find(detail => detail.horseId === horseId) || null;
    }

    getFarrierShoeLabel(app: FarrierAppDTO): string {
      const detail = this.getFarrierHorseDetail(app);
      const count = detail?.shoeCount ?? 0;
      if (count === 4) return '4 patkó';
      if (count === 2) return '2 patkó';
      return 'Nincs patkó';
    }

    loadFeedScheds(horseId: number): void {
      const isOwner = this.authService.hasAnyRole(['OWNER', 'ROLE_OWNER']);
      const pending$ = isOwner ? this.feedSchedService.getMyChangeRequests() : of([]);

      const horses$ = isOwner ? this.horseService.getMine() : this.horseService.getAll();

      forkJoin({
        feedScheds: this.feedSchedService.getAllOfHorseById(horseId),
        items: this.itemService.getAll(),
        horses: horses$,
        pending: pending$
      }).subscribe({
        next: ({ feedScheds, items, horses, pending }) => {
          this.feedScheds = feedScheds.sort((a, b) =>
            (b.feedSchedId || 0) - (a.feedSchedId || 0)
          );
          this.items = items;
          this.feedEditorItems = items.filter(i => (i.itemType || '').toUpperCase() !== 'BEDDING');
          this.allowedFeedItemIds = new Set(
            this.feedEditorItems.map(i => i.itemId).filter(Boolean) as number[]
          );
          this.horsesForFeed = this.mergeHorses(horses, []);
          this.otherHorsesForFeed = this.horsesForFeed.filter(h => h.id !== this.currentHorseId);
          this.updatePendingFeedNotice(pending as FeedSchedChangeRequestDTO[]);
          this.refreshFeedEditorFromExisting();
        },
        error: () => {
          console.error("Nem sikerült betölteni az etetési ütemterveket.");
        }
      });
    }

    getFrequencyLabel(shot: ShotDTO): string {
      if (!shot.frequencyValue || !shot.frequencyUnit) return '-';

      const unit = shot.frequencyUnit.toUpperCase().trim();
      const unitLabel = this.frequencyLabels[unit] || unit;

      return `${shot.frequencyValue} ${unitLabel}`;
    }

    getFeedSchedDisplayName(feed: FeedSchedDTO | null | undefined): string {
      if (!feed) return '-';
      const timeLabel = this.getFeedTimesLabel(feed);
      const idPart = feed.feedSchedId != null ? `_${feed.feedSchedId}` : '';
      return `${timeLabel}${idPart}`;
    }

    getFeedTimeLabel(feed: FeedSchedDTO | null | undefined): string {
      if (!feed) return '-';
      return this.getFeedTimesLabel(feed);
    }

    private getFeedTimesLabel(feed: FeedSchedDTO): string {
      const parts: string[] = [];
      if (feed.feedMorning) parts.push('Reggel');
      if (feed.feedNoon) parts.push('Dél');
      if (feed.feedEvening) parts.push('Este');
      return parts.length ? parts.join(' + ') : '-';
    }

    toggleFeedProfile(feed: FeedSchedDTO): void {
      const id = feed.feedSchedId;
      if (id == null) return;
      this.expandedFeedSchedId = this.expandedFeedSchedId === id ? null : id;
    }

    isFeedExpanded(feed: FeedSchedDTO): boolean {
      if (feed.feedSchedId == null) return false;
      return this.expandedFeedSchedId === feed.feedSchedId;
    }

    getFeedHorseNames(feed: FeedSchedDTO): string[] {
      if (!feed.horseIds || feed.horseIds.length === 0) return [];
      return feed.horseIds.map(id => this.getHorseNameById(id));
    }

    getFeedItemDetails(feed: FeedSchedDTO): string[] {
      if (feed.items && feed.items.length > 0) {
        return feed.items.map(item => {
          const name = this.getItemNameById(item.itemId);
          const amount = Number.isFinite(item.amount) ? item.amount : 0;
          return `${name} - ${this.formatKg(amount)} kg`;
        });
      }
      if (feed.itemIds && feed.itemIds.length > 0) {
        return feed.itemIds.map(id => this.getItemNameById(id));
      }
      return [];
    }

    private formatKg(value: number): string {
      if (!Number.isFinite(value)) return '0';
      const normalized = Math.round(value * 100) / 100;
      return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(2);
    }

    getFeedSchedForTime(time: FeedTimeKey): FeedSchedDTO | null {
      return this.getExistingFeedSchedsByTime()[time];
    }

    private getItemNameById(itemId: number): string {
      const found = this.items.find(i => i.itemId === itemId);
      return found?.name || `Tétel #${itemId}`;
    }

    private getHorseNameById(horseId: number): string {
      const found = this.horsesForFeed.find(h => h.id === horseId);
      return found?.horseName || `Ló #${horseId}`;
    }

    goBack(): void {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.router.navigate(['/horses']);
        }
    }

    goToShot(id: number): void {
      this.router.navigate(['/shots', id]);
    }

    goToTreatment(id: number): void {
      this.router.navigate(['/treatments', id]);
    }

    goToFarrierApp(id: number): void {
      this.router.navigate(['/farrier-apps', id]);
    }


    getSexLabel(sex: string | null | undefined): string {
      switch (sex) {
          case 'G': return 'Herélt';
          case 'M': return 'Csődör';
          case 'F': return 'Kanca';
          default: return 'Ismeretlen';
      }
    }

    editHorse() {
      if (!this.horse?.id) return;
      this.router.navigate(['/horses/edit', this.horse.id]);
    }

    editFeeding() {
      console.log("Etetés szerkesztése");
    }

    addVaccination() {
      this.vaccinationOption = 'existing';
      this.selectedShotId = null;

      this.shotService.getAll().subscribe(shots => {
        this.allShots = shots;
        this.showVaccinationPopup = true;
      });
    }

    submitVaccination() {
      if (!this.horse?.id) return;

      if (this.vaccinationOption === 'existing') {

        if (!this.selectedShotId) return;

        this.horseShotService.addShotToHorse(this.selectedShotId, this.horse.id)
          .subscribe(() => {
            this.showVaccinationPopup = false;
            this.loadShots(this.horse!.id!);
          });

      } else {
        this.showVaccinationPopup = false;
        this.router.navigate(['/shots/new', this.horse!.id]);
      };
    }

    addShoeing() {
      console.log("Patkolás hozzáadása");
    }

    addTreatment() {
      this.treatmentOption = 'existing';
      this.selectedTreatmentId = null;

      this.treatmentService.getAll().subscribe(treatments => {
        this.allTreatments = treatments;
        this.showTreatmentPopup = true;
      });
    }

    addFarrierApp() {
      this.farrierOption = 'existing';
      this.selectedFarrierAppId = null;

      this.farrierAppService.getAll().subscribe(apps => {
        this.allFarrierApps = apps;
        this.showFarrierPopup = true;
      });
    }

    addFeedSched() {
      if (!this.horse?.id) return;
      this.feedEditorError = '';
      this.feedEditor = this.createEmptyFeedEditor();
      this.openFeedEditor();
    }

    get crudActions() {
      return [
        {
          label: "Lóadatok szerkesztése",
          icon: "fa-pen-to-square",
          onClick: () => this.editHorse()
        },
        {
          label: "Etetés hozzáadása",
          icon: "fa-utensils",
          onClick: () => this.addFeedSched()
        },
        {
          label: "Oltás hozzáadása",
          icon: "fa-syringe",
          onClick: () => this.addVaccination()
        },
        {
          label: "Patkolás hozzáadása",
          icon: "fa-hammer",
          onClick: () => this.addFarrierApp()
        },
        {
          label: "Kezelés hozzáadása",
          icon: "fa-briefcase-medical",
          onClick: () => this.addTreatment()
        }
      ];
    }

    submitTreatment() {
      if (!this.horse?.id) return;

      if (this.treatmentOption === 'existing') {

        if (!this.selectedTreatmentId) return;

        const selected = this.allTreatments.find(
          f => f.treatmentId === this.selectedTreatmentId);
        if (!selected?.treatmentId) return;

        const dto: HorseTreatmentDTO = {
          horseId: this.horse.id,
          treatmentId: selected.treatmentId,
        };

        this.horseTreatmentService.create(dto)
          .subscribe(() => {
            this.showTreatmentPopup = false;
            this.loadTreatments(this.horse!.id!);
          });

      } else {
        this.showTreatmentPopup = false;
        this.router.navigate(['/treatments/new', this.horse!.id]);
      };
    }

    submitFarrierApp() {
      if (!this.horse?.id) return;

      if (this.farrierOption === 'existing') {

        if (!this.selectedFarrierAppId) return;

        const selected = this.allFarrierApps.find(
          f => f.farrierAppId === this.selectedFarrierAppId);
        if (!selected?.farrierAppId) return;

        const dto: HorseFarrierAppDTO = {
          horseId: this.horse.id,
          farrierAppId: selected.farrierAppId,
          shoeCount: this.farrierShoeCount,
          note: this.farrierNote
        };

        this.horseFarrierAppService.create(dto)
          .subscribe(() => {
            this.showFarrierPopup = false;
            this.farrierShoeCount = 4;
            this.farrierNote = '';
            this.loadFarrierApps(this.horse!.id!);
          });

      } else {
        this.showFarrierPopup = false;
        this.router.navigate(['/farrier-apps/new', this.horse!.id]);
      };
    }

    submitFeedEditor() {
      if (!this.horse?.id) return;
      this.feedEditorError = '';

      const hasAnyTime = this.feedEditor.morning.enabled
        || this.feedEditor.noon.enabled
        || this.feedEditor.evening.enabled;
      if (!hasAnyTime) {
        this.horseFeedSchedService.deleteAllForHorse(this.horse.id)
          .subscribe(() => {
            this.showFeedEditor = false;
            this.loadFeedScheds(this.horse!.id!);
          });
        return;
      }

      const tasks = this.buildFeedSchedTasks();
      if (tasks.length === 0) {
        this.feedEditorError = 'Legalább egy időpontot válassz ki etetéshez.';
        return;
      }

      forkJoin(tasks).subscribe({
        next: (responses) => {
          const pending = (responses as unknown[]).find(
            r => typeof r === 'string' && r.toLowerCase().includes('kérés')
          ) as string | undefined;
          if (pending) {
            this.feedChangePending = true;
            this.feedChangeMessage = pending;
            this.showFeedToast(pending);
          } else {
            this.feedChangePending = false;
            this.feedChangeMessage = '';
          }
          this.showFeedEditor = false;
          this.loadFeedScheds(this.horse!.id!);
        },
        error: () => {
          this.feedEditorError = 'Nem sikerült létrehozni az etetési ütemtervet.';
        }
      });
    }

    cancelFeedEditor() {
      this.showFeedEditor = false;
    }

    toggleFeedItem(time: FeedTimeKey, itemId: number) {
      const block = this.feedEditor[time];
      if (block.itemIds.includes(itemId)) {
        block.itemIds = block.itemIds.filter(id => id !== itemId);
        delete block.itemAmounts[itemId];
      } else {
        block.itemIds = [...block.itemIds, itemId];
        if (!Number.isFinite(block.itemAmounts[itemId] as number)) {
          block.itemAmounts[itemId] = 1;
        }
      }
    }

    isFeedItemSelected(time: FeedTimeKey, itemId: number): boolean {
      return this.feedEditor[time].itemIds.includes(itemId);
    }

    updateFeedItemAmount(time: FeedTimeKey, itemId: number, value: string) {
      const num = Number(value);
      this.feedEditor[time].itemAmounts[itemId] = Number.isFinite(num) ? num : 0;
    }

    toggleHorseSelection(time: FeedTimeKey, horseId: number) {
      const block = this.feedEditor[time];
      if (block.horseIds.includes(horseId)) {
        block.horseIds = block.horseIds.filter(id => id !== horseId);
      } else {
        block.horseIds = [...block.horseIds, horseId];
      }
      this.ensureCurrentHorse(time);
    }

    onToggleOtherHorses(time: FeedTimeKey) {
      const block = this.feedEditor[time];
      if (!block.includeOtherHorses) {
        block.horseIds = this.currentHorseId ? [this.currentHorseId] : [];
      } else {
        this.ensureCurrentHorse(time);
      }
    }

    get currentHorseId(): number | null {
      return this.horse?.id ?? null;
    }

    private ensureCurrentHorse(time: FeedTimeKey) {
      if (!this.currentHorseId) return;
      const block = this.feedEditor[time];
      if (!block.horseIds.includes(this.currentHorseId)) {
        block.horseIds = [...block.horseIds, this.currentHorseId];
      }
    }

    private openFeedEditor() {
      const isOwner = this.authService.hasAnyRole(['OWNER', 'ROLE_OWNER']);
      if (isOwner) {
        forkJoin({
          horses: this.horseService.getAll(),
          pending: this.horseService.getMyRequests(),
          items: this.itemService.getAll()
        }).subscribe({
          next: ({ horses, pending, items }) => {
            this.horsesForFeed = this.mergeHorses(horses, pending);
            this.otherHorsesForFeed = this.horsesForFeed.filter(h => h.id !== this.currentHorseId);
            this.items = items;
            this.refreshFeedEditorFromExisting();
            this.showFeedEditor = true;
          },
          error: () => {
            this.horsesForFeed = [];
            this.otherHorsesForFeed = [];
            this.items = [];
            this.refreshFeedEditorFromExisting();
            this.showFeedEditor = true;
          }
        });
      } else {
        forkJoin({
          horses: this.horseService.getAll(),
          items: this.itemService.getAll()
        }).subscribe({
          next: ({ horses, items }) => {
            this.horsesForFeed = horses;
            this.otherHorsesForFeed = this.horsesForFeed.filter(h => h.id !== this.currentHorseId);
            this.items = items;
            this.refreshFeedEditorFromExisting();
            this.showFeedEditor = true;
          },
          error: () => {
            this.horsesForFeed = [];
            this.otherHorsesForFeed = [];
            this.items = [];
            this.refreshFeedEditorFromExisting();
            this.showFeedEditor = true;
          }
        });
      }
    }

    private mergeHorses(active: HorseDTO[], pending: HorseDTO[]): HorseDTO[] {
      const byId = new Map<number, HorseDTO>();
      for (const h of active) {
        if (h.id != null) byId.set(h.id, h);
      }
      for (const h of pending) {
        if (h.id != null && !byId.has(h.id)) byId.set(h.id, h);
      }
      return Array.from(byId.values());
    }

    private buildFeedSchedTasks(): Observable<unknown>[] {
      const tasks: Observable<unknown>[] = [];
      const horseId = this.currentHorseId;
      if (!horseId) return tasks;
      let hasError = false;

      const detachHorseFromExisting = (block: FeedEditorBlock, flags: Partial<FeedSchedDTO>) => {
        if (block.existingFeedSchedId == null) return;
        const remainingHorseIds = (block.existingHorseIds || []).filter(id => id !== horseId);
        if (remainingHorseIds.length === 0) {
          tasks.push(this.feedSchedService.delete(block.existingFeedSchedId));
          return;
        }

        const existingItems = (block.existingItemIds || []).map(itemId => ({
          itemId,
          amount: Number(block.existingItemAmounts?.[itemId] || 0)
        }));

        const dto: FeedSchedDTO = {
          feedMorning: !!flags.feedMorning,
          feedNoon: !!flags.feedNoon,
          feedEvening: !!flags.feedEvening,
          description: block.existingDescription || '',
          horseIds: remainingHorseIds,
          itemIds: block.existingItemIds || [],
          items: existingItems
        };

        tasks.push(this.feedSchedService.update(block.existingFeedSchedId, dto));
      };

      const pushIfEnabled = (time: FeedTimeKey, label: string, flags: Partial<FeedSchedDTO>) => {
        const block = this.feedEditor[time];
        if (!block.enabled) {
          detachHorseFromExisting(block, flags);
          return;
        }

        if (block.itemIds.length === 0) {
          this.feedEditorError = 'Minden kijelölt időponthoz adj meg legalább egy tételt.';
          hasError = true;
          return;
        }

        const items = block.itemIds.map(itemId => ({
          itemId,
          amount: Number(block.itemAmounts[itemId] || 0)
        }));

        if (items.some(i => !Number.isFinite(i.amount) || i.amount <= 0)) {
          this.feedEditorError = 'Minden tételhez adj meg pozitív mennyiséget.';
          hasError = true;
          return;
        }

        const horseIds = block.includeOtherHorses
          ? Array.from(new Set([horseId, ...block.horseIds]))
          : [horseId];

        const dto: FeedSchedDTO = {
          feedMorning: !!flags.feedMorning,
          feedNoon: !!flags.feedNoon,
          feedEvening: !!flags.feedEvening,
          description: block.existingDescription || '',
          horseIds,
          itemIds: block.itemIds,
          items
        };

        if (block.existingFeedSchedId != null) {
          const existingHorseIds = block.existingHorseIds || [];
          const hasOtherHorses = existingHorseIds.some(id => id !== horseId);
          if (block.includeOtherHorses || !hasOtherHorses) {
            tasks.push(this.feedSchedService.update(block.existingFeedSchedId, dto));
          } else {
            detachHorseFromExisting(block, flags);
            tasks.push(this.feedSchedService.create(dto));
          }
        } else {
          tasks.push(this.feedSchedService.create(dto));
        }
      };

      pushIfEnabled('morning', 'REGGEL', { feedMorning: true, feedNoon: false, feedEvening: false });
      pushIfEnabled('noon', 'DEL', { feedMorning: false, feedNoon: true, feedEvening: false });
      pushIfEnabled('evening', 'ESTE', { feedMorning: false, feedNoon: false, feedEvening: true });

      return hasError ? [] : tasks;
    }

    private refreshFeedEditorFromExisting() {
      this.feedEditor = this.createEmptyFeedEditor();
      const existing = this.getExistingFeedSchedsByTime();

      (['morning', 'noon', 'evening'] as FeedTimeKey[]).forEach((time) => {
        const feed = existing[time];
        if (!feed) return;
        const block = this.feedEditor[time];
        block.enabled = true;
        block.existingFeedSchedId = feed.feedSchedId ?? null;
        block.existingDescription = feed.description || '';
        block.itemIds = this.filterAllowedItemIds(feed.itemIds);
        block.itemAmounts = this.buildItemAmounts(feed);
        block.horseIds = feed.horseIds ? [...feed.horseIds] : [];
        block.existingHorseIds = feed.horseIds ? [...feed.horseIds] : [];
        block.existingItemIds = this.filterAllowedItemIds(feed.itemIds);
        block.existingItemAmounts = this.buildItemAmounts(feed);
        if (this.currentHorseId && !block.horseIds.includes(this.currentHorseId)) {
          block.horseIds = [...block.horseIds, this.currentHorseId];
        }
        block.includeOtherHorses = false;
      });
    }

    private buildItemAmounts(feed: FeedSchedDTO): Record<number, number> {
      const amounts: Record<number, number> = {};
      if (feed.items && feed.items.length > 0) {
        feed.items.forEach(item => {
          if (this.allowedFeedItemIds.has(item.itemId)) {
            amounts[item.itemId] = Number.isFinite(item.amount) ? item.amount : 0;
          }
        });
      } else if (feed.itemIds) {
        feed.itemIds
          .filter(id => this.allowedFeedItemIds.has(id))
          .forEach(id => {
            amounts[id] = 1;
          });
      }
      return amounts;
    }

    private filterAllowedItemIds(itemIds?: number[] | null): number[] {
      if (!itemIds || itemIds.length === 0) return [];
      return itemIds.filter(id => this.allowedFeedItemIds.has(id));
    }

    private updatePendingFeedNotice(requests: FeedSchedChangeRequestDTO[]) {
      const horseId = this.currentHorseId;
      if (!horseId || !requests || requests.length === 0) {
        this.feedChangePending = false;
        this.feedChangeMessage = '';
        this.pendingFeedRequestsForHorse = [];
        return;
      }
      this.pendingFeedRequestsForHorse = requests.filter(r => (r.horseIds || []).includes(horseId));
      const count = this.pendingFeedRequestsForHorse.length;
      if (count > 0) {
        this.feedChangePending = true;
        this.feedChangeMessage = `Etetés módosítási kérelem függőben (${count}).`;
      } else {
        this.feedChangePending = false;
        this.feedChangeMessage = '';
      }
    }

    private showFeedToast(message: string) {
      this.feedToastMessage = message;
      this.feedToastVisible = true;
      setTimeout(() => {
        this.feedToastVisible = false;
      }, 3000);
    }

    getRequestTimeLabel(request: FeedSchedChangeRequestDTO): string {
      const parts: string[] = [];
      if (request.requestedMorning) parts.push('Reggel');
      if (request.requestedNoon) parts.push('Dél');
      if (request.requestedEvening) parts.push('Este');
      return parts.length ? parts.join(' + ') : '-';
    }

    getRequestItemDetails(request: FeedSchedChangeRequestDTO): string[] {
      if (request.items && request.items.length > 0) {
        return request.items.map(item => {
          const name = this.getItemNameById(item.itemId);
          const amount = Number.isFinite(item.amount) ? item.amount : 0;
          return amount > 0 ? `${name} (${amount})` : name;
        });
      }
      if (request.itemIds && request.itemIds.length > 0) {
        return request.itemIds.map(id => this.getItemNameById(id));
      }
      return [];
    }

    getRequestHorseNames(request: FeedSchedChangeRequestDTO): string[] {
      if (!request.horseIds || request.horseIds.length === 0) return [];
      return request.horseIds.map(id => this.getHorseNameById(id));
    }

    private getExistingFeedSchedsByTime(): Record<FeedTimeKey, FeedSchedDTO | null> {
      const result: Record<FeedTimeKey, FeedSchedDTO | null> = {
        morning: null,
        noon: null,
        evening: null
      };

      const withHorse = this.feedScheds.filter(feed =>
        this.currentHorseId != null && feed.horseIds?.includes(this.currentHorseId)
      );

      const pickLatest = (feeds: FeedSchedDTO[]): FeedSchedDTO | null => {
        if (feeds.length === 0) return null;
        return feeds.reduce((latest, current) => {
          const latestId = latest.feedSchedId ?? -1;
          const currentId = current.feedSchedId ?? -1;
          return currentId > latestId ? current : latest;
        });
      };

      result.morning = pickLatest(withHorse.filter(f => !!f.feedMorning));
      result.noon = pickLatest(withHorse.filter(f => !!f.feedNoon));
      result.evening = pickLatest(withHorse.filter(f => !!f.feedEvening));

      return result;
    }

    private createEmptyFeedEditor(): FeedEditorState {
      const base: FeedEditorBlock = {
        enabled: false,
        itemIds: [],
        itemAmounts: {},
        includeOtherHorses: false,
        horseIds: this.currentHorseId ? [this.currentHorseId] : [],
        existingFeedSchedId: null,
        existingDescription: '',
        existingHorseIds: [],
        existingItemIds: [],
        existingItemAmounts: {}
      };

      const buildBlock = (): FeedEditorBlock => ({
        ...base,
        itemIds: [],
        itemAmounts: {},
        horseIds: base.horseIds ? [...base.horseIds] : [],
        existingHorseIds: [],
        existingItemIds: [],
        existingItemAmounts: {}
      });
      return {
        morning: buildBlock(),
        noon: buildBlock(),
        evening: buildBlock()
      };
    }
}

type FeedTimeKey = 'morning' | 'noon' | 'evening';

type FeedEditorBlock = {
  enabled: boolean;
  itemIds: number[];
  itemAmounts: Record<number, number>;
  includeOtherHorses: boolean;
  horseIds: number[];
  existingFeedSchedId: number | null;
  existingDescription: string;
  existingHorseIds: number[];
  existingItemIds: number[];
  existingItemAmounts: Record<number, number>;
};

type FeedEditorState = {
  morning: FeedEditorBlock;
  noon: FeedEditorBlock;
  evening: FeedEditorBlock;
};
