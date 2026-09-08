import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/product-list.component').then(
            (m) => m.ProductListComponent
          )
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./pages/products/product-detail.component').then(
            (m) => m.ProductDetailComponent
          )
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/category-list.component').then(
            (m) => m.CategoryListComponent
          )
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./pages/stock-management/stock-management.component').then(
            (m) => m.StockManagementComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
