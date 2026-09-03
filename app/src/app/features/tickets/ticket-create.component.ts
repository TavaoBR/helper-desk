import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TicketService } from '../../core/services/ticket.service';
import { PermissionService } from '../../core/services/permission.service';
import { Department, TicketType, Category, Priority } from '../../core/models/catalog.model';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="page-wrap">

      <!-- ── Breadcrumb ─────────────────────────────────────── -->
      <div class="breadcrumb">
        <a routerLink="/tickets">Dashboard</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Novo chamado</span>
      </div>

      <!-- ── Page Header ──────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <h1>Novo chamado</h1>
          <p>Preencha as informações abaixo para abrir um chamado.</p>
        </div>
      </div>

      <!-- ── Alert ────────────────────────────────────────────── -->
      @if (errorMessage()) {
        <div class="alert alert-danger">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 5v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ errorMessage() }}
        </div>
      }

      <!-- ── Card principal ────────────────────────────────────── -->
      <div class="card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Linha 1: Departamento + Tipo + Categoria -->
          <div class="form-row">
            <div class="form-group form-col">
              <label class="form-label" for="departmentId">
                Departamento <span class="required-mark">*</span>
              </label>
              <select
                id="departmentId"
                class="form-select"
                formControlName="departmentId"
                (change)="onDepartmentChange()"
              >
                <option value="">Selecione o departamento...</option>
                @for (dept of departments(); track dept.id) {
                  <option [value]="dept.id">{{ dept.name }}</option>
                }
              </select>
              @if (form.get('departmentId')?.touched && form.get('departmentId')?.hasError('required')) {
                <span class="form-error">Departamento é obrigatório</span>
              }
            </div>

            <div class="form-group form-col">
              <label class="form-label" for="typeId">
                Tipo de chamado <span class="required-mark">*</span>
              </label>
              <select
                id="typeId"
                class="form-select"
                formControlName="typeId"
                [disabled]="!selectedDepartmentId() || isLoadingTypes()"
              >
                @if (!selectedDepartmentId()) {
                  <option value="" disabled selected>Selecione um departamento primeiro...</option>
                } @else if (isLoadingTypes()) {
                  <option value="" disabled selected>Carregando tipos...</option>
                } @else if (ticketTypes().length === 0) {
                  <option value="" disabled selected>Nenhum tipo disponível</option>
                } @else {
                  <option value="">Selecione o tipo...</option>
                  @for (t of ticketTypes(); track t.id) {
                    <option [value]="t.id">{{ t.name }}</option>
                  }
                }
              </select>

              @if (!selectedDepartmentId()) {
                <span class="form-hint">Selecione o departamento para carregar os tipos.</span>
              } @else if (isLoadingTypes()) {
                <span class="form-hint">
                  <svg class="spinner-sm" width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <circle cx="5.5" cy="5.5" r="4" stroke="#B0BAC8" stroke-width="1.5"/>
                    <path d="M9.5 5.5a4 4 0 00-4-4" stroke="#1976D2" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  Carregando tipos...
                </span>
              } @else if (ticketTypes().length === 0 && selectedDepartmentId()) {
                @if (perm.can('request_type.manage')) {
                  <div class="field-alert field-alert-warning">
                    Nenhum tipo cadastrado para este departamento.
                    <a routerLink="/settings" class="alert-link">Cadastrar nos configurações →</a>
                  </div>
                } @else {
                  <div class="field-alert field-alert-info">
                    Nenhum tipo disponível para este setor.
                  </div>
                }
              }

              @if (form.get('typeId')?.touched && form.get('typeId')?.hasError('required') && selectedDepartmentId() && ticketTypes().length > 0) {
                <span class="form-error">Tipo de chamado é obrigatório</span>
              }
            </div>

            <div class="form-group form-col">
              <label class="form-label" for="categoryId">Categoria</label>
              <select
                id="categoryId"
                class="form-select"
                formControlName="categoryId"
                [disabled]="!selectedDepartmentId()"
              >
                <option value="">Sem categoria específica</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Linha 2: Prioridade -->
          <div class="form-row form-row-narrow">
            <div class="form-group form-col-sm">
              <label class="form-label" for="priorityId">
                Prioridade <span class="required-mark">*</span>
              </label>
              <select id="priorityId" class="form-select" formControlName="priorityId">
                <option value="">Selecione a prioridade...</option>
                @for (pri of priorities(); track pri.id) {
                  <option [value]="pri.id">{{ pri.name }}</option>
                }
              </select>
              @if (form.get('priorityId')?.touched && form.get('priorityId')?.hasError('required')) {
                <span class="form-error">Prioridade é obrigatória</span>
              }
            </div>
          </div>

          <!-- Título -->
          <div class="form-group">
            <label class="form-label" for="title">
              Título <span class="required-mark">*</span>
            </label>
            <input
              id="title"
              type="text"
              class="form-input"
              formControlName="title"
              placeholder="Ex: Falha ao emitir nota fiscal ou Sem acesso ao portal"
            />
            @if (form.get('title')?.touched && form.get('title')?.hasError('required')) {
              <span class="form-error">Título é obrigatório (mínimo 5 caracteres)</span>
            }
          </div>

          <!-- Descrição -->
          <div class="form-group">
            <label class="form-label" for="description">
              Descrição <span class="required-mark">*</span>
            </label>
            <!-- Mini toolbar de formatação -->
            <div class="editor-toolbar">
              <button type="button" class="toolbar-btn" title="Negrito">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 2h5a3 3 0 010 6H3V2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                  <path d="M3 8h6a3 3 0 010 6H3V8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                </svg>
              </button>
              <button type="button" class="toolbar-btn" title="Itálico">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M6 2h5M3 12h5M8 2l-3 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
              </button>
              <button type="button" class="toolbar-btn" title="Lista">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="2.5" cy="4" r="1" fill="currentColor"/>
                  <circle cx="2.5" cy="7" r="1" fill="currentColor"/>
                  <circle cx="2.5" cy="10" r="1" fill="currentColor"/>
                  <path d="M5 4h7M5 7h7M5 10h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </button>
              <button type="button" class="toolbar-btn" title="Link">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 8.5A3.5 3.5 0 009.9 9.9l1.4-1.4a3.5 3.5 0 00-5-4.95L5.5 4.35" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M8.5 5.5A3.5 3.5 0 004.1 4.1L2.7 5.5a3.5 3.5 0 005 4.95L8.5 9.65" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <textarea
              id="description"
              class="form-textarea editor-textarea"
              rows="6"
              formControlName="description"
              placeholder="Descreva o problema, passos para reproduzir, mensagens de erro e impacto no trabalho..."
            ></textarea>
            @if (form.get('description')?.touched && form.get('description')?.hasError('required')) {
              <span class="form-error">Descrição é obrigatória (mínimo 10 caracteres)</span>
            }
          </div>

          <!-- Anexos: drag & drop -->
          <div class="form-group">
            <label class="form-label">Anexos</label>
            <div
              class="upload-zone"
              [class.dragging]="isDragging()"
              (dragover)="onDragOver($event)"
              (dragleave)="isDragging.set(false)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
            >
              <input
                #fileInput
                type="file"
                multiple
                style="display:none"
                (change)="onFileSelect($event)"
              />
              <div class="upload-zone-inner">
                <div class="upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17 8l-5-5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <p class="upload-text">
                  <strong>Arraste arquivos aqui</strong>
                  <span> ou clique para selecionar</span>
                </p>
                <p class="upload-limit">Máx. 10 arquivos / 20MB cada</p>
              </div>
            </div>

            <!-- Arquivos selecionados -->
            @if (attachedFiles().length > 0) {
              <div class="file-list">
                @for (file of attachedFiles(); track file.name) {
                  <div class="file-item">
                    <div class="file-info">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L8 1z" stroke="currentColor" stroke-width="1.2"/>
                        <path d="M8 1v4h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                      </svg>
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatSize(file.size) }}</span>
                    </div>
                    <button type="button" class="file-remove" (click)="removeFile(file.name)" title="Remover">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Botões -->
          <div class="form-actions">
            <a routerLink="/tickets" class="btn btn-secondary">Cancelar</a>
            <button
              type="submit"
              id="btn-submit-ticket"
              class="btn btn-yellow btn-lg"
              [disabled]="form.invalid || isSubmitting()"
            >
              @if (isSubmitting()) {
                <svg class="spinner-btn" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="5.5" stroke="rgba(8,43,85,0.25)" stroke-width="2"/>
                  <path d="M13 7.5a5.5 5.5 0 00-5.5-5.5" stroke="#082B55" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Enviando...
              } @else {
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Abrir chamado
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 900px;
    }

    /* ── Form layout ─────────────────────────────────── */
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 4px;
    }

    .form-col {
      flex: 1;
      min-width: 0;
    }

    .form-row-narrow {
      max-width: 320px;
    }

    .form-col-sm {
      min-width: 200px;
    }

    .required-mark {
      color: #DC2626;
    }

    /* ── Editor ──────────────────────────────────────── */
    .editor-toolbar {
      display: flex;
      gap: 2px;
      padding: 6px 8px;
      background-color: #F8FAFC;
      border: 1px solid #E5E7EB;
      border-bottom: none;
      border-radius: 6px 6px 0 0;
    }

    .toolbar-btn {
      width: 30px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: #667085;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.1s ease;
    }

    .toolbar-btn:hover {
      background-color: #E5E7EB;
      color: #14213D;
    }

    .editor-textarea {
      border-radius: 0 0 6px 6px;
      border-top: none;
      min-height: 120px;
    }

    /* ── Upload zone ─────────────────────────────────── */
    .upload-zone {
      border: 1.5px dashed #D1D5DB;
      border-radius: 8px;
      background-color: #F8FAFC;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .upload-zone:hover {
      border-color: #1976D2;
      background-color: #EFF6FF;
    }

    .upload-zone.dragging {
      border-color: #FFC107;
      background-color: #FFFBEB;
    }

    .upload-zone-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 24px;
      pointer-events: none;
    }

    .upload-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background-color: #EFF6FF;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1976D2;
      margin-bottom: 4px;
    }

    .upload-text {
      font-size: 14px;
      color: #14213D;
      margin: 0;
      text-align: center;
    }

    .upload-text span {
      color: #667085;
    }

    .upload-limit {
      font-size: 12px;
      color: #9CA3AF;
      margin: 0;
    }

    /* ── File list ───────────────────────────────────── */
    .file-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 10px;
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #667085;
      min-width: 0;
    }

    .file-name {
      font-size: 13px;
      font-weight: 500;
      color: #14213D;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 280px;
    }

    .file-size {
      font-size: 11.5px;
      color: #9CA3AF;
      flex-shrink: 0;
    }

    .file-remove {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: #9CA3AF;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.12s ease;
      flex-shrink: 0;
    }

    .file-remove:hover {
      background-color: #FEF2F2;
      color: #DC2626;
    }

    /* ── Field alerts ────────────────────────────────── */
    .field-alert {
      margin-top: 5px;
      padding: 7px 10px;
      border-radius: 5px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .field-alert-warning {
      background-color: #FFFBEB;
      border: 1px solid #FDE68A;
      color: #B45309;
    }

    .field-alert-info {
      background-color: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
    }

    .alert-link {
      font-weight: 600;
      font-size: 11.5px;
      text-decoration: underline;
    }

    /* ── Spinners ────────────────────────────────────── */
    .spinner-sm {
      animation: spin 0.7s linear infinite;
      vertical-align: middle;
    }

    .spinner-btn {
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ── Form actions ────────────────────────────────── */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
    }

    /* ── Responsive ──────────────────────────────────── */
    @media (max-width: 768px) {
      .form-row { flex-direction: column; }
      .form-row-narrow { max-width: 100%; }
    }
  `]
})
export class TicketCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  readonly perm = inject(PermissionService);
  private readonly router = inject(Router);

  readonly departments = signal<Department[]>([]);
  readonly ticketTypes = signal<TicketType[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly priorities = signal<Priority[]>([]);

  readonly selectedDepartmentId = signal<string>('');
  readonly isLoadingTypes = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isDragging = signal(false);
  readonly attachedFiles = signal<File[]>([]);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    departmentId: ['', [Validators.required]],
    typeId: ['', [Validators.required]],
    categoryId: [''],
    priorityId: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.ticketService.getDepartments().subscribe({
      next: (data) => this.departments.set(data),
      error: () => this.errorMessage.set('Erro ao carregar departamentos.')
    });
    this.ticketService.getPriorities().subscribe({
      next: (data) => this.priorities.set(data),
      error: () => this.errorMessage.set('Erro ao carregar prioridades.')
    });
  }

  onDepartmentChange(): void {
    const deptId = this.form.get('departmentId')?.value || '';
    this.selectedDepartmentId.set(deptId);
    this.form.get('typeId')?.setValue('');
    this.form.get('categoryId')?.setValue('');

    if (!deptId) {
      this.ticketTypes.set([]);
      this.categories.set([]);
      this.isLoadingTypes.set(false);
      return;
    }

    this.isLoadingTypes.set(true);
    this.ticketService.getTicketTypes(deptId).subscribe({
      next: (types) => { this.ticketTypes.set(types); this.isLoadingTypes.set(false); },
      error: () => { this.ticketTypes.set([]); this.isLoadingTypes.set(false); }
    });
    this.ticketService.getCategories(deptId).subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.categories.set([])
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(event.dataTransfer?.files || []);
    this.addFiles(files);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.addFiles(files);
    input.value = '';
  }

  addFiles(files: File[]): void {
    const current = this.attachedFiles();
    const combined = [...current, ...files].slice(0, 10);
    this.attachedFiles.set(combined);
  }

  removeFile(name: string): void {
    this.attachedFiles.update(list => list.filter(f => f.name !== name));
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();

    this.ticketService.createTicket({
      title: val.title!,
      description: val.description!,
      departmentId: val.departmentId!,
      typeId: val.typeId!,
      categoryId: val.categoryId || null,
      priorityId: val.priorityId!
    }).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.router.navigate(['/tickets', created.id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error?.message || 'Erro ao criar chamado. Tente novamente.');
      }
    });
  }
}
