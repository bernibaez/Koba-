import React, { useState, useCallback, memo } from 'react';

interface AppImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  onClick?: () => void;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
}

const AppImage = memo(function AppImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  onClick,
  fallbackSrc = '/assets/images/no_image.png',
  loading = 'lazy',
  style,
}: AppImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
    setIsLoading(false);
  }, [hasError, imageSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const classes = [
    className,
    isLoading ? 'bg-gray-200' : '',
    onClick ? 'cursor-pointer hover:opacity-90 transition-opacity duration-200' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (fill) {
    return (
      <div className="relative" style={{ width: '100%', height: '100%' }}>
        <img
          src={imageSrc}
          alt={alt}
          className={classes}
          loading={priority ? 'eager' : loading}
          onError={handleError}
          onLoad={handleLoad}
          onClick={onClick}
          style={{ objectFit: 'cover', width: '100%', height: '100%', ...style }}
        />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width || 400}
      height={height || 300}
      className={classes}
      loading={priority ? 'eager' : loading}
      onError={handleError}
      onLoad={handleLoad}
      onClick={onClick}
      style={style}
    />
  );
});

AppImage.displayName = 'AppImage';

export default AppImage;
