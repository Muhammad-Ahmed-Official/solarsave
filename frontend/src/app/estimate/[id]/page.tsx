import Result from "@/components/estimate/result";
import { TaskStatusView } from "@/components/estimate/task-status-view";
import {
  parseEstimateLocation,
  type EstimateSearchParamsInput,
} from "@/lib/estimate-location";

type ParamsInput = { id: string } | Promise<{ id: string }>;
type SearchParamsInput =
  | EstimateSearchParamsInput
  | Promise<EstimateSearchParamsInput>
  | undefined;

export default async function EstimateTaskPage({
  params,
  searchParams,
}: {
  params: ParamsInput;
  searchParams?: SearchParamsInput;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const location = parseEstimateLocation(resolvedSearchParams);

  return <Result activityId={id} location={location} />
  // return <TaskStatusView activityId={id} location={location} />
}
