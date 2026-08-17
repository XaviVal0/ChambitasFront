import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    canActivate: [authGuard]
  },

  // Rutas públicas
  { path: 'register', component: Register },
  { path: 'login', component: Login },
  { path : 'profile', component: Profile, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
