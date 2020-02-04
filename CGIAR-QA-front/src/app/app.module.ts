import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { TypeaheadModule } from 'ngx-type-ahead';
import { NgxSpinnerModule } from "ngx-spinner";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AlertComponent } from './_shared/alert/alert.component';

import { JwtInterceptor } from './_helpers/jwt.interceptor'
import { ErrorInterceptor } from './_helpers/error.interceptor'
import { FakeBackendInterceptor } from './_helpers/fake-back';
import { AdminComponent } from './admin/admin.component';
import { FilterByRolePipe } from './pipes/filter-by-role.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderBarComponent } from './_shared/header-bar/header-bar.component';


// import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
// import { AssesorDashboardComponent } from './dashboard/assesor-dashboard/assesor-dashboard.component';



@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    AlertComponent,
    AdminComponent,
    FilterByRolePipe,
    HeaderBarComponent,
    // AdminDashboardComponent,
    // AssesorDashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    CollapseModule.forRoot(),
    ModalModule.forRoot(),
    ProgressbarModule.forRoot(),
    ButtonsModule.forRoot(),
    TypeaheadModule,
    NgxSpinnerModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    // { provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
