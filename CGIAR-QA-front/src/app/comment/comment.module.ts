import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommentComponent } from './comment.component';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { NgxSpinnerModule } from 'ngx-spinner';
import { OrderModule } from 'ngx-order-pipe';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { TagsBarComponent } from './tags-bar/tags-bar.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';


@NgModule({
  declarations: [CommentComponent, TagsBarComponent],
  exports: [CommentComponent],
  imports: [
    CommonModule,
    ProgressbarModule.forRoot(),
    ButtonsModule.forRoot(),
    CollapseModule.forRoot(),
    PaginationModule.forRoot(),
    TooltipModule.forRoot(),
    NgxSpinnerModule,
    OrderModule,
    ReactiveFormsModule,
    FormsModule,
    Ng2SearchPipeModule,],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CommentComponentModule { }
