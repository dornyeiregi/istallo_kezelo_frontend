import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ItemService } from '../../services/item.service';
import { StorageService } from '../../services/storage.service';
import { ItemDTO } from '../../models/item.model';
import { StorageDTO } from '../../models/storage.model';
import { CrudMenuComponent } from '../../components/crud-menu/crud-menu';


@Component({
  selector: 'app-item-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, CrudMenuComponent],
  templateUrl: './item-profile.html',
  styleUrls: ['./item-profile.css'],

})
export class ItemProfilePage implements OnInit {
  item?: ItemDTO;
  storage?: StorageDTO;

  loading = true;
  error: string | null = null;

  itemTypeLabels: { [key: string]: string } = {
    HAY: 'Szálas takarmány',
    FEED: 'Abraktakarmány',
    SUPPLEMENT: 'Táplálékkiegészítő',
    MACHINE: 'Gép'
  };

  itemCategoryLabels: { [key: string]: string } = {
    CONSUMABLE: 'Takarmány',
    OBJECT: 'Eszköz'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    const itemId = Number(this.route.snapshot.paramMap.get('itemId'));
    
    if (!itemId) {
      this.error = 'Ismeretlen tétel.';
      this.loading = false;
      return;
    }

    // Optional state (gyorsabb betöltés)
    const navStorage = this.router.getCurrentNavigation()?.extras.state?.['storage'] as StorageDTO | undefined;
    if (navStorage) {
      this.storage = navStorage;
    }

    this.fetchData(itemId);
  }

  private fetchData(itemId: number): void {
    this.loading = true;

    this.itemService.getItemById(itemId).subscribe({
      next: (item) => {
        this.item = item;

        // Storage lekérése az itemId alapján
        this.storageService.getAll().subscribe({
          next: (storages) => {
            this.storage = storages.find((s) => s.itemId === itemId);
            this.loading = false;
          },
          error: () => {
            this.error = 'Nem sikerült betölteni a tároló adatokat.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'A tétel nem található.';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/storages']);
    }
  }

  get available(): number {
    if (!this.storage) return 0;
    return this.storage.amountStored - this.storage.amountInUse;
  }

  get estimatedDailyUse(): number {
    if (!this.storage) return 0;
    return this.storage.amountInUse;
  }

  get remainingDays(): number {
    if (this.estimatedDailyUse <= 0) return Infinity;
    return this.available / this.estimatedDailyUse;
  }

  get isRemainingInfinite(): boolean {
    return !isFinite(this.remainingDays);
  }

  get crudActions() {
    return [
        {
        label: 'Készlet hozzáadása',
        icon: 'add',
        onClick: () => alert('Hamarosan: készlet hozzáadása')
        },
        {
        label: 'Felhasználás rögzítése',
        icon: 'remove',
        onClick: () => alert('Hamarosan: felhasználás rögzítése')
        },
        {
        label: 'Tétel szerkesztése',
        icon: 'edit',
        onClick: () => alert('Hamarosan: szerkesztés')
        },
        {
        label: 'Tétel törlése',
        icon: 'delete',
        onClick: () => alert('Hamarosan: törlés')
        }
    ];
  }

  
}
