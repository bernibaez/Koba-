import React, { memo, useEffect, useMemo, useState } from 'react';
import AppIcon from './AppIcon';
import AppImage from './AppImage';
import { getCompanyLogo, subscribeLogoChange, syncCompanyLogoFromDb } from '@/lib/companyLogo';

const DEFAULT_LOGO = '/assets/images/app_logo.png';

interface AppLogoProps {
  src?: string;
  iconName?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const AppLogo = memo(function AppLogo({
  src,
  iconName = 'SparklesIcon',
  size = 64,
  className = '',
  onClick,
}: AppLogoProps) {
  const [storedLogo, setStoredLogo] = useState<string | null>(() => getCompanyLogo());

  useEffect(() => {
    void syncCompanyLogoFromDb().then((url) => setStoredLogo(url));
    return subscribeLogoChange(() => setStoredLogo(getCompanyLogo()));
  }, []);

  const logoSrc = src ?? storedLogo ?? DEFAULT_LOGO;

  const containerClassName = useMemo(() => {
    const classes = ['flex items-center'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick}>
      {logoSrc ? (
        <AppImage
          src={logoSrc}
          alt="Logo"
          width={size}
          height={size}
          className="flex-shrink-0 object-contain rounded-md"
          priority={true}
        />
      ) : (
        <AppIcon name={iconName} size={size} className="flex-shrink-0" />
      )}
    </div>
  );
});

export default AppLogo;
