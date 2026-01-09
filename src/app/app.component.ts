import { Component, isDevMode } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'expense-tracker-angular';

  constructor(private swUpdate: SwUpdate) {
    if (!isDevMode()) {
      // Check for updates every 6 hours
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 6 * 60 * 60 * 1000);

      // Listen for available updates
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          console.log('New app version available. Reloading...');
          // Reload the page to update to the latest version
          window.location.reload();
        }
      });
    }
  }
}


