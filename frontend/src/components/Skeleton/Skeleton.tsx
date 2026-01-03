import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    circle?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    borderRadius,
    className = "",
    circle = false
}) => {
    const styles: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: circle ? '50%' : (typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius),
    };

    return <div className={`skeleton-base ${className}`} style={styles} />;
};

export default Skeleton;
