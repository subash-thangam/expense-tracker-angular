import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DbService, Category } from '../../services/db.service';

@Component({
  selector: 'app-category-manager',
  templateUrl: './category-manager.component.html',
  styleUrls: ['./category-manager.component.scss']
})
export class CategoryManagerComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  categories: Category[] = [];
  newCategoryName = '';
  editingCategory: Category | null = null;

  constructor(private db: DbService) { }

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    this.categories = await this.db.getCategories();
  }

  onClose() {
    this.close.emit();
  }

  async addCategory() {
    if (!this.newCategoryName.trim()) return;
    try {
      await this.db.createCategory(this.newCategoryName.trim());
      this.newCategoryName = '';
      await this.loadCategories();
    } catch (error) {
      alert('Category already exists or invalid');
    }
  }

  startEdit(category: Category) {
    // Clone to avoid direct mutation
    this.editingCategory = { ...category };
  }

  cancelEdit() {
    this.editingCategory = null;
  }

  async saveEdit() {
    if (!this.editingCategory || !this.editingCategory.name.trim()) return;
    try {
      await this.db.updateCategory(this.editingCategory.id, this.editingCategory.name.trim());
      this.editingCategory = null;
      await this.loadCategories();
    } catch (error) {
      console.error(error);
      alert('Failed to update category');
    }
  }

  async deleteCategory(id: string) {
    if (confirm('Are you sure? Entries using this category will remain unchanged but disjointed.')) {
      await this.db.deleteCategory(id);
      await this.loadCategories();
    }
  }
}
