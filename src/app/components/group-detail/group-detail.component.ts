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
  filteredEntries: Entry[] = [];
  loading = true;
  groupId: string | null = null;

  showEntryModal = false;
  showBudgetModal = false;
  showDeleteGroupModal = false;
  selectedEntryId: string | null = null;
  showDeleteEntryModal = false;
  entryToDeleteId: string | null = null;

  // New: Search and sorting
  searchTerm = '';
  sortBy: 'date' | 'amount' | 'name' | 'category' = 'date';
  sortAsc = false;
  showGraphToggle = false;
  graphType: 'daily' | 'category' = 'daily';

  // Chart data
  dailyChartConfig: any = { type: 'bar', data: { labels: [], datasets: [] }, options: {} };
  categoryChartConfig: any = { type: 'pie', data: { labels: [], datasets: [] }, options: {} };

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
      this.applyFiltersAndSort();
      this.generateCharts();
    } catch (error) {
      console.error('Error loading group data', error);
    } finally {
      this.loading = false;
    }
  }

  applyFiltersAndSort() {
    let result = [...this.entries];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(entry =>
        entry.description.toLowerCase().includes(term)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'date':
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
      }

      return this.sortAsc ? comparison : -comparison;
    });

    this.filteredEntries = result;
  }

  onSearchChange() {
    this.applyFiltersAndSort();
  }

  setSortBy(sortType: 'date' | 'amount' | 'name' | 'category') {
    if (this.sortBy === sortType) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortBy = sortType;
      this.sortAsc = false;
    }
    this.applyFiltersAndSort();
  }

  toggleGraphType() {
    this.graphType = this.graphType === 'daily' ? 'category' : 'daily';
  }

  generateCharts() {
    if (this.entries.length === 0) return;

    this.generateDailyChart();
    this.generateCategoryChart();
  }

  generateDailyChart() {
    // Group entries by date
    const dailyData: { [key: string]: number } = {};

    this.entries.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      dailyData[date] = (dailyData[date] || 0) + entry.amount;
    });

    const sortedDates = Object.keys(dailyData).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    this.dailyChartConfig = {
      type: 'bar',
      data: {
        labels: sortedDates,
        datasets: [
          {
            label: 'Daily Spending',
            data: sortedDates.map(date => dailyData[date]),
            backgroundColor: 'rgba(25, 118, 210, 0.7)',
            borderColor: 'rgba(25, 118, 210, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: 'Daily Spending' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  generateCategoryChart() {
    // Group entries by category
    const categoryData: { [key: string]: number } = {};

    this.entries.forEach(entry => {
      const category = entry.category || 'Uncategorized';
      categoryData[category] = (categoryData[category] || 0) + entry.amount;
    });

    const categories = Object.keys(categoryData);
    const colors = [
      'rgba(255, 107, 107, 0.7)',
      'rgba(66, 165, 245, 0.7)',
      'rgba(129, 199, 132, 0.7)',
      'rgba(255, 195, 113, 0.7)',
      'rgba(171, 71, 188, 0.7)',
      'rgba(76, 175, 80, 0.7)',
      'rgba(255, 152, 0, 0.7)',
      'rgba(233, 30, 99, 0.7)'
    ];

    this.categoryChartConfig = {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Amount by Category',
            data: categories.map(cat => categoryData[cat]),
            backgroundColor: colors.slice(0, categories.length),
            borderColor: colors.slice(0, categories.length).map(c => c.replace('0.7', '1')),
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, position: 'bottom' },
          title: { display: true, text: 'Spending by Category' }
        }
      }
    };
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
}
