import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import 'sioux-community-browse-ui-v1/dist/style.css';
import { BubbleSystem } from './BubbleSystem';
import { Bubble } from 'sioux-community-browse-ui-v1';
import { ItemData } from 'sioux-community-bubbles-component';

const data: ItemData[] = Array.from({ length: 10 }).map(() => ({
  imgUrl: './king.svg',
  type: 'birthday',
}));
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="w-screen h-screen overflow-hidden">
      <BubbleSystem
        itemSize={80}
        items={data}
        renderItem={({ imgUrl, type, focused, workAnniversaryYears }) => (
          <Bubble
            imageUrl={imgUrl}
            type={type}
            focused={focused}
            workAnniversaryYears={workAnniversaryYears}
          />
        )}
      />
    </div>
  </StrictMode>
);
