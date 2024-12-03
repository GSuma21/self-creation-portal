import { Routes } from '@angular/router';
import { ResourceHolderComponent } from './components/resource-holder/resource-holder.component';
import { AppMainViewComponent } from './components/app-main-view/app-main-view.component';
import { SolutionsLibHolderComponent } from './components/solutions-lib-holder/solutions-lib-holder.component';
import { CreateNewComponent } from './components/create-new/create-new.component';
import { AuthGuard } from 'authentication_frontend_library';

export const routes: Routes = [
    {
        path:'home',
        component:AppMainViewComponent,
        canActivate:[AuthGuard],
        children:[
            {
                path:'',
                redirectTo:'create-new',
                pathMatch:'full'
            },
            {
                path:'create-new',
                component:CreateNewComponent
            },
            {
                path:'browse-existing',
                component:ResourceHolderComponent
            },
            {
                path:'drafts',
                component:ResourceHolderComponent
            },
            {
                path:'submit-for-review',
                component:ResourceHolderComponent
            },
            {
                path:'published',
                component:ResourceHolderComponent
            },
            {
                path:'up-for-review',
                component:ResourceHolderComponent
            }
            // drafts, publish and other resource listings should be added here.
        ],
        data: { preload: true, delay: 10000 }
    },
    {
        path:"solution",
        component:SolutionsLibHolderComponent,
        canActivate:[AuthGuard],
        loadChildren:() => import('lib-project').then(m => m.ViewModuleModule),
        data: { preload: true, delay: 15000 }
    },
    { path: '', loadChildren: () => import('authentication_frontend_library').then(m => m.SlRoutingRoutingModule) }
];
