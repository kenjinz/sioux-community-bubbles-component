import { Bubble } from 'sioux-community-browse-ui-v1';
import { BubbleSystem, ItemData } from './BubbleSystem';

const data: ItemData[] = Array.from({ length: 60 }).map(() => ({
  imgUrl: './king.svg',
  type: 'birthday',
}));
function App() {
  return (
    <div className="w-screen h-screen max-h-screen overflow-hidden">
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
  );
}

export default App;
