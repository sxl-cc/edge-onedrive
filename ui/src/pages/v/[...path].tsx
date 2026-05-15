import { useLocation, useParams } from "@solidjs/router";
import { ofetch } from "ofetch";
import { onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Button } from "solid-tiny-ui";
import { createList, createWatch } from "solid-tiny-utils";
import type { MsGraphDriveItem } from "~api";
import { DriveItemsView } from "../../components/diver-items-view";
import { normalizeUrlPath } from "../../utils/path";

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
    activeItemName: "",
  });

  const location = useLocation();

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
    acts.setList([]);
    await fetchData().finally(() => {
      setPageState("isLoadingData", false);
    });
  };

  onMount(() => {
    createWatch(() => params.path, reFetchData);
  });

  return (
    <section>
      <Show fallback={<p>No items</p>} when={data.length}>
        <DriveItemsView
          items={data}
          itemUrl={(item) => normalizeUrlPath(location.pathname, item.name)}
        />
      </Show>
      <Show when={pageState.next_token}>
        <Button onClick={fetchData} variant="outline">
          Next
        </Button>
      </Show>
    </section>
  );
}
