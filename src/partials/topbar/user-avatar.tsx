import { useMemo } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
    className?: string;
};

export function useUserAvatar() {
    const { user } = useAuth();

    return useMemo(() => {
        const photoPath = user?.pic;
        const avatarSrc = photoPath
            ? photoPath.startsWith('http')
                ? photoPath
                : toAbsoluteUrl(photoPath)
            : null;

        const nameSource =
            user?.display_name ||
            user?.fullname ||
            (user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username) ||
            user?.email;

        const initials = (() => {
            if (!nameSource) return 'U';
            const parts = nameSource.trim().split(/\s+/).filter(Boolean);
            if (parts.length === 0) return 'U';
            if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        })();

        return { avatarSrc, initials };
    }, [user]);
}

export function UserAvatar({ className }: UserAvatarProps) {
    const { avatarSrc, initials } = useUserAvatar();
    const baseClass = 'size-9 rounded-full shrink-0';

    if (avatarSrc) {
        return (
            <img
                className={cn(baseClass, 'object-cover', className)}
                src={avatarSrc}
                alt="User avatar"
            />
        );
    }

    return (
        <span
            className={cn(
                baseClass,
                'flex items-center justify-center text-sm font-semibold bg-primary text-primary-foreground',
                className,
            )}
        >
            {initials}
        </span>
    );
}
