const Quill = require('quill');

import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    forwardRef,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';

import {
    NG_VALUE_ACCESSOR,
    ControlValueAccessor,
    FormsModule
} from '@angular/forms';

import { Joker } from './interfaces/joker.interface';
import { HashString } from './interfaces/hash-string.interface';

@Component({
    selector: 'ng2-quill-editor',
    template: `
        <div class="quill-editor"></div>
        <div *ngIf="enabledList" class="list-group ui-widget">
            <a *ngFor="let item of autoCompleteListAux; let i = index" (click)="insertItem(item, i)" [class]="item.isActive ? 'list-group-item active' : 'list-group-item'">
                <h5 class="list-group-item-heading">
                    <b>{{ item[fieldHeading] }}</b>
                </h5>
                <p *ngIf="fieldDetail !== null" class="list-group-item-text">
                    <i>{{ item[fieldDetail] }}</i>
                </p>
            </a>
        </div>
        <div *ngIf="itemNotFound" class="list-group ui-widget">
            <a class="list-group-item list-group-item-danger">
                <h5 class="list-group-item-heading">
                    {{ labelVariableNotFound || 'Variable Not Found'  }}
                </h5>
                <p class="list-group-item-text">
                    {{ labelDeleteTheEntireVariableAndReEnter || 'Delete The Entire Variable And ReEnter' }}
                </p>
            </a>
        </div>


        <!-- USE TO DEBUG ALL VARIABLES AND CONSTANTS IN THIS COMPONENT -->
        <!--<div>
            <p>focusedItem: {{ focusedItem | json }}</p>
            <p>itemNotFound: {{ itemNotFound | json }}</p>
            <p>hashString: {{ hashString | json }}</p>
            <p>enabledList: {{ enabledList | json }}</p>
            <p>isTypingHashString: {{ isTypingHashString | json }}</p>
            <p>autoCompleteListAux: {{ this.autoCompleteListAux | json }}</p>
        </div>-->
    `,
    styleUrls: [
        './ng2-quill-editor.component.css',
        '../node_modules/quill/dist/quill.core.css',
        '../node_modules/quill/dist/quill.snow.css',
        '../node_modules/quill/dist/quill.bubble.css'
    ],
    // styleUrls: [
    //     './asas-quill-editor.component.css'
    // ],
    // styles: [
    //     require('quill/dist/quill.core.css'),
    //     require('quill/dist/quill.snow.css'),
    //     require('quill/dist/quill.bubble.css')
    // ],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => Ng2QuillEditorComponent),
        multi: true
    }],
    encapsulation: ViewEncapsulation.None
})
export class Ng2QuillEditorComponent implements AfterViewInit, ControlValueAccessor, OnChanges {

    // Helpful Variables
    public enabledList: boolean = false; // Flag para sabermos quando a lista de items está visivel.
    public autoCompleteListAux: Array<any>; // Lista auxiliar de items para podermos preservar a original.
    public itemNotFound: boolean = false; // Flag de item não encontrada.
    public isTypingHashString: boolean = false; // Flag para sabermos quando estamos digitando.
    public firstArrowUp: boolean = false; // Flag para sabermos quando apertamos a tecla <ArrowUp> pela primeira vez.
    public firstArrowDown: boolean = false; // Flag para sabermos quando apertamos a tecla <ArrowDown> pela primeira vez.
    public focusedItem: number; // Index do item que está em foco no momento.
    public hashString: HashString = {
        textValue: '',
        textIndex: null,
        textLength: 0
    }; // String digitada após o símbolo de hastag '#'.
    public jokersList: Array<Joker> = [
        {
            key: ',',
            code: 'Comma',
            which: 44,
            keyCode: 44,
            charCode: 44
        },
        {
            key: ',',
            code: 'Period',
            which: 46,
            keyCode: 46,
            charCode: 46
        },
        {
            key: ';',
            code: 'Slash',
            which: 59,
            keyCode: 59,
            charCode: 59
        },
        {
            key: ':',
            code: 'Slash',
            which: 58,
            keyCode: 58,
            charCode: 58
        },
        {
            key: ' ',
            code: 'Space',
            which: 32,
            keyCode: 32,
            charCode: 32
        },
        {
            key: 'Tab',
            code: 'Tab',
            which: 9,
            keyCode: 9,
            charCode: 0
        },
        {
            key: 'Enter',
            code: 'Enter',
            which: 13,
            keyCode: 13,
            charCode: 0
        }
    ]; // Lista de teclas coringas.


    // Editor Config
    public quillEditor: any;
    public editorElem: HTMLElement;
    public content: any;
    public defaultModules = {
        toolbar: [
            // Toggled Buttons
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],

            // Custom Button Values
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],

