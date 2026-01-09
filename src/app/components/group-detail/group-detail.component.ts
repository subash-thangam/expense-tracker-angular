import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DbService, Group, Entry } from '../../services/db.service';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.scss']
})
export class GroupDetailComponent implements OnInit {
  group: Group | null = null;
  entries: Entry[] = [];
  loading = true;
  groupId: string | null = null;

  showEntryModal = false;
  showBudgetModal = false;
  showDeleteGroupModal = false;
  selectedEntryId: string | null = null;
  showDeleteEntryModal = false;
  entryToDeleteId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private db: DbService
  ) { }

  async ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id');
    if (this.groupId) {
      await this.loadGroupData();
    } else {
      this.router.navigate(['/']);
    }
  }

  async loadGroupData() {
    if (!this.groupId) return;
    this.loading = true;
    try {
      this.group = await this.db.getGroup(this.groupId);
      if (!this.group) {
        this.router.navigate(['/']);
        return;
      }
      this.entries = await this.db.getEntriesByGroup(this.groupId);
    } catch (error) {
      console.error('Error loading group data', error);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  openEntryModal(entryId: string | null = null) {
    this.selectedEntryId = entryId;
    this.showEntryModal = true;
  }

  closeEntryModal() {
    this.showEntryModal = false;
    this.selectedEntryId = null;
  }

  async onEntrySaved() {
    this.closeEntryModal();
    await this.loadGroupData();
  }

  openBudgetModal() {
    this.showBudgetModal = true;
  }

  closeBudgetModal() {
    this.showBudgetModal = false;
  }

  async duplicateEntry(entry: Entry, event: Event) {
    event.stopPropagation();
    try {
      await this.db.createEntry(entry.parentId, entry.description, entry.amount, entry.category, entry.date);
      await this.loadGroupData();
    } catch (error) {
      console.error('Error duplicating entry', error);
    }
  }

  confirmDeleteEntry(entryId: string, event: Event) {
    event.stopPropagation();
    this.entryToDeleteId = entryId;
    this.showDeleteEntryModal = true;
  }

  async onDeleteEntryConfirmed() {
    if (this.entryToDeleteId) {
      await this.db.deleteEntry(this.entryToDeleteId);
      this.showDeleteEntryModal = false;
      this.entryToDeleteId = null;
      await this.loadGroupData();
    }
  }

  cancelDeleteEntry() {
    this.showDeleteEntryModal = false;
    this.entryToDeleteId = null;
  }

  // Group Deletion
  confirmDeleteGroup() {
    this.showDeleteGroupModal = true;
  }

  async onDeleteGroup() {
    if (this.groupId) {
      await this.db.deleteGroup(this.groupId);
      this.router.navigate(['/']);
    }
  }

  cancelDeleteGroup() {
    this.showDeleteGroupModal = false;
  }

  openScan() {
    this.router.navigate(['/scan']);
  }
}
