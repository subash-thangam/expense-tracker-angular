import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DbService, Entry, Category } from '../../services/db.service';
import { CategoryModalComponent } from '../category-modal/category-modal.component';

@Component({
  selector: 'app-entry-modal',
  templateUrl: './entry-modal.component.html',
  styleUrls: ['./entry-modal.component.scss']
})
export class EntryModalComponent implements OnInit {
  @Input() entryId: string | null = null;
  @Input() groupId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  description = '';
  amount: number | null = null;
  category = '';
  date: string = ''; // YYYY-MM-DD
  categories: Category[] = [];
  showCategoryModal = false;
  isEditing = false;

  constructor(private db: DbService) { }

  async ngOnInit() {
    await this.loadCategories();

    this.date = new Date().toISOString().split('T')[0];

    if (this.entryId) {
      this.isEditing = true;
      await this.loadEntry();
    }
  }

  async loadCategories() {
    this.categories = await this.db.getCategories();
  }

  async loadEntry() {
    if (!this.entryId) return;
    try {
      const entry = await this.db.getEntry(this.entryId);
      if (entry) {
        this.description = entry.description;
        this.amount = entry.amount;
        this.category = entry.category;
        this.date = new Date(entry.date).toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error loading entry', error);
    }
  }

  onClose() {
    this.close.emit();
  }

  async onSubmit() {
    if (!this.description || !this.amount || !this.groupId) return;

    try {
      const timestamp = new Date(this.date).getTime();

      if (this.entryId) {
        await this.db.updateEntry(this.entryId, {
          description: this.description,
          amount: this.amount,
          category: this.category,
          date: timestamp
        });
      } else {
        await this.db.createEntry(this.groupId, this.description, this.amount, this.category, timestamp);
      }
      this.save.emit();
    } catch (error) {
      console.error('Error saving entry', error);
    }
  }

  openCategoryModal() {
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
  }

  async onCategoryAdded() {
    this.closeCategoryModal();
    await this.loadCategories();
    // Auto select last added? Logic in generic service would be better but simple reload works.
  }
}
