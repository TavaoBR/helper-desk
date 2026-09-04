import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { makeAdminUser, DummyComponent } from '../testing/factories';
import { TicketService } from './core/services/ticket.service';
import { AuthService } from './core/services/auth.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'dashboard', component: DummyComponent }, { path: '**', component: DummyComponent }]),
        provideHttpClient(),
        {
          provide: TicketService,
          useValue: {
            getInAppNotifications: () => of({ items: [], unreadCount: 0 })
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should not render sidebar or header when unauthenticated', async () => {
    localStorage.clear();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).toBeNull();
    expect(compiled.querySelector('app-header')).toBeNull();
  });

  it('should render brand name in sidebar when authenticated', async () => {
    const admin = makeAdminUser();
    const authService = TestBed.inject(AuthService);
    authService.setSession('mock-token', admin);

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-name')?.textContent).toContain('SupportFlow');
  });
});


