import "./tabs.scss";
import { TinyTabs } from "@solid-tiny-ui/core";
import { For, type JSX } from "solid-js";
import { dataIf } from "solid-tiny-utils";

export interface TabItem {
  content: JSX.Element;
  /**
   * Unique key for the tab item
   */
  key: string;
  /**
   * Label for the tab item
   * Optional, If not provided, the tab will use key as label
   */
  label?: JSX.Element;
}

export interface TabsProps {
  activeKey?: string;
  defaultActiveKey?: string;
  items: TabItem[];
  onActiveKeyChange?: (key: string) => void;
}

export function Tabs(props: TabsProps) {
  return (
    <TinyTabs.Root
      activeKey={props.activeKey}
      defaultActiveKey={props.defaultActiveKey}
      keys={props.items.map((item) => item.key)}
      onActiveKeyChange={props.onActiveKeyChange}
    >
      {(state) => (
        <div class="tiny-tabs">
          <TinyTabs.List class="tiny-tabs__header">
            <For each={props.items}>
              {(item) => (
                <TinyTabs.Trigger
                  class="tiny-tabs__tab"
                  data-active={dataIf(state.activeKey === item.key)}
                  data-dir={state.direction || undefined}
                  data-prev={dataIf(
                    state.previousActiveKey === item.key &&
                      state.activeKey !== item.key
                  )}
                  tabKey={item.key}
                >
                  {item.label ?? item.key}
                </TinyTabs.Trigger>
              )}
            </For>
          </TinyTabs.List>
          <TinyTabs.Content class="tiny-tabs__content">
            <For each={props.items}>
              {(item) => (
                <TinyTabs.Panel
                  class="tiny-tabs__item"
                  data-dir={state.direction || undefined}
                  tabKey={item.key}
                >
                  {item.content}
                </TinyTabs.Panel>
              )}
            </For>
          </TinyTabs.Content>
        </div>
      )}
    </TinyTabs.Root>
  );
}
