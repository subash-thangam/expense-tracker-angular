import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { GroupDetailComponent } from './components/group-detail/group-detail.component';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { CategoryModalComponent } from './components/category-modal/category-modal.component';
import { GroupModalComponent } from './components/group-modal/group-modal.component';
import { BudgetModalComponent } from './components/budget-modal/budget-modal.component';
import { CategoryManagerComponent } from './components/category-manager/category-manager.component';
import { ScanComponent } from './components/scan/scan.component';
import { EntryScannerComponent } from './components/entry-scanner/entry-scanner.component';

import { ZXingScannerModule } from '@zxing/ngx-scanner';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GroupDetailComponent,
    EntryModalComponent,
    CategoryModalComponent,
    GroupModalComponent,
    BudgetModalComponent,
    CategoryManagerComponent,
    ScanComponent,
    EntryScannerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ZXingScannerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
