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

const createDownloadUrl = (path: string, sign?: string) => {
  const url = normalizeUrlPath(
    "/api/v1/drive/d",
    ...path.split("/").map(encodeURIComponent)
  );
  return sign ? `${url}?sign=${sign}` : url;
};

export function FileView(props: { path: string; refetchSignal: number }) {
  const query = createQuery(
    async () => getItem({ path: props.path }) as Promise<MsGraphDriveItemFile>
  );

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
        downloadHref={createDownloadUrl(props.path, query.data?.sign)}
        item={query.data as MsGraphDriveItemFile | MsGraphDriveItemImage}
        loading={query.isLoading}
      />
    </div>
  );
}
