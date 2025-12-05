import { RouteObject } from 'react-router-dom';
import { BrandedLayout } from './layouts/branded';
import { ClassicLayout } from './layouts/classic';
import { CallbackPage } from './pages/callback-page';
import { SignInPage } from './pages/signin-page';

// Define the auth routes
export const authRoutes: RouteObject[] = [
  {
    path: '',
    element: <BrandedLayout />,
    children: [
      {
        path: 'signin',
        element: <SignInPage />,
      },
    ],
  },
  {
    path: '',
    element: <ClassicLayout />,
    children: [
      {
        path: 'classic/signin',
        element: <SignInPage />,
      },
    ],
  },
  {
    path: 'callback',
    element: <CallbackPage />,
  },
];
