import { v4 as uuid } from 'uuid';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import Draggable, { DraggableData } from 'react-draggable';

class ObjectBubble {
  public size: number;
  public id: string;
  public x: number;
  public y: number;
  public data: ItemData;

  private vx: number;
  private vy: number;
  private isStopped: boolean;
  private isDragging: boolean;

  public isFocused: boolean;

  constructor(id: string, size: number, data: ItemData) {
    this.id = id;
    this.data = data;
    this.size = size; // Size of the shape
    this.x = Math.floor(Math.random() * (window.innerWidth - this.size));
    this.y = Math.floor(Math.random() * (window.innerHeight - this.size));
    this.vx = 1; // Velocity in x-direction
    this.vy = 1; // Velocity in y-direction
    this.isStopped = false; // Flag to check if the shape is stopped
    this.isDragging = false; // Flag to check if the shape is being dragged
    this.isFocused = false;
    this.updatePosition();
  }

  public updatePosition() {
    if (!this.isStopped && !this.isDragging) {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off the edges
      if (this.x <= 0 || this.x >= window.innerWidth - this.size) {
        this.x -= this.vx;
        this.vx *= -1;
      }
      if (this.y <= 0 || this.y >= window.innerHeight - this.size) {
        this.y -= this.vy;
        this.vy *= -1;
      }
    }
  }

  checkCollision(otherBubble: ObjectBubble) {
    const dx = this.x - otherBubble.x;
    const dy = this.y - otherBubble.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.size + otherBubble.size) / 2;
  }

  resolveCollision(otherBubble: ObjectBubble) {
    const dx = otherBubble.x - this.x;
    const dy = otherBubble.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const overlap = this.size - distance;

    // Normalize the vector
    const nx = dx / distance;
    const ny = dy / distance;

    // Separate the shapes to avoid sticking
    if (!this.isStopped) {
      this.x -= (nx * overlap) / 2;
      this.y -= (ny * overlap) / 2;
    }

    if (!otherBubble.isStopped) {
      otherBubble.x += (nx * overlap) / 2;
      otherBubble.y += (ny * overlap) / 2;
    }

    const angle = Math.atan2(dy, dx);
    const speed1 = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const speed2 = Math.sqrt(
      otherBubble.vx * otherBubble.vx + otherBubble.vy * otherBubble.vy
    );

    const direction1 = Math.atan2(this.vy, this.vx);
    const direction2 = Math.atan2(otherBubble.vy, otherBubble.vx);

    const newVx1 = speed1 * Math.cos(direction1 - angle);
    const newVy1 = speed1 * Math.sin(direction1 - angle);
    const newVx2 = speed2 * Math.cos(direction2 - angle);
    const newVy2 = speed2 * Math.sin(direction2 - angle);

    const finalVx1 =
      ((this.size - otherBubble.size) * newVx1 +
        (otherBubble.size + otherBubble.size) * newVx2) /
      (this.size + otherBubble.size);
    const finalVx2 =
      ((this.size + this.size) * newVx1 +
        (otherBubble.size - this.size) * newVx2) /
      (this.size + otherBubble.size);

    const finalVy1 = newVy1;
    const finalVy2 = newVy2;

    if (!this.isStopped) {
      this.vx =
        Math.cos(angle) * finalVx1 + Math.cos(angle + Math.PI / 2) * finalVy1;
      this.vy =
        Math.sin(angle) * finalVx1 + Math.sin(angle + Math.PI / 2) * finalVy1;
    }

    if (!otherBubble.isStopped) {
      otherBubble.vx =
        Math.cos(angle) * finalVx2 + Math.cos(angle + Math.PI / 2) * finalVy2;
      otherBubble.vy =
        Math.sin(angle) * finalVx2 + Math.sin(angle + Math.PI / 2) * finalVy2;
    }
  }

  stop() {
    if (!this.isDragging) {
      this.isStopped = true;
    }
  }

  resume() {
    if (!this.isDragging && !this.isFocused) {
      this.isStopped = false;
    }
  }

  startFocus() {
    if (this.isFocused) return;

    this.isStopped = true;
    this.isFocused = true;
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    // Here's is the scale size, should be either props or hard code, will check.
    this.size *= 3;
  }

  endFocus() {
    if (!this.isFocused) return;

    this.isFocused = false;
    this.isStopped = false;
    this.isDragging = false;

    this.size /= 3;
  }

  startDrag() {
    this.isDragging = true;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  endDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.isStopped = false;
    }
  }
}

class CoordinateSystem {
  private bubbles: ObjectBubble[] = [];
  private focusedBubbleId?: string;

  constructor(bubbles: ItemData[], size: number) {
    this.initBubbles(bubbles, size);
  }

