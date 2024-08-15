# Installation

```
npm install sioux-community-bubbles-component

```

## Bubble system component

```js
import { ItemData, BubbleSystem } from 'sioux-community-bubbles-component';
import { Bubble } from 'sioux-community-browse-ui-v1';

const Example = () => {
  // Example data
  const data: ItemData[] = Array.from({ length: 10 }).map(() => ({
    imgUrl: './king.svg',
    type: 'birthday',
  }));
  
  return (
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
  );
};
```
