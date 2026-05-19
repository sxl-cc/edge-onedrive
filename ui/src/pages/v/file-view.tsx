import { createQuery } from "solid-tiny-query";
import { createWatch } from "solid-tiny-utils";
import type {
  MsGraphDriveItem,
  MsGraphDriveItemFile,
  MsGraphDriveItemImage,
} from "~api";
import { MsDriveItem } from "../../components/drive-file-view";
import { normalizeUrlPath } from "../../utils/path";
import { req } from "../../utils/req";

const getItem = async (params: { path: string }) => {
  const res = await req.get<MsGraphDriveItem>(
    `/api/v1/drive/get/${params.path}`
  );
  return res;
};

const createDownloadUrl = (path: string) =>
  normalizeUrlPath("d", ...path.split("/").map(encodeURIComponent));

export function FileView(props: { path: string; refetchSignal: number }) {
  const query = createQuery({
    queryKey: () => ["file", props.path],
    queryFn: async () => getItem({ path: props.path }),
  });

  createWatch(
    () => [props.refetchSignal],
    () => {
      query.refetch();
    },
    { defer: true }
  );

  return (
    <div class="flex h-full w-full items-center">
      <MsDriveItem
        downloadHref={createDownloadUrl(props.path)}
        item={query.data as MsGraphDriveItemFile | MsGraphDriveItemImage}
        loading={query.isLoading}
      />
    </div>
  );
}
