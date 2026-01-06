import { Link, useLocation } from 'react-router-dom';
import { MENU_MEGA } from '@/config/menu.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

export function MegaMenu() {
  const { pathname } = useLocation();
  const { isActive, hasActiveChild } = useMenu(pathname);

  const linkClass = `
    text-sm text-secondary-foreground font-medium 
    hover:text-primary hover:bg-transparent 
    focus:text-primary focus:bg-transparent 
    data-[active=true]:text-primary data-[active=true]:bg-transparent 
    data-[state=open]:text-primary data-[state=open]:bg-transparent
  `;

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-0">
        {MENU_MEGA.map((item, index) => {
          // If item has no children, render as simple link
          if (!item.children) {
            return (
              <NavigationMenuItem key={index}>
                <NavigationMenuLink asChild>
                  <Link
                    to={item.path || '/'}
                    className={cn(linkClass)}
                    data-active={isActive(item.path) || undefined}
                  >
                    {item.title}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }

          // If item has children, render as dropdown
          return (
            <NavigationMenuItem key={index}>
              <NavigationMenuTrigger
                className={cn(linkClass)}
                data-active={hasActiveChild(item.children) || undefined}
              >
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0">
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Menu content for {item.title}
                  </p>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
