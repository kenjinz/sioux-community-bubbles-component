import { v4 as uuid } from 'uuid';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Layer, Stage, Star, Text } from 'react-konva';
import useImage from 'use-image';

type Size = {
  width: number;
  height: number;
};

class ObjectBubble {
  public size: number;
  public id: string;
  public x: number;
  public y: number;
  public data: ItemData;
  private boundaries: Size;

  private vx: number;
  private vy: number;
  private isStopped: boolean;
  public isDragging: boolean;

  private isMouseDown: boolean;
  private dragThreshold: number;
  private startX: number;
  private startY: number;
  private offsetX: number;
  private offsetY: number;

  public isFocused: boolean;

  constructor(id: string, size: number, data: ItemData, boundaries?: Size) {
    this.id = id;
    this.data = data;
    this.size = size; // Size of the shape
    this.boundaries = {
      width: boundaries?.width || window.innerWidth,
      height: boundaries?.height || window.innerHeight,
    };
    this.x = Math.floor(Math.random() * (this.boundaries.width - this.size));
    this.y = Math.floor(Math.random() * (this.boundaries.height - this.size));
    this.vx = 1; // Velocity in x-direction
    this.vy = 1; // Velocity in y-direction
    this.isStopped = false; // Flag to check if the shape is stopped
    this.isDragging = false; // Flag to check if the shape is being dragged
    this.isFocused = false;
    this.isMouseDown = false; // Flag to check if the mouse button is held down
    this.dragThreshold = 5; // Minimum movement in pixels to start dragging
    this.startX = 0; // Initial mouse x position when dragging starts
    this.startY = 0; // Initial mouse y position when dragging starts
    this.offsetX = 0;
    this.offsetY = 0;

    this.updatePosition();
  }

  public updatePosition() {
    if (!this.isStopped && !this.isDragging) {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off the edges
      if (this.x <= 0 || this.x >= this.boundaries.width - this.size) {
        this.x -= this.vx;
        this.vx *= -1;
      }
      if (this.y <= 0 || this.y >= this.boundaries.height - this.size) {
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
    this.isMouseDown = false;
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    // Here's is the scale size, should be either props or hard code, will check.
    this.size *= 3;
  }

  endFocus() {
    if (!this.isFocused || this.isDragging) return;
    this.isFocused = false;
    this.isStopped = false;
    this.isDragging = false;
    this.isMouseDown = false;

    this.size /= 3;
  }

  startDrag() {
    this.isDragging = true;
  }

  startMouseDown(e: any) {
    this.isMouseDown = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.offsetX = e.clientX - this.x;
    this.offsetY = e.clientY - this.y;
  }

  checkDrag(e: any) {
    if (this.isMouseDown && !this.isFocused) {
      const moveX = e.clientX - this.startX;
      const moveY = e.clientY - this.startY;
      const distance = Math.sqrt(moveX * moveX + moveY * moveY);

      if (distance > this.dragThreshold) {
        this.isDragging = true;
        this.isStopped = true;
        this.drag(e);
      }
    }
  }

  drag(e: any) {
    if (this.isDragging) {
      this.x = e.clientX - this.offsetX;
      this.y = e.clientY - this.offsetY;
      this.updatePosition();
    }
  }

  endDrag() {
    this.isMouseDown = false;
    if (this.isDragging) {
      this.isDragging = false;
      this.isStopped = false;
    }
  }
}

class CoordinateSystem {
  private bubbles: ObjectBubble[] = [];
  private focusedBubbleId?: string;

  constructor(bubbles: ItemData[], size: number, boundaries?: Size) {
    this.initBubbles(bubbles, size, boundaries);
  }

  private initBubbles(bubbles: ItemData[], size: number, boundaries?: Size) {
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = new ObjectBubble(uuid(), size, bubbles[i], boundaries);
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

  public onMouseUp(id: string) {
    const bubble = this.getBubble(id);
    if (!bubble) return;

    if (bubble.isDragging) {
      this.endDrag(id);
    } else {
      this.focus(id);
    }
  }

  private endDrag(id: string) {
    const bubble = this.getBubble(id);
    bubble?.endDrag();
  }

  public isBubbleFocused(id: string): boolean {
    const bubble = this.getBubble(id);
    return bubble?.isFocused ?? false;
  }

  private focus(id: string) {
    if (this.focusedBubbleId && this.focusedBubbleId === id) {
      this.stopFocus(id);
      return;
    }

    this.startFocus(id);
  }

  private startFocus(id: string) {
    if (this.focusedBubbleId) {
      this.stopFocus(this.focusedBubbleId);
    }

    const bubble = this.getBubble(id);
    bubble?.startFocus();
    this.focusedBubbleId = id;
  }

  private stopFocus(id: string) {
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

  public startMouseDown(id: string, e: any) {
    const bubble = this.getBubble(id);
    bubble?.startMouseDown(e);
  }

  public checkDrag(id: string, e: any) {
    if (this.focusedBubbleId === id) return;
    const bubble = this.getBubble(id);
    bubble?.checkDrag(e);
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

  /**
   * The boundaries that bubble can move around
   *
   * @default - The window size
   */
  boundaries?: {
    width: number;
    height: number;
  };
}

export const BubbleSystem = (props: BubbleSystemProps) => {
  function generateShapes() {
    return [...Array(10)].map((_, i) => ({
      id: i.toString(),
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      rotation: Math.random() * 180,
      isDragging: false,
    }));
  }

  const INITIAL_STATE = generateShapes();
  const [stars, setStars] = React.useState(INITIAL_STATE);
  const handleDragStart = (e) => {
    const id = e.target.id();
    setStars(
      stars.map((star) => {
        return {
          ...star,
          isDragging: star.id === id,
        };
      })
    );
  };
  const handleDragEnd = (e) => {
    setStars(
      stars.map((star) => {
        return {
          ...star,
          isDragging: false,
        };
      })
    );
  };

  const LionImage = () => {
    const [image] = useImage('./test.png');
    return <Image image={image} draggable  />;
  };
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Text text="Try to drag a star" />
        {stars.map((star) => (
          <LionImage  />
        ))}
      </Layer>
    </Stage>
  );
};

interface IShape {
  id: string;
  x: number;
  y: number;
  size: number;
  data: ItemData;
}
