import { v4 as uuid } from 'uuid';
import { useEffect, useMemo, useRef, useState } from 'react';

import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Bubble } from 'sioux-community-browse-ui-v1';

class ObjectBubble {
  private size: number;
  public id: string;
  public x: number;

  public y: number;

  private vx: number;
  private vy: number;
  private isStopped: boolean;
  private isDragging: boolean;
  
  public isFocused: boolean;

  constructor(id: string) {
    this.id = id;
    // this.element = element;
    this.size = 80; // Size of the shape
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
    return distance < this.size;
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

  focus() {
    this.isStopped = !this.isStopped;
    this.isFocused = !this.isFocused;
    if (this.isFocused) {
      this.size = this.size * 3;
      this.x = window.innerWidth / 2;
      this.y = window.innerHeight / 2;
    } else {
      this.size = this.size / 3;
    }
  }

  // startMouseDown(e) {
  //     this.isMouseDown = true;
  //     this.startX = e.clientX;
  //     this.startY = e.clientY;
  //     this.offsetX = e.clientX - this.x;
  //     this.offsetY = e.clientY - this.y;
  // }

  // checkDrag(e) {
  //     if (this.isMouseDown) {
  //         const moveX = e.clientX - this.startX;
  //         const moveY = e.clientY - this.startY;
  //         const distance = Math.sqrt(moveX * moveX + moveY * moveY);

  //         if (distance > this.dragThreshold) {
  //             this.isDragging = true;
  //             this.isStopped = true;
  //             this.drag(e);
  //         }
  //     }
  // }
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

  constructor(bubblesNumber: number) {
    this.initBubbles(bubblesNumber);
  }

  private initBubbles(bubbleNumber: number) {
    for (let i = 0; i < bubbleNumber; i++) {
      const bubble = new ObjectBubble(uuid());
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

  public focusBubble(id: string) {
    const bubble = this.getBubble(id);
    bubble?.focus();
  }
}

interface ShapeProps {
  size: number;
  items: React.ReactNode[];
}
export const BubbleUI = (props: ShapeProps) => {
  const updatePositionRequestRef = useRef<number>();
  const system = useMemo(() => new CoordinateSystem(props.size), []);

  const [bubblesState, setShapesState] = useState<IShape[]>([]);
  const { size = 80 } = props;
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      system.updatePosition();
      setShapesState(system.getCoordinates());
      updatePositionRequestRef.current = requestAnimationFrame(updatePosition);
    };

    updatePositionRequestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(updatePositionRequestRef.current || 0);
  }, []);

  const onDrag = (id: string, data: DraggableData) => {
    const { x, y } = data;
    system.dragBubble(id, x, y);
  };

  return bubblesState.map((bubble) => (
    <Draggable
      onStart={() => system.startDragBubble(bubble.id)}
      onStop={() => system.endDragBubble(bubble.id)}
      onDrag={(_e, data) => onDrag(bubble.id, data)}
      position={{ x: bubble.x, y: bubble.y }}
      bounds={{
        top: 0,
        left: 0,
        right: window.innerWidth - size,
        bottom: window.innerHeight - size,
      }}
    >
      <div
        onMouseEnter={(_e) => {
          system.stopBubble(bubble.id);
        }}
        onMouseLeave={(_e) => system.resumeBubble(bubble.id)}
        style={{
          transform: `translate(${bubble.x}px, ${bubble.y}px)`,
        }}
        key={bubble.id}
        className={`w-[80px] h-[80px] rounded-full absolute `}
        onClick={() => system.focusBubble(bubble.id)}
      >
        {/* <img src='./test.png' /> */}
       
          <Bubble imageUrl="./test.png" type="birthday" focused={system.isBubbleFocused(bubble.id)} />
      </div>
    </Draggable>
  ));
};

interface IShape {
  id: string;
  x: number;
  y: number;
}
