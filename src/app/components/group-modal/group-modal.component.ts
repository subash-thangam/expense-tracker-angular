import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { DbService } from '../../services/db.service';

@Component({
  selector: 'app-group-modal',
  templateUrl: './group-modal.component.html',
  styleUrls: ['./group-modal.component.scss']
})
export class GroupModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  name = '';
  monthYear = '';

  constructor(private db: DbService) { }

  ngOnInit() {
    // Set default month/year
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.monthYear = `${year}-${month}`;
  }

  onClose() {
    this.close.emit();
  }

  async onSubmit() {
    if (this.name && this.monthYear) {
      try {
        await this.db.createGroup(this.name, this.monthYear);
        this.save.emit();
      } catch (error) {
        console.error('Error creating group', error);
        alert('Failed to create group. It might already exist.');
      }
    }
  }
}
