import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Ng2QuillEditorComponent } from './ng2-quill-editor.component';

const myDirectives = [
    Ng2QuillEditorComponent
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule
    ],
    declarations: [
        myDirectives
    ],
    exports: [
        myDirectives
    ]
})
export class Ng2QuillEditorModule { }