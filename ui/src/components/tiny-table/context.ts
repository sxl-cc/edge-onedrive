import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { assignAccessors, createEasyContext } from "solid-tiny-utils";

const context = createEasyContext(() => {
  const [state, setState] = createStore({
    colsKeys: {} as Record<string, boolean>,
    colsWidth: {} as Record<string, number>,
    headerScrollRef: null as HTMLDivElement | null,
    manualWidths: {} as Record<string, number>,
    wrapperWidth: 0,
    width: 0,
  });

  const sortedColsKeys = createMemo(() => {
    const headerDom = state.headerScrollRef;
    if (!headerDom) {
      return [];
    }

    // make sure all cols is leaf
    const keys = Object.keys(state.colsKeys).filter((key) => {
      if (!state.colsKeys[key]) {
        return false;
      }
      const th = headerDom.querySelector(`th[data-key="${key}"]`);
      if (!th) {
        return false;
      }
      // check if the th's rowIndex+rowSpan is equal to total row count
      const rowIndex = (th.parentElement as HTMLTableRowElement)?.rowIndex;
      const rowSpan = th.getAttribute("rowSpan");
      const rowSpanNum = rowSpan ? Number(rowSpan) : 1;
      const rowCount = headerDom.querySelectorAll("tr").length;
      if (rowIndex + rowSpanNum < rowCount) {
        return false;
      }
      return true;
    });

    if (keys.length === 0) {
      return [];
    }
    return keys.sort((a, b) => {
      const aLeft =
        headerDom?.querySelector(`th[data-key="${a}"]`)?.getBoundingClientRect()
          .left || 0;
      const bLeft =
        headerDom?.querySelector(`th[data-key="${b}"]`)?.getBoundingClientRect()
          .left || 0;
      return aLeft - bLeft;
    });
  });

  function refresh(wrapperWidth: number) {
    const needSetWidth: string[] = [];
    const widths: Record<string, number> = {};
    let constWidthCount = 0;

    // check if the width is set manually
    for (const key in state.colsWidth) {
      if (Object.hasOwn(state.colsWidth, key)) {
        if (Object.hasOwn(state.manualWidths, key)) {
          constWidthCount += state.colsWidth[key];
          continue;
        }

        needSetWidth.push(key);
      }
    }

    const minWidth = needSetWidth.length * 80 + constWidthCount;
    if (wrapperWidth < minWidth) {
      setState("width", minWidth);
    } else {
      setState("width", 0);
    }

    // calculate the width of each column which is not set manually
    for (const key of needSetWidth) {
      widths[key] = Math.max(
        Math.floor((wrapperWidth - constWidthCount) / needSetWidth.length),
        80
      );
    }

    setState("colsWidth", { ...state.colsWidth, ...widths });
  }

  return [
    assignAccessors(
      {},
      {
        colsKeys: () => state.colsKeys,
        colsWidth: () => state.colsWidth,
        headerScrollRef: () => state.headerScrollRef,
        manualWidths: () => state.manualWidths,
        wrapperWidth: () => state.wrapperWidth,
        width: () => state.width,
        sortedColsKeys,
      }
    ),
    { setState, refresh },
  ] as const;
});

export default context;