  private initBubbles(bubbles: ItemData[], size: number) {
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = new ObjectBubble(uuid(), size, bubbles[i]);
      this.bubbles.push(bubble);
    }
  }

  private getBubble(id: string) {
    return this.bubbles.find((bubble) => bubble.id === id);
  }

  public getCoordinates() {
    return this.bubbles.map((bubble) => ({
      id: bubble.id,
      x: bubble.x,
      y: bubble.y,
      size: bubble.size,
      data: bubble.data,
    }));
  }

  public updatePosition() {
    this.bubbles.forEach((bubble) => bubble.updatePosition());

    for (let i = 0; i < this.bubbles.length; i++) {
      for (let j = i + 1; j < this.bubbles.length; j++) {
        if (this.bubbles[i].checkCollision(this.bubbles[j])) {
          this.bubbles[i].resolveCollision(this.bubbles[j]);
        }
      }
    }
  }

  public stopBubble(id: string) {
    const bubble = this.getBubble(id);
    bubble?.stop();
  }

  public resumeBubble(id: string) {
    const bubble = this.getBubble(id);
    bubble?.resume();
  }

  public startDragBubble(id: string) {
    const bubble = this.getBubble(id);
    bubble?.startDrag();
  }

  public dragBubble(id: string, x: number, y: number) {
    const bubble = this.getBubble(id);
    bubble?.drag(x, y);
  }

  public endDragBubble(id: string) {
    const bubble = this.getBubble(id);
    bubble?.endDrag();
  }

  public isBubbleFocused(id: string): boolean {
    const bubble = this.getBubble(id);
    return bubble?.isFocused ?? false;
  }

  public startFocus(id: string) {
    if (this.focusedBubbleId) {
      this.stopFocus(this.focusedBubbleId);
    }

    const bubble = this.getBubble(id);
    bubble?.startFocus();
    this.focusedBubbleId = id;
  }

  public stopFocus(id: string) {
    const bubble = this.getBubble(id);
    bubble?.endFocus();
    this.focusedBubbleId = undefined;
  }

  public stopFocusBubbleIfNeeded() {
    if (!this.focusedBubbleId) return;
    const bubble = this.getBubble(this.focusedBubbleId);
    bubble?.endFocus();
    this.focusedBubbleId = undefined;
  }
}

/**
 * The data for bubble item
 */
export interface ItemData {
  /**
   * Data Image source
   */
  imgUrl: string;
  /**
   * Data type
   */
  type: 'birthday' | 'normal' | 'workAnniversary' | 'sponsor' | undefined;

  /**
   * Indicate whether it's focused or not
   */
  focused?: boolean;

  /**
   * Work anniversary years
   */
  workAnniversaryYears?: number;
}

/**
 * Bubble system props
 */
export interface BubbleSystemProps {
  /**
   * The size of a bubble.
   * All the bubble will have same size.
   */
  itemSize: number;

  /**
   * Array of bubble data
   */
  items: ItemData[];

  /**
   * The function to render the bubble
   * @param item - The data for rendering bubble
   * @returns The rendered bubble
   */
  renderItem: (item: ItemData) => ReactNode;
}

export const BubbleSystem = (props: BubbleSystemProps) => {
  const updatePositionRequestRef = useRef<number>();
  const { itemSize: size } = props;
  const system = useMemo(() => new CoordinateSystem(props.items, size), []);

  const [bubblesState, setShapesState] = useState<IShape[]>([]);

  const dragStartPositionXYRef = useRef<{ x: number; y: number }>();

  useEffect(() => {
    const updatePosition = () => {
      system.updatePosition();
      setShapesState(system.getCoordinates());
      updatePositionRequestRef.current = requestAnimationFrame(updatePosition);
    };
    updatePosition();
    return () => cancelAnimationFrame(updatePositionRequestRef.current || 0);
  }, []);

  const onStart = (data: DraggableData, id: string) => {
    dragStartPositionXYRef.current = { x: data.x, y: data.y };
    system.startDragBubble(id);
  };

  const onDrag = (id: string, data: DraggableData) => {
    const { x, y } = data;
    system.dragBubble(id, x, y);
  };

  /**
   * If it's dragging, this function will end the drag bubble
   * If it's not, this function will focus the bubble
   */
  const onStop = (data: DraggableData, id: string) => {
    if (!dragStartPositionXYRef.current) return;
    const THRESHOLD = 2;

    const { x: startX, y: startY } = dragStartPositionXYRef.current;
    const { x, y } = data;
    const wasDragged =
      Math.abs(x - startX) > THRESHOLD && Math.abs(y - startY) > THRESHOLD;

    if (!wasDragged) {
      system.startFocus(id);
    } else {
      system.endDragBubble(id);
    }
  };

  const onOutsideClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    const overlay = document.querySelector('#coordinate-system-bubbles');
    if (e.target === overlay) {
      system.stopFocusBubbleIfNeeded();
    }
  };

  /**
   * There's consecutive events trigger when dragging:
   *  onMouseDown => onStart => onDrag => onStop => onClick (of the children)
   */
  return (
    <div
      className="w-full h-full"
      id="coordinate-system-bubbles"
      onClick={onOutsideClick}
    >
      {bubblesState.map((bubble) => {
        return (
          <Draggable
            disabled={system.isBubbleFocused(bubble.id)}
            onStart={(_e, data) => onStart(data, bubble.id)}
            onStop={(_e, data) => onStop(data, bubble.id)}
            onDrag={(_e, data) => onDrag(bubble.id, data)}
            position={{ x: bubble.x, y: bubble.y }}
            bounds={{
              top: 0,
              left: 0,
              right: window.innerWidth - size,
              bottom: window.innerHeight - size,
            }}
            onMouseDown={(_e) => {
              if (system.isBubbleFocused(bubble.id)) {
                system.stopFocus(bubble.id);
              }
            }}
          >
            <div
              onMouseEnter={() => {
                system.stopBubble(bubble.id);
              }}
              onMouseLeave={(_e) => system.resumeBubble(bubble.id)}
              key={bubble.id}
              className={`w-[${bubble.size}px] h-[${bubble.size}px] rounded-full absolute `}
            >
              <div className="pointer-events-none">
                {props.renderItem({
                  ...bubble.data,
                  focused: system.isBubbleFocused(bubble.id),
                })}
              </div>
            </div>
          </Draggable>
        );
      })}
    </div>
  );
};

interface IShape {
  id: string;
  x: number;
  y: number;
  size: number;
  data: ItemData;
}
