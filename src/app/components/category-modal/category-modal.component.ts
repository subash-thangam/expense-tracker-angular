import { Component, EventEmitter, Output } from '@angular/core';
import { DbService } from '../../services/db.service';

@Component({
  selector: 'app-category-modal',
  template: `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Add Category</h2>
          <button class="close-modal" aria-label="Close" (click)="onClose()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="category-name-input">Category Name *</label>
            <input type="text" id="category-name-input" class="form-input" placeholder="e.g., Gym, Pets..."
              [(ngModel)]="name" name="name" required>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!name">Add</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./category-modal.component.scss']
})
export class CategoryModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>(); // Emits when saved

  name = '';

  constructor(private db: DbService) { }

  onClose() {
    this.close.emit();
  }

  async onSubmit() {
    if (this.name) {
      try {
        await this.db.createCategory(this.name);
        this.save.emit();
      } catch (error) {
        console.error('Error creating category', error);
        alert('Failed OR Category already exists');
      }
    }
  }
}
