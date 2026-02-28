import { useState, useEffect } from 'react'

export default function RoomImageCarousel({ images, alt, height = '200px' }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const displayImages = images && images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&q=80']

    useEffect(() => {
        if (displayImages.length <= 1 || isHovered) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % displayImages.length)
        }, 3000)

        return () => clearInterval(interval)
    }, [displayImages, isHovered])

    return (
        <div
            className="room-carousel"
            style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {displayImages.map((img, idx) => (
                <img
                    key={idx}
                    src={img}
                    alt={`${alt} ${idx + 1}`}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: currentIndex === idx ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out',
                        zIndex: currentIndex === idx ? 1 : 0
                    }}
                />
            ))}

            {displayImages.length > 1 && (
                <div style={{
                    position: 'absolute',
                    bottom: '0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '0.4rem',
                    zIndex: 2
                }}>
                    {displayImages.map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: currentIndex === idx ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
