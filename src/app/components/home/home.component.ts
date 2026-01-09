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
  sortedGroups: Group[] = [];
  filteredGroups: Group[] = [];
  loading = true;
  groupEntriesCount: { [key: string]: number } = {};
  showGroupModal = false;

  // New: Sorting
  groupSortBy: 'name' | 'month' = 'month';
  groupSortAsc = false;

  // New: Search and filters
  groupSearchQuery: string = '';
  dateFilter: string = 'all';
  showFilterMenu: boolean = false;
  showSortMenu: boolean = false;

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

      this.applyGroupSort();
    } catch (error) {
      console.error('Error loading groups', error);
    } finally {
      this.loading = false;
    }
  }

  applyGroupSort() {
    let result = [...this.groups];

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (this.groupSortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'month':
        default:
          // Sort by month/year - using group creation date or last modified
          // For now, we'll use the name as fallback since we don't have date fields
          comparison = new Date(a.name).getTime() - new Date(b.name).getTime();
          if (isNaN(comparison)) {
            comparison = a.name.localeCompare(b.name);
          }
          break;
      }

      return this.groupSortAsc ? comparison : -comparison;
    });

    this.sortedGroups = result;
    this.filterGroups();
  }

  setGroupSortBy(sortType: 'name' | 'month') {
    if (this.groupSortBy === sortType) {
      this.groupSortAsc = !this.groupSortAsc;
    } else {
      this.groupSortBy = sortType;
      this.groupSortAsc = false;
    }
    this.applyGroupSort();
  }

  getTotalExpenses(): number {
    return this.sortedGroups.reduce((sum, group) => sum + group.totalExpenses, 0);
  }

  filterGroups(): void {
    let filtered = this.sortedGroups;

    // Search filter
    if (this.groupSearchQuery.trim()) {
      const query = this.groupSearchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(query)
      );
    }

    this.filteredGroups = filtered;
  }

  onSearchChange(): void {
    this.filterGroups();
  }

  clearSearch(): void {
    this.groupSearchQuery = '';
    this.filterGroups();
  }

  toggleFilterMenu(): void {
    this.showFilterMenu = !this.showFilterMenu;
  }

  toggleSortMenu(): void {
    this.showSortMenu = !this.showSortMenu;
  }

  closeBothMenus(): void {
    this.showFilterMenu = false;
    this.showSortMenu = false;
  }

  setSortAndCloseMenu(sortType: 'name' | 'month'): void {
    this.setGroupSortBy(sortType);
    this.showSortMenu = false;
  }

  setDateFilter(filter: string): void {
    this.dateFilter = filter;
    this.showFilterMenu = false;
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
