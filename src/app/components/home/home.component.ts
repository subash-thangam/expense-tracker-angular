import { Component, OnInit } from '@angular/core';
import { DbService, Group, Entry } from '../../services/db.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  groups: Group[] = [];
  loading = true;
  groupEntriesCount: { [key: string]: number } = {};
  showGroupModal = false;

  // Menu State
  showMenu = false;
  showCategoryManager = false;

  constructor(private db: DbService, private router: Router) { }

  async ngOnInit() {
    await this.loadGroups();
  }

  async loadGroups() {
    this.loading = true;
    try {
      this.groups = await this.db.getAllGroups();

      // Load entry counts
      for (const group of this.groups) {
        const entries = await this.db.getEntriesByGroup(group.id);
        this.groupEntriesCount[group.id] = entries.length;
      }
    } catch (error) {
      console.error('Error loading groups', error);
    } finally {
      this.loading = false;
    }
  }

  openGroup(groupId: string) {
    this.router.navigate(['/group', groupId]);
  }

  openCreateModal() {
    this.showGroupModal = true;
  }

  closeCreateModal() {
    this.showGroupModal = false;
  }

  async onGroupCreated() {
    this.closeCreateModal();
    await this.loadGroups();
  }

  // ==================== MENU ACTIONS ====================

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }

  openCategoryManager() {
    this.closeMenu();
    this.showCategoryManager = true;
  }

  openScan() {
    this.closeMenu();
    this.router.navigate(['/scan']);
  }

  closeCategoryManager() {
    this.showCategoryManager = false;
  }

  async exportData() {
    this.closeMenu();
    try {
      const data = await this.db.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export data');
    }
  }

  importData() {
    this.closeMenu();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await this.db.importData(data);
        alert('Data imported successfully! Reloading...');
        window.location.reload();
      } catch (error) {
        console.error('Import failed', error);
        alert('Failed to import data');
      }
    };

    input.click();
  }
}
