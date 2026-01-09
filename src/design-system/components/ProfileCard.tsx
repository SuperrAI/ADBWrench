import React from 'react';
import { cn } from '@/lib/utils';
import { textStyles } from '@/design-system/foundations/typography';
import { CoreColors, Neutral, Orange } from '../foundations/colors';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/dicebear-avatar';

export interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Display name of the user
   */
  name: string;
  /**
   * Additional information (email, role, etc.)
   */
  subtitle?: string;
  /**
   * Optional badge number/text to display
   */
  badgeText?: string;
  /**
   * Card variant - student or teacher
   */
  variant?: 'TEACHER' | 'STUDENT';
  /**
   * Custom icon path from public folder (e.g., '/assets/icons/student-avatars/student-01.svg')
   * If provided, this will be used instead of the generated DiceBear avatar
   */
  iconPath?: string;
}

export const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ name, subtitle, badgeText, variant = 'STUDENT', iconPath, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn('relative flex flex-col items-center p-6', className)}
        style={{
          width: '208px',
          height: '236px',
          borderRadius: '24px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: Neutral.N200,
          boxShadow: '0px 1px 2px -1px rgba(0, 0, 0, 0.1), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
        }}
        {...props}
      >
        {/* Badge Number */}
        {variant === 'STUDENT' && badgeText && (
          <div
            className="absolute"
            style={{
              width: '20px',
              height: '24px',
              top: '16px',
              left: '16px',
            }}
          >
            <span style={{ color: Neutral.N400, ...textStyles.labelMono }}>
              {String(badgeText).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Profile Avatar */}
        <div className="mt-24">
          <div
            className="rounded-full overflow-hidden"
            style={{
              borderColor: Neutral.N200,
            }}
          >
            <Avatar 
              size={96} 
              name={name} 
              variant="beam" 
              className="rounded-full" 
              iconPath={iconPath}
            />
          </div>
        </div>

        {/* Name and Subtitle */}
        <div
          className="flex flex-col items-center justify-between flex-1"
          style={{
            width: '160px',
            margin: '24px',
          }}
        >
          <div
            className="text-center w-full"
            style={{
              ...textStyles.h4,
              color: CoreColors.Black,
              fontWeight: '600',
              width: '160px',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              height: '40px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {name}
          </div>

          {subtitle && (
            <p
              className="text-center w-full truncate"
              style={{
                ...textStyles.body3Semi,
                fontWeight: '400',
                color: variant === 'TEACHER' ? Orange.O500 : Neutral.N500,
                marginTop: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </Card>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;
