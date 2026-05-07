import { useDraggable } from '@dnd-kit/core';

interface HoleTokenProps {
  hole: number;
  size?: number;
}

export default function HoleToken({ hole, size = 36 }: HoleTokenProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `hole-${hole}`,
    data: { hole },
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.08 : 1})`
      : undefined,
    width: size,
    height: size,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`
        flex items-center justify-center rounded-full
        bg-white border-2 border-forest
        font-body text-small font-bold text-forest
        shadow-token cursor-grab
        transition-shadow duration-150 ease-smooth
        select-none touch-none
        ${isDragging ? 'shadow-card-hover cursor-grabbing' : ''}
      `}
    >
      {hole}
    </div>
  );
}
