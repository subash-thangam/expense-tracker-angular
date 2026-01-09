import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { GroupDetailComponent } from './components/group-detail/group-detail.component';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { CategoryModalComponent } from './components/category-modal/category-modal.component';
import { GroupModalComponent } from './components/group-modal/group-modal.component';
import { BudgetModalComponent } from './components/budget-modal/budget-modal.component';
import { CategoryManagerComponent } from './components/category-manager/category-manager.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GroupDetailComponent,
    EntryModalComponent,
    CategoryModalComponent,
    GroupModalComponent,
    BudgetModalComponent,
    CategoryManagerComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
