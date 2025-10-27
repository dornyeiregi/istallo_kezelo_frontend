import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <a routerLink="/horses" routerLinkActive="active">Lovak</a>
      <a routerLink="/stables" routerLinkActive="active">Istállók</a>
    </nav>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: ['./app.css']
})
export class AppComponent {}
