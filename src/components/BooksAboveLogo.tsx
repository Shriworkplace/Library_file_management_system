import React from 'react';

interface BooksAboveLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  color?: string; // Optional custom color override (default is antique olive green)
  showText?: boolean;
  variant?: 'transparent' | 'badge';
}

export const BooksAboveLogo: React.FC<BooksAboveLogoProps> = ({
  className = '',
  size = 'md',
  color,
  showText = true,
  variant = 'transparent',
}) => {
  // Determine standard dimension mappings
  const dimensions = {
    sm: { width: 148, height: 45 },
    md: { width: 190, height: 58 },
    lg: { width: 312, height: 95 },
    xl: { width: 466, height: 142 },
    custom: { width: '100%', height: '100%' },
  }[size];

  // The antique olive-green brand color from the uploaded image is #4e5b31
  const brandColor = color || '#4e5b31';

  // SVG components rendering setup
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={showText ? "0 0 460 140" : "0 0 160 160"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,550;0,700;1,400&family=Cinzel:wght@500;700&display=swap');
            
            .brand-cursive {
              font-family: 'Alex Brush', cursive;
              font-weight: 400;
            }
            .brand-sub {
              font-family: 'Cinzel', serif;
              letter-spacing: 0.18em;
              font-weight: 700;
              font-size: 10px;
            }
            .monogram-serif-b {
              font-family: 'Playfair Display', 'Cinzel', serif;
              font-weight: 700;
              font-size: 110px;
            }
            .monogram-serif-a {
              font-family: 'Playfair Display', 'Cinzel', serif;
              font-weight: 500;
              font-size: 112px;
            }
          `}} />
        </defs>

        {/* Optional App Icon Badge Container wrapper exactly like the user's uploaded icon */}
        {variant === 'badge' ? (
          <>
            {/* Soft, beautiful, physical shadow for the badge */}
            <rect 
              x="3" 
              y="3" 
              width="154" 
              height="154" 
              rx="32" 
              fill="#000000" 
              opacity="0.12" 
              filter="blur(4px)"
            />
            {/* The crisp white iOS-style rounded-square badge background requested */}
            <rect 
              x="4" 
              y="4" 
              width="152" 
              height="152" 
              rx="32" 
              fill="#FFFFFF" 
              stroke="#E8EBE4" 
              strokeWidth="1.5"
            />
          </>
        ) : null}

        {/* Center alignment support helper */}
        <g transform={showText ? "translate(5, 5)" : (variant === 'badge' ? "translate(0, 0)" : "translate(5, 5)")}>
          
          {/* A. Elegant Monogram "BA" Letterforms from the branding design */}
          {/* Background Letter "B" */}
          <text 
            x={variant === 'badge' ? "58" : "54"} 
            y={variant === 'badge' ? "106" : "110"} 
            className="monogram-serif-b select-none" 
            fill={variant === 'badge' ? '#4e5b31' : brandColor}
            opacity="0.95"
          >
            B
          </text>

          {/* Foreground Letter "A" intersecting beautifully with "B" */}
          <text 
            x={variant === 'badge' ? "88" : "84"} 
            y={variant === 'badge' ? "118" : "122"} 
            className="monogram-serif-a select-none" 
            fill={variant === 'badge' ? '#4e5b31' : brandColor}
          >
            A
          </text>

          {/* B. Symmetrical Old World Book Icon on the Left, overlapping "B" spine */}
          <g 
            id="book-monogram-overlap" 
            stroke={variant === 'badge' ? '#4e5b31' : brandColor} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            transform={variant === 'badge' ? "translate(8, 0)" : "translate(4, 4)"}
          >
            {/* Book thick sturdy Spine backing */}
            <path d="M 28,34 L 28,102" strokeWidth="2.8" />
            <path d="M 28,34 C 23,36 21,39 21,45 L 21,91 C 21,97 23,100 28,102" strokeWidth="2.5" fill="none" />
            
            {/* Front Cover page layers with elegant slightly rounded corner borders */}
            <path d="M 28,34 L 48,34 C 50,34 52,36 52,38 L 52,98 C 52,100 50,102 48,102 L 28,102" strokeWidth="2.5" fill={variant === 'badge' ? '#FFFFFF' : 'none'} />
            <path d="M 32,34 L 32,102" strokeWidth="1" strokeOpacity="0.4" />

            {/* Spine mini structural ridges */}
            <line x1="21" y1="48" x2="28" y2="48" strokeWidth="1.5" />
            <line x1="21" y1="62" x2="28" y2="62" strokeWidth="1.5" />
            <line x1="21" y1="76" x2="28" y2="76" strokeWidth="1.5" />
            <line x1="21" y1="90" x2="28" y2="90" strokeWidth="1.5" />

            {/* Arch-shield (cartouche) detail emblazoned on the book cover */}
            <path 
              d="M 36,54 C 36,46 40,41 46,41 C 46,47 46,47 46,54 L 46,82 C 46,90 40,95 46,95 Z" 
              strokeWidth="1.2" 
              strokeOpacity="0.8"
              fill="none"
              strokeDasharray="1 1"
            />
            {/* Actual shield container */}
            <path 
              d="M 35,56 C 35,48 40,43 40,43 C 40,43 45,48 45,56 L 45,80 C 45,88 40,93 40,93 C 40,93 35,88 35,80 Z" 
              strokeWidth="1.5" 
              fill="none"
            />

            {/* Central florid star emblem at the heart of the cover container */}
            <polygon 
              points="40,60 41.5,63.5 45,63.8 42.4,66 43.2,69.5 40,67.6 36.8,69.5 37.6,66 35,63.8 38.5,63.5" 
              fill={variant === 'badge' ? '#4e5b31' : brandColor}
              stroke="none"
            />
          </g>

        </g>

        {/* C. Elegant Script Typography for branding "Books Above" */}
        {showText && (
          <g transform="translate(156, 12)">
            {/* Cursive Logo Header */}
            <text 
              x="0" 
              y="60" 
              className="brand-cursive select-none" 
              fontSize="64" 
              fill={brandColor}
            >
              Books Above
            </text>

            {/* Classy Serif/Slate Subtitle badge */}
            <text 
              x="6" 
              y="82" 
              className="brand-sub select-none" 
              fill={brandColor}
              opacity="0.65"
            >
              The Scholastic Ledger
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
