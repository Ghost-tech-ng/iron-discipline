import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ShoppingItem {
  id: string;
  label: string;
  note: string;
  checked: boolean;
}

export interface ShoppingSection {
  id: string;
  title: string;
  items: ShoppingItem[];
}

const DEFAULT_SECTIONS: ShoppingSection[] = [
  {
    id: 'protein_priority',
    title: 'Protein Priority',
    items: [
      { id: 'whey', label: 'Whey protein (Bluenax, USN, or Dymatize)', note: '25g protein/scoop — get this first, biggest lever', checked: false },
      { id: 'eggs', label: 'Eggs — full crate of 30', note: '6g protein each, buy in bulk', checked: false },
      { id: 'chicken', label: 'Frozen chicken breast/thigh carton', note: 'Cheapest protein-per-naira, portion and freeze', checked: false },
      { id: 'sardines', label: 'Titus / Mackerel canned sardines (multiple)', note: '~25g protein per can, zero cooking', checked: false },
      { id: 'yogurt', label: 'Greek yogurt (Krysville or Hollandia)', note: '15-20g protein per cup, snack replacement', checked: false },
      { id: 'smoked_fish', label: 'Smoked/dried fish (panla, titus)', note: 'Very high protein density', checked: false },
      { id: 'beef', label: 'Lean beef cuts (shin or chuck)', note: 'Bulk-buy and portion-freeze', checked: false },
    ],
  },
  {
    id: 'carbs_keep',
    title: 'Carbs to Keep',
    items: [
      { id: 'rice', label: 'Brown/white rice', note: 'Watch portion on rice + stew days', checked: false },
      { id: 'oats', label: 'Oats (Quaker)', note: 'Reliable breakfast base', checked: false },
      { id: 'yam_plantain', label: 'Yam and plantain', note: 'No change needed', checked: false },
      { id: 'beans', label: 'Beans', note: 'Good fiber + protein combo', checked: false },
    ],
  },
  {
    id: 'watch_this',
    title: 'Watch This',
    items: [
      { id: 'takeout_cap', label: 'Cap takeout (Chicken Republic, Mr Biggs) to 1x/week', note: 'Source of your 1100-1240 kcal single-meal spikes — split into two servings when you do', checked: false },
    ],
  },
];

interface ShoppingListStore {
  sections: ShoppingSection[];
  toggleItem: (sectionId: string, itemId: string) => void;
  resetWeek: () => void;
  totalCount: () => number;
  checkedCount: () => number;
}

export const useShoppingListStore = create<ShoppingListStore>()(
  persist(
    (set, get) => ({
      sections: DEFAULT_SECTIONS,

      toggleItem: (sectionId, itemId) =>
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId
              ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) }
              : s
          ),
        })),

      resetWeek: () =>
        set((state) => ({
          sections: state.sections.map((s) => ({
            ...s,
            items: s.items.map((i) => ({ ...i, checked: false })),
          })),
        })),

      totalCount: () => get().sections.reduce((sum, s) => sum + s.items.length, 0),
      checkedCount: () => get().sections.reduce((sum, s) => sum + s.items.filter((i) => i.checked).length, 0),
    }),
    {
      name: 'shopping_list_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
