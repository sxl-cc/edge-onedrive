import { createMemo } from "solid-js";
import {
  assignAccessors,
  createEasyContext,
  createStaticStore,
} from "solid-tiny-utils";

export const context = createEasyContext(
  (params: {
    hue?: () => number | undefined;
    neutralHue?: () => number | undefined;
  }) => {
    const [store, setState] = createStaticStore({
      hue: 210,
      neutralHue: 210,
    });

    return [
      assignAccessors(
        {},
        {
          hue: createMemo(() => params.hue?.() ?? store.hue),
          neutralHue: createMemo(
            () => params.neutralHue?.() ?? store.neutralHue
          ),
        }
      ),
      { setState },
    ] as const;
  }
);
