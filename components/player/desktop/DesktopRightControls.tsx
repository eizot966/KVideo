import React from 'react';
import { Icons } from '@/components/ui/Icon';
import { useIsTV } from '@/lib/contexts/TVContext';

interface DesktopRightControlsProps {
    isNativeFullscreen: boolean;
    isWebFullscreen: boolean;
    isPiPSupported: boolean;
    isAirPlaySupported: boolean;
    isCastAvailable: boolean;
    onToggleNativeFullscreen: () => void;
    onToggleWebFullscreen: () => void;
    onTogglePictureInPicture: () => void;
    onShowAirPlayMenu: () => void;
    onShowCastMenu: () => void;
}

export function DesktopRightControls({
    isNativeFullscreen,
    isWebFullscreen,
    isPiPSupported,
    isAirPlaySupported,
    isCastAvailable,
    onToggleNativeFullscreen,
    onToggleWebFullscreen,
    onTogglePictureInPicture,
    onShowAirPlayMenu,
    onShowCastMenu
}: DesktopRightControlsProps) {
    const isTV = useIsTV();

    return (
        <div className="player-controls-right relative z-50 flex shrink-0 items-center gap-3">
            {/* Picture-in-Picture */}
            {
                !isTV && isPiPSupported && (
                    <button
                        onClick={onTogglePictureInPicture}
                        className="btn-icon shrink-0"
                        aria-label="画中画"
                        title="画中画"
                    >
                        <Icons.PictureInPicture size={20} />
                    </button>
                )
            }

            {/* AirPlay */}
            {
                !isTV && isAirPlaySupported && (
                    <button
                        onClick={onShowAirPlayMenu}
                        className="btn-icon shrink-0"
                        aria-label="隔空播放"
                        title="隔空播放"
                    >
                        <Icons.Airplay size={20} />
                    </button>
                )
            }

            {/* Google Cast */}
            {
                !isTV && isCastAvailable && (
                    <button
                        onClick={onShowCastMenu}
                        className="btn-icon shrink-0"
                        aria-label="投屏"
                        title="投屏"
                    >
                        <Icons.Cast size={20} />
                    </button>
                )
            }

            {/* Web Fullscreen (Always available, primary on TV/PS5) */}
            <button
                onClick={onToggleWebFullscreen}
                className="btn-icon shrink-0"
                aria-label={isWebFullscreen ? '退出网页全屏' : '网页全屏'}
                title={isWebFullscreen ? '退出网页全屏 (W)' : '网页全屏 (W)'}
            >
                {isWebFullscreen
                    ? <Icons.WebFullscreenExit size={20} className="text-[var(--accent-color)]" />
                    : <Icons.WebFullscreen size={20} />}
            </button>

            {/* Native Fullscreen / Fullscreen on TV */}
            <button
                onClick={isTV ? onToggleWebFullscreen : onToggleNativeFullscreen}
                className="btn-icon shrink-0"
                aria-label={(isNativeFullscreen || (isTV && isWebFullscreen)) ? '退出全屏' : '全屏'}
                title={(isNativeFullscreen || (isTV && isWebFullscreen)) ? '退出全屏 (F/W)' : '全屏 (F/W)'}
            >
                {(isNativeFullscreen || (isTV && isWebFullscreen)) ? <Icons.Minimize size={20} /> : <Icons.Maximize size={20} />}
            </button>
        </div>
    );
}
