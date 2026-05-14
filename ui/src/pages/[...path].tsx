import { A, useParams } from "@solidjs/router";
import { ofetch } from "ofetch";
import { For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Spin } from "solid-tiny-ui";
import { createList, createWatch } from "solid-tiny-utils";
import type { MsGraphDriveItem } from "~api";

function RenderItem(props: { item: MsGraphDriveItem; currentPath: string }) {
  return (
    <Show fallback={<div>{props.item.name}</div>} when={props.item.is_folder}>
      <A class="block" href={`/${props.currentPath}/${props.item.name}`}>
        {props.item.name}
      </A>
    </Show>
  );
}

const listItems = async (params: {
  path: string;
  page_size: number;
  next_token: string;
}) => {
  const res = await ofetch<{
    next_token?: string;
    data: MsGraphDriveItem[];
  }>(`/api/v1/drive/list/${params.path}`, {
    query: {
      page_size: params.page_size,
      next_token: params.next_token,
    },
  });

  return res;
};

export default function IndexPage() {
  const params = useParams<{ path: string }>();
  const [pageState, setPageState] = createStore({
    next_token: "",
    isLoadingData: false,
  });

  const [data, acts] = createList<MsGraphDriveItem>([]);
  const fetchData = async () => {
    const res = await listItems({
      path: params.path,
      page_size: 30,
      next_token: pageState.next_token,
    });

    acts.setList((prev) => [...prev, ...res.data]);
    setPageState("next_token", res.next_token || "");
  };

  const reFetchData = async () => {
    setPageState({
      next_token: "",
      isLoadingData: true,
    });
    await fetchData().finally(() => {
      setPageState("isLoadingData", false);
    });
  };

  onMount(() => {
    createWatch(() => params.path, reFetchData);
  });

  return (
    <section class="grid gap-xl lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
      <Spin spinning={pageState.isLoadingData}>
        <Show fallback={<p>No items</p>} when={data.length}>
          <For each={data}>{(item) => <p>{item.name}</p>}</For>
        </Show>
        <Show when={pageState.next_token}>
          <Button onClick={fetchData} variant="outline">
            Next
          </Button>
        </Show>
      </Spin>
    </section>
  );
}
