import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DbService, Group, Entry, Category } from '../../services/db.service';

@Component({
  selector: 'app-budget-modal',
  templateUrl: './budget-modal.component.html',
  styleUrls: ['./budget-modal.component.scss']
})
export class BudgetModalComponent implements OnInit {
  @Input() groupId: string | null = null;
  @Output() close = new EventEmitter<void>();

  salary: number | null = null;
  budgets: { [key: string]: number } = {};

  // UI Data
  totalSpent = 0;
  remaining = 0;
  chartBackground = '';
  categoryStats: any[] = []; // { name, budget, spent, percent, progressClass }

  constructor(private db: DbService) { }

  async ngOnInit() {
    if (this.groupId) {
      await this.loadData();
    }
  }

  async loadData() {
    if (!this.groupId) return;

    // Fetch Data
    const group = await this.db.getGroup(this.groupId);
    const entries = await this.db.getEntriesByGroup(this.groupId);
    const categories = await this.db.getCategories();

    this.salary = group.salary || null;
    this.budgets = group.budgets || {};

    // Calculate
    const categorySpending: { [key: string]: number } = {};
    this.totalSpent = 0;

    entries.forEach(entry => {
      const cat = entry.category || 'Uncategorized';
      categorySpending[cat] = (categorySpending[cat] || 0) + entry.amount;
      this.totalSpent += entry.amount;
    });

    this.remaining = (this.salary || 0) - this.totalSpent;

    // Chart
    this.updateChart();

    // Stats
    const allCategories = new Set([...categories.map(c => c.name), ...Object.keys(categorySpending)]);
    const sortedCats = Array.from(allCategories).sort();

    this.categoryStats = sortedCats.map(cat => {
      const spent = categorySpending[cat] || 0;
      const budget = this.budgets[cat] || 0;
      const percent = budget > 0 ? (spent / budget) * 100 : 0;

      let progressClass = '';
      if (percent > 100) progressClass = 'danger';
      else if (percent > 75) progressClass = 'warning';

      return {
        name: cat,
        spent,
        budget, // View model for input
        percent,
        progressClass
      };
    });
  }

  updateChart() {
    const sal = this.salary || 0;
    if (sal > 0) {
      const spentPercentage = Math.min((this.totalSpent / sal) * 100, 100);
      const color = this.totalSpent > sal ? '#f56565' : 'var(--primary-color)';
      this.chartBackground = `conic-gradient(${color} 0% ${spentPercentage}%, var(--bg-lighter) ${spentPercentage}% 100%)`;
    } else {
      this.chartBackground = 'conic-gradient(var(--bg-lighter) 0% 100%)';
    }
  }

  onClose() {
    this.close.emit();
  }

  async onSave() {
    if (!this.groupId) return;

    // Collect budgets from UI
    const newBudgets: { [key: string]: number } = {};
    this.categoryStats.forEach(stat => {
      if (stat.budget > 0) {
        newBudgets[stat.name] = stat.budget;
      }
    });

    try {
      await this.db.updateGroupBudget(this.groupId, this.salary || 0, newBudgets);
      // Reload to refresh view
      await this.loadData();
    } catch (error) {
      console.error('Error saving budget', error);
    }
  }
}
