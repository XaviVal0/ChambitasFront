import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { Profile } from './pages/profile/profile';
import { Jobs } from './pages/jobs/jobs';
import { Applications } from './pages/applications/applications';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'jobs', component: Jobs, canActivate: [authGuard] },
  { path: 'applications', component: Applications, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },

  { path: 'register', component: Register },
  { path: 'login', component: Login },

  { path: '**', redirectTo: '' }
];
