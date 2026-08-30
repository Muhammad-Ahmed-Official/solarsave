import Result from "@/components/estimate/result";
import { FallbackSection } from "@/components/estimate/sections/fallback";
import { TaskStatusView } from "@/components/estimate/task-status-view";
import {
  parseEstimateLocation,
  type EstimateSearchParamsInput,
} from "@/lib/estimate-location";

type ParamsInput = Promise<{ id: string }>;
type SearchParamsInput = Promise<EstimateSearchParamsInput | undefined>;

export default async function EstimateTaskPage({
  params,
  searchParams,
}: {
  params: ParamsInput;
  searchParams?: SearchParamsInput;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const location = parseEstimateLocation(resolvedSearchParams);

      const hasLocation = location.latitude !== null && location.longitude !== null;
  const hasAnalysisResult = Boolean(location.placeId);

    // const place = useMemo(() => {
    //     return {
    //         id: location.placeId,
    //         displayName: location.title,
    //         latitude: location.latitude,
    //         longitude: location.longitude,
    //         title: location.title,
    //         subtitle: location.subtitle,
    //     } as GeocodedPlace;
    // }, [location]);

      if (!hasLocation) {
    return <FallbackSection reason="location" />;
  }

  if (!hasAnalysisResult) {
    return <FallbackSection reason="analysis" />;
  }

  return <TaskStatusView activityId={id} location={location} />
}