            // Superscript / Subscript
            [{ 'script': 'sub' }, { 'script': 'super' }],

            // Outdent / Indent
            [{ 'indent': '-1' }, { 'indent': '+1' }],

            // Text Direction
            [{ 'direction': 'rtl' }],

            // Custom Dropdown'
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            // Dropdown (with defaults from theme)
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],

            // Remove Formatting Button
            ['clean'],

            // Link and Image, Video
            ['link', 'image', 'video']
        ]
    };

    // Incoming Configuration
    @Input() options: Object; // Configurações customizadas do Quill Editor.
    @Input() fieldSearch: string; // Nome do atributo (campo) que será feita a busca na lista de items.
    @Input() fieldDetail: string; // Nome do atributo (campo) que será mostrado na lista como detalhe.
    @Input() fieldHeading: string; // Nome do atributo (campo) qu será mostrado na lista como título (cabeçalho).
    @Input() autoCompleteList: Array<any>; // Lista de items original que entrará como parâmetro.
    @Input() labelVariableNotFound: string;
    @Input() labelDeleteTheEntireVariableAndReEnter: string;    

    // Element Events
    @Output() blur: EventEmitter<any> = new EventEmitter();
    @Output() focus: EventEmitter<any> = new EventEmitter();
    @Output() ready: EventEmitter<any> = new EventEmitter();
    @Output() change: EventEmitter<any> = new EventEmitter();

    onModelChange: Function = () => { };
    onModelTouched: Function = () => { };

    // Inject DOM
    constructor(
        public elementRef: ElementRef
    ) { }

    // After the view is loadad, the initilizator is performed
    ngAfterViewInit() {
        this.editorElem = this.elementRef.nativeElement.children[0];

        this.quillEditor = new Quill(this.editorElem, Object.assign({
            modules: this.defaultModules,
            placeholder: 'Insert text here ...',
            readOnly: false,
            theme: 'snow',
            boundary: document.body
        }, this.options || {}));

        // Write Content
        if (this.content) {
            this.quillEditor.pasteHTML(this.content);
        }

        // Broadcast Event
        this.ready.emit(this.quillEditor);

        // Set model as touched if editor lost focus
        this.quillEditor.on('selection-change', (range) => {
            if (!range) {
                this.onModelTouched();
                this.blur.emit(this.quillEditor);
            } else {
                this.focus.emit(this.quillEditor);
            }
        });

        // Update model if text changes
        this.quillEditor.on('text-change', (delta, oldDelta, source) => {
            let html = this.editorElem.children[0].innerHTML;
            const text = this.quillEditor.getText();

            if (html === '<p><br></p>') html = null;

            this.onModelChange(html);

            this.change.emit({
                editor: this.quillEditor,
                html: html,
                text: text
            });
        });
    }

    // Data Changings
    ngOnChanges(changes: SimpleChanges) {
        if (changes['readOnly'] && this.quillEditor) {
            this.quillEditor.enable(!changes['readOnly'].currentValue);
        }
        this.autoCompleteListAux = this.autoCompleteList;
    }

    // Write Data
    writeValue(currentValue: any) {
        this.content = currentValue;

        if (this.quillEditor) {
            if (currentValue) {
                this.quillEditor.pasteHTML(currentValue);
                return;
            }
            this.quillEditor.setText('');
        }
    }

    // Registration Event
    registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }

    public deleteCaracter(hashString: HashString): HashString {
        return {
            textIndex: hashString.textLength > 0 ? hashString.textIndex : null,
            textValue: hashString.textValue.substr(0, hashString.textValue.length - 1),
            textLength: hashString.textValue.length
        }
    }

    public addCharacter(hashString: HashString, e: KeyboardEvent): HashString {
        return {
            textIndex: hashString.textIndex,
            textValue: hashString.textValue + e.key,
            textLength: (hashString.textValue + e.key).length
        }
    }

    public deactivateItems(list: Array<any>) {
        for (let item of list) {
            item.isActive = false;
        }
        return list;
    }

    public filterListByItemTyped(list: Array<any>): Array<any> {
        return list.filter((item) =>
            item[this.fieldSearch].toLowerCase().indexOf(this.hashString.textValue.toLowerCase().substr(1, this.hashString.textValue.length)) != -1
        );
    }

    public hashTagPressed(e: KeyboardEvent): boolean {
        return e.keyCode === 51 || e.which === 51 || e.key === '#' ? true : false;
    }

    public backSpacePressed(e: KeyboardEvent): boolean {
        return e.keyCode === 8 || e.which === 8 ? true : false;
    }

    public arrowDownPressed(e: KeyboardEvent): boolean {
        return e.keyCode == 40 || e.which == 40 ? true : false;
    }

    public arrowUpPressed(e: KeyboardEvent): boolean {
        return e.keyCode == 38 || e.which == 38 ? true : false;
    }

    public jokerPressed(e: KeyboardEvent): boolean {
        let result: boolean = false;
        for (let item of this.jokersList) {
            if (item.keyCode === e.keyCode || item.which === e.keyCode) {
                result = true;
            }
        }
        return result;
    }

    public replaceItem() {
        if (this.autoCompleteListAux.length > 0) {
            this.focusedItem = this.autoCompleteListAux.length === 1 ? 0 : this.focusedItem;

            if (this.focusedItem !== null && this.focusedItem !== undefined) {
                // Atualiza 'hashString'
                this.hashString = {
                    textIndex: this.hashString.textIndex,
                    textValue: this.autoCompleteListAux[this.focusedItem][this.fieldSearch],
                    textLength: this.hashString.textValue.length
                }
                this.autoCompleteListAux[this.focusedItem].isActive = true;

                // Executa funções do Quill Editor
                this.quillEditor.deleteText(this.hashString.textIndex, this.hashString.textLength + 1);
                this.quillEditor.insertText(this.hashString.textIndex, this.hashString.textValue);
                this.quillEditor.setSelection((this.quillEditor.getText().length - (this.quillEditor.getText().length - this.hashString.textIndex)) + (this.hashString.textValue.length + 1), 0);
            }
        }
    }

    public checkoutHashString() {
        // Verifica se o item foi encontrado ou nâo.
        this.itemNotFound = this.checkItemStatus();

        if (!this.itemNotFound) {
            this.hashString = {
                textValue: '',
                textIndex: null,
                textLength: 0
            };
            this.focusedItem = null;
            this.enabledList = false;
            this.firstArrowUp = false;
            this.firstArrowDown = false;
            this.isTypingHashString = false;
            this.autoCompleteListAux = this.autoCompleteList;
            this.autoCompleteListAux = this.deactivateItems(this.autoCompleteListAux);
        }
        else {
            this.quillEditor.setSelection((this.quillEditor.getText().length - (this.quillEditor.getText().length - this.hashString.textIndex)) + (this.hashString.textValue.length + 1), 0);
        }
    }

    public checkinHashString() {
        // Verifica se o item foi encontrado ou nâo.
        this.itemNotFound = this.checkItemStatus();

        if (this.itemNotFound) {
            this.focusedItem = null;
            this.enabledList = false;
            this.firstArrowUp = false;
            this.firstArrowDown = false;
            this.isTypingHashString = true;
            this.autoCompleteListAux = this.autoCompleteList;
            this.autoCompleteListAux = this.deactivateItems(this.autoCompleteListAux);
        }
        else {
            this.focusedItem = null;
            this.enabledList = true;
            this.firstArrowUp = false;
            this.firstArrowDown = false;
            this.isTypingHashString = true;
            this.autoCompleteListAux = this.deactivateItems(this.autoCompleteListAux);
        }
    }

    public checkItemStatus(): boolean {
        return this.autoCompleteList.every(item => item[this.fieldSearch] !== this.hashString.textValue) && this.autoCompleteListAux.length < 1 ? true : false;
    }

    public insertItem(item: any, index: number) {
        this.focusedItem = index;
        this.replaceItem();
        this.checkoutHashString();
    }

    @HostListener("keypress", ['$event'])
    onkeypress(e: KeyboardEvent) {
        // Quando apertar a tecla <hashtag> '#'...
        if (this.hashTagPressed(e)) {
            this.enabledList = true;
            this.isTypingHashString = true;
            this.hashString.textIndex = this.quillEditor.getSelection().index;
        }

        // Se estiver digitando uma 'hashString'...
        if (this.isTypingHashString) {
            // Se apertar a tecla REFERENTE à um coringa...
            if (this.jokerPressed(e)) {
                this.checkoutHashString();
            }
            // Se apertar a tecla NÃO REFERENTE à um coringa...
            else {
                // Atualiza 'hashString'.
                this.hashString = this.addCharacter(this.hashString, e);

                // Filtrando items enquanto digita a 'hashString'.
                this.autoCompleteListAux = this.filterListByItemTyped(this.autoCompleteList);

                // Verifica se deve mostrar a lista de items.
                this.enabledList = this.autoCompleteListAux.length > 0 ? true : false;
            }
        }
    }

    @HostListener('keyup', ['$event'])
    onkeyup(e: KeyboardEvent) {
        if (this.isTypingHashString) {
            if (!this.jokerPressed(e) && !this.arrowDownPressed(e) && !this.arrowUpPressed(e) && !this.backSpacePressed(e)) {
                // Se o autocomplete encontrar apenas um item no match!
                this.replaceItem();
                this.itemNotFound = this.checkItemStatus();
            }
        }
    }

    @HostListener("keydown", ['$event'])
    onkeydown(e: KeyboardEvent) {
        // Se estiver digitando uma 'hashString'...
        if (this.isTypingHashString) {
            // Se apertar a tecla <backspace>...
            if (this.backSpacePressed(e)) {
                // Se o estado atual da 'hashString' for vazia ou apenas '#'...
                if (this.hashString.textValue === '' || this.hashString.textValue === '#') {
                    // Atualiza 'hashString'.
                    this.hashString = this.deleteCaracter(this.hashString);

                    // Tira o foco do item.
                    this.focusedItem = null;

                    // Atualiza flags auxiliares.
                    this.enabledList = false;
                    this.firstArrowUp = false;
                    this.firstArrowDown = false;
                    this.isTypingHashString = false;

                    // Reinicia lista auxiliar.
                    this.autoCompleteListAux = this.autoCompleteList;

                    // Inativa todos os item da lista auxiliar.
                    this.autoCompleteListAux = this.deactivateItems(this.autoCompleteListAux);
                }
                // Se o estado atual da 'hashString' não for vazia ou apenas '#'.
                else {
                    // Atualiza 'hashString'.
                    this.hashString = this.deleteCaracter(this.hashString);

                    // Filtrando items enquanto apaga 'hashString'.
                    this.autoCompleteListAux = this.filterListByItemTyped(this.autoCompleteList);

                    this.checkinHashString();
                }
            }
            // Se apertar a tecla <ArrowDown>...
            else if (this.arrowDownPressed(e)) {
                e.preventDefault();

                // Se não é o primeiro 'arrowDown' && primeiro 'arrowUp'...
                if (!this.firstArrowUp && !this.firstArrowDown) {
                    this.focusedItem = -1;
                    this.firstArrowDown = true;
                }

                this.focusedItem++;

                // Se o índice do item em foco é menor que a quantidade de items da lista auxiliar...
                if (this.focusedItem < this.autoCompleteListAux.length) {
                    // Se o índice do item for maior do que zero desativa o item anterior.
                    if (this.focusedItem > 0) {
                        this.autoCompleteListAux[this.focusedItem - 1].isActive = false;
                    }
                    this.autoCompleteListAux[this.focusedItem].isActive = true;
                }
                // Se o índice do item em foco é maior ou igual a quantidade de items da lista auxiliar...
                else {
                    this.focusedItem = 0;
                    this.autoCompleteListAux[this.autoCompleteListAux.length - 1].isActive = false;
                    this.autoCompleteListAux[this.focusedItem].isActive = true;
                }

                this.replaceItem();
            }
            // Se apertar a tecla <ArrowUp>...
            else if (this.arrowUpPressed(e)) {
                e.preventDefault();

                // Se não é o primeiro 'arrowDown' && primeiro 'arrowUp'...
                if (!this.firstArrowUp && !this.firstArrowDown) {
                    this.focusedItem = this.autoCompleteListAux.length;
                    this.firstArrowUp = true;
                }

                this.focusedItem--;

                // Se o índice do item em foco é maior ou igual a zero...
                if (this.focusedItem >= 0) {
                    // Se o índice do item em foco for diferente da quantidade de items da lista auxiliar menos um.
                    if (this.focusedItem !== (this.autoCompleteListAux.length - 1)) {
                        this.autoCompleteListAux[this.focusedItem + 1].isActive = false;
                    }
                    this.autoCompleteListAux[this.focusedItem].isActive = true;
                }
                // Se o índice do item em foco é menor do que zero...
                else {
                    this.focusedItem = this.autoCompleteListAux.length - 1;
                    this.autoCompleteListAux[0].isActive = false;
                    this.autoCompleteListAux[this.focusedItem].isActive = true;
                }

                this.replaceItem();
            }
            else if (this.jokerPressed(e)) {
                if ((e.keyCode === 13 || e.which === 13) || (e.keyCode === 9 || e.which === 9)) {
                    e.preventDefault();
                }
                this.checkoutHashString();
            }
        }
        else {
            // Quando apertar a tecla <backspace>
            if (this.backSpacePressed(e)) {
                // Percorre a lista de items e seta como false o atributo "isActive" de cada uma.
                this.autoCompleteListAux = this.deactivateItems(this.autoCompleteListAux);
            }
        }
    }
}
